-- FIX: Add missing INSERT policies

-- 1. Allow Lead Auditors (and Admins) to CREATE Audits
CREATE POLICY "Lead Auditors can insert audits" ON audits FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lead_auditor', 'admin'))
);

-- 2. Allow Lead Auditors (and Admins) to INSERT Checklist Items
CREATE POLICY "Lead Auditors can insert checklist items" ON audit_checklist_items FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('lead_auditor', 'admin'))
);

-- 3. Verify Profiles Policies (Ensure users can read own profile to check role)
-- The existing policy "Public profiles are viewable by everyone" covers SELECT.
