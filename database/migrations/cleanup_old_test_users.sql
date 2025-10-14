-- cleanup_old_test_users.sql
-- This script removes old test user data from the database tables
-- Run this in the Supabase SQL Editor before deleting users from Authentication

-- First, delete any updates associated with these users
DELETE FROM public.updates 
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE full_name IN ('Team Member One', 'Team Member Two', 'Team Lead User')
  OR id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('member1@example.com', 'member2@example.com', 'lead@example.com', 'teamlead@example.com')
  )
);

-- Delete any approvals made by these users
DELETE FROM public.approvals 
WHERE approver_id IN (
  SELECT id FROM public.profiles 
  WHERE full_name IN ('Team Member One', 'Team Member Two', 'Team Lead User')
  OR id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('member1@example.com', 'member2@example.com', 'lead@example.com', 'teamlead@example.com')
  )
);

-- Delete tasks assigned to these users
DELETE FROM public.pws_tasks 
WHERE assigned_to IN (
  SELECT id FROM public.profiles 
  WHERE full_name IN ('Team Member One', 'Team Member Two', 'Team Lead User')
  OR id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('member1@example.com', 'member2@example.com', 'lead@example.com', 'teamlead@example.com')
  )
);

-- Finally, delete the profiles
DELETE FROM public.profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('member1@example.com', 'member2@example.com', 'lead@example.com', 'teamlead@example.com')
);

-- Verification: Check if any data remains
SELECT 'Remaining profiles' as check_type, COUNT(*) as count 
FROM public.profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('member1@example.com', 'member2@example.com', 'lead@example.com', 'teamlead@example.com')
)
UNION ALL
SELECT 'Remaining tasks', COUNT(*) 
FROM public.pws_tasks 
WHERE assigned_to IN (
  SELECT id FROM auth.users 
  WHERE email IN ('member1@example.com', 'member2@example.com', 'lead@example.com', 'teamlead@example.com')
)
UNION ALL
SELECT 'Remaining updates', COUNT(*) 
FROM public.updates 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('member1@example.com', 'member2@example.com', 'lead@example.com', 'teamlead@example.com')
);
