-- 1. Add column to user_educations
ALTER TABLE user_educations ADD COLUMN document_url TEXT;

-- 2. Create Storage Bucket for Competence Documents
-- Note: Supabase Storage buckets needs to be inserted into `storage.buckets`
INSERT INTO storage.buckets (id, name, public) 
VALUES ('competence-docs', 'competence-docs', false) -- Private bucket
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users upload own competence docs" ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'competence-docs' AND
    auth.uid() = owner
);

-- Allow users to view their own files
CREATE POLICY "Users view own competence docs" ON storage.objects FOR SELECT 
USING (
    bucket_id = 'competence-docs' AND
    auth.uid() = owner
);

-- Allow Lead Auditors/Admins to view all files
CREATE POLICY "Leads view all competence docs" ON storage.objects FOR SELECT 
USING (
    bucket_id = 'competence-docs' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lead_auditor', 'admin'))
);
