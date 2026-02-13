-- RESET ALL AUDIT APPLICATIONS TO INITIAL STATE
-- This will allow you to test the full workflow from scratch

-- 1. Delete all audit team assignments
DELETE FROM audit_teams;

-- 2. Reset all audit applications to Draft status
UPDATE audit_applications 
SET status = 'Draft'
WHERE status != 'Draft';

-- 3. Optional: Delete all audits if you want to start completely fresh
-- Uncomment the line below if you want to delete all audit programs
-- DELETE FROM audits;

-- Reload schema cache
NOTIFY pgrst, 'reload config';

-- Verify the reset
SELECT 
    status, 
    COUNT(*) as count 
FROM audit_applications 
GROUP BY status;
