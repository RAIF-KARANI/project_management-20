import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Intro() {
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (user) {
      // If already signed in, send to dashboard
      nav("/dashboard");
    }
  }, [user, nav]);

  return (
    <div className="max-w-3xl mx-auto mt-16 rounded-lg border bg-card p-8 text-center">
      <h1 className="text-3xl font-bold">Welcome to SprintFlow</h1>
      <p className="mt-3 text-muted-foreground">Track projects, manage tasks, assign work and measure progress — all in one place.</p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button onClick={() => nav('/login')}>Sign in</Button>
        <Button variant="secondary" onClick={() => nav('/dashboard')}>Explore demo dashboard</Button>
      </div>

      <div className="mt-6 text-sm text-muted-foreground">If you already have an account, click Sign in. For demo users, pick a seeded user on the login page.</div>
    </div>
  );
}
