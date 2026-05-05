I’ll fix this at the core auth/routing layer and tighten the dashboard data paths so a previous user’s in-memory state cannot render a dashboard before the current session and role are verified.

Implementation plan:

1. Centralize strict session verification
- Add shared auth helpers around the existing Lovable Cloud client, without editing the auto-generated client file again.
- Create/extend helpers to:
  - clear all auth-related browser storage and cookies;
  - call `supabase.auth.getSession()` explicitly;
  - verify the session has a real `session.user.id`;
  - fetch the role/profile for exactly that `session.user.id`.
- Update `useAuth` so it never marks the user as authenticated until the session and role/profile lookup for that exact user have completed.
- Guard against stale async role fetches overwriting state after another login/logout by checking that the returned role belongs to the currently verified session user.

2. Fix Login and AdminLogin auto-login behavior
- On `/login` and `/admin/login` mount, explicitly call `supabase.auth.getSession()`.
- If any existing session is found, sign it out locally and clear browser auth state before showing the login form.
- Remove automatic dashboard redirects from login pages that rely only on `useAuth` local state.
- After a successful credential login, fetch/verify the fresh session and its role, then redirect:
  - admin users to `/admin-dashboard`;
  - students to `/student-dashboard`;
  - a non-admin trying admin login will be routed to the student dashboard or shown an authorization message, depending on the current page flow.

3. Fix RBAC race conditions in ProtectedRoute
- Update `ProtectedRoute` to perform its own `supabase.auth.getSession()` verification on every route mount/navigation.
- Show a loading spinner until all three are confirmed:
  - session exists;
  - session user id exists;
  - user role for that same id is loaded.
- If no session exists, redirect to `/login`.
- If role is wrong, redirect based on the verified role only, never based on stale local state.
- Prevent any child dashboard/test page from rendering while the role is still unknown.

4. Make data fetching session-bound
- Review and update student-facing data fetches so they use the verified current session user id at fetch time, not a possibly stale `user` object captured earlier.
- Focus areas:
  - `StudentDashboard` / `useStudentDashboardData`
  - `/student/tests`
  - `/student/results`
  - `/student/analytics`
  - `TestResults`
  - exam submission flow where relevant.
- Ensure student queries on submissions always include `.eq('user_id', session.user.id)`.
- Keep public published-test reads where intended, but all student-specific completion/results data will be filtered by the current session user.

5. Keep admin data access broad but verified
- Admin pages can continue to see all tests/students/results, but only after `ProtectedRoute` confirms the user is an admin.
- Add explicit session checks before admin data fetches where needed so those pages do not start querying before auth is verified.
- Focus areas:
  - admin dashboard hook
  - tests list
  - students list
  - results leaderboard
  - analytics.

6. Backend/RLS review and security migration if needed
- Current RLS already separates:
  - admins can view/manage broad records via `has_role(auth.uid(), 'admin')`;
  - students can view only their own profiles/submissions;
  - published tests/questions are visible to students.
- I’ll add a migration to harden callable security-definer functions if needed, especially by revoking public/anonymous execution for functions that should only be used by authenticated users.
- I will not store roles on profiles/users; roles remain in `user_roles`.

7. Validation
- Verify that visiting `/login` with an existing session clears it and shows the login form instead of auto-redirecting.
- Verify admin and student routes wait on session + role before rendering.
- Verify a student cannot briefly see admin UI and an admin cannot briefly see student UI because of stale role state.
- Verify student result/test/submission queries are always scoped to the current session user id.