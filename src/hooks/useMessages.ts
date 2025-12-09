import { useState, useEffect, useCallback } from "react";
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
  lastMessage?: string;
  lastMessageTime?: string;
}

export function useMessages() {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!user) return;

    try {
      if (role === 'admin') {
        // Admins see all students
        const { data: students, error } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .order('name');

        if (error) throw error;

        // Also fetch groups
        const { data: groups } = await supabase
          .from('chat_groups')
          .select('id, name, description');

        const studentContacts: ChatContact[] = (students || []).map(s => ({
          id: s.user_id,
          name: s.name,
          email: s.email,
          type: 'user' as const
        }));

        const groupContacts: ChatContact[] = (groups || []).map(g => ({
          id: g.id,
          name: g.name,
          type: 'group' as const
        }));

        setContacts([...studentContacts, ...groupContacts]);
      } else {
        // Students see admin contact and their groups
        const { data: admins } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        const adminContacts: ChatContact[] = [];

        if (admins && admins.length > 0) {
          for (const admin of admins) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('user_id', admin.user_id)
              .single();

            if (profile) {
              adminContacts.push({
                id: admin.user_id,
                name: profile.name || 'Admin',
                email: profile.email,
                type: 'user'
              });
            }
          }
        }

        // Fetch groups the student belongs to
        const { data: memberGroups } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        const groupContacts: ChatContact[] = [];

        if (memberGroups && memberGroups.length > 0) {
          const groupIds = memberGroups.map(m => m.group_id);
          const { data: groups } = await supabase
            .from('chat_groups')
            .select('id, name')
            .in('id', groupIds);

          if (groups) {
            groups.forEach(g => {
              groupContacts.push({
                id: g.id,
                name: g.name,
                type: 'group'
              });
            });
          }
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
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (selectedContact.type === 'group') {
        query = query.eq('group_id', selectedContact.id).eq('is_group', true);
      } else {
        query = query
          .eq('is_group', false)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch sender names
      const messagesWithNames: Message[] = [];
      for (const msg of data || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', msg.sender_id)
          .single();

        messagesWithNames.push({
          ...msg,
          sender_name: profile?.name || 'Unknown'
        });
      }

      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user, selectedContact]);

  const sendMessage = async (text: string) => {
    if (!user || !selectedContact || !text.trim() || !role) return;

    try {
      const messageData = {
        sender_id: user.id,
        sender_role: role,
        text: text.trim(),
        is_group: selectedContact.type === 'group',
        receiver_id: selectedContact.type === 'user' ? selectedContact.id : null,
        group_id: selectedContact.type === 'group' ? selectedContact.id : null
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      // Refresh messages
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchContacts().finally(() => setLoading(false));
  }, [fetchContacts]);

  // Fetch messages when contact changes
  useEffect(() => {
    if (selectedContact) {
      fetchMessages();
    }
  }, [selectedContact, fetchMessages]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!selectedContact) return;

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedContact, fetchMessages]);

  return {
    messages,
    contacts,
    loading,
    selectedContact,
    setSelectedContact,
    sendMessage,
    refetch: fetchMessages
  };
}