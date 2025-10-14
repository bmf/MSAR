# Review Queue User Guide

## Accessing the Review Queue

### Step 1: Login as Team Lead
1. Navigate to `http://localhost:3000`
2. Enter credentials:
   - **Email:** `teamlead@example.com`
   - **Password:** `TestPassword123!`
3. Click **Login**

### Step 2: Verify Navigation
After successful login, you should see:
- **Dashboard** link in the navigation bar
- **Review Queue** link in the navigation bar (only visible to Team Leads and Admins)

If you don't see the "Review Queue" link:
- Check that you're logged in as `teamlead@example.com`
- Verify the user has `role = 'Team Lead'` in the profiles table
- Try refreshing the page

### Step 3: Navigate to Review Queue
1. Click the **"Review Queue"** link in the navigation
2. The URL should change to `http://localhost:3000/#review`
3. You should see a page titled "Review Queue"

### Step 4: View Pending Submissions
The Review Queue displays a table with these columns:
- **Task Name** - Name of the task
- **Submitted By** - Team member who submitted
- **Submitted At** - Timestamp of submission
- **% Complete** - Completion percentage
- **Short Status** - In Progress, On Hold, or Complete
- **Actions** - Review button

Currently, there should be **3 pending submissions** from Team Alpha members:
1. "Implement Authentication" by Team Member One (75% complete)
2. "Design User Interface" by Team Member Two (90% complete)
3. "Write API Documentation" by Team Member One (100% complete)

### Step 5: Review a Submission
1. Click the **"Review"** button on any row
2. A modal dialog will open showing:
   - **Task details** (task name, submitted by, submitted at)
   - **Editable fields:**
     - Narrative (text area)
     - % Complete (number input)
     - Blockers (text area)
     - Short Status (dropdown)
   - **Comments field** (for feedback to team member)
   - **Three action buttons:**
     - **Approve** (green) - Approve submission as-is
     - **Approve with Changes** (blue) - Save your edits and approve
     - **Reject** (red) - Reject and require resubmission

### Step 6: Take Action

#### To Approve As-Is:
1. Review the submission details
2. Optionally add comments
3. Click **"Approve"** button
4. Alert: "Submission approved successfully!"
5. Modal closes, table refreshes (approved item removed)

#### To Approve with Changes:
1. Edit any fields (narrative, %, blockers, status)
2. Add comments explaining your changes
3. Click **"Approve with Changes"** button
4. Alert: "Submission approved with changes!"
5. Modal closes, table refreshes

#### To Reject:
1. **REQUIRED:** Add comments explaining why
2. Click **"Reject"** button
3. If no comments: Error message "Please provide comments when rejecting"
4. With comments: Alert "Submission rejected."
5. Modal closes, table refreshes

## Verifying Approvals in Database

After approving or rejecting a submission, you can verify the data:

### Check Approvals Table
```sql
SELECT 
  a.id,
  a.status,
  a.comments,
  a.created_at,
  t.task_name,
  p.full_name as approver
FROM public.approvals a
JOIN public.updates u ON a.update_id = u.id
JOIN public.pws_tasks t ON u.task_id = t.id
JOIN public.profiles p ON a.approver_id = p.id
ORDER BY a.created_at DESC;
```

### Check Updated Status
```sql
SELECT 
  u.id,
  u.status,
  t.task_name,
  p.full_name as submitted_by
FROM public.updates u
JOIN public.pws_tasks t ON u.task_id = t.id
JOIN public.profiles p ON u.user_id = p.id
WHERE u.id IN (9, 10, 11)
ORDER BY u.id;
```

Expected status values:
- `submitted` - Still pending review
- `approved` - Approved by team lead
- `rejected` - Rejected by team lead

## Troubleshooting

### "Review Queue" link not visible
**Problem:** Navigation doesn't show "Review Queue" link  
**Solutions:**
1. Verify you're logged in as `teamlead@example.com`
2. Check user role in database:
   ```sql
   SELECT id, full_name, role, team 
   FROM public.profiles 
   WHERE id = 'a4fde722-7859-467c-9740-9d5739e131cd';
   ```
   Should show: `role = 'Team Lead'`
3. Clear browser cache and refresh
4. Check browser console for errors (F12 → Console tab)

### Review Queue is empty
**Problem:** Table shows "No pending submissions"  
**Solutions:**
1. Verify there are submitted updates:
   ```sql
   SELECT * FROM public.updates WHERE status = 'submitted';
   ```
2. Check team members are in same team:
   ```sql
   SELECT full_name, team FROM public.profiles WHERE team = 'Alpha';
   ```
3. Verify RLS policies are correct (see migrations/0002_rls_policies.sql)

### Review button doesn't open modal
**Problem:** Clicking "Review" button does nothing  
**Solutions:**
1. Check browser console for JavaScript errors
2. Verify Bootstrap modal is loaded (check page source for bootstrap.bundle.min.js)
3. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Approve/Reject doesn't work
**Problem:** Clicking action buttons shows error  
**Solutions:**
1. Check browser console for error messages
2. Verify Supabase connection is working
3. Check RLS policies allow team lead to insert into approvals table
4. Verify team lead has proper permissions

### Database Verification
Run this comprehensive check:
```sql
-- Check team lead profile
SELECT 'Team Lead Profile' as check, * 
FROM public.profiles 
WHERE id = 'a4fde722-7859-467c-9740-9d5739e131cd';

-- Check team members
SELECT 'Team Members' as check, id, full_name, role, team 
FROM public.profiles 
WHERE team = 'Alpha' AND role = 'Team Member';

-- Check pending submissions
SELECT 'Pending Submissions' as check, u.id, t.task_name, p.full_name, u.status
FROM public.updates u
JOIN public.pws_tasks t ON u.task_id = t.id
JOIN public.profiles p ON u.user_id = p.id
WHERE u.status = 'submitted' AND p.team = 'Alpha';
```

## Testing the Full Workflow

1. **Login as Team Lead** (`teamlead@example.com`)
2. **Navigate to Review Queue** (click link in nav)
3. **Verify 3 submissions** are visible
4. **Click Review** on first submission
5. **Approve it** (click Approve button)
6. **Verify:** Table now shows 2 submissions
7. **Click Review** on second submission
8. **Modify narrative** (edit the text)
9. **Approve with Changes**
10. **Verify:** Table now shows 1 submission
11. **Click Review** on last submission
12. **Try to reject without comments** → Should show error
13. **Add comments** "Please add more detail"
14. **Reject** the submission
15. **Verify:** Table shows "No pending submissions"

## Expected Database State After Testing

After completing the workflow above:
- **Approvals table:** 3 records (2 approved, 1 rejected)
- **Updates table:** 
  - Update ID 9: status = 'approved'
  - Update ID 10: status = 'approved' (with modified narrative)
  - Update ID 11: status = 'rejected'
