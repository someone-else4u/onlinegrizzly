-- Add read tracking + attachment support to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text;

-- Allow recipients (and group members) to mark messages as read (UPDATE only read_at)
CREATE POLICY "Recipients can mark direct messages as read"
ON public.messages
FOR UPDATE
USING (is_group = false AND receiver_id = auth.uid())
WITH CHECK (is_group = false AND receiver_id = auth.uid());

CREATE POLICY "Group members can mark group messages as read"
ON public.messages
FOR UPDATE
USING (
  is_group = true AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = messages.group_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  is_group = true AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = messages.group_id AND user_id = auth.uid()
  )
);

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END $$;

-- Storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone authenticated can read chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON public.messages (receiver_id) WHERE read_at IS NULL AND is_group = false;