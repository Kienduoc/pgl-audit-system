-- FIX ADMIN ACCESS TO AUDIT APPLICATIONS
-- This will allow admins to see all submitted applications

-- 1. Drop ALL existing policies
DROP POLICY IF EXISTS "Clients manage their own applications" ON audit_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON audit_applications;

-- 2. Create policy for CLIENTS (manage their own)
CREATE POLICY "Clients manage their own applications" 
ON audit_applications 
FOR ALL 
USING (
    user_id = auth.uid()
);

-- 3. Create policy for ADMINS (read all)
CREATE POLICY "Admins view all applications" 
ON audit_applications 
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'lead_auditor', 'auditor')
    )
);

-- 4. Create policy for ADMINS (update statuses)
CREATE POLICY "Admins update application status" 
ON audit_applications 
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'lead_auditor', 'auditor')
    )
);

-- Reload schema
NOTIFY pgrst, 'reload config';

-- Test query
SELECT COUNT(*) as total_apps FROM audit_applications;
SELECT COUNT(*) as submitted_apps FROM audit_applications WHERE status IN ('Submitted', 'submitted');
