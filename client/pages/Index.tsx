import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MetricsResponse, Project, Task, CreateProjectInput, CreateTaskInput, User, TaskStatus } from "@shared/api";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-lg border p-4 bg-card text-card-foreground">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={"mt-2 text-2xl font-bold " + (accent ?? "")}>{value}</div>
    </motion.div>
  );
}

function ProjectCard({ project, tasks }: { project: Project; tasks: Task[] }) {
  const done = tasks.filter((t) => t.status === "DONE").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="rounded-lg border p-4 bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-lg">{project.name}</div>
          {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
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
      <div className="mt-2 text-xs text-muted-foreground">{pct}% complete • {tasks.length} tasks</div>
    </motion.div>
  );
}

function StatusPill({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; color: string }> = {
    TODO: { label: "To Do", color: "text-slate-700 bg-[color:var(--status-todo)]/10 border-[color:var(--status-todo)]" },
    IN_PROGRESS: { label: "In Progress", color: "text-yellow-800 bg-[color:var(--status-inprogress)]/10 border-[color:var(--status-inprogress)]" },
    DONE: { label: "Done", color: "text-green-800 bg-[color:var(--status-done)]/10 border-[color:var(--status-done)]" },
  };
  const s = map[status];
  return <span className={"px-2 py-1 rounded-full text-xs font-medium border " + s.color}>{s.label}</span>;
}

