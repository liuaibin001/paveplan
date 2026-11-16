import { env } from "cloudflare:workers";
import { and, eq, gt, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { projects } from "../db/schema";
import {
  CALCULATOR_LIMITS,
  calculateProject,
  type AreaInput,
  type ProjectInput,
} from "../lib/calculator";

export const MAX_PROJECT_BODY_BYTES = 16 * 1024;
export const PROJECT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type ProjectEnvironment = {
  DB: D1Database;
  SHARE_RATE_LIMITER: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
};

export type CreatedProject = {
  id: string;
  deleteToken: string;
  expiresAt: string;
};

export type SharedProject = {
  project: ProjectInput;
  createdAt: string;
  expiresAt: string;
};

class ProjectApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DELETE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;

function apiResponse(body: unknown, status = 200, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  if (body === null) return new Response(null, { status, headers });
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(error: unknown) {
  if (error instanceof ProjectApiError) {
    return apiResponse(
      { error: error.message },
      error.status,
      error.status === 429 ? { "Retry-After": "60" } : undefined,
    );
  }
  return apiResponse(
    { error: "Project sharing is temporarily unavailable." },
    503,
  );
}

export function projectMethodNotAllowed(allowedMethods: string[]) {
  return apiResponse({ error: "Method not allowed." }, 405, {
    Allow: allowedMethods.join(", "),
  });
}

function requireSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new ProjectApiError(403, "A same-origin request is required.");
  }
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin") {
    throw new ProjectApiError(403, "A same-origin request is required.");
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function requireRateLimit(
  request: Request,
  environment: ProjectEnvironment,
  action: "create" | "delete",
) {
  if (!environment.SHARE_RATE_LIMITER)
    throw new Error("Rate limiter unavailable");
  const client = request.headers.get("CF-Connecting-IP") ?? "unknown-client";
  const key = `${action}:${await sha256(`paveplan-share:${client}`)}`;
  const { success } = await environment.SHARE_RATE_LIMITER.limit({ key });
  if (!success)
    throw new ProjectApiError(
      429,
      "Too many requests. Please try again shortly.",
    );
}

async function readSmallJson(request: Request): Promise<unknown> {
  const contentType = request.headers
    .get("Content-Type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    throw new ProjectApiError(415, "Send the project as application/json.");
  }
  const contentEncoding = request.headers.get("Content-Encoding");
  if (contentEncoding && contentEncoding.toLowerCase() !== "identity") {
    throw new ProjectApiError(
      415,
      "Compressed request bodies are not supported.",
    );
  }
  const contentLength = request.headers.get("Content-Length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength))
      throw new ProjectApiError(400, "Invalid request body.");
    if (Number(contentLength) > MAX_PROJECT_BODY_BYTES) {
      throw new ProjectApiError(413, "Project data must be 16 KB or smaller.");
    }
  }
  if (!request.body)
    throw new ProjectApiError(400, "Project data is required.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_PROJECT_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new ProjectApiError(
          413,
          "Project data must be 16 KB or smaller.",
        );
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ) as unknown;
  } catch {
    throw new ProjectApiError(400, "Invalid JSON project data.");
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProjectApiError(400, "Invalid project data.");
  }
  return value as Record<string, unknown>;
}

function number(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ProjectApiError(
      400,
      "Project measurements must be finite numbers.",
    );
  }
  return value;
}

function label(value: unknown, maximum: number, allowEmpty = true) {
  if (
    typeof value !== "string" ||
    value.length > maximum ||
    (!allowEmpty && value.trim().length === 0) ||
    CONTROL_CHARACTERS.test(value)
  ) {
    throw new ProjectApiError(400, "Invalid project area label.");
  }
  return value.trim();
}

