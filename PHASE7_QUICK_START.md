# Phase 7 Quick Start Guide

**PM/APM Monthly Reporting Dashboard**

---

## Setup (One-Time)

### 1. Create Report Approver User

In Supabase Dashboard → Authentication → Users:
- Click "Add User"
- Email: `approver@example.com`
- Password: `TestPassword123!`
- Check "Auto Confirm User"
- Click "Create User"

### 2. Configure Profile & Permissions

In Supabase Dashboard → SQL Editor, run:

```sql
DO $$
DECLARE
    approver_id uuid;
    contract_id uuid;
BEGIN
    -- Get approver user ID
    SELECT id INTO approver_id
    FROM auth.users
    WHERE email = 'approver@example.com';
    
    -- Get a contract ID
    SELECT id INTO contract_id
    FROM public.contracts
    LIMIT 1;
    
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (approver_id, 'approver@example.com', 'Test Approver', 'Report Approver', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'Report Approver', full_name = 'Test Approver';
    
    -- Assign PM role for the contract
    INSERT INTO public.user_contract_roles (user_id, contract_id, role)
    VALUES (approver_id, contract_id, 'PM')
    ON CONFLICT (user_id, contract_id, role) DO NOTHING;
END $$;
```

### 3. Update .env File

Add to your `.env` file:
```
TEST_APPROVER_EMAIL=approver@example.com
TEST_APPROVER_PASSWORD=TestPassword123!
```

---

## Usage

### Access the Reporting Dashboard

1. Login as Report Approver (`approver@example.com`)
2. You'll land directly on the Monthly Reporting dashboard
3. Or click "Reporting" in the navigation

### Create a New Report

1. Click "Create New Report" button
2. Select a contract from dropdown
3. Select report month (defaults to current month)
4. Click "Create Report"
5. Report appears in the table with "Pending" status

### Review a Report

1. Find the report in the table
2. Click "View/Review" button
3. Review the report preview:
   - Contract and month info
   - Total items in queue
   - Grouped by PWS line item
   - Task details with narratives and blockers

### Approve a Report

1. Open the report for review
2. Optionally add a comment
3. Click one of:
   - **Approve** - Report is finalized
   - **Approve with Changes** - Report finalized with notes
   - **Reject** - Report rejected (comment required)
4. Status updates in the table

### Export to PDF

1. Find an approved report in the table
2. Click "Export PDF" button (in table or modal)
3. PDF downloads automatically
4. Filename: `MSR_{CONTRACT_CODE}_{REPORT_MONTH}.pdf`

### Filter Reports

Use the filter controls to narrow down reports:
- **Contract:** Show reports for specific contract
- **Report Month:** Show reports for specific month
- **Status:** Filter by Pending, Approved, Approved with Changes, or Rejected

---

## Testing

### Run Automated Tests

```bash
# All reporting tests
npm test -- reporting.spec.js

# Specific test
npm test -- reporting.spec.js -g "should navigate to reporting dashboard"
```

### Manual Test Scenarios

#### Scenario 1: Create and Approve Report
1. Login as approver
2. Create new report for current month
3. Verify report appears with queue count
4. Review report and approve
5. Export to PDF
6. Verify PDF content

#### Scenario 2: Reject Report
1. Open a pending report
2. Try to reject without comment → Should fail
3. Add comment and reject
4. Verify status changes to "Rejected"

#### Scenario 3: Test Locking
1. Approve a report for current month
2. Logout and login as team member
3. Try to submit status for current month
4. Should see "locked" error message

#### Scenario 4: Access Control
1. Login as team lead (not approver)
2. Verify "Reporting" link is not visible
3. Try to navigate to `#reporting`
4. Should see "Access Denied" message

---

## Troubleshooting

### No Reports Showing
- Ensure you have PM/APM role assigned for at least one contract
- Check that reports exist in `monthly_reports` table
- Verify RLS policies allow access

### Can't Create Report
- Ensure contract and month are selected
- Check for duplicate reports (same contract + month)
- Verify user has PM/APM role for selected contract

### PDF Export Not Working
- Check browser console for errors
- Verify jsPDF library loaded (check Network tab)
- Ensure report has approved status

### Queue Count is Zero
- Verify team leads have approved task statuses
- Check that approved items are in `report_queue` table
- Ensure contract_id and report_month match

---

## Database Queries

### Check Report Status
```sql
SELECT 
    mr.id,
    c.name as contract_name,
    mr.report_month,
    mr.pm_review_status,
    p.full_name as reviewer,
    mr.pm_reviewed_at
FROM public.monthly_reports mr
JOIN public.contracts c ON mr.contract_id = c.id
LEFT JOIN public.profiles p ON mr.pm_reviewer = p.id
ORDER BY mr.report_month DESC;
```

### Check Queue Items
```sql
SELECT 
    rq.id,
    c.name as contract,
    rq.report_month,
    t.title as task,
    ts.narrative,
    ts.percent_complete
FROM public.report_queue rq
JOIN public.task_statuses ts ON rq.task_status_id = ts.id
JOIN public.tasks t ON ts.task_id = t.id
JOIN public.pws_line_items pli ON t.pws_line_item_id = pli.id
JOIN public.contracts c ON pli.contract_id = c.id
WHERE rq.report_month = date_trunc('month', CURRENT_DATE)
ORDER BY c.name, t.title;
```

### Check User Permissions
```sql
SELECT 
    p.full_name,
    p.email,
    p.role as profile_role,
    c.name as contract,
    ucr.role as contract_role
FROM public.profiles p
LEFT JOIN public.user_contract_roles ucr ON p.id = ucr.user_id
LEFT JOIN public.contracts c ON ucr.contract_id = c.id
WHERE p.email = 'approver@example.com';
```

---

## Key Features

✅ **Contract Filtering** - View reports for specific contracts  
✅ **Month Selection** - Filter by reporting period  
✅ **Status Tracking** - See pending, approved, and rejected reports  
✅ **Queue Counts** - Know how many items in each report  
✅ **Grouped Preview** - Reports organized by PWS line item  
✅ **Review Actions** - Approve, approve with changes, or reject  
✅ **PDF Export** - Download professional formatted reports  
✅ **Report Locking** - Prevent edits after finalization  
✅ **Access Control** - PM/APM only access  

---

## Next Phase

After Phase 7 is approved, move to:
- **Phase 8:** Admin contract/team/PWS management (tasks 8.7-8.10)
- **Phase 9:** Non-functional requirements (security, performance, accessibility)
- **Phase 10:** DevOps & CI/CD
- **Phase 11:** Comprehensive QA test suites
- **Phase 12:** Documentation & handover
