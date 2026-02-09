-- FIX: Drop and Recreate to resolve "column user_id does not exist" error
-- Run this ENTIRE script

-- 1. Clean up potential bad state
DROP TABLE IF EXISTS audit_applications CASCADE;

-- 2. Create the table correctly
CREATE TABLE audit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Security
ALTER TABLE audit_applications ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (One by one to avoid errors)
CREATE POLICY "Users can view own applications" ON audit_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON audit_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON audit_applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all applications" ON audit_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND active_role IN ('admin', 'lead_auditor', 'auditor')
    )
  );

-- 5. Create Indexes
CREATE INDEX IF NOT EXISTS idx_audit_applications_user_id ON audit_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_applications_status ON audit_applications(status);

-- 6. Add auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_audit_applications_updated_at ON audit_applications;
CREATE TRIGGER update_audit_applications_updated_at
    BEFORE UPDATE ON audit_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
