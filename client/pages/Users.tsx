import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function UsersPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "DEVELOPER", password: "password" });

  const users = useQuery({ queryKey: ["users"], queryFn: () => apiFetch('/api/users', token) });

  const createUser = useMutation({
    mutationFn: async (input: { name: string; email: string; role: string }) => apiFetch('/api/users', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setCreating(false); setForm({ name: '', email: '', role: 'DEVELOPER' }); },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => apiFetch(`/api/users/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/users/${id}`, token, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage roles and team members here. Only admins can create, edit or remove users.</p>
        </div>
        <div>
          <Button onClick={() => setCreating(true)}>Add user</Button>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {Array.isArray(users.data) && users.data.map((u: any) => (
          <div key={u.id} className="rounded-lg border p-4 bg-card flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <select className="rounded border bg-background px-2 py-1 text-sm" value={u.role} onChange={(e) => updateUser.mutate({ id: u.id, patch: { role: e.target.value } })}>
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="DEVELOPER">DEVELOPER</option>
              </select>
              <button className="text-sm text-destructive" onClick={() => { if (confirm('Delete user?')) deleteUser.mutate(u.id); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => setCreating(false)}>
          <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Create User</h3>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded border bg-background px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full rounded border bg-background px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <select className="w-full rounded border bg-background px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="DEVELOPER">DEVELOPER</option>
              </select>
              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
                <Button onClick={() => createUser.mutate(form)} disabled={!form.email || !form.name}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
