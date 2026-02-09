-- Migration: Create Audit Applications Table
-- Created: 2026-02-06
-- Description: Stores audit program applications with flexible JSONB content

-- Step 1: Create audit_applications table
CREATE TABLE IF NOT EXISTS audit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add RLS Policies
ALTER TABLE audit_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications" ON audit_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create their own applications
CREATE POLICY "Users can create own applications" ON audit_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own applications
CREATE POLICY "Users can update own applications" ON audit_applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins and Auditors can view all applications
-- (Assuming we want them to see applications to review them)
CREATE POLICY "Staff can view all applications" ON audit_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND active_role IN ('admin', 'lead_auditor', 'auditor')
    )
  );

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_applications_user_id ON audit_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_applications_status ON audit_applications(status);

-- Step 4: Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_audit_applications_updated_at
    BEFORE UPDATE ON audit_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify
-- SELECT * FROM audit_applications;
