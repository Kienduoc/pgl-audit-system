-- Allow admins and auditors to read ALL audit applications
CREATE POLICY "Admins can view all applications" 
ON audit_applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'lead_auditor', 'auditor')
    )
);

-- Reload schema cache
NOTIFY pgrst, 'reload config';