// Build a fresh allowlisted object so arbitrary request properties never reach storage.
export function sanitizeSharedProject(input: unknown): ProjectInput {
  const source = record(input);
  if (
    (source.units !== "imperial" && source.units !== "metric") ||
    (source.outputUnit !== "us-ton" && source.outputUnit !== "metric-tonne") ||
    !Array.isArray(source.areas) ||
    source.areas.length < 1 ||
    source.areas.length > CALCULATOR_LIMITS.maxAreas
  ) {
    throw new ProjectApiError(400, "Invalid project units or areas.");
  }
  const areas: AreaInput[] = source.areas.map((value) => {
    const area = record(value);
    if (area.mode !== "dimensions" && area.mode !== "area") {
      throw new ProjectApiError(400, "Invalid project area mode.");
    }
    return {
      id: label(area.id, 128, false),
      name: label(area.name, 80),
      mode: area.mode,
      length: number(area.length),
      width: number(area.width),
      area: number(area.area),
      thickness: number(area.thickness),
    };
  });
  const project: ProjectInput = {
    units: source.units,
    outputUnit: source.outputUnit,
    areas,
    density: number(source.density),
    allowance: number(source.allowance),
    price: source.price === null ? null : number(source.price),
  };
  try {
    calculateProject(project);
  } catch {
    throw new ProjectApiError(
      400,
      "Project values are outside the supported calculator limits.",
    );
  }
  return project;
}

function createDeleteToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function equalHash(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function handleCreateProject(
  request: Request,
  environment = env as unknown as ProjectEnvironment,
) {
  try {
    requireSameOrigin(request);
    await requireRateLimit(request, environment, "create");
    const project = sanitizeSharedProject(await readSmallJson(request));
    const createdAt = Date.now();
    const expiresAt = createdAt + PROJECT_TTL_MS;
    const id = crypto.randomUUID();
    const deleteToken = createDeleteToken();
    await drizzle(environment.DB)
      .insert(projects)
      .values({
        id,
        projectJson: JSON.stringify(project),
        deleteTokenHash: await sha256(deleteToken),
        createdAt,
        expiresAt,
      });
    return apiResponse(
      {
        id,
        deleteToken,
        expiresAt: new Date(expiresAt).toISOString(),
      } satisfies CreatedProject,
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleGetProject(
  id: string,
  environment = env as unknown as ProjectEnvironment,
) {
  try {
    if (!UUID_PATTERN.test(id))
      throw new ProjectApiError(404, "Project not found or expired.");
    const row = await drizzle(environment.DB)
      .select({
        projectJson: projects.projectJson,
        createdAt: projects.createdAt,
        expiresAt: projects.expiresAt,
      })
      .from(projects)
      .where(and(eq(projects.id, id), gt(projects.expiresAt, Date.now())))
      .get();
    if (!row) throw new ProjectApiError(404, "Project not found or expired.");
    return apiResponse({
      project: sanitizeSharedProject(JSON.parse(row.projectJson)),
      createdAt: new Date(row.createdAt).toISOString(),
      expiresAt: new Date(row.expiresAt).toISOString(),
    } satisfies SharedProject);
  } catch (error) {
    if (error instanceof ProjectApiError && error.status === 400) {
      return errorResponse(new Error("Stored project is invalid"));
    }
    return errorResponse(error);
  }
}

export async function handleDeleteProject(
  request: Request,
  id: string,
  environment = env as unknown as ProjectEnvironment,
) {
  try {
    requireSameOrigin(request);
    if (!UUID_PATTERN.test(id))
      throw new ProjectApiError(404, "Project not found or expired.");
    const token = request.headers.get("X-Delete-Token");
    if (!token || !DELETE_TOKEN_PATTERN.test(token)) {
      throw new ProjectApiError(403, "A valid deletion token is required.");
    }
    await requireRateLimit(request, environment, "delete");
    const database = drizzle(environment.DB);
    const row = await database
      .select({ deleteTokenHash: projects.deleteTokenHash })
      .from(projects)
      .where(and(eq(projects.id, id), gt(projects.expiresAt, Date.now())))
      .get();
    if (!row) throw new ProjectApiError(404, "Project not found or expired.");
    const tokenHash = await sha256(token);
    if (!equalHash(tokenHash, row.deleteTokenHash)) {
      throw new ProjectApiError(403, "A valid deletion token is required.");
    }
    await database
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.deleteTokenHash, tokenHash)));
    return apiResponse(null, 204);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function cleanupExpiredProjects(
  database: D1Database = (env as unknown as ProjectEnvironment).DB,
  now = Date.now(),
) {
  const result = await drizzle(database)
    .delete(projects)
    .where(lte(projects.expiresAt, now));
  return result.meta.changes;
}
