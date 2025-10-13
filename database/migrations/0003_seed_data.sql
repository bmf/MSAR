-- 0003_seed_data.sql

-- This script requires manual creation of users in Supabase Auth to get UUIDs.
-- Replace the UUIDs below with the actual UUIDs of your created users.

-- To use this seed data:
-- 1. Create users in your Supabase project's Authentication section.
-- 2. Get the UUID for each user.
-- 3. Uncomment the INSERT statements below and replace the placeholder UUIDs.
-- 4. Run this script in the Supabase SQL Editor.

-- Example Seed data for profiles
-- INSERT INTO public.profiles (id, full_name, role, team)
-- VALUES
--   ('your-admin-uuid-here', 'Admin User', 'Admin', 'Platform'),
--   ('your-team-lead-uuid-here', 'Team Lead', 'Team Lead', 'Alpha'),
--   ('your-team-member-1-uuid-here', 'Team Member 1', 'Team Member', 'Alpha'),
--   ('your-team-member-2-uuid-here', 'Team Member 2', 'Team Member', 'Bravo');

-- Example Seed data for pws_tasks
-- INSERT INTO public.pws_tasks (task_name, pws_line_item, start_date, due_date, assigned_to)
-- VALUES
--   ('Develop Login Module', 'PWS-1.1', '2025-10-15', '2025-10-22', 'your-team-member-1-uuid-here'),
--   ('Design Dashboard UI', 'PWS-1.2', '2025-10-18', '2025-10-25', 'your-team-member-2-uuid-here');
