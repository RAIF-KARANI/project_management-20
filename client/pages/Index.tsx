import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MetricsResponse, Project, Task, CreateProjectInput, CreateTaskInput, User } from "@shared/api";

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-lg border p-4 bg-card text-card-foreground">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={"mt-2 text-2xl font-bold " + (accent ?? "")}>
        {value}
      </div>
    </div>
  );
}

function ProjectCard({ project, tasks }: { project: Project; tasks: Task[] }) {
  const done = tasks.filter((t) => t.status === "DONE").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <div className="rounded-lg border p-4 bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-lg">{project.name}</div>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        {project.deadline && (
          <div className="text-right text-xs text-muted-foreground">
            <div>Deadline</div>
            <div className="font-medium">{new Date(project.deadline).toLocaleDateString()}</div>
          </div>
        )}
      </div>
      <div className="mt-4 h-2 rounded bg-muted">
        <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{pct}% complete �� {tasks.length} tasks</div>
    </div>
  );
}

export default function Index() {
  const qc = useQueryClient();
  const [projForm, setProjForm] = useState<Partial<CreateProjectInput>>({});
  const [taskForm, setTaskForm] = useState<Partial<CreateTaskInput>>({});

  const metrics = useQuery<MetricsResponse>({ queryKey: ["metrics"], queryFn: () => fetch("/api/metrics").then((r) => r.json()) });
  const projects = useQuery<Project[]>({ queryKey: ["projects"], queryFn: () => fetch("/api/projects").then((r) => r.json()) });
  const users = useQuery<User[]>({ queryKey: ["users"], queryFn: () => fetch("/api/users").then((r) => r.json()) });
  const tasks = useQuery<Task[]>({ queryKey: ["tasks"], queryFn: () => fetch("/api/tasks").then((r) => r.json()) });

  const createProject = useMutation({
    mutationFn: async (input: CreateProjectInput) => fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); qc.invalidateQueries({ queryKey: ["metrics"] }); },
  });

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["metrics"] }); },
  });

  return (
    <div>
      <section className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track projects, tasks, roles and deadlines.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            const firstUser = users.data?.[0]?.id;
            if (projects.data && projects.data[0]) {
              setTaskForm({ projectId: projects.data[0].id, assigneeId: firstUser ?? null, title: "New Task", status: "TODO" });
            }
          }}>Quick Task</Button>
          <Button onClick={() => setProjForm({ name: "New Project" })} variant="secondary">New Project</Button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Stat label="Projects" value={metrics.data?.totalProjects ?? 0} />
        <Stat label="Tasks" value={metrics.data?.totalTasks ?? 0} />
        <Stat label="In Progress" value={metrics.data?.tasksByStatus.inProgress ?? 0} accent="text-yellow-600" />
        <Stat label="Overdue" value={metrics.data?.tasksByStatus.overdue ?? 0} accent="text-destructive" />
      </section>

      <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.data?.map((p) => (
              <ProjectCard key={p.id} project={p} tasks={(tasks.data ?? []).filter((t) => t.projectId === p.id)} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Tasks</h2>
          <div className="space-y-2">
            {(tasks.data ?? []).slice(0, 6).map((t) => (
              <div key={t.id} className="rounded border p-3 bg-card">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{t.title}</div>
                  <span className={
                    t.status === "DONE" ? "text-green-600 text-xs" : t.status === "IN_PROGRESS" ? "text-yellow-700 text-xs" : "text-muted-foreground text-xs"
                  }>{t.status.replace("_", " ")}</span>
                </div>
                {t.dueDate && (
                  <div className="text-xs text-muted-foreground mt-1">Due {new Date(t.dueDate).toLocaleDateString()}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {projForm && projForm.name !== undefined && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => setProjForm({})}>
          <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Create Project</h3>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded border bg-background px-3 py-2" placeholder="Name" value={projForm.name ?? ""} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} />
              <textarea className="w-full rounded border bg-background px-3 py-2" placeholder="Description" value={projForm.description ?? ""} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} />
              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" onClick={() => setProjForm({})}>Cancel</Button>
                <Button onClick={() => {
                  if (!projForm.name) return;
                  createProject.mutate({ name: projForm.name, description: projForm.description });
                  setProjForm({});
                }}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {taskForm && taskForm.title !== undefined && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => setTaskForm({})}>
          <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Create Task</h3>
            <div className="mt-4 space-y-3">
              <select className="w-full rounded border bg-background px-3 py-2" value={taskForm.projectId ?? ""} onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}>
                <option value="">Select project</option>
                {projects.data?.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
              <input className="w-full rounded border bg-background px-3 py-2" placeholder="Title" value={taskForm.title ?? ""} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
              <select className="w-full rounded border bg-background px-3 py-2" value={taskForm.assigneeId ?? ""} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.data?.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
              </select>
              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" onClick={() => setTaskForm({})}>Cancel</Button>
                <Button onClick={() => {
                  if (!taskForm.title || !taskForm.projectId) return;
                  createTask.mutate({
                    projectId: taskForm.projectId,
                    title: taskForm.title,
                    assigneeId: taskForm.assigneeId ?? null,
                  });
                  setTaskForm({});
                }}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
