# Phase 6 Quick Start Guide

## 🎯 Goal
Set up test data and verify Phase 6 (Team Lead Review) is working correctly.

## ⚡ Quick Steps

### 1. Create Test Users (5 minutes)
Go to: https://supabase.com/dashboard → Your Project → Authentication → Users

Click "Add User" for each:
- `teamlead@example.com` / `TestPassword123!` ✓ Auto Confirm
- `member1@example.com` / `TestPassword123!` ✓ Auto Confirm  
- `member2@example.com` / `TestPassword123!` ✓ Auto Confirm
- `approver@example.com` / `TestPassword123!` ✓ Auto Confirm

### 2. Run Migration (1 minute)
Go to: Supabase Dashboard → SQL Editor → New Query

Copy/paste: `database/migrations/0014_phase6_complete_test_data.sql`

Click **Run** ▶️

### 3. Test It (2 minutes)
```bash
npm test -- review.spec.js
```

Expected: ✅ 12 tests pass

## 📋 What Gets Created

- **3 Profiles:** 1 Team Lead + 2 Team Members
- **1 Team:** "Maintenance Team Alpha"
- **3 Tasks:** Assigned to members
- **3 Submissions:** Pending review by team lead

## 🔍 Verify Setup

```sql
-- Should return 3 pending submissions
SELECT COUNT(*) FROM task_statuses WHERE lead_review_status = 'pending';
```

## 🐛 Troubleshooting

**Tests fail with "User not found"**
→ Make sure you created users in Supabase Auth first

**"No pending submissions" in tests**
→ Re-run the migration SQL script

**Login fails in tests**
→ Check `.env` has correct credentials

## 📚 Full Details
See `database/setup_phase6_test_data.md` for complete instructions.
