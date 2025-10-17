import AppLayout from "@/components/layout/AppLayout";

export default function TasksPage() {
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
      <p className="text-sm text-muted-foreground">A detailed Kanban and list views will appear here. For now, manage tasks via the Dashboard.</p>
    </AppLayout>
  );
}
