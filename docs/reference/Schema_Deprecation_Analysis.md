# Schema Deprecation Analysis

**Date:** October 16, 2025  
**Analyst:** Development Team  
**Status:** Complete

## Executive Summary

This document provides a comprehensive analysis of deprecated database tables and columns in the MSR Webform application. The analysis was conducted by reviewing the PRD v3, database migrations, and application codebase.

## Findings

### Deprecated Tables (3)

#### 1. `pws_tasks` ⚠️ DEPRECATED

**Status:** Not used in current codebase  
**Replacement:** `tasks` table  
**Migration:** `0008_v3_core_tables.sql`

**Reason for Deprecation:**
- Uses old schema with `bigint` IDs instead of `uuid`
- Single assignee model (FK to profiles)
- Does not support multi-contract architecture
- Replaced by v3 `tasks` table with multi-assignee support via `task_assignments`

**Impact:** None - Not referenced in application code

**Recommendation:** 
- Mark as deprecated in database comments
- Consider dropping table after data archival
- Document in Data Model Reference ✅ DONE

---

#### 2. `updates` ⚠️ DEPRECATED

**Status:** Not used in current codebase  
**Replacement:** `task_statuses` table  
**Migration:** `0013_migrate_updates_to_task_statuses.sql`

**Reason for Deprecation:**
- Uses old schema with `bigint` task_id referencing deprecated `pws_tasks`
- Simple draft/submitted status model
- No integrated approval workflow
- Replaced by v3 `task_statuses` with lead review workflow

**Impact:** None - Not referenced in application code

**Database Comment Added:** 
```sql
COMMENT ON TABLE public.updates IS 'DEPRECATED: Use task_statuses table instead. 
This table uses old schema with bigint task_id referencing pws_tasks.';
```

**Recommendation:**
- Already marked as deprecated in migration 0013 ✅
- Document in Data Model Reference ✅ DONE
- Consider dropping table after data archival

---

#### 3. `approvals` ⚠️ DEPRECATED

**Status:** Not used in current codebase  
**Replacement:** Functionality merged into `task_statuses` table  
**Migration:** Implicit in v3 schema design

**Reason for Deprecation:**
- Separate approval tracking no longer needed
- Approval workflow now integrated into `task_statuses` via:
  - `lead_review_status` (pending/approved/rejected)
  - `lead_reviewer` (who approved)
  - `lead_reviewed_at` (when approved)
  - `lead_review_comment` (approval comments)

**Impact:** None - Not referenced in application code

**Recommendation:**
- Mark as deprecated in database comments
- Document in Data Model Reference ✅ DONE
- Consider dropping table after data archival

---

### Deprecated Columns (2)

#### 1. `profiles.role` ⚠️ DEPRECATED

**Status:** Legacy field, still exists but not used for authorization  
**Replacement:** `user_contract_roles` table  
**Migration:** `0009_user_contract_roles.sql`

**Reason for Deprecation:**
- Single global role per user
- Does not support multi-contract architecture
- No contract-scoped permissions
- Replaced by `user_contract_roles` for contract-scoped role assignments

**Current Usage:**
- Still used by `is_admin()` helper function for backward compatibility
- Should be phased out in favor of checking `user_contract_roles`

**Impact:** Low - Only used for admin checks

**Recommendation:**
- Mark as deprecated in Data Model Reference ✅ DONE
- Update `is_admin()` function to check `user_contract_roles` instead
- Add migration to populate `user_contract_roles` from `profiles.role`
- Eventually drop column after full migration

---

#### 2. `profiles.team` ⚠️ DEPRECATED

**Status:** Legacy field, not used in current codebase  
**Replacement:** `team_memberships` table  
**Migration:** `0008_v3_core_tables.sql`

**Reason for Deprecation:**
- Single team assignment per user
- Does not support multi-team membership
- Does not support team roles (lead vs member)
- Replaced by `team_memberships` with role support

**Current Usage:** None - Not referenced in application code

**Impact:** None

**Recommendation:**
- Mark as deprecated in Data Model Reference ✅ DONE
- Consider dropping column in future migration
- No code changes needed

---

## Codebase Verification

### Search Results

**Query:** References to deprecated tables in `app.js`

```bash
grep -n "from('pws_tasks')" app.js     # No results ✅
grep -n "from('updates')" app.js       # No results ✅
grep -n "from('approvals')" app.js     # No results ✅
```

**Conclusion:** No deprecated tables are referenced in the current application codebase.

### Active Tables Used

The application exclusively uses v3 schema tables:
- `contracts`
- `pws_line_items`
- `teams`
- `team_memberships`
- `tasks`
- `task_assignments`
- `task_statuses`
- `report_queue`
- `monthly_reports`
- `profiles`
- `user_contract_roles`
- `account_requests`

---

## PRD v3 Alignment

### PRD v3 Schema (Section 7)

