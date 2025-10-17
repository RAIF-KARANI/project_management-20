import AppLayout from "@/components/layout/AppLayout";

export default function UsersPage() {
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold tracking-tight">Users</h1>
      <p className="text-sm text-muted-foreground">Manage roles and team members here. Initial roles and members are seeded for demo.</p>
    </AppLayout>
  );
}
