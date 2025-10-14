-- 0010_v3_seed_data.sql
-- Phase 1.6: Seed Data for Contract-Scoped Tables

-- Note: This seed data assumes test users exist from previous migrations
-- If running fresh, ensure users are created first

-- Insert Sample Contracts
INSERT INTO public.contracts (id, name, code, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Navy Maintenance Contract', 'NMC-2025', true),
    ('22222222-2222-2222-2222-222222222222', 'Fleet Support Services', 'FSS-2025', true);

-- Insert Sample PWS Line Items
INSERT INTO public.pws_line_items (id, contract_id, code, title, description, periodicity, is_active) VALUES
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '4.1.1.2', 'Maintenance Planning', 'Plan and schedule maintenance activities', 'monthly', true),
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '4.1.2.1', 'Equipment Inspection', 'Conduct routine equipment inspections', 'weekly', true),
    ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', '3.2.1.1', 'Fleet Readiness Assessment', 'Assess fleet operational readiness', 'monthly', true);

-- Insert Sample Teams
INSERT INTO public.teams (id, contract_id, name, is_active) VALUES
    ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Maintenance Team Alpha', true),
    ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Maintenance Team Bravo', true),
    ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'Fleet Support Team', true);

-- Insert Team Memberships (requires existing users)
-- This will be populated based on existing test users
-- Example structure - adjust user IDs based on your actual test users:
-- INSERT INTO public.team_memberships (team_id, user_id, role_in_team) VALUES
--     ('66666666-6666-6666-6666-666666666666', '<team_lead_user_id>', 'lead'),
--     ('66666666-6666-6666-6666-666666666666', '<team_member_user_id>', 'member');

-- Insert Sample Tasks
INSERT INTO public.tasks (id, pws_line_item_id, title, description, start_date, due_date, status_short, is_active) VALUES
    ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'Q4 Maintenance Schedule', 'Develop comprehensive maintenance schedule for Q4', '2025-10-01', '2025-10-31', 'in-progress', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'Weekly Equipment Check', 'Perform weekly equipment safety checks', '2025-10-01', '2025-10-07', 'not-started', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555', 'October Readiness Report', 'Compile fleet readiness metrics for October', '2025-10-01', '2025-10-31', 'in-progress', true);

-- Insert User Contract Roles (requires existing users)
-- This section assigns roles to users per contract
-- Note: Adjust user IDs based on your actual test users from profiles table

-- Example structure (uncomment and update with actual user IDs):
-- Admin role (global access)
-- INSERT INTO public.user_contract_roles (user_id, contract_id, role) 
-- SELECT id, '11111111-1111-1111-1111-111111111111', 'Admin' 
-- FROM public.profiles WHERE role = 'Admin' LIMIT 1;

-- PM/APM roles per contract
-- INSERT INTO public.user_contract_roles (user_id, contract_id, role) VALUES
--     ('<pm_user_id>', '11111111-1111-1111-1111-111111111111', 'PM'),
--     ('<apm_user_id>', '22222222-2222-2222-2222-222222222222', 'APM');

-- Team Lead roles per contract
-- INSERT INTO public.user_contract_roles (user_id, contract_id, role) VALUES
--     ('<team_lead_user_id>', '11111111-1111-1111-1111-111111111111', 'Team Lead');

-- Team Member roles per contract
-- INSERT INTO public.user_contract_roles (user_id, contract_id, role) VALUES
--     ('<team_member_user_id>', '11111111-1111-1111-1111-111111111111', 'Team Member');

-- Create a helper view to see contract access
CREATE OR REPLACE VIEW public.v_user_contract_access AS
SELECT 
    p.full_name,
    p.role as global_role,
    c.name as contract_name,
    c.code as contract_code,
    ucr.role as contract_role
FROM public.profiles p
LEFT JOIN public.user_contract_roles ucr ON p.id = ucr.user_id
LEFT JOIN public.contracts c ON ucr.contract_id = c.id
ORDER BY p.full_name, c.name;

COMMENT ON VIEW public.v_user_contract_access IS 'Shows user access to contracts with their roles';
