# MSR Webform Program Requirements Document (PRD) v3

**Document:** MSR_Webform_PRD_v3  
**Date:** 2025-10-14  
**Author:** Brandon Flade & ChatGPT (GPT-5 Thinking)

---

## 1. Overview
The Monthly Status Report (MSR) Webform application supports **multiple contracts**, each with its own **Performance Work Statement (PWS)** composed of **PWS line items**. Each line item may have one or more **tasks**. Tasks are assigned to members of one or more **teams** under a contract. **Team Leads** review and approve task status updates; approved updates are then queued for **monthly reporting**. **Project Manager (PM)** and **Assistant PM (APM)** provide final approval for monthly reporting artifacts, which are exported to **PDF**.

The application is a lightweight web app built with **HTML + Bootstrap 5.x + jQuery 3.x**, using **Supabase** (PostgreSQL + Auth) for data, authentication, and access control. It is hosted on **Vercel** with source control on **GitHub**. **Playwright** is used for **local** end‑to‑end testing.

---

## 2. Objectives
- Track **multiple contracts**, each with PWS and PWS line items.
- Streamline **task assignment** (including multi‑assignee) and **status submission**.
- Provide **role-based views** and **approval workflows** for Team Leads, PM/APM, and Admins.
- Ensure approved statuses flow into a **monthly reporting queue** and export to **PDF**.
- Maintain **security, auditability, and usability** for a mixed role environment.

---

## 3. Scope
**In scope**
- Contract/PWS/PWS Line Item/Task data model
- Supabase Auth with RLS (Row Level Security)
- Role-based dashboards (Admin, PM/APM, Team Lead, Team Member)
- Task assignment (incl. multiple assignees and leads)
- Status submission & lead approval workflow
- Reporting queue and PM/APM approval for a monthly PDF
- Admin workflows: account approval, contract management, PWS line item lifecycle, team/role assignment
- Local Playwright E2E tests

**Out of scope (v3)**
- Email/Push notifications (defer)
- LLM narrative generation (defer)
- External SSO (defer)
- Advanced analytics dashboards (defer)

---

## 4. Technical Stack
| Layer | Technology |
|------|------------|
| Frontend | HTML5, Bootstrap 5.x, jQuery 3.x |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Hosting | Vercel (static + Serverless API routes if needed) |
| Version Control | Git / GitHub |
| Testing | Playwright (Local only) |
| Browser Support | Latest Chrome, Edge, Firefox |

---

## 5. Roles & Permissions
### Roles
- **Admin**: System admin for user, contract, and PWS management.
- **PM/APM**: Contract-level approvers of monthly reporting; read access to all tasks and line items for assigned contracts.
- **Team Lead**: Assigns tasks; reviews/approves/rejects task status submissions for their team(s).
- **Team Member**: Submits status for tasks assigned to them; can be assigned tasks alongside leads.

### Visibility
- **Admin**: Sees *all* contracts and PWS items; can filter by contract.
- **PM/APM**: Sees all tasks and PWS line items **for their assigned contract(s)**.
- **Team Lead**: Sees all tasks and PWS line items **for team(s) they lead**.
- **Team Member**: Sees only **their assigned tasks** and their prior submitted statuses.

### Actions (summary)
| Action | Admin | PM/APM | Team Lead | Team Member |
|---|---|---|---|---|
| Approve new account requests | ✓ | – | – | – |
| Add/Update/Retire PWS line items | ✓ | – | – | – |
| Add contracts, teams | ✓ | – | – | – |
| Assign roles & team membership | ✓ | – | – | – |
| Assign tasks (to members/leads) | – | – | ✓ | – |
| Submit task status | – | – | ✓* | ✓ |
| Approve/Reject task status | – | – | ✓ | – |
| Queue for monthly reporting | – | – | auto (post‑approval) | – |
| Approve/Approve w/ changes/Reject reporting | – | ✓ | – | – |
| Export PDF | – | ✓ | – | – |

\* Leads may also be assignees and submit status for tasks they own.

---

## 6. Core Entities & Relationships (Conceptual)
- **Contract** (1..n) → **PWS** (1)  
  Each contract has one PWS artifact (logical), which includes many **PWSLineItem**s.
- **PWSLineItem** (1..n) → **Task** (1..n)  
  Each line item can have many tasks.
- **Contract** (1..n) → **Team** (1..n)  
  Teams are scoped to contracts (a person can belong to multiple teams across contracts).
- **Team** (1..n) → **TeamLead** (1..n users)
- **Task** (n..m) ↔ **User** (assignees)  
  Many‑to‑many via TaskAssignment (supports multiple assignees including leads).
- **TaskStatus**: Submission records per task, per reporting period, per submitter.
- **ReportQueue**: Aggregation of approved TaskStatus entries for a month per contract.

---

## 7. Proposed Supabase Schema (Initial)
> Naming can be adjusted to enterprise standards; include created_at/updated_at, soft‑delete flags where noted.

