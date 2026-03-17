
-- Add scheduling columns to tests table
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS schedule_type text NOT NULL DEFAULT 'flexible';

-- Add subject column to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'physics';

-- Add image columns for options
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_a_image text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_b_image text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_c_image text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_d_image text;

-- Make correct_option nullable (for deferred answers)
ALTER TABLE public.questions ALTER COLUMN correct_option DROP NOT NULL;

-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: admins can upload
CREATE POLICY "Admins can upload question images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'question-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policy: anyone authenticated can view
CREATE POLICY "Anyone can view question images"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

-- Storage policy: admins can delete
CREATE POLICY "Admins can delete question images"
ON storage.objects FOR DELETE
USING (bucket_id = 'question-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
