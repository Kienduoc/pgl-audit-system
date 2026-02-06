-- Add enterprise fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS tax_code TEXT,
ADD COLUMN IF NOT EXISTS representative TEXT;

-- Enhance RLS for profiles to allow Admin/Leads to insert/update
-- (Assuming Admin role exists or using Lead Auditor)
CREATE POLICY "Admin/Lead can update any profile" ON profiles
FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lead_auditor'))
);

CREATE POLICY "Admin/Lead can insert profiles" ON profiles
FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lead_auditor'))
);
