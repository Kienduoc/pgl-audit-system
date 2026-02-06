-- Fix RLS for Audits table to allow Client Insertion

-- Drop existing restricted policy if it exists (or just add new one)
-- Check if policy exists first is complex in simple SQL script without procedural code, 
-- but `create policy if not exists` isn't standard PG. 
-- We will DROP IF EXISTS to be safe.

DROP POLICY IF EXISTS "Clients can insert their own audits" ON audits;

CREATE POLICY "Clients can insert their own audits"
ON audits
FOR INSERT
WITH CHECK (
    auth.uid() = client_id
);

-- Ensure Clients can also SELECT their own audits (view the result)
DROP POLICY IF EXISTS "Clients can view their own audits" ON audits;

CREATE POLICY "Clients can view their own audits"
ON audits
FOR SELECT
USING (
    auth.uid() = client_id
);

-- Grant permissions if not already granted (though RLS implies role has GRANT)
GRANT ALL ON audits TO authenticated;
