-- Chat groups table
CREATE TABLE public.chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;

-- Group members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role app_role NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  is_group BOOLEAN NOT NULL DEFAULT false,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((is_group = true AND group_id IS NOT NULL) OR (is_group = false AND receiver_id IS NOT NULL))
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_groups
CREATE POLICY "Admins can manage all groups"
ON public.chat_groups
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view groups they belong to"
ON public.chat_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = chat_groups.id
    AND group_members.user_id = auth.uid()
  )
);

-- RLS Policies for group_members
CREATE POLICY "Admins can manage all group members"
ON public.group_members
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own memberships"
ON public.group_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Group admins can manage members"
ON public.group_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
);

-- RLS Policies for messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can send messages"
ON public.messages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND sender_id = auth.uid());

CREATE POLICY "Users can view their direct messages"
ON public.messages
FOR SELECT
USING (
  is_group = false AND (sender_id = auth.uid() OR receiver_id = auth.uid())
);

CREATE POLICY "Users can send direct messages"
ON public.messages
FOR INSERT
WITH CHECK (
  is_group = false AND sender_id = auth.uid()
);

CREATE POLICY "Users can view group messages they belong to"
ON public.messages
FOR SELECT
USING (
  is_group = true AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = messages.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send group messages to groups they belong to"
ON public.messages
FOR INSERT
WITH CHECK (
  is_group = true AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = messages.group_id
    AND group_members.user_id = auth.uid()
  )
);