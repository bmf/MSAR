# Data Model Reference

**Document:** Data_Model_Reference.md  
**Version:** 1.1.0  
**Last Updated:** October 16, 2025  
**Schema Version:** v3

## Overview

This document provides comprehensive documentation of the MSR Webform database schema, including entity relationships, table structures, indexes, and Row Level Security (RLS) policies.

**Important:** This document identifies deprecated tables and columns from the pre-v3 schema. The application uses only the v3 schema tables. Deprecated tables (`pws_tasks`, `updates`, `approvals`) and deprecated columns (`profiles.role`, `profiles.team`) should not be used for new development.

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Core Tables](#core-tables)
3. [Supporting Tables](#supporting-tables)
4. [Deprecated Tables](#deprecated-tables)
5. [Helper Functions](#helper-functions)
6. [Row Level Security](#row-level-security)
7. [Indexes](#indexes)

---

## Entity Relationship Diagram

### High-Level Architecture

```
Contract
├── PWS Line Items → Tasks → Task Assignments (Users)
│                         └→ Task Statuses → Report Queue
├── Teams → Team Memberships (Users)
├── User Contract Roles (Users)
└── Monthly Reports
```

### Detailed Relationships

```
auth.users (Supabase Auth)
    ├→ profiles (1:1)
    ├→ user_contract_roles (1:n) → contracts (n:1)
    ├→ team_memberships (1:n) → teams (n:1) → contracts (n:1)
    ├→ task_assignments (1:n) → tasks (n:1) → pws_line_items (n:1) → contracts (n:1)
    └→ task_statuses (1:n) → tasks (n:1) → report_queue (1:n) → monthly_reports (n:1)
```

---

## Core Tables

### contracts

**Purpose:** Contract master data (top-level organizational unit)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Contract name |
| code | text | Unique contract code |
| is_active | boolean | Active/Archived status |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Update timestamp |

**Relationships:** Has many pws_line_items, teams, user_contract_roles, monthly_reports

---

### pws_line_items

**Purpose:** Performance Work Statement line items scoped to contracts

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| contract_id | uuid | FK to contracts |
| code | text | Line item code (unique per contract) |
| title | text | Short title |
| description | text | Detailed description |
| periodicity | text | Reporting frequency |
| is_active | boolean | Active/Retired status |

**Relationships:** Belongs to contracts, has many tasks

---

### teams

**Purpose:** Teams scoped to contracts

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| contract_id | uuid | FK to contracts |
| name | text | Team name (unique per contract) |
| is_active | boolean | Active/Inactive status |

**Relationships:** Belongs to contracts, has many team_memberships

---

### team_memberships

**Purpose:** User membership in teams with role (lead/member)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| team_id | uuid | FK to teams |
| user_id | uuid | FK to auth.users |
| role_in_team | text | 'lead' or 'member' |

**Relationships:** Belongs to teams and auth.users

---

### tasks

**Purpose:** Tasks linked to PWS line items

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| pws_line_item_id | uuid | FK to pws_line_items |
| title | text | Task title |
| description | text | Detailed description |
| start_date | date | Start date |
| due_date | date | Due date |
| status_short | text | Quick status |
| is_active | boolean | Active status |

**Relationships:** Belongs to pws_line_items, has many task_assignments and task_statuses

---

### task_assignments

**Purpose:** Many-to-many assignment of users to tasks

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| task_id | uuid | FK to tasks |
| user_id | uuid | FK to auth.users (assignee) |
| assigned_by | uuid | FK to auth.users (assigner) |
| assigned_at | timestamptz | Assignment timestamp |

**Unique:** (task_id, user_id)

---

### task_statuses

**Purpose:** Task status submissions with lead review workflow

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| task_id | uuid | FK to tasks |
| submitted_by | uuid | FK to auth.users |
| narrative | text | Status narrative |
| percent_complete | numeric | Progress (0-100) |
| blockers | text | Blocker description |
| lead_review_status | text | 'pending', 'approved', 'rejected' |
| lead_reviewer | uuid | FK to auth.users |
| lead_reviewed_at | timestamptz | Review timestamp |
| report_month | date | Reporting month |

**Relationships:** Belongs to tasks and auth.users

---

### report_queue

**Purpose:** Approved statuses queued for monthly reporting

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| contract_id | uuid | FK to contracts |
| report_month | date | Reporting month |
| task_status_id | uuid | FK to task_statuses |
| added_at | timestamptz | Queue timestamp |

**Unique:** (contract_id, report_month, task_status_id)

---

### monthly_reports

**Purpose:** Monthly report metadata and PM/APM approval

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| contract_id | uuid | FK to contracts |
| report_month | date | Reporting month |
| pm_review_status | text | PM/APM review status |
| pm_reviewer | uuid | FK to auth.users |
| pm_reviewed_at | timestamptz | Review timestamp |
| pm_review_comment | text | Review comments |
| pdf_storage_path | text | PDF path |

**Unique:** (contract_id, report_month)

---

## Supporting Tables

### profiles

**Purpose:** User profile information (extends Supabase Auth)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK (matches auth.users.id) |
| full_name | text | User's full name |
| role | text | **DEPRECATED** - Legacy role field, use user_contract_roles instead |
| team | text | **DEPRECATED** - Legacy team field, use team_memberships instead |
| email | text | Email address |
| disabled | boolean | Account disabled status |

**Deprecated Columns:**
- `role` - Use `user_contract_roles` table for contract-scoped role assignments
- `team` - Use `team_memberships` table for team assignments

---

### user_contract_roles

**Purpose:** Maps users to contracts with specific roles

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| contract_id | uuid | FK to contracts |
| role | text | 'Admin', 'PM', 'APM', 'Team Lead', 'Team Member' |

**Unique:** (user_id, contract_id, role)

---

### account_requests

**Purpose:** Pending account requests for admin approval

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | text | Requester's name |
| email | text | Requester's email (unique) |
| reason | text | Access request reason |
| status | text | 'pending', 'approved', 'rejected' |

---

## Deprecated Tables

The following tables exist in the database but are **DEPRECATED** and should not be used for new development. They are retained for historical reference only.

### ⚠️ pws_tasks (DEPRECATED)

**Status:** DEPRECATED - Use `tasks` table instead

**Reason:** This table uses the old schema with `bigint` IDs and references the deprecated structure. Replaced by the v3 `tasks` table which uses `uuid` IDs and references `pws_line_items`.

**Original Purpose:** Stored PWS line items (pre-v3 schema)

**Schema:**
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key (old ID type) |
| task_name | text | Task name |
| pws_line_item | text | PWS line item reference |
| start_date | date | Start date |
| due_date | date | Due date |
| assigned_to | uuid | FK to profiles (single assignee only) |

**Migration:** Data not migrated. Use `tasks` table with `task_assignments` for multi-assignee support.

**Do Not Use:** This table is not referenced in the current codebase.

---

### ⚠️ updates (DEPRECATED)

**Status:** DEPRECATED - Use `task_statuses` table instead

**Reason:** This table uses the old schema with `bigint` task IDs referencing `pws_tasks`. Replaced by the v3 `task_statuses` table which uses `uuid` task IDs and references the new `tasks` table. See migration `0013_migrate_updates_to_task_statuses.sql`.

**Original Purpose:** Stored task status updates (pre-v3 schema)

**Schema:**
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key (old ID type) |
| task_id | bigint | FK to pws_tasks (deprecated) |
| user_id | uuid | FK to profiles |
| narrative | text | Status narrative |
| percent_complete | integer | Progress (0-100) |
| blockers | text | Blocker description |
| short_status | text | Short status |
| status | text | 'draft' or 'submitted' |
| submitted_at | timestamptz | Submission timestamp |

**Migration:** Data not migrated. Fresh start with `task_statuses` table. Historical data retained for reference.

**Do Not Use:** This table is not referenced in the current codebase.

---

### ⚠️ approvals (DEPRECATED)

**Status:** DEPRECATED - Functionality merged into `task_statuses` table

**Reason:** Approval workflow is now handled directly in the `task_statuses` table via `lead_review_status`, `lead_reviewer`, `lead_reviewed_at`, and `lead_review_comment` columns. Separate approvals table no longer needed.

**Original Purpose:** Stored approval history for updates (pre-v3 schema)

**Schema:**
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key (old ID type) |
| update_id | bigint | FK to updates (deprecated) |
| approver_id | uuid | FK to profiles |
| status | text | 'approved', 'rejected', 'modified' |
| comments | text | Approval comments |

**Migration:** Approval workflow redesigned. Use `task_statuses` columns for review tracking.

**Do Not Use:** This table is not referenced in the current codebase.

---

### Migration Notes

**Phase 5 Migration (October 2025):**
- Migration `0013_migrate_updates_to_task_statuses.sql` formally deprecated the `updates` table
- Added comment to `updates` table: "DEPRECATED: Use task_statuses table instead"
- No data migration performed - fresh start with v3 schema
- Historical data in deprecated tables retained for reference

**Why No Data Migration:**
1. Schema incompatibility (bigint vs uuid IDs)
2. Different relationship structure (single vs multi-assignee)
3. Enhanced workflow (integrated approval tracking)
4. Clean slate for production deployment

**If Historical Data Needed:**
- Old tables remain in database
- Can be queried directly if needed
- Not accessible through application UI
- Consider archiving to separate database if needed

---

## Helper Functions

### is_admin()
Returns true if current user is an Admin.

### has_contract_role(contract_id, role)
Returns true if current user has specified role for given contract.

### get_user_contracts()
Returns contract IDs accessible to current user.

### is_team_lead(team_id)
Returns true if current user leads the specified team.

### get_user_led_teams()
Returns team IDs that current user leads.

---

## Row Level Security

All tables have RLS enabled. Policies enforce role-based access:

**Admin:** Full access to all tables

**PM/APM:** Read all data for assigned contracts, write to monthly_reports

**Team Lead:** Read/write tasks and statuses for their teams

**Team Member:** Read assigned tasks, write their own task statuses

---

## Indexes

Performance indexes on:
- Foreign keys (contract_id, team_id, user_id, task_id)
- Status fields (is_active, lead_review_status)
- Date fields (report_month)
- Composite indexes on (contract_id, report_month)

---

## Migration Files

See `database/migrations/` for complete SQL:
- 0001-0003: Initial schema
- 0008-0011: v3 schema (contracts, teams, roles)
- 0013: Status migration
- 0015-0017: Reporting and admin features
