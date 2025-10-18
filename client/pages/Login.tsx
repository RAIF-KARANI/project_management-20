import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await login(email, password);
      nav("/dashboard");
    } catch (err) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">Sign in to SprintFlow</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Select a seeded user for demo sign-in or enter an email.
      </p>

      <div className="mt-4 space-y-3">
        <select
          className="w-full rounded border bg-background px-3 py-2"
          onChange={(e) => {
            setEmail(e.target.value);
            // prefill password for seeded users
            const sel = users.find((u) => u.email === e.target.value);
            setPassword(sel ? "password" : "");
          }}
          value={email}
        >
          <option value="">-- choose demo user --</option>
          {users.map((u) => (
            <option key={u.id} value={u.email}>
              {u.name} — {u.role}
            </option>
          ))}
        </select>

        <input
          className="w-full rounded border px-3 py-2"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <Button onClick={handleLogin} disabled={loading || !email || !password}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">Use password "password" for seeded demo users.</div>
      </div>
    </div>
  );
}
