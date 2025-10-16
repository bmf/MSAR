-- 0016_add_email_to_profiles.sql
-- Add email column to profiles table for easier access in admin panel

-- Add email column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update existing profiles with emails from auth.users
-- This requires a function that can access auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When a profile is created or updated, sync email from auth.users
    NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
    RETURN NEW;
END;
$$;

-- Create trigger to auto-sync email
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON public.profiles;
CREATE TRIGGER sync_profile_email_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_email();

-- Backfill existing profiles with emails
UPDATE public.profiles p
SET email = (SELECT email FROM auth.users WHERE id = p.id)
WHERE email IS NULL;

COMMENT ON COLUMN public.profiles.email IS 'User email address synced from auth.users';
