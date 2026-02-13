-- 1. Ensure `user_id` column exists in audit_applications (for ownership)
ALTER TABLE audit_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Update RLS policy to allow users to manage their own applications directly via user_id
DROP POLICY IF EXISTS "Clients manage their own applications" ON audit_applications;

CREATE POLICY "Clients manage their own applications" 
ON audit_applications FOR ALL 
USING (
    user_id = auth.uid() OR
    client_org_id IN (
        SELECT id FROM client_organizations WHERE profile_id = auth.uid()
    )
);

-- 3. Also fix client_organizations RLS just in case
DROP POLICY IF EXISTS "Clients manage their own org info" ON client_organizations;

CREATE POLICY "Clients manage their own org info" 
ON client_organizations FOR ALL 
USING (profile_id = auth.uid());

-- 4. Enable RLS on client_organizations if not already enabled
ALTER TABLE client_organizations ENABLE ROW LEVEL SECURITY;
