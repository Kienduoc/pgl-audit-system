-- Add missing fields to profiles table for Audit Sync

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name_en TEXT,
ADD COLUMN IF NOT EXISTS founding_year TEXT,
ADD COLUMN IF NOT EXISTS address_office TEXT,
ADD COLUMN IF NOT EXISTS address_factory TEXT,
ADD COLUMN IF NOT EXISTS representative_name TEXT,
ADD COLUMN IF NOT EXISTS representative_email TEXT,
ADD COLUMN IF NOT EXISTS representative_phone TEXT,
ADD COLUMN IF NOT EXISTS representative_position TEXT,
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_email TEXT,
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_person_position TEXT;
