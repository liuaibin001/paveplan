import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProject } from "../lib/calculator";

vi.mock("cloudflare:workers", () => ({ env: {} }));

import {
  MAX_PROJECT_BODY_BYTES,
  PROJECT_TTL_MS,
  cleanupExpiredProjects,
  handleCreateProject,
  handleDeleteProject,
  handleGetProject,
  projectMethodNotAllowed,
  type CreatedProject,
  type ProjectEnvironment,
} from "./projects";

const ORIGIN = "https://paveplan.example";
const NOW = Date.parse("2026-11-16T00:00:00.000Z");

function createDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(
    readFileSync(
      new URL("../../drizzle/0000_projects.sql", import.meta.url),
      "utf8",
    ),
  );
  const db = {
    prepare(query: string) {
      const statement = sqlite.prepare(query);
      const prepared = (parameters: (string | number | null)[]) => ({
        bind(...nextParameters: (string | number | null)[]) {
          return prepared(nextParameters);
        },
        async raw() {
          return statement.all(...parameters).map((row) => Object.values(row));
        },
        async all() {
          return {
            results: statement.all(...parameters),
            success: true,
            meta: { changes: 0 },
          };
        },
        async run() {
          const result = statement.run(...parameters);
          return {
            results: [],
            success: true,
            meta: { changes: Number(result.changes) },
          };
        },
      });
      return prepared([]);
    },
  } as unknown as D1Database;
  return { sqlite, db };
}

