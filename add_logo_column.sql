-- Add logo_url column to client_organizations table

ALTER TABLE client_organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN client_organizations.logo_url IS 'URL to company logo stored in Supabase Storage';
