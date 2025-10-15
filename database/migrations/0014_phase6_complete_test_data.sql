-- 0014_phase6_complete_test_data.sql
-- Complete test data setup for Phase 6: Team Lead Review functionality
-- This script creates a complete test environment with users, teams, tasks, and submissions

-- Prerequisites:
-- 1. Test users must exist in Supabase Auth with these emails:
--    - teamlead@example.com (password: TestPassword123!)
--    - member1@example.com (password: TestPassword123!)
--    - member2@example.com (password: TestPassword123!)
--    - approver@example.com (password: TestPassword123!)
-- 2. Run this script in the Supabase SQL Editor after creating the auth users

-- Step 1: Get user IDs from auth.users and ensure profiles exist
DO $$
DECLARE
    v_team_lead_id UUID;
    v_member1_id UUID;
    v_member2_id UUID;
    v_approver_id UUID;
    v_contract_id UUID := '11111111-1111-1111-1111-111111111111';
    v_team_id UUID := '66666666-6666-6666-6666-666666666666';
    v_pws_line_item_id UUID := '33333333-3333-3333-3333-333333333333';
    v_task1_id UUID;
    v_task2_id UUID;
    v_task3_id UUID;
BEGIN
    -- Get user IDs from auth.users
    SELECT id INTO v_team_lead_id FROM auth.users WHERE email = 'teamlead@example.com';
    SELECT id INTO v_member1_id FROM auth.users WHERE email = 'member1@example.com';
    SELECT id INTO v_member2_id FROM auth.users WHERE email = 'member2@example.com';
    SELECT id INTO v_approver_id FROM auth.users WHERE email = 'approver@example.com';

    -- Check if users exist
    IF v_team_lead_id IS NULL THEN
        RAISE NOTICE 'Team Lead user not found. Please create teamlead@example.com in Supabase Auth first.';
        RETURN;
    END IF;
    
    IF v_member1_id IS NULL THEN
        RAISE NOTICE 'Member 1 user not found. Please create member1@example.com in Supabase Auth first.';
        RETURN;
    END IF;

    IF v_member2_id IS NULL THEN
        RAISE NOTICE 'Member 2 user not found. Please create member2@example.com in Supabase Auth first.';
        RETURN;
    END IF;

    -- Create or update profiles for test users
    INSERT INTO public.profiles (id, full_name, role, team)
    VALUES
        (v_team_lead_id, 'Test Team Lead', 'Team Lead', 'Maintenance Team Alpha'),
        (v_member1_id, 'Test Member One', 'Team Member', 'Maintenance Team Alpha'),
        (v_member2_id, 'Test Member Two', 'Team Member', 'Maintenance Team Alpha')
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, 
        role = EXCLUDED.role, 
        team = EXCLUDED.team;

    -- Create approver profile if user exists
    IF v_approver_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, full_name, role, team)
        VALUES (v_approver_id, 'Test Report Approver', 'Report Approver', NULL)
        ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name, 
            role = EXCLUDED.role;
    END IF;

    -- Insert user contract roles
    INSERT INTO public.user_contract_roles (user_id, contract_id, role)
    VALUES
        (v_team_lead_id, v_contract_id, 'Team Lead'),
        (v_member1_id, v_contract_id, 'Team Member'),
        (v_member2_id, v_contract_id, 'Team Member')
    ON CONFLICT (user_id, contract_id, role) DO NOTHING;

    -- Add approver role if user exists
    IF v_approver_id IS NOT NULL THEN
        INSERT INTO public.user_contract_roles (user_id, contract_id, role)
        VALUES (v_approver_id, v_contract_id, 'PM')
        ON CONFLICT (user_id, contract_id, role) DO NOTHING;
    END IF;

    -- Insert team memberships
    INSERT INTO public.team_memberships (team_id, user_id, role_in_team)
    VALUES
        (v_team_id, v_team_lead_id, 'lead'),
        (v_team_id, v_member1_id, 'member'),
        (v_team_id, v_member2_id, 'member')
    ON CONFLICT (team_id, user_id, role_in_team) DO NOTHING;

    -- Create test tasks
    INSERT INTO public.tasks (id, pws_line_item_id, title, description, start_date, due_date, status_short, is_active)
    VALUES
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', v_pws_line_item_id, 'Implement Authentication Module', 'Develop and test user authentication with Supabase', '2025-10-01', '2025-10-15', 'in-progress', true),
        ('ffffffff-ffff-ffff-ffff-ffffffffffff', v_pws_line_item_id, 'Design Dashboard UI', 'Create responsive dashboard layout with Bootstrap', '2025-10-05', '2025-10-20', 'in-progress', true),
        ('dddddddd-dddd-dddd-dddd-dddddddddddd', v_pws_line_item_id, 'Write API Documentation', 'Document all REST endpoints with examples', '2025-10-10', '2025-10-25', 'not-started', true)
    ON CONFLICT (id) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        start_date = EXCLUDED.start_date,
        due_date = EXCLUDED.due_date,
        status_short = EXCLUDED.status_short;

    -- Get task IDs
    v_task1_id := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    v_task2_id := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    v_task3_id := 'dddddddd-dddd-dddd-dddd-dddddddddddd';

    -- Assign tasks to team members
    INSERT INTO public.task_assignments (task_id, user_id, assigned_by, assigned_at)
    VALUES
        (v_task1_id, v_member1_id, v_team_lead_id, NOW() - INTERVAL '5 days'),
        (v_task2_id, v_member2_id, v_team_lead_id, NOW() - INTERVAL '4 days'),
        (v_task3_id, v_member1_id, v_team_lead_id, NOW() - INTERVAL '3 days')
    ON CONFLICT (task_id, user_id) DO NOTHING;

    -- Create task status submissions (pending review)
    INSERT INTO public.task_statuses (
        task_id, 
        submitted_by, 
        narrative, 
        percent_complete, 
        blockers, 
        submitted_at, 
        lead_review_status,
        report_month
    )
    VALUES
        (
            v_task1_id, 
            v_member1_id, 
            'Completed user login and registration forms. Integrated with Supabase Auth. Implemented password reset flow and email verification.', 
            75, 
            'Need to implement multi-factor authentication', 
            NOW() - INTERVAL '2 hours',
            'pending',
            DATE_TRUNC('month', CURRENT_DATE)
        ),
        (
            v_task2_id, 
            v_member2_id, 
            'Created wireframes and mockups for dashboard. Implemented responsive layout using Bootstrap 5. Added data visualization charts.', 
            90, 
            NULL, 
            NOW() - INTERVAL '1 hour',
            'pending',
            DATE_TRUNC('month', CURRENT_DATE)
        ),
        (
            v_task3_id, 
            v_member1_id, 
            'Documented all REST API endpoints with request/response examples. Added authentication requirements and error codes.', 
            100, 
            NULL, 
            NOW() - INTERVAL '30 minutes',
            'pending',
            DATE_TRUNC('month', CURRENT_DATE)
        )
    ON CONFLICT (task_id, submitted_by, report_month, submitted_at) DO NOTHING;

    RAISE NOTICE 'Phase 6 test data setup complete!';
    RAISE NOTICE 'Team Lead: % (%)', v_team_lead_id, 'teamlead@example.com';
    RAISE NOTICE 'Member 1: % (%)', v_member1_id, 'member1@example.com';
    RAISE NOTICE 'Member 2: % (%)', v_member2_id, 'member2@example.com';
    RAISE NOTICE 'Tasks created: 3';
    RAISE NOTICE 'Pending submissions: 3';
END $$;

-- Verification queries
SELECT 'Profiles' as table_name, COUNT(*) as count FROM public.profiles WHERE team = 'Maintenance Team Alpha'
UNION ALL
SELECT 'User Contract Roles', COUNT(*) FROM public.user_contract_roles WHERE contract_id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'Team Memberships', COUNT(*) FROM public.team_memberships WHERE team_id = '66666666-6666-6666-6666-666666666666'
UNION ALL
SELECT 'Tasks', COUNT(*) FROM public.tasks WHERE pws_line_item_id = '33333333-3333-3333-3333-333333333333'
UNION ALL
SELECT 'Task Assignments', COUNT(*) FROM public.task_assignments
UNION ALL
SELECT 'Pending Task Statuses', COUNT(*) FROM public.task_statuses WHERE lead_review_status = 'pending';
