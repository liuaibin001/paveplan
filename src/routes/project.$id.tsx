import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Calculator } from "@/components/calculator";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/site";
import type { SharedProject } from "@/server/projects";

const getSharedProject = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { handleGetProject } = await import("@/server/projects");
    const response = await handleGetProject(data);
    if (response.status === 404) return null;
    if (!response.ok)
      throw new Error("This estimate could not be loaded. Please try again.");
    return (await response.json()) as SharedProject;
  });

export const Route = createFileRoute("/project/$id")({
  loader: async ({ params }) => {
    const project = await getSharedProject({ data: params.id });
    if (!project) throw notFound();
    return project;
  },
  head: ({ params }) =>
    pageHead(
      "Shared Asphalt Estimate",
      "A shared PavePlan asphalt material estimate with measurements and assumptions.",
      `/project/${params.id}`,
      true,
    ),
  component: SharedProjectPage,
});
function SharedProjectPage() {
  const data = Route.useLoaderData();
  const { id } = Route.useParams();
  const [token, setToken] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      setToken(localStorage.getItem(`paveplan:delete:${id}`));
    } catch {}
  }, [id]);
  async function deleteShare() {
    if (!token) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: { "X-Delete-Token": token },
      });
      if (!response.ok)
        throw new Error("Could not delete the link. Please try again.");
      try {
        localStorage.removeItem(`paveplan:delete:${id}`);
      } catch {}
      setDeleted(true);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (deleted)
    return (
      <main className="content-width error-page" id="main-content">
        <p className="eyebrow">SHARE LINK DELETED</p>
        <h1>This estimate is no longer shared.</h1>
        <p>
          The public record has been removed. Any copies already downloaded by
          others cannot be removed.
        </p>
        <a href="/asphalt-calculator" className="button-link">
          Create another estimate
        </a>
      </main>
    );
  return (
    <main className="content-width" id="main-content">
      <header className="shared-heading">
        <p className="eyebrow">PAVEPLAN / SHARED ESTIMATE</p>
        <h1>A material plan, together.</h1>
        <p>
          Shared on {new Date(data.createdAt).toISOString().slice(0, 10)}. This
          public link expires on{" "}
          {new Date(data.expiresAt).toISOString().slice(0, 10)} (UTC). These are
          the creator's measurements and assumptions.
        </p>
      </header>
      <Calculator initialProject={data.project} readOnly />
      {token && (
        <section className="share-delete">
          <p>
            This browser holds the deletion key for this link. Deleting the link
            removes access to this saved estimate.
          </p>
          <Button variant="outline" onClick={deleteShare} disabled={busy}>
            {busy ? "Deleting…" : "Delete this public link"}
          </Button>
          {notice && <p role="alert">{notice}</p>}
        </section>
      )}
      <p className="shared-heading">
        <a href="/asphalt-calculator" className="button-link">
          Make your own estimate
        </a>
      </p>
    </main>
  );
}
