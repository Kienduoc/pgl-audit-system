-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON audits;
DROP POLICY IF EXISTS "Enable read access for profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for audit_members" ON audit_members;

-- 1. Audits: Allow ALL authenticated users to VIEW audits
CREATE POLICY "Enable read access for authenticated users" ON audits
FOR SELECT
TO authenticated
USING (true);

-- 2. Profiles: Allow ALL authenticated users to VIEW profiles
CREATE POLICY "Enable read access for profiles" ON profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Audit Members: Allow ALL authenticated users to VIEW team members
-- Fixed table name from audit_team_members to audit_members
CREATE POLICY "Enable read access for audit_members" ON audit_members
FOR SELECT
TO authenticated
USING (true);
