-- 0017_session_invalidation.sql
-- Add session invalidation tracking for disabled, deleted, or role-changed users

-- Add session_version column to track when user state changes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_version integer DEFAULT 0;

-- Create index for session version lookups
CREATE INDEX IF NOT EXISTS idx_profiles_session_version ON public.profiles(session_version);

-- Function to increment session version (invalidates all sessions)
CREATE OR REPLACE FUNCTION public.invalidate_user_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increment session version when:
    -- 1. User is disabled/enabled
    -- 2. User role changes
    -- 3. User is deleted (handled by trigger timing)
    
    IF TG_OP = 'UPDATE' THEN
        -- Check if disabled status changed
        IF (OLD.disabled IS DISTINCT FROM NEW.disabled) THEN
            NEW.session_version := COALESCE(OLD.session_version, 0) + 1;
            RAISE NOTICE 'Session invalidated for user % due to disabled status change', NEW.id;
        END IF;
        
        -- Check if role changed
        IF (OLD.role IS DISTINCT FROM NEW.role) THEN
            NEW.session_version := COALESCE(OLD.session_version, 0) + 1;
            RAISE NOTICE 'Session invalidated for user % due to role change', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to invalidate sessions on profile changes
DROP TRIGGER IF EXISTS invalidate_sessions_on_profile_change ON public.profiles;
CREATE TRIGGER invalidate_sessions_on_profile_change
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.invalidate_user_sessions();

-- Function to check if user session is valid
CREATE OR REPLACE FUNCTION public.is_session_valid(user_session_version integer DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_version integer;
    user_disabled boolean;
BEGIN
    -- Get current session version and disabled status
    SELECT session_version, COALESCE(disabled, false)
    INTO current_version, user_disabled
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- If user not found or disabled, session is invalid
    IF NOT FOUND OR user_disabled THEN
        RETURN false;
    END IF;
    
    -- If session version doesn't match, session is invalid
    IF current_version != user_session_version THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

COMMENT ON COLUMN public.profiles.session_version IS 'Incremented when user is disabled/enabled or role changes to invalidate sessions';
COMMENT ON FUNCTION public.invalidate_user_sessions() IS 'Trigger function to increment session_version on profile changes';
COMMENT ON FUNCTION public.is_session_valid(integer) IS 'Check if user session is still valid based on session_version';
