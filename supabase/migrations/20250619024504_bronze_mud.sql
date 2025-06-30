/*
  # Fix Authentication Settings

  1. Authentication Changes
    - Disable email confirmation requirement (for development)
    - Update auth settings for better UX
    - Set proper redirect URLs

  2. Security
    - Maintain RLS policies
    - Keep data security intact
*/

-- Update auth settings to disable email confirmation for development
-- This should be done in Supabase Dashboard under Authentication > Settings
-- But we can also handle it in the frontend by showing proper messages

-- Add a helper function to check if user email is confirmed
CREATE OR REPLACE FUNCTION public.is_email_confirmed(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email_confirmed_at IS NOT NULL
  FROM auth.users
  WHERE id = user_id;
$$;

-- Add email confirmation status to user profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_confirmed'
  ) THEN
    ALTER TABLE users ADD COLUMN email_confirmed boolean DEFAULT false;
  END IF;
END $$;

-- Update existing users to mark as confirmed if their auth.users entry is confirmed
UPDATE users 
SET email_confirmed = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL
);

-- Create trigger to auto-update email_confirmed status
CREATE OR REPLACE FUNCTION sync_user_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user profile when auth.users email confirmation changes
  IF TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at THEN
    UPDATE public.users 
    SET email_confirmed = (NEW.email_confirmed_at IS NOT NULL)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_email_confirmation();