# Phase 5 Testing Instructions

## Prerequisites

Before running Phase 5 tests, you need to:

1. **Apply the database migration**
2. **Ensure test users exist**
3. **Create test data (tasks with assignments)**

---

## Step 1: Apply Database Migration

Run the migration script to update the database schema:

```sql
-- Connect to your Supabase database and run:
-- File: database/migrations/0013_migrate_updates_to_task_statuses.sql
```

You can apply this migration through:
- Supabase Dashboard SQL Editor
- Or using the Supabase CLI: `supabase db push`

---

## Step 2: Verify Test Users Exist

The tests require these users (configured in `.env`):

### Admin User
- Email: `flade@falconwood.biz`
- Password: `New25Password!@`
- Role: `Admin`

### Team Lead User
- Email: `teamlead@example.com`
- Password: `TestPassword123!`
- Role: `Team Lead`
- Team: Should be assigned to a team

### Team Member User
- Email: `member1@example.com`
- Password: `TestPassword123!`
- Role: `Team Member`
- Team: Should be on same team as Team Lead

### Verify Users Exist

Run this query in Supabase SQL Editor:

```sql
SELECT 
    au.email,
    p.role,
    p.team,
    p.full_name
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email IN (
    'flade@falconwood.biz',
    'teamlead@example.com',
    'member1@example.com'
);
```

If users don't exist, create them through:
1. The account request flow in the app
2. Admin panel user creation
3. Or manually via Supabase Auth dashboard

---

## Step 3: Create Test Data

For the tests to work properly, you need:

### 1. At least one Contract
```sql
INSERT INTO contracts (name, code, is_active)
VALUES ('Test Contract', 'TEST-001', true)
RETURNING id;
```

### 2. At least one PWS Line Item
```sql
-- Use the contract ID from above
INSERT INTO pws_line_items (contract_id, code, title, is_active)
VALUES ('[CONTRACT_ID]', '1.1', 'Test PWS Line Item', true)
RETURNING id;
```

### 3. At least one Team
```sql
-- Use the contract ID from above
INSERT INTO teams (contract_id, name, is_active)
VALUES ('[CONTRACT_ID]', 'Test Team', true)
RETURNING id;
```

### 4. Team Memberships
```sql
-- Get user IDs
SELECT id, email FROM auth.users 
WHERE email IN ('teamlead@example.com', 'member1@example.com');

-- Add team lead
INSERT INTO team_memberships (team_id, user_id, role_in_team)
VALUES ('[TEAM_ID]', '[TEAM_LEAD_USER_ID]', 'lead');

-- Add team member
INSERT INTO team_memberships (team_id, user_id, role_in_team)
VALUES ('[TEAM_ID]', '[MEMBER_USER_ID]', 'member');
```

### 5. At least one Task
```sql
-- Use the PWS line item ID from above
INSERT INTO tasks (pws_line_item_id, title, description, status_short, is_active)
VALUES (
    '[PWS_LINE_ITEM_ID]',
    'Test Task for Phase 5',
    'This is a test task for Phase 5 testing',
    'not-started',
    true
)
RETURNING id;
```

### 6. Task Assignment
```sql
-- Assign the task to the team member
INSERT INTO task_assignments (task_id, user_id, assigned_by)
VALUES (
    '[TASK_ID]',
    '[MEMBER_USER_ID]',
    '[TEAM_LEAD_USER_ID]'
);
```

### 7. Optional: Multi-Assignee Task
```sql
-- Create another task
INSERT INTO tasks (pws_line_item_id, title, description, status_short, is_active)
VALUES (
    '[PWS_LINE_ITEM_ID]',
    'Multi-Assignee Test Task',
    'This task has multiple assignees',
    'in-progress',
    true
)
RETURNING id;

-- Assign to multiple users
INSERT INTO task_assignments (task_id, user_id, assigned_by)
VALUES 
    ('[TASK_ID]', '[MEMBER_USER_ID]', '[TEAM_LEAD_USER_ID]'),
    ('[TASK_ID]', '[TEAM_LEAD_USER_ID]', '[TEAM_LEAD_USER_ID]');
```

