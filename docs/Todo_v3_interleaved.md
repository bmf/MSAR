
# MSR Webform — Developer Todo List

This Todo.md enumerates all active development tasks (Phases 0–12) for the MSR Webform web application.
Each task includes a checkbox and clear acceptance criteria.

---

## Phase 0 — Project Bootstrap

- [x] **0.1 Initialize Repository and Hosting**
  - *Acceptance Criteria:* GitHub repo created and connected to Vercel. `.gitignore` and base README present.

- [x] **0.2 Set Up Project Structure**
  - *Acceptance Criteria:* Folder structure with `/public`, `/src`, `/tests`, `/assets`. HTML/Bootstrap/jQuery files scaffolded.

- [x] **0.3 Configure Playwright for Local Testing**
  - *Acceptance Criteria:* Playwright installed and local test script (`npm run test`) executes successfully with sample test.

- [x] **0.4 Environment Configuration**
  - *Acceptance Criteria:* `.env.example` file created; contains placeholders for `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

---

## Phase 1 — Supabase Setup & Data Model

- [x] **1.1 Create Supabase Project**
  - *Acceptance Criteria:* Project visible in Supabase dashboard with email/password auth enabled.

- [x] **1.2 Define Database Schema**
  - *Acceptance Criteria:* Tables created: `profiles`, `pws_tasks`, `updates`, `approvals`, `account_requests`.

- [x] **1.3 Configure RLS Policies**
  - *Acceptance Criteria:* RLS enabled; access restricted based on user role. Member, Lead, and Admin behaviors verified via test queries.

- [x] **1.4 Create SQL Migration and Seed Data**
  - *Acceptance Criteria:* SQL scripts saved under `/database/migrations`. Local dev data populates successfully.

---

- [x] **1.5 Create Contract-Scoped Core Tables**
  - *Acceptance Criteria:* SQL migrations create tables: `contracts`, `pws_line_items`, `teams`, `team_memberships`, `tasks`, `task_assignments`, `task_statuses`, `report_queue`, `monthly_reports`. All FKs, PKs, and indexes applied as in PRD v3.

- [x] **1.6 Add Helper Role Map**
  - *Acceptance Criteria:* Table `user_contract_roles(user_id, contract_id, role)` created with unique constraint `(user_id, contract_id, role)`; seed data includes at least one Admin, one PM/APM, one Lead, and one Member.

- [x] **1.7 RLS by Contract and Role**
  - *Acceptance Criteria:* RLS policies enforce: Admin unrestricted; PM/APM read all for assigned contract(s) and write to `monthly_reports`; Leads read/write tasks & statuses for teams they lead; Members read assigned tasks and write their own `task_statuses` only.

- [ ] **1.8 Storage Bucket for Reports** *(Not required - reports will be downloaded directly from application)*
  - *Acceptance Criteria:* ~~Supabase Storage bucket (e.g., `reports`) created with folder structure `reports/{CONTRACT_CODE}/{YYYY-MM}/report.pdf`. Public access disabled; signed URL retrieval works in dev.~~ Reports will be generated and downloaded client-side without storage.

## Phase 2 — Frontend Foundation

- [x] **2.1 Build Base Layout**
  - *Acceptance Criteria:* Header, footer, and nav created; responsive on mobile and desktop using Bootstrap grid.

- [x] **2.2 Implement Routing System**
  - *Acceptance Criteria:* Hash-based client router toggles between pages without full reload.

- [x] **2.3 Create API Utility Module**
  - *Acceptance Criteria:* Supabase client wrapper built; supports query, insert, update, and delete.

- [x] **2.4 Implement Auth State Handling**
  - *Acceptance Criteria:* Logged-in state persisted; unauthenticated users redirected to login.

---

## Phase 3 — Login & Account Request

- [x] **3.1 Build Login Page**
  - *Acceptance Criteria:* Login form validates inputs and displays proper error messaging for invalid credentials.

- [x] **3.2 Implement Account Request Modal**
  - *Acceptance Criteria:* Request form captures name, email, and reason; record stored in `account_requests` table.

- [x] **3.3 Add Admin Notification Placeholder**
  - *Acceptance Criteria:* Console log or placeholder UI confirms request submission (no backend email required).

- [x] **3.4 Write Playwright Tests for Login Flow**
  - *Acceptance Criteria:* All tests (valid login, invalid login, account request submission) pass locally.

---

## Phase 4 — Dashboard

- [x] **4.1 Create Dashboard View**
  - *Acceptance Criteria:* Displays assigned tasks for the logged-in user; matches PRD-specified columns.

- [x] **4.2 Add Filtering and Sorting**
  - *Acceptance Criteria:* Users can filter by status and sort by due date; filter states persist through navigation.

- [x] **4.3 Add “Create New Task Update” Button**
  - *Acceptance Criteria:* Opens modal or form for task update; accessible only to authenticated users.

- [x] **4.4 Write Dashboard Tests**
  - *Acceptance Criteria:* Playwright verifies visibility of data, filtering, and modal open behavior.

---

- [x] **4.5 Add Global Filters (Contract → Team → PWS Line Item → Task)** *(PENDING USER APPROVAL)*
  - *Acceptance Criteria:* Filter bar present on dashboard; changing Contract filters Team/PWS/Task options. Selections persist during navigation.
  - *Status:* ✅ Complete - Implemented cascading filters with localStorage persistence. Updated to use v3 schema.

- [x] **4.6 Role-Based Landing Views** *(PENDING USER APPROVAL)*
  - *Acceptance Criteria:* On login, users route to: Admin Panel; PM/APM Reporting; Team Lead Dashboard; or My Tasks (Member). Manual route guard prevents access to restricted views.
  - *Status:* ✅ Complete - Implemented role-based routing with access control. 19 Playwright tests created.

## Phase 5 — Task Update Workflow

- [x] **5.1 Build Update Form**
  - *Acceptance Criteria:* Form includes Narrative, % Complete, Blockers, Short Status; input validation implemented.

- [x] **5.2 Implement Save Draft and Submit Logic**
  - *Acceptance Criteria:* Drafts saved locally or to `updates` table with status "draft"; submission requires mandatory fields.

- [x] **5.3 Link Updates to PWS Tasks**
  - *Acceptance Criteria:* Submitted update references correct task and user in database.

- [x] **5.4 Write Update Workflow Tests**
  - *Acceptance Criteria:* Playwright confirms save/submit flow and validation errors display correctly.

---

- [ ] **5.5 Report-Month Handling**
  - *Acceptance Criteria:* When submitting status, system derives `report_month` (first day of current month). Prevent duplicate submissions by same user for same task and month unless prior is Draft or Rejected.

- [ ] **5.6 Multi-Assignee Awareness**
  - *Acceptance Criteria:* Task detail displays all assignees; submitter identity recorded in `task_statuses.submitted_by`. UI indicates if lead is also an assignee.

## Phase 6 — Team Lead Review

- [x] **6.1 Create Review Queue View**
  - *Acceptance Criteria:* Shows list of pending submissions filtered by team lead's team.

- [x] **6.2 Build Review Detail Panel**
  - *Acceptance Criteria:* Displays submission details and allows Approve, Reject, or Modify actions.

- [x] **6.3 Update Approval Logic**
  - *Acceptance Criteria:* Approved or rejected updates create entries in `approvals` table; UI reflects state change.

- [x] **6.4 Write Review Tests**
  - *Acceptance Criteria:* Playwright verifies permission checks, approve/reject actions, and UI refresh behavior.

---

- [ ] **6.5 Auto-Queue Approved Statuses**
  - *Acceptance Criteria:* On Approve, a row is added to `report_queue` for (contract_id, report_month, task_status_id). Unique constraint prevents duplicates; rejection requires comment.

- [ ] **6.6 Edit Policy Toggle (Optional)**
  - *Acceptance Criteria:* Feature flag controls whether leads can edit narratives prior to approval. If disabled, only Approve/Reject with comment allowed.

## Phase 7 — Report Approver & Export

- [ ] **7.1 Create Approver View**
  - *Acceptance Criteria:* Displays list of items approved by team leads awaiting finalization.

- [ ] **7.2 Implement “Finalize & Export” Workflow**
  - *Acceptance Criteria:* Aggregates approved updates into printable HTML; includes report date and section headers.

- [ ] **7.3 Add PDF Export Option**
  - *Acceptance Criteria:* Users can export report to PDF; result matches on-screen data.

- [ ] **7.4 Write Export Tests**
  - *Acceptance Criteria:* Playwright verifies report accuracy and successful PDF download initiation.

---

- [ ] **7.5 PM/APM Review States**
  - *Acceptance Criteria:* Approver view supports **Approve**, **Approve with Changes**, and **Reject** with required comments for rejection. State saved to `monthly_reports.pm_review_status` and audit fields.

- [ ] **7.6 Generate and Store PDF**
  - *Acceptance Criteria:* Finalized report renders grouped by PWS line item with task narratives, % complete, blockers. PDF saved to Supabase Storage; `pdf_storage_path` updated; download link uses signed URL.

- [ ] **7.7 Month/Contract Locking**
  - *Acceptance Criteria:* After PDF generation, subsequent edits for that month require PM/APM to “Re-open” report; UI indicates lock state.

## Phase 8 — Admin: User & Role Management

- [x] **8.1 Create Admin Panel**
  - *Acceptance Criteria:* Displays users with columns: Username, Role, Team, Created At.
  - *Status:* ✅ Complete - Admin panel with tabbed interface (Users & Account Requests)

- [x] **8.2 Approve Account Requests**
  - *Acceptance Criteria:* Admin can approve pending account requests; new users created in Supabase Auth and `profiles`.
  - *Status:* ✅ Complete - Approve/Reject functionality with user creation

- [x] **8.3 Manage Roles**
  - *Acceptance Criteria:* Admin can update role assignments; permissions take effect immediately.
  - *Status:* ✅ Complete - Edit role modal with team assignment

- [x] **8.4 Write Admin Tests**
  - *Acceptance Criteria:* Playwright validates only Admins can access; role changes apply immediately.
  - *Status:* ✅ Complete - 14 tests covering access control, user management, account requests, and workflows

- [x] **8.5 Disable/Enable Users**
  - *Acceptance Criteria:* Admin can disable/enable users; disabled users shown with visual indicator.
  - *Status:* ✅ Complete - Toggle button with disabled badge and gray row styling

- [x] **8.6 Delete Users**
  - *Acceptance Criteria:* Admin can delete user profiles with double confirmation.
  - *Status:* ✅ Complete - Delete button with profile removal (note: auth user must be deleted manually from dashboard)

---

- [ ] **8.7 Contracts CRUD**
  - *Acceptance Criteria:* Admin can create, update, archive contracts; `code` is unique; filtering by contract available globally.

- [ ] **8.8 Teams CRUD & Memberships**
  - *Acceptance Criteria:* Admin can create teams per contract and assign users as **lead** or **member**; uniqueness and role constraints enforced.

- [ ] **8.9 PWS Line Items Lifecycle**
  - *Acceptance Criteria:* Admin can create/update/retire PWS line items with `code`, `title`, `description`, `periodicity`. Retired items cannot receive new tasks; existing tasks stay visible with badge.

- [ ] **8.10 Roles per Contract**
  - *Acceptance Criteria:* Admin can assign PM/APM/Lead/Member roles per contract via `user_contract_roles`. Changes reflect immediately in RLS-scoped views.

## Phase 9 — Non-Functional Requirements

- [ ] **9.1 Security Validation**
  - *Acceptance Criteria:* All Supabase queries follow RLS; secrets not exposed in client-side code.

- [ ] **9.2 Performance Check**
  - *Acceptance Criteria:* Dashboard and forms load under 2 seconds on broadband.

- [ ] **9.3 Accessibility Verification**
  - *Acceptance Criteria:* Elements include `aria` labels, focus states, and color contrast meet WCAG 2.1 AA.

- [ ] **9.4 Cross-Browser Compatibility**
  - *Acceptance Criteria:* App functions correctly on Chrome, Edge, and Firefox latest.

---

- [ ] **9.5 Security & Audit Enhancements**
  - *Acceptance Criteria:* All create/update/delete endpoints write `created_by/updated_by` (where feasible). Admin actions surfaced in an audit log table or console for v3.

## Phase 10 — DevOps & CI/CD

- [ ] **10.1 Configure Environment Variables on Vercel**
  - *Acceptance Criteria:* `SUPABASE_URL` and `SUPABASE_ANON_KEY` set for both preview and production.

- [ ] **10.2 Implement Continuous Deployment**
  - *Acceptance Criteria:* PR merges trigger preview deployments; main branch deploys to production automatically.

- [ ] **10.3 Add CI Test Workflow**
  - *Acceptance Criteria:* GitHub Actions runs Playwright tests and lint checks on PR creation.

---

- [ ] **10.4 Database Migration Workflow**
  - *Acceptance Criteria:* New SQL migrations for v3 tables/policies added; `npm run db:migrate` documented and tested on a fresh database instance.

- [ ] **10.5 Secrets & Storage Config on Vercel**
  - *Acceptance Criteria:* Vercel envs include storage bucket name and a toggle for signed URLs. Preview/Prod parity documented.

## Phase 11 — QA: Playwright Test Suites

- [ ] **11.1 Auth Suite**
  - *Acceptance Criteria:* Validates login, invalid login, and logout flow.

- [ ] **11.2 Dashboard Suite**
  - *Acceptance Criteria:* Ensures task visibility, filtering, and sorting are correct per role.

- [ ] **11.3 Update Workflow Suite**
  - *Acceptance Criteria:* Confirms draft and submission flows execute without errors.

- [ ] **11.4 Review & Approval Suite**
  - *Acceptance Criteria:* Approve/reject/modify actions succeed; DB state matches UI.

- [ ] **11.5 Admin Suite**
  - *Acceptance Criteria:* Verifies access control and role update behaviors.

---

- [ ] **11.6 RLS Contract Isolation Suite**
  - *Acceptance Criteria:* Tests verify users cannot access data outside assigned contracts across dashboards and API calls.

- [ ] **11.7 Multi-Assignee Task Suite**
  - *Acceptance Criteria:* Tests cover visibility for all assignees, unique submission constraints, and lead-as-assignee edge cases.

- [ ] **11.8 Lead → Queue → PM/APM Flow Suite**
  - *Acceptance Criteria:* Approvals push to `report_queue`; PM/APM finalize; PDF path recorded; lock state respected.

## Phase 12 — Documentation & Handover

- [ ] **12.1 Update README**
  - *Acceptance Criteria:* Includes setup, run, and deployment instructions.

- [ ] **12.2 Create Admin Runbook**
  - *Acceptance Criteria:* Describes account approval and role management steps.

- [ ] **12.3 Add Developer Guide**
  - *Acceptance Criteria:* Details code structure, testing strategy, and CI/CD workflow.

- [ ] **12.4 Version and Tag Release**
  - *Acceptance Criteria:* v1.0.0 tag created; changelog documents final state.

---

**End of Active Scope**

- [ ] **12.5 Reporting Runbook**
  - *Acceptance Criteria:* PM/APM guide documents month selection, review states, PDF export, and re-open procedures.

- [ ] **12.6 Data Model Reference**
  - *Acceptance Criteria:* ERD and table reference added to docs folder reflecting PRD v3 schema.
