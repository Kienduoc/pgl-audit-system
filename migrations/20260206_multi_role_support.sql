-- Migration: Multi-Role User Support
-- Created: 2026-02-06
-- Description: Adds support for users to have multiple roles and switch between them

-- Step 1: Add new columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY['client']::text[],
  ADD COLUMN IF NOT EXISTS active_role text DEFAULT 'client';

-- Step 2: Migrate existing single role data to new structure
-- This preserves the current role for all existing users
UPDATE profiles 
SET 
  roles = ARRAY[COALESCE(role, 'client')]::text[],
  active_role = COALESCE(role, 'client')
WHERE roles IS NULL OR active_role IS NULL;

-- Step 3: Add constraints for valid roles
ALTER TABLE profiles 
  ADD CONSTRAINT valid_roles 
  CHECK (roles <@ ARRAY['client', 'auditor', 'lead_auditor', 'admin']::text[]);

ALTER TABLE profiles 
  ADD CONSTRAINT valid_active_role 
  CHECK (active_role = ANY(roles));

-- Step 4: Create index for faster role queries
CREATE INDEX IF NOT EXISTS idx_profiles_active_role ON profiles(active_role);
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON profiles USING GIN(roles);

-- Step 5: Update RLS policies to use active_role instead of role
-- Drop existing policies that reference 'role' column
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies using active_role
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin-specific policies using active_role
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles; -- Drop potential old one shown in query result

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND active_role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND active_role = 'admin'
    )
  );

-- Step 6: Create helper function to get default role based on priority
CREATE OR REPLACE FUNCTION get_default_role(user_roles text[])
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  role_priority text[] := ARRAY['admin', 'lead_auditor', 'auditor', 'client'];
  role text;
BEGIN
  FOREACH role IN ARRAY role_priority
  LOOP
    IF role = ANY(user_roles) THEN
      RETURN role;
    END IF;
  END LOOP;
  RETURN 'client';
END;
$$;

-- Step 7: Add comment for documentation
COMMENT ON COLUMN profiles.roles IS 'Array of all roles assigned to the user';
COMMENT ON COLUMN profiles.active_role IS 'Currently active role for the user session';
COMMENT ON FUNCTION get_default_role IS 'Returns the highest priority role from a list of roles';

-- Verification queries (commented out - run manually to verify)
-- SELECT id, email, roles, active_role FROM profiles LIMIT 10;
-- SELECT * FROM profiles WHERE 'admin' = ANY(roles);
-- SELECT get_default_role(ARRAY['client', 'auditor', 'admin']::text[]);
