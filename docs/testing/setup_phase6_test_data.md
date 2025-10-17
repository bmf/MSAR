# Phase 6 Test Data Setup Guide

This guide will help you set up the test data needed for Phase 6 (Team Lead Review) tests.

## Prerequisites

- Access to Supabase Dashboard
- Admin access to the project

## Step 1: Create Test Users in Supabase Auth

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** and create the following users:

### Test Users to Create:

| Email | Password | Role |
|-------|----------|------|
| teamlead@example.com | TestPassword123! | Team Lead |
| member1@example.com | TestPassword123! | Team Member |
| member2@example.com | TestPassword123! | Team Member |
| approver@example.com | TestPassword123! | Report Approver (PM) |

**Important:** 
- Use **exactly** these email addresses and passwords
- Make sure "Auto Confirm User" is checked when creating users
- These credentials match the `.env` file test configuration

## Step 2: Run the Test Data Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `database/migrations/0014_phase6_complete_test_data.sql`
4. Click **Run** to execute the migration

The script will:
- Create profiles for all test users
- Assign them to the "Maintenance Team Alpha" team
- Create user contract roles
- Set up team memberships
- Create 3 test tasks
- Assign tasks to team members
- Create 3 pending task status submissions for review

## Step 3: Verify the Setup

Run these verification queries in the SQL Editor:

```sql
-- Check profiles
SELECT id, full_name, role, team 
FROM public.profiles 
WHERE team = 'Maintenance Team Alpha';

-- Check team memberships
SELECT tm.role_in_team, p.full_name, t.name as team_name
FROM public.team_memberships tm
JOIN public.profiles p ON tm.user_id = p.id
JOIN public.teams t ON tm.team_id = t.id
WHERE t.name = 'Maintenance Team Alpha';

-- Check pending submissions
SELECT 
    ts.id,
    t.title as task_title,
    p.full_name as submitted_by,
    ts.percent_complete,
    ts.lead_review_status,
    ts.submitted_at
FROM public.task_statuses ts
JOIN public.tasks t ON ts.task_id = t.id
JOIN public.profiles p ON ts.submitted_by = p.id
WHERE ts.lead_review_status = 'pending'
ORDER BY ts.submitted_at DESC;
```

Expected results:
- 3 profiles (1 Team Lead, 2 Team Members)
- 3 team memberships
- 3 pending task status submissions

## Step 4: Run the Tests

After setup is complete, run the Phase 6 tests:

```bash
npm test -- review.spec.js
```

All tests should pass if the setup was completed correctly.

## Troubleshooting

### "User not found" errors
- Make sure you created the users in Supabase Auth first
- Check that email addresses match exactly (case-sensitive)
- Verify users are confirmed (not pending email verification)

### "No pending submissions" in tests
- Re-run the migration script (it's idempotent)
- Check that the report_month matches the current month
- Verify RLS policies allow the team lead to see submissions

### Login failures in tests
- Verify `.env` file has the correct test credentials
- Check that passwords match exactly
- Ensure Supabase URL and anon key are correct in `.env`

## Cleanup

To remove test data and start fresh:

```sql
-- Delete test task statuses
DELETE FROM public.task_statuses 
WHERE task_id IN (
    SELECT id FROM public.tasks 
    WHERE id IN (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'dddddddd-dddd-dddd-dddd-dddddddddddd'
    )
);

-- Delete test task assignments
DELETE FROM public.task_assignments 
WHERE task_id IN (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

-- Delete test tasks
DELETE FROM public.tasks 
WHERE id IN (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

-- Then re-run the setup script
```
