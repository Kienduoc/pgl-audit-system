-- Create Supabase Storage bucket for company logos and setup RLS policies

-- 1. Create storage bucket (run this in Supabase Dashboard > Storage or via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'company-assets' 
    AND (storage.foldername(name))[1] = 'logos'
    AND auth.uid()::text = (storage.filename(name))::text LIKE auth.uid()::text || '-%'
);

-- 3. Allow public read access to all logos
CREATE POLICY "Public read access to company logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-assets');

-- 4. Allow users to delete their own logos
CREATE POLICY "Users can delete their own company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] = 'logos'
    AND auth.uid()::text = (storage.filename(name))::text LIKE auth.uid()::text || '-%'
);

-- 5. Allow users to update their own logos
CREATE POLICY "Users can update their own company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] = 'logos'
    AND auth.uid()::text = (storage.filename(name))::text LIKE auth.uid()::text || '-%'
);
