-- Add time_text column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_text TEXT;
