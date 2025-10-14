
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

## Phase 10 — DevOps & CI/CD

- [ ] **10.1 Configure Environment Variables on Vercel**
  - *Acceptance Criteria:* `SUPABASE_URL` and `SUPABASE_ANON_KEY` set for both preview and production.

- [ ] **10.2 Implement Continuous Deployment**
  - *Acceptance Criteria:* PR merges trigger preview deployments; main branch deploys to production automatically.

- [ ] **10.3 Add CI Test Workflow**
  - *Acceptance Criteria:* GitHub Actions runs Playwright tests and lint checks on PR creation.

---

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
