-- 0009_user_contract_roles.sql
-- Phase 1.6: Add Helper Role Map Table

-- User Contract Roles Table
CREATE TABLE public.user_contract_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('Admin', 'PM', 'APM', 'Team Lead', 'Team Member')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, contract_id, role)
);

-- Create Index for Performance
CREATE INDEX idx_user_contract_roles_user ON public.user_contract_roles(user_id);
CREATE INDEX idx_user_contract_roles_contract ON public.user_contract_roles(contract_id);
CREATE INDEX idx_user_contract_roles_role ON public.user_contract_roles(role);

-- Enable RLS
ALTER TABLE public.user_contract_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (global)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has a specific role for a contract
CREATE OR REPLACE FUNCTION public.has_contract_role(p_contract_id uuid, p_role text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_contract_roles 
        WHERE user_id = auth.uid() 
        AND contract_id = p_contract_id 
        AND role = p_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's contracts
CREATE OR REPLACE FUNCTION public.get_user_contracts()
RETURNS TABLE(contract_id uuid) AS $$
BEGIN
    -- Admins see all contracts
    IF public.is_admin() THEN
        RETURN QUERY SELECT id FROM public.contracts;
    ELSE
        -- Others see only their assigned contracts
        RETURN QUERY 
        SELECT DISTINCT ucr.contract_id 
        FROM public.user_contract_roles ucr
        WHERE ucr.user_id = auth.uid();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user leads a team
CREATE OR REPLACE FUNCTION public.is_team_lead(p_team_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.team_memberships 
        WHERE user_id = auth.uid() 
        AND team_id = p_team_id 
        AND role_in_team = 'lead'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get teams a user leads
CREATE OR REPLACE FUNCTION public.get_user_led_teams()
RETURNS TABLE(team_id uuid) AS $$
BEGIN
    RETURN QUERY 
    SELECT tm.team_id 
    FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role_in_team = 'lead';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.user_contract_roles IS 'Maps users to contracts with specific roles (Admin, PM, APM, Team Lead, Team Member)';
COMMENT ON FUNCTION public.is_admin() IS 'Returns true if current user is an Admin';
COMMENT ON FUNCTION public.has_contract_role(uuid, text) IS 'Returns true if current user has specified role for given contract';
COMMENT ON FUNCTION public.get_user_contracts() IS 'Returns contract IDs accessible to current user';
COMMENT ON FUNCTION public.is_team_lead(uuid) IS 'Returns true if current user leads the specified team';
COMMENT ON FUNCTION public.get_user_led_teams() IS 'Returns team IDs that current user leads';