---

## Step 4: Run the Tests

Once the database is set up, run the Phase 5 tests:

```bash
npm test -- tests/phase5.spec.js
```

---

## Manual Testing Checklist

In addition to automated tests, perform these manual tests:

### Test 1: Submit Task Status
1. Login as `member1@example.com`
2. Navigate to Dashboard
3. Click "Create New Task Update"
4. Select a task
5. Fill in narrative, % complete, blockers, short status
6. Click "Submit"
7. ✅ Should see success message
8. ✅ Should not be able to submit again for same task/month

### Test 2: Review Queue - Multi-Assignee Display
1. Login as `teamlead@example.com`
2. Navigate to Review Queue
3. ✅ Should see "All Assignees" column
4. ✅ Multi-assignee tasks should show badge with count
5. Click "Review" on a submission
6. ✅ Modal should show task details including PWS line item
7. ✅ Multi-assignee tasks should show alert with all assignees

### Test 3: Approve Submission
1. In review modal, click "Approve"
2. ✅ Should see success message
3. ✅ Submission should disappear from review queue
4. Check database:
```sql
SELECT * FROM task_statuses 
WHERE lead_review_status = 'approved' 
ORDER BY submitted_at DESC LIMIT 1;

SELECT * FROM report_queue 
ORDER BY added_at DESC LIMIT 1;
```
5. ✅ Status should be approved
6. ✅ Entry should exist in report_queue

### Test 4: Reject Submission
1. Submit another status as member
2. Login as team lead
3. Try to reject without comments
4. ✅ Should show error requiring comments
5. Add comments and reject
6. ✅ Should see success message
7. Login as member
8. ✅ Should be able to submit again for same task/month

### Test 5: Duplicate Prevention
1. Login as member
2. Submit a task status
3. Try to submit again for same task
4. ✅ Should show error about existing submission
5. Wait for team lead to reject
6. ✅ Should be able to submit again

### Test 6: Report Month Display
1. Check any submission in review queue
2. ✅ Should show "Report Month" field
3. ✅ Should be first day of current month (YYYY-MM-01)

---

## Troubleshooting

### Tests fail with "Timeout waiting for URL"
- Check that test users exist and have correct passwords
- Verify users have correct roles assigned
- Check browser console for JavaScript errors

### Tests fail with "No tasks found"
- Ensure test data is created (tasks and assignments)
- Verify task assignments exist for test users
- Check that tasks are active (`is_active = true`)

### Review queue is empty
- Submit a task status as a team member first
- Ensure team lead and member are on the same team
- Check that status is in 'pending' state

### Database errors
- Verify migration was applied successfully
- Check that all foreign key relationships are correct
- Ensure RLS policies allow test users to access data

### Console shows 400 errors
- This was the known issue - should be fixed after migration
- If still occurring, check that all code uses `task_statuses` table
- Verify no references to old `updates` table remain

---

## Expected Test Results

After proper setup, you should see:

```
Phase 5: Task Update Workflow with Report-Month and Multi-Assignee
  5.5: Report-Month Handling
    ✓ should derive report_month as first day of current month
    ✓ should prevent duplicate submissions for same task/month
    - should allow resubmission after rejection (skipped)
  
  5.6: Multi-Assignee Awareness
    ✓ should display all assignees in review queue
    ✓ should show multi-assignee info in review modal
    - should record submitter identity in task_statuses (skipped)
  
  Auto-Queue Feature (6.5)
    ✓ should add approved status to report_queue
    ✓ should require comments when rejecting
  
  Update Form Validation
    ✓ should validate required fields
    ✓ should validate percent complete range
  
  Dashboard Display
    ✓ should show latest approved status in dashboard

9 passed, 3 skipped
```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark Phase 5 items as complete in TODO list
2. ✅ Update Phase 5 completion summary
3. ✅ Commit changes to git
4. ✅ Push to remote repository
5. ✅ Create pull request for review

---

## Support

If you encounter issues:
1. Check the Phase5_Implementation_Summary.md for details
2. Review the migration script for any errors
3. Check Supabase logs for database errors
4. Verify RLS policies are correctly configured
