import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { UserRole } from "@/hooks/useAuth";

/**
 * Wipe every Supabase auth artifact from this browser (sessionStorage,
 * localStorage and cookies). Used to prevent any previous user's session
 * from leaking into the next login on the same machine.
 */
export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    const wipe = (store: Storage) => {
      const toRemove: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key) continue;
        if (
          key === "grizzly-auth-session" ||
          key.startsWith("sb-") ||
          key.startsWith("supabase.auth.")
        ) {
          toRemove.push(key);
        }
      }
      toRemove.forEach((k) => store.removeItem(k));
    };
    wipe(window.sessionStorage);
    wipe(window.localStorage);
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0]?.trim();
      if (name && (name.startsWith("sb-") || name.startsWith("supabase"))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  } catch {
    /* best-effort cleanup */
  }
}

/**
 * Strictly verify the current Supabase session by hitting the auth API.
 * Returns null if there is no valid session bound to a user id.
 */
export async function verifySession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  const session = data.session;
  if (!session?.user?.id) return null;
  return session;
}

/**
 * Fetch role for a specific verified user id. Never trust a role unless it
 * came back for the exact session user id.
 */
export async function fetchRoleFor(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return ((data?.role as UserRole) ?? "student") as UserRole;
}

export async function fetchProfileFor(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return data ?? null;
}

/**
 * Verify session AND fetch role for that exact user. Returns null on any
 * mismatch so callers can safely redirect to login.
 */
export async function verifySessionAndRole(): Promise<
  { session: Session; user: User; role: UserRole } | null
> {
  const session = await verifySession();
  if (!session) return null;
  const role = await fetchRoleFor(session.user.id);
  if (!role) return null;
  return { session, user: session.user, role };
}

/**
 * Hard sign-out: revoke local session and wipe browser storage. Safe to call
 * even if there is no current session.
 */
export async function hardSignOut() {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* ignore */
  }
  clearAuthStorage();
}
