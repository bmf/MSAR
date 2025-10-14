-- 0004_phase6_test_data.sql
-- Test data for Phase 6: Team Lead Review functionality

-- This script sets up test data for the review queue functionality.
-- Prerequisites:
-- 1. Create the following users in Supabase Auth:
--    - teamlead@example.com (password: TestPassword123!)
--    - member1@example.com (password: TestPassword123!)
--    - member2@example.com (password: TestPassword123!)
-- 2. Get the UUIDs for each user from the Supabase Auth dashboard
-- 3. Replace the placeholder UUIDs below with the actual UUIDs
-- 4. Run this script in the Supabase SQL Editor

-- Example: Update profiles for test users
-- Replace 'team-lead-uuid', 'member1-uuid', 'member2-uuid' with actual UUIDs

-- Update existing user to be a Team Lead
-- UPDATE public.profiles 
-- SET role = 'Team Lead', team = 'Alpha', full_name = 'Team Lead User'
-- WHERE id = 'team-lead-uuid';

-- Insert or update team member profiles
-- INSERT INTO public.profiles (id, full_name, role, team)
-- VALUES
--   ('member1-uuid', 'Team Member One', 'Team Member', 'Alpha'),
--   ('member2-uuid', 'Team Member Two', 'Team Member', 'Alpha')
-- ON CONFLICT (id) DO UPDATE
-- SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, team = EXCLUDED.team;

-- Insert test tasks for team members
-- INSERT INTO public.pws_tasks (task_name, pws_line_item, start_date, due_date, assigned_to)
-- VALUES
--   ('Implement Authentication', 'PWS-2.1', '2025-10-01', '2025-10-15', 'member1-uuid'),
--   ('Design User Interface', 'PWS-2.2', '2025-10-05', '2025-10-20', 'member2-uuid'),
--   ('Write API Documentation', 'PWS-2.3', '2025-10-10', '2025-10-25', 'member1-uuid');

-- Insert test updates (submitted status) for review queue
-- Note: Replace task IDs with actual IDs from the pws_tasks table after insertion
-- INSERT INTO public.updates (task_id, user_id, narrative, percent_complete, blockers, short_status, status, submitted_at)
-- VALUES
--   (1, 'member1-uuid', 'Completed user login and registration forms. Integrated with Supabase Auth.', 75, 'Need to implement password reset functionality', 'In Progress', 'submitted', NOW() - INTERVAL '2 hours'),
--   (2, 'member2-uuid', 'Created wireframes and mockups for dashboard. Implemented responsive layout using Bootstrap.', 90, NULL, 'In Progress', 'submitted', NOW() - INTERVAL '1 hour'),
--   (3, 'member1-uuid', 'Documented all REST API endpoints with request/response examples.', 100, NULL, 'Complete', 'submitted', NOW() - INTERVAL '30 minutes');

-- Verification queries (run these to check the data):
-- SELECT * FROM public.profiles WHERE team = 'Alpha';
-- SELECT * FROM public.pws_tasks WHERE assigned_to IN (SELECT id FROM public.profiles WHERE team = 'Alpha');
-- SELECT u.*, t.task_name, p.full_name 
-- FROM public.updates u 
-- JOIN public.pws_tasks t ON u.task_id = t.id 
-- JOIN public.profiles p ON u.user_id = p.id 
-- WHERE u.status = 'submitted';