```
tables:
  contracts (
    id uuid pk,
    name text not null,
    code text unique not null,         -- internal identifier
    is_active boolean default true
  )

  pws_line_items (
    id uuid pk,
    contract_id uuid fk -> contracts.id,
    code text not null,                -- e.g., "4.1.1.2"
    title text not null,
    description text,
    periodicity text,                  -- e.g., daily, weekly, monthly, as-needed
    is_active boolean default true
  )

  teams (
    id uuid pk,
    contract_id uuid fk -> contracts.id,
    name text not null,
    is_active boolean default true
  )

  team_memberships (
    id uuid pk,
    team_id uuid fk -> teams.id,
    user_id uuid fk -> auth.users.id,
    role_in_team text check (role_in_team in ('lead','member')),
    unique(team_id, user_id, role_in_team)
  )

  tasks (
    id uuid pk,
    pws_line_item_id uuid fk -> pws_line_items.id,
    title text not null,
    description text,
    start_date date,
    due_date date,
    status_short text check (status_short in ('not-started','in-progress','on-hold','complete')) default 'not-started',
    is_active boolean default true
  )

  task_assignments (
    id uuid pk,
    task_id uuid fk -> tasks.id,
    user_id uuid fk -> auth.users.id,
    assigned_by uuid fk -> auth.users.id,
    assigned_at timestamptz default now(),
    unique(task_id, user_id)
  )

  task_statuses (
    id uuid pk,
    task_id uuid fk -> tasks.id,
    submitted_by uuid fk -> auth.users.id,
    narrative text,
    percent_complete numeric check (percent_complete between 0 and 100),
    blockers text,
    submitted_at timestamptz default now(),
    lead_review_status text check (lead_review_status in ('pending','approved','rejected')) default 'pending',
    lead_reviewer uuid fk -> auth.users.id,
    lead_reviewed_at timestamptz,
    lead_review_comment text,
    report_month date,                -- e.g., 2025-10-01 for October 2025 cycle
    unique(task_id, submitted_by, report_month, submitted_at)
  )

  report_queue (
    id uuid pk,
    contract_id uuid fk -> contracts.id,
    report_month date not null,
    task_status_id uuid fk -> task_statuses.id,  -- only approved entries
    added_at timestamptz default now(),
    unique(contract_id, report_month, task_status_id)
  )

  monthly_reports (
    id uuid pk,
    contract_id uuid fk -> contracts.id,
    report_month date not null,
    pm_review_status text check (pm_review_status in ('pending','approved','approved-with-changes','rejected')) default 'pending',
    pm_reviewer uuid fk -> auth.users.id,
    pm_reviewed_at timestamptz,
    pm_review_comment text,
    pdf_storage_path text,              -- path in Supabase Storage when exported
    unique(contract_id, report_month)
  )
```

**Indexes**: foreign keys + `(contract_id, report_month)`, `(pws_line_item_id)`, `(task_id)`, `(user_id)` where appropriate.  
**Storage**: `reports/CONTRACT_CODE/YYYY-MM/report.pdf` in Supabase Storage.

---

## 8. Access Control & RLS (Examples)
- **Admins**: unrestricted RLS bypass via `is_admin()` Postgres function mapping to a `user_roles` table.
- **PM/APM**: read all rows where `contract_id` ∈ contracts they are assigned to; write on `monthly_reports` for those contracts.
- **Team Leads**: read/write tasks and task_statuses where they lead the team associated to the task’s line item → contract; can approve/reject `task_statuses` with `lead_review_status` updates.
- **Team Members**: read tasks assigned to them; write `task_statuses` where `submitted_by = auth.uid()`.
- **Cross‑contract isolation**: every row in `pws_line_items`, `teams`, `tasks`, `task_statuses`, `report_queue`, and `monthly_reports` is scoped by `contract_id` (explicit or via joins), enforced in policies.

*Implementation note*: a helper table `user_contract_roles(user_id, contract_id, role)` simplifies RLS checks for PM/APM/Lead/Member per contract.

---

## 9. Workflows
### 9.1 Task Assignment
1. Team Lead selects a PWS line item → creates/edits a Task.  
2. Lead assigns one or more users (including themselves if desired).  
3. Assignees see tasks on their dashboard.

### 9.2 Status Submission (Assignee)
1. Open task → “Submit Status” for current **report_month**.  
2. Provide **Narrative**, **% Complete**, **Blockers**; save Draft or Submit.  
3. Upon Submit → `lead_review_status = 'pending'`.

### 9.3 Lead Review
1. Lead opens **Review Queue** (team scoped).  
2. For each submission: **Approve** or **Reject** (with comment; may edit text if policy allows).  
3. On **Approve** → add to **report_queue** for that contract & month.

### 9.4 PM/APM Reporting
1. PM/APM opens **Monthly Report** for chosen contract & month.  
2. Reviews aggregated approved items; may **Approve**, **Approve with Changes**, or **Reject** (comment required for Reject).  
3. On **Approve** (or **Approve with Changes**) → generate and store **PDF** to Supabase Storage; record path in `monthly_reports`.

