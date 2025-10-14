-- 0005_fix_team_lead_rls.sql
-- Fix RLS policies to allow Team Leads to view their team members' profiles
-- This is required for the Review Queue functionality in Phase 6

-- Create helper functions to avoid infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION is_team_lead(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'Team Lead'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_team(user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (SELECT team FROM public.profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team leads can view their team members profiles" ON public.profiles;

-- Create comprehensive profile view policy
CREATE POLICY "Profile view policy" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id  -- Users can see their own profile
  OR 
  is_admin(auth.uid())  -- Admins can see all profiles
  OR 
  (is_team_lead(auth.uid()) AND team = get_user_team(auth.uid()))  -- Team leads can see their team
);
