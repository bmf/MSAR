
# MSR Webform Program Requirements Document (PRD) v2

## 1. Overview
The Monthly Status Report (MSR) Webform application allows team members to submit task updates based on assigned PWS line items. These updates are reviewed and approved by team leads and project managers. The system aims to streamline data collection, review, and report generation for monthly project summaries.

## 2. Objectives
- Simplify task update submission for team members.
- Provide clear approval workflows for team leads.
- Enable structured data export for automated report generation.
- Ensure secure role-based access and data handling using Supabase.
- Utilize a modern, low-cost hosting and source control setup with Vercel and GitHub.

## 3. Scope
This PRD covers the development of a simple web-based form application using:
- HTML, Bootstrap 5.x, and jQuery 3.x for the front end.
- Supabase as the backend for data storage and authentication.
- Hosting provided by Vercel.
- Source control and version management through Git and GitHub.
- Playwright for local end-to-end testing and QA verification.

## 4. Technical Stack
| Layer | Technology |
|-------|-------------|
| Frontend | HTML5, Bootstrap 5.x, jQuery 3.x |
| Backend | Supabase (PostgreSQL + Auth) |
| Hosting | **Vercel** (Static Frontend + API Integration) |
| Version Control | **Git / GitHub** |
| Testing | **Playwright (Local E2E Testing)** |
| Browser Support | Latest Chrome, Edge, Firefox |

## 5. User Roles & Permissions
### Admin
- Create and manage user accounts.
- Assign team leads and team members.
- Approve new account requests.
- View system logs (optional future enhancement).

### Team Lead
- Assign PWS line items to team members.
- Review submitted task updates.
- Approve, reject, or modify updates.
- Provide comments during review.

### Team Member
- Submit status updates for assigned PWS tasks.
- View and edit drafts until submission.
- Track approval status of submitted reports.

### Report Approver / Project Manager
- Review and finalize approved team lead submissions.
- Trigger export to PDF or HTML summary.

## 6. Functional Requirements
### 6.1 Login & Account Request
- Login screen with email and password fields.
- “Request Account” link opens modal collecting:
  - Name, email, reason for access.
- Admins receive notifications for pending requests.

### 6.2 Dashboard (Post-Login)
- Users land on a personalized dashboard showing only their assigned tasks.
- Display columns:
  - Task Name  
  - Start Date  
  - Due Date  
  - Assigned To (auto-filled)  
  - PWS Line Item  
  - Status (% Complete, Narrative, Blockers) 
  - Short Status (In Progress, On Hold, Complete) 
- Option to create or edit draft updates.

### 6.3 Task Update Workflow
- Each update form includes:
  - Narrative Description
  - % Complete (Numeric Input)
  - Blockers (optional text field)
- Team leads can:
  - Approve
  - Reject (with comments)
  - Modify text and resubmit

### 6.4 Report Generation
- Approved updates feed into a structured dataset.
- Trigger LLM (future integration) to generate standardized narrative reports.
- Allow manual edits by Project Manager.
- Export options: PDF and HTML.

### 6.5 User Management
- Admin view listing:
  - Username, role, team, and last login time.
- Assign/revoke roles (Admin, Team Lead, Team Member, Report Approver).

### 6.6 Notifications (future integration)
- Supabase triggers or cron jobs send alerts for:
  - Pending approvals (future integration)
  - Task updates due within 3 days (future integration)
  - Rejected submissions requiring attention (future integration)

## 7. Non-Functional Requirements
- **Security:** Authentication handled via Supabase Auth; all API calls require secure tokens.
- **Performance:** Page load <2 seconds on broadband connection.
- **Accessibility:** WCAG 2.1 AA compliance where practical.
- **Maintainability:** Code modularized with clear separation of concerns (HTML, JS, CSS). Source control handled through Git and GitHub workflows.
- **Scalability:** Design should support future role or feature expansion (e.g., report automation).
- **Deployment:** Continuous deployment integrated via Vercel with GitHub commit triggers.

## 8. Deliverables
- Responsive webform (Bootstrap 5) integrated with Supabase.
- Functional login and registration workflow.
- Task assignment and approval modules.
- Admin panel for user management.
- Exportable PDF/HTML monthly report.
- GitHub repository with version control and CI/CD pipeline to Vercel.
- README and deployment guide.

## 9. Future Enhancements (Optional)
- LLM integration for narrative generation.
- Role-based dashboards with charts.
- Email digest summaries for leads and approvers.

---
**Document Version:** MSR_Webform_PRD_v2  
**Date:** 2025-10-12  
**Author:** Brandon Flade & ChatGPT (GPT-5)
