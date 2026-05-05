import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchRoleFor, verifySession } from "@/lib/authSession";
import type { UserRole } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

type GuardState =
  | { status: "checking" }
  | { status: "anonymous" }
  | { status: "ready"; userId: string; role: UserRole };

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const [state, setState] = useState<GuardState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      setState({ status: "checking" });
      const session = await verifySession();
      if (cancelled) return;
      if (!session) {
        setState({ status: "anonymous" });
        return;
      }
      const role = await fetchRoleFor(session.user.id);
      if (cancelled) return;
      if (!role) {
        setState({ status: "anonymous" });
        return;
      }
      setState({ status: "ready", userId: session.user.id, role });
    };

    verify();

    // Re-verify on any auth state change (sign-in/sign-out in another tab,
    // token refresh failure, etc.) so this guard never serves stale state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(verify, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // Re-run when navigating to a new protected path
  }, [location.pathname]);

  if (state.status === "checking") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  if (state.status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && state.role !== requiredRole) {
    return (
      <Navigate
        to={state.role === "admin" ? "/admin-dashboard" : "/student-dashboard"}
        replace
      />
    );
  }

  return <>{children}</>;
}
