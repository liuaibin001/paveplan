import { createFileRoute } from "@tanstack/react-router";
import {
  handleCreateProject,
  projectMethodNotAllowed,
} from "../server/projects";

const notAllowed = () => projectMethodNotAllowed(["POST"]);

export const Route = createFileRoute("/api/projects")({
  server: {
    handlers: {
      POST: ({ request }) => handleCreateProject(request),
      GET: notAllowed,
      HEAD: notAllowed,
      OPTIONS: notAllowed,
      PUT: notAllowed,
      PATCH: notAllowed,
      DELETE: notAllowed,
    },
  },
});
