-- Create storage bucket for task images
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-images', 'task-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read public task images
CREATE POLICY "Task images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-images');

-- Allow admins to upload task images
CREATE POLICY "Admins can upload task images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-images' AND public.is_admin(auth.uid()));

-- Allow admins to update task images
CREATE POLICY "Admins can update task images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'task-images' AND public.is_admin(auth.uid()));

-- Allow admins to delete task images
CREATE POLICY "Admins can delete task images"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-images' AND public.is_admin(auth.uid()));