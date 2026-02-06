-- Add certificate dates to audits table
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS issue_date DATE,
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Comment on columns for clarity
COMMENT ON COLUMN audits.issue_date IS 'Date when the certificate was issued';
COMMENT ON COLUMN audits.expiry_date IS 'Date when the certificate expires (usually 3 years after issue)';