function Donut({ counts }: { counts: { todo: number; inProgress: number; done: number } }) {
  const total = counts.todo + counts.inProgress + counts.done || 1;
  const todoPct = (counts.todo / total) * 100;
  const inPct = (counts.inProgress / total) * 100;
  const donePct = (counts.done / total) * 100;
  const size = 96;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  const dashTodo = (todoPct / 100) * circ;
  const dashIn = (inPct / 100) * circ;
  const dashDone = (donePct / 100) * circ;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} strokeOpacity={0.08} strokeWidth={stroke} stroke="hsl(var(--border))" fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke="hsl(var(--status-todo))"
            strokeDasharray={`${dashTodo} ${circ - dashTodo}`}
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke="hsl(var(--status-inprogress))"
            strokeDasharray={`${dashIn} ${circ - dashIn}`}
            strokeDashoffset={-dashTodo}
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke="hsl(var(--status-done))"
            strokeDasharray={`${dashDone} ${circ - dashDone}`}
            strokeDashoffset={-(dashTodo + dashIn)}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
      <div>
        <div className="text-sm font-medium">Task distribution</div>
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[color:var(--status-todo)]" /> To Do: {counts.todo}</div>
          <div className="flex items-center gap-2 mt-1"><span className="w-3 h-3 rounded-full bg-[color:var(--status-inprogress)]" /> In Progress: {counts.inProgress}</div>
          <div className="flex items-center gap-2 mt-1"><span className="w-3 h-3 rounded-full bg-[color:var(--status-done)]" /> Done: {counts.done}</div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [projForm, setProjForm] = useState<Partial<CreateProjectInput>>({});
  const [taskForm, setTaskForm] = useState<Partial<CreateTaskInput>>({});
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingNewStatus, setEditingNewStatus] = useState<TaskStatus | null>(null);
  const [editComment, setEditComment] = useState("");

  const { token } = useAuth();
  const metrics = useQuery<MetricsResponse>({ queryKey: ["metrics"], queryFn: () => apiFetch("/api/metrics", token) });
  const projects = useQuery<Project[]>({ queryKey: ["projects"], queryFn: () => apiFetch("/api/projects", token) });
  const users = useQuery<User[]>({ queryKey: ["users"], queryFn: () => apiFetch("/api/users", token) });
  const tasks = useQuery<Task[]>({ queryKey: ["tasks"], queryFn: () => apiFetch("/api/tasks", token) });

  const createProject = useMutation({
    mutationFn: async (input: CreateProjectInput) => apiFetch("/api/projects", token, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); qc.invalidateQueries({ queryKey: ["metrics"] }); },
  });

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => apiFetch("/api/tasks", token, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["metrics"] }); },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => apiFetch(`/api/tasks/${id}`, token, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["metrics"] }); },
  });

  const canCreateProject = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canCreateTask = !!user;

  const counts = {
    todo: (tasks.data ?? []).filter((t) => t.status === "TODO").length,
    inProgress: (tasks.data ?? []).filter((t) => t.status === "IN_PROGRESS").length,
    done: (tasks.data ?? []).filter((t) => t.status === "DONE").length,
  };

  const performStatusChange = (task: Task, newStatus: TaskStatus, comment?: string) => {
    const patch: any = { status: newStatus };
    if (comment) patch.description = comment;
    updateTask.mutate({ id: task.id, patch });
  };

  const requestStatusChange = (task: Task, newStatus: TaskStatus) => {
    // admins/managers immediately perform
    if (user?.role === "ADMIN" || user?.role === "MANAGER") {
      performStatusChange(task, newStatus);
      return;
    }
    // developers must be assigned and will be prompted for a description
    if (user?.role === "DEVELOPER") {
      if (task.assigneeId !== user.id) return alert("You can only update tasks assigned to you");
      setEditingTaskId(task.id);
      setEditingNewStatus(newStatus);
      setEditComment("");
    }
  };

  const miniKanban = (column: TaskStatus) => (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">
          {column === "TODO" ? "To Do" : column === "IN_PROGRESS" ? "In Progress" : "Done"}
        </div>
        <div className="text-xs text-muted-foreground">{(tasks.data ?? []).filter((t) => t.status === column).length}</div>
      </div>
      <div className="space-y-2">
        {(tasks.data ?? []).filter((t) => t.status === column).slice(0, 6).map((t) => (
          <motion.div key={t.id} whileHover={{ x: 4 }} className="rounded border p-3 bg-card flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{t.assigneeId ? users.data?.find((u) => u.id === t.assigneeId)?.name : "Unassigned"}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusPill status={t.status} />
              <div className="text-xs text-muted-foreground">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ""}</div>
              <div className="flex gap-1">
                <button className="text-xs text-muted-foreground hover:text-primary" title="Move forward" onClick={() => {
                  const next: Record<TaskStatus, TaskStatus> = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "DONE" };
                  if (t.status !== "DONE") requestStatusChange(t, next[t.status]);
                }}>▶</button>
                <button className="text-xs text-muted-foreground hover:text-destructive" title="Move back" onClick={() => {
                  const prev: Record<TaskStatus, TaskStatus> = { TODO: "TODO", IN_PROGRESS: "TODO", DONE: "IN_PROGRESS" };
                  if (t.status !== "TODO") requestStatusChange(t, prev[t.status]);
                }}>◀</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

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
          {canCreateProject && (
            <Button onClick={() => setProjForm({ name: "New Project" })} variant="secondary">New Project</Button>
          )}
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Projects</h2>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="flex items-center gap-2">
                <button className={`px-2 py-1 rounded ${filterStatus === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => setFilterStatus("ALL")}>All</button>
                <button className={`px-2 py-1 rounded ${filterStatus === "TODO" ? "bg-[color:var(--status-todo)]/80 text-white" : "bg-muted text-muted-foreground"}`} onClick={() => setFilterStatus("TODO")}>To Do</button>
                <button className={`px-2 py-1 rounded ${filterStatus === "IN_PROGRESS" ? "bg-[color:var(--status-inprogress)]/80 text-white" : "bg-muted text-muted-foreground"}`} onClick={() => setFilterStatus("IN_PROGRESS")}>In Progress</button>
                <button className={`px-2 py-1 rounded ${filterStatus === "DONE" ? "bg-[color:var(--status-done)]/80 text-white" : "bg-muted text-muted-foreground"}`} onClick={() => setFilterStatus("DONE")}>Done</button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {projects.data?.map((p) => (
              <ProjectCard key={p.id} project={p} tasks={(tasks.data ?? []).filter((t) => t.projectId === p.id && (filterStatus === "ALL" ? true : t.status === filterStatus))} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-card">
            <Donut counts={counts} />
          </div>

          <div className="rounded-lg border p-4 bg-card">
            <h3 className="font-semibold text-sm mb-3">Mini Kanban</h3>
            <div className="flex gap-3">
              {miniKanban("TODO")}
              {miniKanban("IN_PROGRESS")}
              {miniKanban("DONE")}
            </div>
          </div>

        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Recent Tasks</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {(tasks.data ?? []).filter((t) => filterStatus === "ALL" ? true : t.status === filterStatus).slice(0, 8).map((t) => (
            <motion.div key={t.id} whileHover={{ x: 4 }} className="rounded border p-3 bg-card flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.assigneeId ? users.data?.find((u) => u.id === t.assigneeId)?.name : "Unassigned"} • {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusPill status={t.status} />
                <div className="flex gap-2">
                  <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => updateTask.mutate({ id: t.id, patch: { status: t.status === "TODO" ? "IN_PROGRESS" : t.status === "IN_PROGRESS" ? "DONE" : "DONE" } })}>Advance</button>
                  <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => updateTask.mutate({ id: t.id, patch: { status: t.status === "DONE" ? "IN_PROGRESS" : t.status === "IN_PROGRESS" ? "TODO" : "TODO" } })}>Back</button>
                </div>
              </div>
            </motion.div>
          ))}
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
