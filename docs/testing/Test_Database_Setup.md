# Test Database Setup Requirements

## Overview
Some tests require specific user accounts and roles to be configured in the Supabase database. These tests will fail if the required test data is not present.

## Required Test Users

The following test users must be created in Supabase Auth and have corresponding profiles with the correct roles:

### 1. Admin User
- **Email**: `flade@falconwood.biz`
- **Password**: `New25Password!@`
- **Role**: `Admin`
- **Team**: Any
- **Status**: ✅ Currently configured

### 2. Team Lead User
- **Email**: `teamlead@example.com`
- **Password**: `TestPassword123!`
- **Role**: `Team Lead`
- **Team**: `Alpha` (or any team name)
- **Status**: ⚠️ Requires verification

### 3. Team Member Users
- **Email**: `member1@example.com`
- **Password**: `TestPassword123!`
- **Role**: `Team Member` (NOT Team Lead or Admin)
- **Team**: `Alpha` (same as Team Lead)
- **Status**: ❌ Currently has incorrect role or doesn't exist

- **Email**: `member2@example.com`
- **Password**: `TestPassword123!`
- **Role**: `Team Member`
- **Team**: `Alpha` (same as Team Lead)
- **Status**: ⚠️ Requires verification

## Setup Instructions

### Step 1: Create Users in Supabase Auth
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add User** for each test user
4. Enter the email and password from the table above
5. Note the UUID generated for each user

### Step 2: Create or Update Profiles
Run the following SQL in the Supabase SQL Editor, replacing the UUIDs with the actual UUIDs from Step 1:

```sql
-- Insert or update profiles for test users
INSERT INTO public.profiles (id, full_name, role, team)
VALUES
  ('admin-uuid-here', 'Admin User', 'Admin', 'Platform'),
  ('team-lead-uuid-here', 'Team Lead User', 'Team Lead', 'Alpha'),
  ('member1-uuid-here', 'Team Member One', 'Team Member', 'Alpha'),
  ('member2-uuid-here', 'Team Member Two', 'Team Member', 'Alpha')
ON CONFLICT (id) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  team = EXCLUDED.team;
```

### Step 3: Create Test Tasks (Optional)
For more comprehensive testing, create some test tasks assigned to the team members:

```sql
-- Get the UUIDs for member1 and member2
-- Replace with actual UUIDs
INSERT INTO public.pws_tasks (task_name, pws_line_item, start_date, due_date, assigned_to)
VALUES
  ('Test Task 1', 'PWS-TEST-1', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'member1-uuid-here'),
  ('Test Task 2', 'PWS-TEST-2', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 'member2-uuid-here');
```

### Step 4: Verify Setup
Run this query to verify all test users are configured correctly:

```sql
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.team
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN (
  'flade@falconwood.biz',
  'teamlead@example.com',
  'member1@example.com',
  'member2@example.com'
)
ORDER BY p.role DESC, u.email;
```

Expected output:
- Admin user with role 'Admin'
- Team Lead user with role 'Team Lead'
- Two Team Member users with role 'Team Member'

## Tests Requiring Database Setup

### Currently Failing Tests
1. **Review Queue - Permission Checks › should not show Review Queue link for team members**
   - Requires: `member1@example.com` with role `Team Member`
   - Current Issue: User has incorrect role (Team Lead or Admin)

2. **Admin Panel - Account Requests › should successfully reject an account request**
   - Requires: Proper logout/login flow
   - Current Issue: Timing issue with logout detection

### Tests That May Fail Without Setup
- All Review Queue tests require Team Lead user
- Permission check tests require users with specific roles
- Update workflow tests require tasks assigned to users

## Troubleshooting

### Test fails with "Review Queue link should not be visible"
- **Cause**: The member user has role 'Team Lead' or 'Admin' instead of 'Team Member'
- **Fix**: Update the profile role in the database using the SQL above

### Test fails with "Login failed - user may not exist"
- **Cause**: The test user doesn't exist in Supabase Auth
- **Fix**: Create the user in Supabase Auth dashboard

### Test fails with timeout waiting for login form
- **Cause**: User is already logged in from previous test
- **Fix**: Tests should handle logout properly (this is a test code issue)

## Environment Variables

All test credentials are stored in the `.env` file:

```
TEST_ADMIN_EMAIL=flade@falconwood.biz
TEST_ADMIN_PASSWORD=New25Password!@
TEST_TEAM_LEAD_EMAIL=teamlead@example.com
TEST_TEAM_LEAD_PASSWORD=TestPassword123!
TEST_MEMBER_EMAIL=member1@example.com
TEST_MEMBER_PASSWORD=TestPassword123!
TEST_MEMBER2_EMAIL=member2@example.com
TEST_MEMBER2_PASSWORD=TestPassword123!
```

**Important**: Never commit the `.env` file to version control. Use `.env.example` as a template.
