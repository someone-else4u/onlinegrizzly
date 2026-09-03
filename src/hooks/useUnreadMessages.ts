import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Lightweight hook for the sidebar badge: total unread direct messages
 * for the current user. Subscribes to realtime inserts/updates.
 */
export function useUnreadMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { count: c } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_group', false)
      .eq('receiver_id', user.id)
      .is('read_at', null);
    setCount(c || 0);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`unread-badge-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        refresh();
      })
      .on('broadcast', { event: 'new_message' }, () => {
        refresh();
      })
      .subscribe();
    // Also listen on the personal inbox broadcast + poll as a fallback
    const inbox = supabase
      .channel(`inbox-badge-${user.id}`)
      .subscribe();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 15000);
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(inbox);
      window.clearInterval(id);
    };
  }, [user, refresh]);

  return count;
}
