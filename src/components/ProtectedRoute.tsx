import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "student";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading } = useAuth();

  // Wait until auth state (and role) finish hydrating to avoid flicker-redirects
  if (loading || (isAuthenticated && requiredRole && !role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect to the user's actual dashboard, never inherit another role's view
    return <Navigate to={role === "admin" ? "/admin-dashboard" : "/student-dashboard"} replace />;
  }

  return <>{children}</>;
}