function createRequest(
  body: unknown = defaultProject,
  headers: Record<string, string> = {},
) {
  return new Request(`${ORIGIN}/api/projects`, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "CF-Connecting-IP": "192.0.2.1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function deleteRequest(id: string, token: string, origin = ORIGIN) {
  return new Request(`${ORIGIN}/api/projects/${id}`, {
    method: "DELETE",
    headers: {
      Origin: origin,
      "X-Delete-Token": token,
      "CF-Connecting-IP": "192.0.2.1",
    },
  });
}

function expectPrivateApiHeaders(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
}

describe("optional project sharing API", () => {
  let sqlite: DatabaseSync;
  let environment: ProjectEnvironment;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const database = createDatabase();
    sqlite = database.sqlite;
    environment = {
      DB: database.db,
      SHARE_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    };
  });

  afterEach(() => {
    sqlite.close();
    vi.useRealTimers();
  });

  async function createProject(body: unknown = defaultProject) {
    const response = await handleCreateProject(
      createRequest(body),
      environment,
    );
    expect(response.status).toBe(201);
    expectPrivateApiHeaders(response);
    return (await response.json()) as CreatedProject;
  }

  it("persists only sanitized parameters, returns a public read, and never stores or returns the deletion token hash", async () => {
    const input = {
      ...defaultProject,
      email: "not-to-be-stored@example.com",
      areas: defaultProject.areas.map((area) => ({
        ...area,
        extra: "not-stored",
      })),
    };
    const created = await createProject(input);
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.deleteToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(created.expiresAt).toBe(
      new Date(NOW + PROJECT_TTL_MS).toISOString(),
    );

    const row = sqlite
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(created.id)!;
    expect(row.project_json).toBe(JSON.stringify(defaultProject));
    expect(row.delete_token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain(created.deleteToken);
    expect(JSON.stringify(row)).not.toContain("192.0.2.1");

    const response = await handleGetProject(created.id, environment);
    expect(response.status).toBe(200);
    expectPrivateApiHeaders(response);
    expect(await response.json()).toEqual({
      project: defaultProject,
      createdAt: new Date(NOW).toISOString(),
      expiresAt: created.expiresAt,
    });

    const calls = vi.mocked(environment.SHARE_RATE_LIMITER.limit).mock.calls;
    expect(calls[0][0].key).toMatch(/^create:[0-9a-f]{64}$/);
    expect(calls[0][0].key).not.toContain("192.0.2.1");
  });

  it("requires an exact same-origin write, without permitting CORS", async () => {
    for (const origin of ["https://other.example", "null", ""]) {
      const response = await handleCreateProject(
        createRequest(defaultProject, { Origin: origin }),
        environment,
      );
      expect(response.status).toBe(403);
      expectPrivateApiHeaders(response);
    }
    const crossSite = await handleCreateProject(
      createRequest(defaultProject, { "Sec-Fetch-Site": "cross-site" }),
      environment,
    );
    expect(crossSite.status).toBe(403);
    expect(
      sqlite.prepare("SELECT count(*) AS count FROM projects").get()!.count,
    ).toBe(0);
  });

  it("rejects invalid measurements, duplicate IDs, oversized labels, and more than twenty areas", async () => {
    const invalidProjects = [
      { ...defaultProject, density: 0 },
      { ...defaultProject, allowance: 101 },
      { ...defaultProject, price: "100" },
      { ...defaultProject, units: "unknown" },
      { ...defaultProject, areas: [] },
      {
        ...defaultProject,
        areas: [defaultProject.areas[0], defaultProject.areas[0]],
      },
      {
        ...defaultProject,
        areas: [{ ...defaultProject.areas[0], name: "x".repeat(81) }],
      },
      {
        ...defaultProject,
        areas: [{ ...defaultProject.areas[0], name: "bad\nlabel" }],
      },
      {
        ...defaultProject,
        areas: [{ ...defaultProject.areas[0], thickness: -3 }],
      },
      {
        ...defaultProject,
        areas: [{ ...defaultProject.areas[0], length: 100_001 }],
      },
      {
        ...defaultProject,
        areas: Array.from({ length: 21 }, (_, index) => ({
          ...defaultProject.areas[0],
          id: String(index),
        })),
      },
    ];
    for (const project of invalidProjects) {
      const response = await handleCreateProject(
        createRequest(project),
        environment,
      );
      expect(response.status).toBe(400);
      expectPrivateApiHeaders(response);
    }
    expect(
      sqlite.prepare("SELECT count(*) AS count FROM projects").get()!.count,
    ).toBe(0);
  });

  it("enforces a byte limit even without Content-Length and rejects malformed JSON", async () => {
    const oversized = new Request(`${ORIGIN}/api/projects`, {
      method: "POST",
      headers: { Origin: ORIGIN, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x".repeat(MAX_PROJECT_BODY_BYTES) }),
    });
    expect(oversized.headers.has("Content-Length")).toBe(false);
    const rejected = await handleCreateProject(oversized, environment);
    expect(rejected.status).toBe(413);
    expectPrivateApiHeaders(rejected);

    const malformed = new Request(`${ORIGIN}/api/projects`, {
      method: "POST",
      headers: { Origin: ORIGIN, "Content-Type": "application/json" },
      body: "{invalid",
    });
    expect((await handleCreateProject(malformed, environment)).status).toBe(
      400,
    );
    expect(
      (
        await handleCreateProject(
          createRequest(defaultProject, { "Content-Type": "text/plain" }),
          environment,
        )
      ).status,
    ).toBe(415);
  });

  it("expires reads at exactly thirty days and removes expired rows through cleanup", async () => {
    const created = await createProject();
    vi.setSystemTime(NOW + PROJECT_TTL_MS - 1);
    expect((await handleGetProject(created.id, environment)).status).toBe(200);
    vi.setSystemTime(NOW + PROJECT_TTL_MS);
    const response = await handleGetProject(created.id, environment);
    expect(response.status).toBe(404);
    expectPrivateApiHeaders(response);
    expect(
      sqlite.prepare("SELECT count(*) AS count FROM projects").get()!.count,
    ).toBe(1);
    expect(await cleanupExpiredProjects(environment.DB)).toBe(1);
    expect(
      sqlite.prepare("SELECT count(*) AS count FROM projects").get()!.count,
    ).toBe(0);
  });

  it("deletes only with the matching token and same origin, using a separate rate-limit key", async () => {
    const created = await createProject();
    expect(
      (
        await handleDeleteProject(
          deleteRequest(created.id, "x".repeat(43)),
          created.id,
          environment,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await handleDeleteProject(
          deleteRequest(
            created.id,
            created.deleteToken,
            "https://other.example",
          ),
          created.id,
          environment,
        )
      ).status,
    ).toBe(403);
    expect((await handleGetProject(created.id, environment)).status).toBe(200);
    const deleted = await handleDeleteProject(
      deleteRequest(created.id, created.deleteToken),
      created.id,
      environment,
    );
    expect(deleted.status).toBe(204);
    expect(await deleted.text()).toBe("");
    expectPrivateApiHeaders(deleted);
    expect((await handleGetProject(created.id, environment)).status).toBe(404);
    expect(
      vi.mocked(environment.SHARE_RATE_LIMITER.limit).mock.calls.at(-1)![0].key,
    ).toMatch(/^delete:/);
  });

  it("fails closed on missing rate limiting and returns generic errors instead of database details", async () => {
    const unavailable = { DB: environment.DB } as ProjectEnvironment;
    const missingLimiter = await handleCreateProject(
      createRequest(),
      unavailable,
    );
    expect(missingLimiter.status).toBe(503);
    expectPrivateApiHeaders(missingLimiter);

    vi.mocked(environment.SHARE_RATE_LIMITER.limit).mockResolvedValueOnce({
      success: false,
    });
    const limited = await handleCreateProject(createRequest(), environment);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("60");
    expectPrivateApiHeaders(limited);

    const broken = {
      ...environment,
      DB: {
        prepare() {
          throw new Error("private SQL detail or binding secret");
        },
      } as unknown as D1Database,
    };
    const response = await handleCreateProject(createRequest(), broken);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private SQL");
    expectPrivateApiHeaders(response);
  });

  it("uses a uniform not-found response for absent and malformed IDs and marks unsupported methods private", async () => {
    for (const id of ["not-an-id", crypto.randomUUID()]) {
      const response = await handleGetProject(id, environment);
      expect(response.status).toBe(404);
      expectPrivateApiHeaders(response);
    }
    const response = projectMethodNotAllowed(["GET", "DELETE"]);
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, DELETE");
    expectPrivateApiHeaders(response);
  });
});
