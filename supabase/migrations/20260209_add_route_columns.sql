-- Migration to add route tracking columns to profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS route_start TEXT,
ADD COLUMN IF NOT EXISTS route_end TEXT;

-- Optional: Add a comment
COMMENT ON COLUMN profiles.route_start IS 'Starting location of the user journey';
COMMENT ON COLUMN profiles.route_end IS 'Destination or current goal of the user journey';
