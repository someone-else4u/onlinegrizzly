import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  receiver_id: string | null;
  group_id: string | null;
  is_group: boolean;
  text: string;
  created_at: string;
  sender_name?: string;
}

interface ChatContact {
  id: string;
  name: string;
  email?: string;
  type: 'user' | 'group';
}

export function useMessages() {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const profileCache = useRef<Record<string, string>>({});
  const selectedContactRef = useRef<ChatContact | null>(null);

  // Keep ref in sync so realtime callback always sees latest
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  const getProfileName = async (userId: string): Promise<string> => {
    if (profileCache.current[userId]) return profileCache.current[userId];
    const { data } = await supabase.from('profiles').select('name').eq('user_id', userId).single();
    const name = data?.name || 'Unknown';
    profileCache.current[userId] = name;
    return name;
  };

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    try {
      if (role === 'admin') {
        const [{ data: students }, { data: groups }] = await Promise.all([
          supabase.from('profiles').select('user_id, name, email').order('name'),
          supabase.from('chat_groups').select('id, name, description'),
        ]);
        const studentContacts: ChatContact[] = (students || []).map(s => ({ id: s.user_id, name: s.name, email: s.email, type: 'user' }));
        const groupContacts: ChatContact[] = (groups || []).map(g => ({ id: g.id, name: g.name, type: 'group' }));
        setContacts([...studentContacts, ...groupContacts]);
      } else {
        const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
        const adminContacts: ChatContact[] = [];
        if (admins) {
          const profilePromises = admins.map(async (admin) => {
            const name = await getProfileName(admin.user_id);
            return { id: admin.user_id, name, type: 'user' as const };
          });
          adminContacts.push(...await Promise.all(profilePromises));
        }
        const { data: memberGroups } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
        const groupContacts: ChatContact[] = [];
        if (memberGroups && memberGroups.length > 0) {
          const { data: groups } = await supabase.from('chat_groups').select('id, name').in('id', memberGroups.map(m => m.group_id));
          if (groups) groups.forEach(g => groupContacts.push({ id: g.id, name: g.name, type: 'group' }));
        }
        setContacts([...adminContacts, ...groupContacts]);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  }, [user, role]);

  const fetchMessages = useCallback(async () => {
    if (!user || !selectedContact) return;
    try {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (selectedContact.type === 'group') {
        query = query.eq('group_id', selectedContact.id).eq('is_group', true);
      } else {
        query = query.eq('is_group', false).or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`
        );
      }
      const { data, error } = await query;
      if (error) throw error;

      const namesNeeded = [...new Set((data || []).map(m => m.sender_id))];
      await Promise.all(namesNeeded.map(id => getProfileName(id)));

      const messagesWithNames = (data || []).map(msg => ({
        ...msg,
        sender_name: profileCache.current[msg.sender_id] || 'Unknown',
      }));
      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user, selectedContact]);

  const sendMessage = async (text: string) => {
    if (!user || !selectedContact || !text.trim() || !role) return;
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        sender_role: role,
        text: text.trim(),
        is_group: selectedContact.type === 'group',
        receiver_id: selectedContact.type === 'user' ? selectedContact.id : null,
        group_id: selectedContact.type === 'group' ? selectedContact.id : null,
      });
      if (error) throw error;
      // Don't manually append – realtime will handle it
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    fetchContacts().finally(() => setLoading(false));
  }, [fetchContacts]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedContact, fetchMessages]);

  // Real-time subscription — single channel for user's lifetime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-rt-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMsg = payload.new as any;
          const current = selectedContactRef.current;
          if (!current) return;

          const isRelevant = current.type === 'group'
            ? newMsg.group_id === current.id && newMsg.is_group === true
            : !newMsg.is_group &&
              ((newMsg.sender_id === current.id && newMsg.receiver_id === user.id) ||
               (newMsg.sender_id === user.id && newMsg.receiver_id === current.id));

          if (isRelevant) {
            const senderName = await getProfileName(newMsg.sender_id);
            setMessages(prev => {
              // Deduplicate by id
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, sender_name: senderName }];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    messages, contacts, loading,
    selectedContact, setSelectedContact,
    sendMessage, refetch: fetchMessages,
  };
}