---

## 10. UI / Screens
- **Login & Account Request**: Email/password login; Account Request form (name, email, contract/team if known, reason). Admin queue to approve/deny.
- **Admin Panel**: Users (approve accounts, assign roles, team memberships), Contracts (CRUD), Teams (CRUD), PWS Line Items (create, update, retire). Filters by contract.
- **PM/APM Dashboard**: Select Contract + Month → view report queue, review actions, export PDF, history of past reports.
- **Team Lead Dashboard**: Team filter → Tasks list (create/edit), Assign users, Review Queue of submitted statuses.
- **Team Member Dashboard**: My Tasks; Submit/Edit Status (drafts), History of prior submissions.
- **Global Filters**: Contract → Team → PWS Line Item → Task; Date/Month picker.
- **PDF Export Modal**: Confirm month/contract; acknowledge finalization.
- **Theme Toggle**: Light/Dark mode switch available to **all roles**; persists per user; accessible from the header.

---

## 11. Reporting Details
- **Cycle**: Monthly, using `report_month` (first day of month as key).
- **Contents**: Contract header, PWS sections by line item, approved task narratives, % complete, blockers summary (if any), and metadata (prepared by, reviewed by, dates).
- **Format**: PDF stored in Supabase Storage. Optional HTML preview page (non‑authoritative).

---

## 12. Non‑Functional Requirements
- **Security**: Supabase Auth; HTTPS; least‑privilege RLS; audit columns; admin actions logged.
- **Performance**: <2s page load on broadband; queries indexed; pagination on lists.
- **Accessibility**: WCAG 2.1 AA where feasible.
- **Maintainability**: Modular JS; config via environment variables; GitHub workflows.
- **Scalability**: Multi‑contract isolation; indices for month/contract; storage path partitioning.
- **Observability**: Console error logging; minimal client metrics (later enhancement).
- **Dark Mode (Section 508 compliant)**: Provide a user‑controlled dark theme with colors suitable for low‑vision users; maintain contrast ratios ≥ 4.5:1 for text and ≥ 3:1 for large text/icons; preserve visible focus states; avoid color‑only cues; ensure toggle is operable via keyboard and screen readers.
- **Theme Toggle**: Light/Dark mode switch available to **all roles**; persists per user; accessible from the header.

---

## 13. Testing (Playwright – Local Only)
- **Auth smoke tests**: login, account request flow (admin approval simulated).
- **RLS checks (UI-level)**: Ensure users cannot access out‑of‑scope records.
- **Task assignment & visibility**: Lead assigns; assignees see tasks only if assigned.
- **Status submission**: Draft → Submit → visible in Lead Review Queue.
- **Lead review**: Approve/Reject updates; approved items appear in Report Queue.
- **PM/APM review**: Approve/Approve w/ changes/Reject; PDF export path recorded.
- **Regression**: Basic cross‑browser (Chromium, Firefox, WebKit).

---

## 14. Acceptance Criteria (High Level)
- **Multi‑contract support** with contract‑scoped data and role visibility.
- **PWS line items lifecycle**: create, update, retire; tasks linked to line items.
- **Task assignment** supports **multiple assignees**, including leads.
- **Status submission** recorded with **report_month** and **lead review workflow**.
- **PM/APM final review** and **PDF export** stored with retrievable path.
- **RLS policies** enforce access per role & contract.
- **Dashboards** reflect role‑appropriate data and filters function as described.
- **Playwright tests** cover the above flows and pass locally.

---

## 15. Open Questions & Assumptions
1. **User directory**: Will all users be provisioned via Supabase Auth email/password, or will SSO be needed in a later phase?
2. **PDF template**: Is there a mandated government/compliance template for the monthly report layout?
3. **Edits by Leads**: Should leads be allowed to modify submitter narratives prior to approval, or must they return with comments for resubmission?
4. **Report-month logic**: Lock date? (e.g., submissions for a month close on the 3rd business day of the following month.)
5. **Audit requirements**: Do we need immutable audit trails for approvals (separate append‑only log)?
6. **Data retention**: Retain submissions and PDFs for how long (e.g., 7 years)?
7. **Notifications**: Email/SMS later? If so, SMTP provider constraints?
8. **PII/Compliance**: Any specific DoN/contractor security requirements applicable to hosting or data location?

---

## 16. Deployment & Environments
- **Environments**: Dev → Preview → Prod (Vercel previews via PR branches).
- **Secrets**: Supabase URL/Key, storage bucket name, optional signing secrets in Vercel.
- **Migrations**: SQL migrations versioned in repo; seed data for roles.
- **Rollbacks**: Revert to prior Vercel deploy; DB rollbacks via migration scripts.

---

## 17. Version History
- **v2**: Baseline single‑contract view, roles, approvals, initial reporting concept (2025‑10‑12).
- **v3**: Adds **multi‑contract**, refined role visibility, **multi‑assignee tasks**, **PM/APM approvals with PDF export**, and Admin ownership of PWS lifecycle (2025‑10‑14).
