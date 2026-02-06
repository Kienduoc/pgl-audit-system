-- Add DELETE and UPDATE policies for clients on audits table

-- Allow clients to DELETE their own planned audits
DROP POLICY IF EXISTS "Clients can delete their own planned audits" ON audits;

CREATE POLICY "Clients can delete their own planned audits"
ON audits
FOR DELETE
USING (
    auth.uid() = client_id 
    AND status = 'planned'
);

-- Allow clients to UPDATE their own planned audits
DROP POLICY IF EXISTS "Clients can update their own planned audits" ON audits;

CREATE POLICY "Clients can update their own planned audits"
ON audits
FOR UPDATE
USING (
    auth.uid() = client_id 
    AND status = 'planned'
)
WITH CHECK (
    auth.uid() = client_id 
    AND status = 'planned'
);
