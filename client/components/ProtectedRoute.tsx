import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Array<"ADMIN" | "MANAGER" | "DEVELOPER">;
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return (
      <div className="max-w-md mx-auto mt-12 rounded-lg border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold">Unauthorized</h2>
        <p className="text-sm text-muted-foreground mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
