# Phase 1 Migration Guide - PRD v3 Database Upgrade

This guide walks through applying Phase 1 migrations to upgrade the database schema to support multi-contract architecture per PRD v3.

## Overview

Phase 1 introduces:
- Contract-scoped data model
- Multi-assignee task support
- Enhanced role-based access control
- Monthly reporting workflow
- Storage bucket for PDF reports

## Prerequisites

- Supabase project with existing Phase 0 schema
- Admin access to Supabase Dashboard
- Node.js environment with dependencies installed

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| `0008_v3_core_tables.sql` | Creates contracts, pws_line_items, teams, tasks, etc. | Required |
| `0009_user_contract_roles.sql` | Creates user_contract_roles and helper functions | Required |
| `0010_v3_seed_data.sql` | Seed data for testing (requires user ID updates) | Required |
| `0011_v3_rls_policies.sql` | RLS policies for contract-scoped access | Required |
| `0012_storage_setup.md` | Manual storage bucket setup instructions | Manual |

## Application Methods

### Method 1: Automated Script (Recommended for Dev)

**Note:** This method requires `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file.

1. Add service role key to `.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the migration script:
   ```bash
   node database/apply-phase1-migrations.js
   ```

3. Review output for any errors

### Method 2: Manual via Supabase SQL Editor (Recommended for Production)

1. Open Supabase Dashboard → SQL Editor

2. Apply migrations in order:

   **Step 1: Core Tables**
   - Copy contents of `0008_v3_core_tables.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Verify: Check that new tables appear in Table Editor

   **Step 2: User Contract Roles**
   - Copy contents of `0009_user_contract_roles.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Verify: Check that `user_contract_roles` table exists and helper functions are created

   **Step 3: Seed Data**
   - **IMPORTANT:** Before applying, update user IDs in `0010_v3_seed_data.sql`
   - Query existing users:
     ```sql
     SELECT id, full_name, role FROM public.profiles;
     ```
   - Update the commented INSERT statements with actual user IDs
   - Copy modified contents
   - Paste into SQL Editor
   - Click "Run"
   - Verify: Check that contracts, teams, and tasks are created

   **Step 4: RLS Policies**
   - Copy contents of `0011_v3_rls_policies.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Verify: Check Authentication → Policies to see new policies

   **Step 5: Storage Bucket**
   - Follow instructions in `0012_storage_setup.md`
   - Create bucket via Storage UI
   - Apply storage policies via SQL Editor

## Verification Steps

After applying all migrations, verify:

### 1. Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'contracts', 'pws_line_items', 'teams', 'team_memberships',
    'tasks', 'task_assignments', 'task_statuses', 
    'report_queue', 'monthly_reports', 'user_contract_roles'
);
```
Expected: All 10 tables listed

### 2. Helper Functions Created
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'is_admin', 'has_contract_role', 'get_user_contracts',
    'is_team_lead', 'get_user_led_teams'
);
```
Expected: All 5 functions listed

### 3. RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%contract%' OR tablename LIKE '%task%';
```
Expected: All tables show `rowsecurity = true`

### 4. Seed Data Present
```sql
SELECT COUNT(*) as contract_count FROM public.contracts;
SELECT COUNT(*) as team_count FROM public.teams;
SELECT COUNT(*) as task_count FROM public.tasks;
```
Expected: At least 2 contracts, 3 teams, 3 tasks

### 5. Storage Bucket
- Navigate to Storage in Supabase Dashboard
- Verify `reports` bucket exists and is private

## Updating Seed Data with Real User IDs

1. Get existing user IDs:
```sql
SELECT id, full_name, role FROM public.profiles ORDER BY role, full_name;
```

2. Edit `0010_v3_seed_data.sql` and uncomment/update these sections:

```sql
-- Example: Assign Admin role
INSERT INTO public.user_contract_roles (user_id, contract_id, role) 
VALUES ('<admin-user-id>', '11111111-1111-1111-1111-111111111111', 'Admin');

-- Example: Assign PM role
INSERT INTO public.user_contract_roles (user_id, contract_id, role) 
VALUES ('<pm-user-id>', '11111111-1111-1111-1111-111111111111', 'PM');

-- Example: Assign Team Lead and add to team
INSERT INTO public.user_contract_roles (user_id, contract_id, role) 
VALUES ('<lead-user-id>', '11111111-1111-1111-1111-111111111111', 'Team Lead');

INSERT INTO public.team_memberships (team_id, user_id, role_in_team) 
VALUES ('66666666-6666-6666-6666-666666666666', '<lead-user-id>', 'lead');

-- Example: Assign Team Member and add to team
INSERT INTO public.user_contract_roles (user_id, contract_id, role) 
VALUES ('<member-user-id>', '11111111-1111-1111-1111-111111111111', 'Team Member');

INSERT INTO public.team_memberships (team_id, user_id, role_in_team) 
VALUES ('66666666-6666-6666-6666-666666666666', '<member-user-id>', 'member');

-- Example: Assign tasks to users
INSERT INTO public.task_assignments (task_id, user_id, assigned_by) 
VALUES ('99999999-9999-9999-9999-999999999999', '<member-user-id>', '<lead-user-id>');
```

3. Re-run the updated seed data SQL

## Rollback Plan

If you need to rollback Phase 1 migrations:

```sql
-- Drop new tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS public.monthly_reports CASCADE;
DROP TABLE IF EXISTS public.report_queue CASCADE;
DROP TABLE IF EXISTS public.task_statuses CASCADE;
DROP TABLE IF EXISTS public.task_assignments CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.team_memberships CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.pws_line_items CASCADE;
DROP TABLE IF EXISTS public.user_contract_roles CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.has_contract_role(uuid, text);
DROP FUNCTION IF EXISTS public.get_user_contracts();
DROP FUNCTION IF EXISTS public.is_team_lead(uuid);
DROP FUNCTION IF EXISTS public.get_user_led_teams();

-- Drop views
DROP VIEW IF EXISTS public.v_user_contract_access;
```

## Troubleshooting

### Error: "relation already exists"
- Tables may have been partially created
- Check which tables exist: `\dt` in psql or use Table Editor
- Drop existing tables and retry

### Error: "function does not exist"
- Helper functions may not have been created
- Apply `0009_user_contract_roles.sql` separately

### Error: "permission denied"
- Ensure you're using service role key or admin account
- Check RLS policies aren't blocking admin access

### Error: "foreign key violation"
- Seed data references non-existent users
- Update user IDs in `0010_v3_seed_data.sql` before applying

## Next Steps After Phase 1

1. ✅ Verify all acceptance criteria (see TODO list)
2. Update frontend to use new schema
3. Create/update Playwright tests for Phase 1
4. Begin Phase 2 tasks (Dashboard updates)

## Acceptance Criteria Checklist

- [ ] **1.5**: All core tables created with correct FKs, PKs, and indexes
- [ ] **1.6**: `user_contract_roles` table created with seed data (at least 1 of each role)
- [ ] **1.7**: RLS policies enforce Admin/PM/APM/Lead/Member access correctly
- [ ] **1.8**: Storage bucket `reports` created with signed URL retrieval working

## Support

For issues or questions:
1. Check Supabase logs: Dashboard → Logs
2. Review SQL error messages carefully
3. Verify prerequisites are met
4. Consult PRD v3 for schema requirements
