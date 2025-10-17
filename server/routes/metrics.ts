import { Request, Response, Router } from "express";
import { db, overdue } from "./store";
import { MetricsResponse } from "@shared/api";

export function registerMetricsRoutes(app: any) {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    const overdueByProject: Record<string, number> = {};
    for (const p of db.projects) {
      overdueByProject[p.id] = db.tasks.filter((t) => t.projectId === p.id && overdue(t)).length;
    }
    const metrics: MetricsResponse = {
      totalProjects: db.projects.length,
      totalTasks: db.tasks.length,
      tasksByStatus: {
        todo: db.tasks.filter((t) => t.status === "TODO").length,
        inProgress: db.tasks.filter((t) => t.status === "IN_PROGRESS").length,
        done: db.tasks.filter((t) => t.status === "DONE").length,
        overdue: db.tasks.filter((t) => overdue(t)).length,
      },
      overdueByProject,
    };
    res.json(metrics);
  });

  app.use("/api/metrics", router);
}
