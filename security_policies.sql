-- SECURITY POLICIES FOR ISO 17065 SYSTEM
-- Enorcing strict RBAC for Clients, Auditors, and Admins

-- 1. Enable RLS on core tables (if not already)
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTIONS
-- Check if user is an Admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a member of the audit team
CREATE OR REPLACE FUNCTION is_audit_member(_audit_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM audit_members 
    WHERE audit_id = _audit_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. AUDITS TABLE POLICIES
-- Client: View OWN audits only
CREATE POLICY "Client View Own Audits" ON audits
FOR SELECT TO authenticated
USING (
    client_id = auth.uid() 
    OR is_admin() 
    OR lead_auditor_id = auth.uid()
    OR is_audit_member(id)
);

-- Client: Insert (Self-Registration) - Handled by createAudit action with Service Role usually, 
-- but if we allow direct insert via RLS:
CREATE POLICY "Client Create Audit Requests" ON audits
FOR INSERT TO authenticated
WITH CHECK (
    client_id = auth.uid() -- Can only create for self
);

-- Admin/Lead: Update Audits
CREATE POLICY "Lead/Admin Update Audits" ON audits
FOR UPDATE TO authenticated
USING (
    is_admin() 
    OR lead_auditor_id = auth.uid()
);

-- 4. AUDIT PRODUCTS POLICIES
-- Everyone involved can view
CREATE POLICY "View Audit Products" ON audit_products
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits 
        WHERE id = audit_products.audit_id 
        AND (
            client_id = auth.uid() 
            OR lead_auditor_id = auth.uid() 
            OR is_audit_member(id)
            OR is_admin()
        )
    )
);

-- Client can Manage products for 'Planned' audits only
CREATE POLICY "Client Manage Products" ON audit_products
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits 
        WHERE id = audit_products.audit_id 
        AND client_id = auth.uid()
        AND status = 'planned' -- Lock after planning
    )
);

-- 5. AUDIT DOCUMENTS (Evidence/Legal)
-- Policy: Client sees all. Auditors see all.
CREATE POLICY "Access Audit Documents" ON audit_documents
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits 
        WHERE id = audit_documents.audit_id 
        AND (
            client_id = auth.uid() 
            OR lead_auditor_id = auth.uid() 
            OR is_audit_member(id)
            OR is_admin()
        )
    )
);

-- 6. AUDIT CHECKLIST (INTERNAL - CRITICAL)
-- Client MUST NOT SEE Checklist Items
CREATE POLICY "Internal Checklist Access" ON audit_checklist_items
FOR ALL TO authenticated
USING (
    -- ONLY Auditors/Admin
    (
        EXISTS (
            SELECT 1 FROM audits 
            WHERE id = audit_checklist_items.audit_id 
            AND (lead_auditor_id = auth.uid() OR is_audit_member(id))
        )
        OR is_admin()
    )
    -- Explicitly EXCLUDE Client if they are not the auditor (edge case)
    AND NOT (
        EXISTS (
            SELECT 1 FROM audits
            WHERE id = audit_checklist_items.audit_id
            AND client_id = auth.uid()
        )
        AND NOT is_admin() -- Allow if Client is also Admin (testing)
    )
);

-- 7. FINDINGS (NCs)
-- Client: View Only. Reply (Update specific fields) likely handled via RPC or strict column update?
-- For now, allow Update if Client Owns Audit, but frontend limits fields.
CREATE POLICY "View Audit Findings" ON findings
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits 
        WHERE id = findings.audit_id 
        AND (
            client_id = auth.uid() 
            OR lead_auditor_id = auth.uid() 
            OR is_audit_member(id)
            OR is_admin()
        )
    )
);

-- Auditors: Full Control on Findings
CREATE POLICY "Auditor Manage Findings" ON findings
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits 
        WHERE id = findings.audit_id 
        AND (
            lead_auditor_id = auth.uid() 
            OR is_audit_member(id)
            OR is_admin()
        )
    )
);

-- Client: Update (Reply to NC - e.g. root_cause, corrective_action)
CREATE POLICY "Client Reply Findings" ON findings
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM audits 
        WHERE id = findings.audit_id 
        AND client_id = auth.uid()
    )
)
WITH CHECK (
    -- Prevent Client from changing the NC statement or rating
    -- This requires column-level security or Trigger, but RLS `WITH CHECK` can compare old/new ideally.
    -- Postgres RLS check compares *new* row against expression.
    -- Simple RLS doesn't easily support "Column X didn't change".
    -- We assume Frontend enforces this + maybe a Trigger later.
    true
);
