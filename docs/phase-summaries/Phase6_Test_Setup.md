# Phase 6 Test Setup Guide

This guide explains how to set up test data for Phase 6 (Team Lead Review) functionality.

## Prerequisites

- Supabase project is set up and running
- Database migrations 0001, 0002, and 0003 have been applied
- Local development server is running on `http://localhost:3000`

## Step 1: Create Test Users in Supabase Auth

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add User** and create the following users:

### Team Lead User
- **Email:** `teamlead@example.com`
- **Password:** `TestPassword123!`
- **Auto Confirm User:** Yes

### Team Member Users (for testing submissions)
- **Email:** `member1@example.com`
- **Password:** `TestPassword123!`
- **Auto Confirm User:** Yes

- **Email:** `member2@example.com`
- **Password:** `TestPassword123!`
- **Auto Confirm User:** Yes

4. After creating each user, **copy their UUID** from the user list

## Step 2: Update Profiles Table

Run the following SQL in the Supabase SQL Editor (replace UUIDs with actual values):

```sql
-- Update Team Lead profile
UPDATE public.profiles 
SET role = 'Team Lead', team = 'Alpha', full_name = 'Team Lead User'
WHERE id = 'YOUR-TEAM-LEAD-UUID-HERE';

-- Insert or update team member profiles
INSERT INTO public.profiles (id, full_name, role, team)
VALUES
  ('YOUR-MEMBER1-UUID-HERE', 'Team Member One', 'Team Member', 'Alpha'),
  ('YOUR-MEMBER2-UUID-HERE', 'Team Member Two', 'Team Member', 'Alpha')
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, team = EXCLUDED.team;
```

## Step 3: Create Test Tasks

Run the following SQL (replace UUIDs with actual member UUIDs):

```sql
INSERT INTO public.pws_tasks (task_name, pws_line_item, start_date, due_date, assigned_to)
VALUES
  ('Implement Authentication', 'PWS-2.1', '2025-10-01', '2025-10-15', 'YOUR-MEMBER1-UUID-HERE'),
  ('Design User Interface', 'PWS-2.2', '2025-10-05', '2025-10-20', 'YOUR-MEMBER2-UUID-HERE'),
  ('Write API Documentation', 'PWS-2.3', '2025-10-10', '2025-10-25', 'YOUR-MEMBER1-UUID-HERE');
```

## Step 4: Create Test Submissions

After creating tasks, get the task IDs and run:

```sql
-- Get task IDs first
SELECT id, task_name FROM public.pws_tasks ORDER BY id DESC LIMIT 3;

-- Insert test updates (replace task_id and user_id with actual values)
INSERT INTO public.updates (task_id, user_id, narrative, percent_complete, blockers, short_status, status, submitted_at)
VALUES
  (YOUR-TASK-ID-1, 'YOUR-MEMBER1-UUID-HERE', 'Completed user login and registration forms. Integrated with Supabase Auth.', 75, 'Need to implement password reset functionality', 'In Progress', 'submitted', NOW() - INTERVAL '2 hours'),
  (YOUR-TASK-ID-2, 'YOUR-MEMBER2-UUID-HERE', 'Created wireframes and mockups for dashboard. Implemented responsive layout using Bootstrap.', 90, NULL, 'In Progress', 'submitted', NOW() - INTERVAL '1 hour'),
  (YOUR-TASK-ID-3, 'YOUR-MEMBER1-UUID-HERE', 'Documented all REST API endpoints with request/response examples.', 100, NULL, 'Complete', 'submitted', NOW() - INTERVAL '30 minutes');
```

## Step 5: Verify Test Data

Run these verification queries:

```sql
-- Check profiles
SELECT id, full_name, role, team FROM public.profiles WHERE team = 'Alpha';

-- Check tasks
SELECT t.id, t.task_name, t.pws_line_item, p.full_name as assigned_to
FROM public.pws_tasks t
JOIN public.profiles p ON t.assigned_to = p.id
WHERE p.team = 'Alpha';

-- Check submitted updates
SELECT u.id, t.task_name, p.full_name as submitted_by, u.narrative, u.status, u.submitted_at
FROM public.updates u
JOIN public.pws_tasks t ON u.task_id = t.id
JOIN public.profiles p ON u.user_id = p.id
WHERE u.status = 'submitted'
ORDER BY u.submitted_at DESC;
```

## Step 6: Run Tests

Once test data is set up, run the Phase 6 tests:

```bash
npm test -- tests/review.spec.js
```

## Manual Testing

### Test as Team Lead
1. Login with `teamlead@example.com` / `TestPassword123!`
2. Click **Review Queue** in the navigation
3. Verify you see submitted updates from team members
4. Click **Review** on any submission
5. Test the following actions:
   - **Approve** - approves submission as-is
   - **Approve with Changes** - modify narrative/fields and approve
   - **Reject** - must provide comments

### Test as Team Member
1. Login with `flade@falconwood.biz` / `New25Password!@`
2. Verify **Review Queue** link is NOT visible in navigation
3. Verify you cannot access `/#review` page

## Acceptance Criteria Verification

- [x] **6.1 Review Queue View** - Shows list of pending submissions filtered by team lead's team
- [x] **6.2 Review Detail Panel** - Displays submission details with Approve, Reject, Modify actions
- [x] **6.3 Approval Logic** - Creates entries in `approvals` table; UI reflects state changes
- [x] **6.4 Review Tests** - Playwright verifies permission checks, actions, and UI refresh

## Troubleshooting

### Tests fail with "Review Queue link not visible"
- Verify the team lead user has `role = 'Team Lead'` in the profiles table
- Check that the user is logged in successfully

### Review queue is empty
- Verify team members have `team = 'Alpha'` (same as team lead)
- Check that updates have `status = 'submitted'`
- Run the verification queries above

### Cannot approve/reject submissions
- Check RLS policies are enabled and configured correctly
- Verify the team lead user has proper permissions
- Check browser console for errors
