-- Add audit_code column to audits table
ALTER TABLE audits 
ADD COLUMN audit_code TEXT;

-- Set unique constraint
ALTER TABLE audits
ADD CONSTRAINT audits_audit_code_unique UNIQUE (audit_code);

-- Create index for faster lookups
CREATE INDEX idx_audits_audit_code ON audits(audit_code);
