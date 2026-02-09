-- Create Supabase Storage bucket for audit attachments (Private)

-- 1. Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audit-attachments',
    'audit-attachments',
    false, -- Private bucket
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- 2. RLS Policies

-- Policy: Authenticated users can upload to their own folder: {user_id}/*
CREATE POLICY "Users can upload own audit attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'audit-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own audit attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'audit-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update/delete their own files
CREATE POLICY "Users can update own audit attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'audit-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own audit attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'audit-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Staff (Admins, Auditors) can view ALL files
CREATE POLICY "Staff can view all audit attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'audit-attachments'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND active_role IN ('admin', 'lead_auditor', 'auditor')
    )
);
