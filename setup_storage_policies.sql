-- Setup RLS policies for company-assets storage bucket
-- (Bucket đã được tạo thủ công qua Dashboard)

-- 1. Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'company-assets' 
    AND (storage.foldername(name))[1] = 'logos'
);

-- 2. Allow public read access to all logos
CREATE POLICY "Public read access to company logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-assets');

-- 3. Allow users to delete their own logos
CREATE POLICY "Users can delete their own company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] = 'logos'
);

-- 4. Allow users to update their own logos
CREATE POLICY "Users can update their own company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] = 'logos'
);
