-- Add campus and branch columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS campus TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT;

-- Update RLS if needed (already public read, user update own)
-- Existing policies cover these new columns as long as they are part of the table.
