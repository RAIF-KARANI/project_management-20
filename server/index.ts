import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { registerUserRoutes } from "./routes/users";
import { registerProjectRoutes } from "./routes/projects";
import { registerTaskRoutes } from "./routes/tasks";
import { registerMetricsRoutes } from "./routes/metrics";
import { registerAuthRoutes } from "./routes/auth";
import { seed } from "./routes/store";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Seed demo data (in-memory). For production, connect to Postgres/MySQL.
  seed();

  // Health
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Example route
  app.get("/api/demo", handleDemo);

  // Domain routes
  registerUserRoutes(app);
  registerProjectRoutes(app);
  registerTaskRoutes(app);
  registerMetricsRoutes(app);
  registerAuthRoutes(app);

  // Minimal OpenAPI spec endpoint for tooling
  app.get("/api/openapi.json", (_req, res) => {
    res.json({
      openapi: "3.0.0",
      info: { title: "Project Management API", version: "1.0.0" },
      paths: {
        "/api/projects": { get: { summary: "List projects" }, post: { summary: "Create project" } },
        "/api/tasks": { get: { summary: "List tasks" }, post: { summary: "Create task" } },
        "/api/users": { get: { summary: "List users" }, post: { summary: "Create user" } },
        "/api/metrics": { get: { summary: "Get metrics" } },
      },
    });
  });

  return app;
}
