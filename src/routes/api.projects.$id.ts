import { createFileRoute } from "@tanstack/react-router";
import {
  handleDeleteProject,
  handleGetProject,
  projectMethodNotAllowed,
} from "../server/projects";

const notAllowed = () => projectMethodNotAllowed(["GET", "DELETE"]);

export const Route = createFileRoute("/api/projects/$id")({
  server: {
    handlers: {
      GET: ({ params }) => handleGetProject(params.id),
      DELETE: ({ request, params }) => handleDeleteProject(request, params.id),
      HEAD: notAllowed,
      OPTIONS: notAllowed,
      POST: notAllowed,
      PUT: notAllowed,
      PATCH: notAllowed,
    },
  },
});
