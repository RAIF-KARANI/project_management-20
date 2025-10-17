import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
  { to: "/tasks", label: "Tasks" },
  { to: "/users", label: "Users" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="inline-block h-6 w-6 rounded bg-primary" />
            <span className="text-lg">SprintFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "transition-colors hover:text-primary",
                  location.pathname === n.to ? "text-primary" : "text-muted-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="text-xs text-muted-foreground">Role: Admin</div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
      <footer className="border-t border-border mt-12 text-xs text-muted-foreground">
        <div className="container py-6 flex items-center justify-between">
          <p>© {new Date().getFullYear()} SprintFlow</p>
          <p>Project tracking • Tasks • Roles • Metrics</p>
        </div>
      </footer>
    </div>
  );
}
