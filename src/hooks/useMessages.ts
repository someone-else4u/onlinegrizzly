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
  read_at?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
}

interface ChatContact {
  id: string;
  name: string;
  email?: string;
  type: 'user' | 'group';
  online?: boolean;
  unread?: number;
}

export function useMessages() {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({});
  const profileCache = useRef<Record<string, string>>({});
  const selectedContactRef = useRef<ChatContact | null>(null);

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

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;
    // Direct unread (messages addressed to me, not yet read)
    const { data: direct } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('is_group', false)
      .eq('receiver_id', user.id)
      .is('read_at', null);
    const counts: Record<string, number> = {};
    (direct || []).forEach((m: any) => {
      counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
    });
    setUnreadByContact(counts);
  }, [user]);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    try {
      if (role === 'admin') {
        const [{ data: students }, { data: groups }] = await Promise.all([
          supabase.from('profiles').select('user_id, name, email').order('name'),
          supabase.from('chat_groups').select('id, name, description'),
        ]);
        const studentContacts: ChatContact[] = (students || [])
          .filter((s: any) => s.user_id !== user.id)
          .map((s: any) => ({ id: s.user_id, name: s.name, email: s.email, type: 'user' }));
        const groupContacts: ChatContact[] = (groups || []).map((g: any) => ({ id: g.id, name: g.name, type: 'group' }));
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

  const markRead = useCallback(async (contact: ChatContact) => {
    if (!user || contact.type !== 'user') return;
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('is_group', false)
      .eq('receiver_id', user.id)
      .eq('sender_id', contact.id)
      .is('read_at', null);
    setUnreadByContact(prev => {
      const n = { ...prev };
      delete n[contact.id];
      return n;
    });
  }, [user]);

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
      setMessages(prev => {
        const ids = new Set(messagesWithNames.map(m => m.id));
        const extras = prev.filter(m => !ids.has(m.id) && new Date(m.created_at).getTime() > Date.now() - 60000);
        return [...messagesWithNames, ...extras];
      });
      await markRead(selectedContact);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user, selectedContact, markRead]);

  const roomKey = (contact: ChatContact) =>
    contact.type === 'group'
      ? `room-group-${contact.id}`
      : `room-dm-${[user?.id, contact.id].sort().join('-')}`;

  const appendMessage = useCallback(async (msg: Message) => {
    const senderName = await getProfileName(msg.sender_id);
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, { ...msg, sender_name: senderName }];
    });
  }, []);

  const sendMessage = async (
    text: string,
    attachment?: { url: string; name: string; type: string }
  ) => {
    if (!user || !selectedContact || !role) return;
    if (!text.trim() && !attachment) return;
    try {
      const { data, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        sender_role: role,
        text: text.trim(),
        is_group: selectedContact.type === 'group',
        receiver_id: selectedContact.type === 'user' ? selectedContact.id : null,
        group_id: selectedContact.type === 'group' ? selectedContact.id : null,
        attachment_url: attachment?.url ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_type: attachment?.type ?? null,
      }).select('*').single();
      if (error) throw error;
      if (data) {
        // Optimistic local append (instant for the sender)
        await appendMessage(data as Message);
        // Secondary delivery path: broadcast to the room + recipient inbox.
        // This works even if postgres_changes is delayed or blocked.
        const room = supabase.channel(roomKey(selectedContact));
        await room.send({ type: 'broadcast', event: 'new_message', payload: data });
        supabase.removeChannel(room);
        if (selectedContact.type === 'user') {
          const inbox = supabase.channel(`inbox-${selectedContact.id}`);
          await inbox.send({ type: 'broadcast', event: 'new_message', payload: data });
          supabase.removeChannel(inbox);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
    return { url: data.publicUrl, name: file.name, type: file.type };
  };

  useEffect(() => {
    fetchContacts().finally(() => setLoading(false));
    fetchUnreadCounts();
  }, [fetchContacts, fetchUnreadCounts]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedContact, fetchMessages]);

  // Realtime messages
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

          // Update unread counter for direct messages addressed to me
          if (!newMsg.is_group && newMsg.receiver_id === user.id && newMsg.sender_id !== user.id) {
            const isOpen = current?.type === 'user' && current.id === newMsg.sender_id;
            if (!isOpen) {
              setUnreadByContact(prev => ({ ...prev, [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1 }));
            }
          }

          if (!current) return;
          const isRelevant = current.type === 'group'
            ? newMsg.group_id === current.id && newMsg.is_group === true
            : !newMsg.is_group &&
              ((newMsg.sender_id === current.id && newMsg.receiver_id === user.id) ||
               (newMsg.sender_id === user.id && newMsg.receiver_id === current.id));

          if (isRelevant) {
            const senderName = await getProfileName(newMsg.sender_id);
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, sender_name: senderName }];
            });
            // auto mark as read if I'm the recipient and the chat is open
            if (!newMsg.is_group && newMsg.receiver_id === user.id) {
              markRead(current);
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime messages channel:', status, err?.message);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, markRead]);

  // Broadcast room for the open conversation (secondary realtime path)
  useEffect(() => {
    if (!user || !selectedContact) return;
    const contact = selectedContact;
    const channel = supabase
      .channel(roomKey(contact), { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        const msg = payload as Message;
        if (!msg || msg.sender_id === user.id) return;
        appendMessage(msg);
        if (!msg.is_group && msg.receiver_id === user.id) markRead(contact);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedContact, appendMessage, markRead]);

  // Personal inbox broadcast: bump unread counters for closed conversations
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inbox-${user.id}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        const msg = payload as Message;
        if (!msg || msg.is_group || msg.receiver_id !== user.id) return;
        const current = selectedContactRef.current;
        const isOpen = current?.type === 'user' && current.id === msg.sender_id;
        if (!isOpen) {
          setUnreadByContact(prev => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Polling fallback: if realtime is ever unavailable, refresh every 6s while visible
  useEffect(() => {
    if (!user || !selectedContact) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
        fetchUnreadCounts();
      }
    }, 6000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchMessages();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, selectedContact, fetchMessages, fetchUnreadCounts]);

  // Presence channel for online/offline indicators
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const enrichedContacts: ChatContact[] = contacts.map(c => ({
    ...c,
    online: c.type === 'user' ? onlineUsers.has(c.id) : undefined,
    unread: c.type === 'user' ? (unreadByContact[c.id] || 0) : 0,
  }));

  const totalUnread = Object.values(unreadByContact).reduce((a, b) => a + b, 0);

  return {
    messages,
    contacts: enrichedContacts,
    loading,
    selectedContact,
    setSelectedContact,
    sendMessage,
    uploadAttachment,
    refetch: fetchMessages,
    totalUnread,
    onlineUsers,
  };
}
