import { createRoot } from "react-dom/client";
import { supabase } from "@/integrations/supabase/client";
import App from "./App.tsx";
import "./index.css";

// Session security: Sign out stale sessions when browser was closed
// We use sessionStorage as a tab-lifetime marker. If it's missing but
// localStorage has a supabase session, it means the browser was reopened
// after being closed — force sign-out so user must re-authenticate.
const SESSION_TAB_KEY = "app_session_active";

if (!sessionStorage.getItem(SESSION_TAB_KEY)) {
  // Mark this tab as active
  sessionStorage.setItem(SESSION_TAB_KEY, "1");
  // Sign out any leftover session from a previous browser session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      supabase.auth.signOut();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