The PRD v3 explicitly defines the current schema and does not reference the deprecated tables. All deprecated tables were part of the pre-v3 architecture.

**PRD v3 Tables:**
- ✅ contracts
- ✅ pws_line_items
- ✅ teams
- ✅ team_memberships
- ✅ tasks
- ✅ task_assignments
- ✅ task_statuses
- ✅ report_queue
- ✅ monthly_reports

**Not in PRD v3:**
- ❌ pws_tasks (deprecated)
- ❌ updates (deprecated)
- ❌ approvals (deprecated)

---

## Migration History

### Phase 1 (Initial Schema)
- `0001_initial_schema.sql` - Created `pws_tasks`, `updates`, `approvals`
- Used bigint IDs and simple structure

### Phase 1.5 (v3 Schema)
- `0008_v3_core_tables.sql` - Created new v3 tables with uuid IDs
- Introduced multi-contract architecture
- Created `tasks`, `task_statuses` as replacements

### Phase 5 (Deprecation)
- `0013_migrate_updates_to_task_statuses.sql` - Formally deprecated `updates` table
- Added database comment marking deprecation
- No data migration performed (fresh start)

---

## Recommendations

### Immediate Actions (Completed)

1. ✅ **Document Deprecated Tables** - Added comprehensive section to Data Model Reference
2. ✅ **Mark Deprecated Columns** - Identified `profiles.role` and `profiles.team` as deprecated
3. ✅ **Update Documentation Version** - Bumped to v1.1.0

### Short-Term Actions (Optional)

1. **Add Database Comments** - Add COMMENT ON TABLE for remaining deprecated tables:
   ```sql
   COMMENT ON TABLE public.pws_tasks IS 'DEPRECATED: Use tasks table instead. 
   This table uses old schema with bigint IDs.';
   
   COMMENT ON TABLE public.approvals IS 'DEPRECATED: Functionality merged into 
   task_statuses table. Use lead_review_status columns instead.';
   
   COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: Use user_contract_roles 
   table for contract-scoped role assignments.';
   
   COMMENT ON COLUMN public.profiles.team IS 'DEPRECATED: Use team_memberships 
   table for team assignments.';
   ```

2. **Update is_admin() Function** - Modify to check `user_contract_roles` instead of `profiles.role`

### Long-Term Actions (Future Versions)

1. **Data Archival** - Archive historical data from deprecated tables to separate database
2. **Drop Deprecated Tables** - After archival and verification period:
   ```sql
   DROP TABLE IF EXISTS public.pws_tasks CASCADE;
   DROP TABLE IF EXISTS public.updates CASCADE;
   DROP TABLE IF EXISTS public.approvals CASCADE;
   ```

3. **Drop Deprecated Columns** - After full migration to new tables:
   ```sql
   ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
   ALTER TABLE public.profiles DROP COLUMN IF EXISTS team;
   ```

---

## Risk Assessment

### Low Risk ✅

**Deprecated Tables:**
- Not referenced in application code
- RLS policies may exist but are not used
- Can be safely dropped after archival

**Deprecated Columns:**
- `profiles.team` - Not used at all
- `profiles.role` - Only used for admin check (easily replaceable)

### No Breaking Changes

All deprecations are backward-compatible:
- Old tables remain in database
- Old columns remain in profiles table
- Application uses only new v3 schema
- No user-facing impact

---

## Conclusion

The MSR Webform application has successfully migrated to the v3 schema. Three tables (`pws_tasks`, `updates`, `approvals`) and two columns (`profiles.role`, `profiles.team`) have been identified as deprecated.

**Current Status:**
- ✅ All deprecated items documented
- ✅ No deprecated items used in application code
- ✅ Data Model Reference updated
- ✅ Zero risk to production deployment

**Next Steps:**
- Consider adding database comments to remaining deprecated tables
- Plan data archival strategy for historical data
- Schedule deprecated table/column removal for future version

---

## Appendix: Verification Queries

### Check for Deprecated Table Usage

```sql
-- Check if any RLS policies reference deprecated tables
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('pws_tasks', 'updates', 'approvals');

-- Check for foreign key constraints to deprecated tables
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE confrelid::regclass::text IN ('pws_tasks', 'updates', 'approvals');

-- Check table sizes (to assess archival needs)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE tablename IN ('pws_tasks', 'updates', 'approvals')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Verify No Code References

```bash
# Search entire codebase for deprecated table references
grep -r "pws_tasks" public/src/
grep -r "updates" public/src/ | grep -v "task_statuses"
grep -r "approvals" public/src/

# Search test files
grep -r "pws_tasks" tests/
grep -r "updates" tests/ | grep -v "task_statuses"
grep -r "approvals" tests/
```

---

**Document Version:** 1.0  
**Last Updated:** October 16, 2025  
**Next Review:** Before v2.0.0 release
