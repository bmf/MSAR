# Phase 7 Setup Summary

## ✅ Completed Setup

### Report Approver Accounts Created

| Email | Password | User ID | Role |
|-------|----------|---------|------|
| approver1@example.com | TestPassword123! | ba919fe4-eb24-4826-8305-c4e4a3258948 | PM |
| approver2@example.com | TestPassword123! | b728449a-c349-4996-be02-9fd4cdb64073 | APM |

### Files Updated

1. **`.env`** - Added both approver credentials:
   ```env
   TEST_APPROVER_EMAIL=approver1@example.com
   TEST_APPROVER_PASSWORD=TestPassword123!
   
   TEST_APPROVER2_EMAIL=approver2@example.com
   TEST_APPROVER2_PASSWORD=TestPassword123!
   ```

2. **`tests/reporting.spec.js`** - Updated to load both approver credentials

3. **`database/migrations/0015_phase7_approvers_setup.sql`** - Created migration script

---

## Next Steps

### 1. Run the Migration

In **Supabase Dashboard** → **SQL Editor**:

1. Click "New Query"
2. Copy and paste the contents of `database/migrations/0015_phase7_approvers_setup.sql`
3. Click "Run"

Expected output:
```
✅ Phase 7 Approvers Setup Complete!

Test Credentials:
  Approver 1 (PM): approver1@example.com / TestPassword123!
  Approver 2 (APM): approver2@example.com / TestPassword123!

Contract Assignments:
  Approver 1 → Contract 1 (PM)
  Approver 2 → Contract 2 (APM)

Reports Created:
  - Pending report for current month
  - Approved report for previous month (for PDF testing)
```

### 2. Verify Setup

Run this query to verify both approvers are set up:

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
WHERE p.email IN ('approver1@example.com', 'approver2@example.com')
ORDER BY p.email;
```

Expected: 2 rows showing both approvers with their contract assignments

### 3. Run Tests

```bash
# Run all Phase 7 tests
npm test -- reporting.spec.js

# Run with UI for debugging
npx playwright test reporting.spec.js --ui
```

---

## What the Migration Does

1. **Creates Profiles:**
   - Approver 1: "Test Approver One" with role "Report Approver"
   - Approver 2: "Test Approver Two" with role "Report Approver"

2. **Assigns Contract Roles:**
   - Approver 1 → PM for Contract 1
   - Approver 2 → APM for Contract 2 (or Contract 1 if only one exists)

3. **Creates Test Reports:**
   - Pending report for current month (for review testing)
   - Approved report for previous month (for PDF export testing)

4. **Populates Report Queue:**
   - Adds approved task statuses to report queue
   - Links them to the monthly reports

---

## Testing Scenarios

### Scenario 1: Login as Approver 1
- Should land on Monthly Reporting dashboard
- See reports for Contract 1
- Can create, review, and approve reports

### Scenario 2: Login as Approver 2
- Should land on Monthly Reporting dashboard
- See reports for Contract 2
- Can create, review, and approve reports

### Scenario 3: Multi-Contract Access
- If you assign both approvers to the same contract, they'll both see the same reports
- Tests contract-scoped access control

---

## Troubleshooting

### Issue: Migration fails with "user not found"
**Cause:** Auth users weren't created in Supabase Auth Dashboard  
**Solution:** The users should already exist (you provided the UUIDs). Verify in Auth → Users

### Issue: No contracts found
**Cause:** Contracts table is empty  
**Solution:** Run Phase 1-6 migrations first to create test contracts

### Issue: Tests still failing
**Cause:** Server not running or .env not loaded  
**Solution:** 
- Restart server: `node server.js`
- Verify .env file is in project root
- Check that credentials match exactly

---

## Database Schema Reference

```
profiles
├── id (uuid) - User ID from auth.users
├── email
├── full_name
└── role - "Report Approver"

user_contract_roles
├── user_id (uuid) - Links to profiles.id
├── contract_id (uuid) - Links to contracts.id
└── role - "PM" or "APM"

monthly_reports
├── id (uuid)
├── contract_id (uuid)
├── report_month (date)
├── pm_review_status - 'pending', 'approved', 'approved-with-changes', 'rejected'
├── pm_reviewer (uuid) - Links to profiles.id
├── pm_reviewed_at (timestamptz)
└── pm_review_comment (text)

report_queue
├── id (uuid)
├── contract_id (uuid)
├── report_month (date)
└── task_status_id (uuid) - Links to task_statuses.id
```

---

## Quick Commands

```bash
# Start server
node server.js

# Run all reporting tests
npm test -- reporting.spec.js

# Run specific test
npm test -- reporting.spec.js -g "should navigate to reporting dashboard"

# Run with headed browser
npx playwright test reporting.spec.js --headed

# Run with UI mode
npx playwright test reporting.spec.js --ui
```

---

## Success Criteria

✅ Both approvers can login  
✅ Reporting dashboard loads  
✅ Reports table shows monthly reports  
✅ Can create new reports  
✅ Can review and approve reports  
✅ Can export approved reports to PDF  
✅ Access control works (team leads can't access)  
✅ All 24 Playwright tests pass  

---

**Ready to proceed with migration and testing!**
