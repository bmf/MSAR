# Changelog

All notable changes to the MSR Webform project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-16

### Added

#### Phase 0: Project Bootstrap
- Initialized GitHub repository with Vercel hosting
- Created project structure with `/public`, `/src`, `/tests`, `/database` folders
- Configured Playwright for local end-to-end testing
- Added environment configuration with `.env.example`

#### Phase 1: Supabase Setup & Data Model
- Created Supabase project with email/password authentication
- Defined database schema with v3 multi-contract architecture
- Implemented Row Level Security (RLS) policies for role-based access
- Created SQL migrations for schema versioning
- Added contract-scoped core tables: `contracts`, `pws_line_items`, `teams`, `team_memberships`, `tasks`, `task_assignments`, `task_statuses`, `report_queue`, `monthly_reports`
- Implemented `user_contract_roles` table for contract-scoped permissions
- Created helper functions for RLS: `is_admin()`, `has_contract_role()`, `get_user_contracts()`, `is_team_lead()`, `get_user_led_teams()`

#### Phase 2: Frontend Foundation
- Built responsive base layout with Bootstrap 5
- Implemented hash-based client-side routing
- Created Supabase API utility module
- Added authentication state handling with session persistence

#### Phase 3: Login & Account Request
- Built login page with form validation
- Implemented account request modal for new users
- Added admin notification system for account requests
- Created Playwright tests for authentication flows

#### Phase 4: Dashboard
- Created role-based dashboard views (Admin, PM/APM, Team Lead, Member)
- Added task filtering by status and sorting by due date
- Implemented global cascading filters (Contract → Team → PWS Line Item → Task)
- Added "Create New Task Update" functionality
- Implemented role-based landing views with access control
- Created 19 Playwright tests for dashboard features

#### Phase 5: Task Update Workflow
- Built task update form with narrative, % complete, blockers, short status
- Implemented save draft and submit logic
- Added report-month handling with duplicate prevention
- Migrated from `updates` table to `task_statuses` table
- Implemented multi-assignee awareness with badge UI
- Added Team Lead dashboard with team task visibility
- Created 10 Playwright tests (100% pass rate)

#### Phase 6: Team Lead Review
- Created review queue view for pending submissions
- Built review detail panel with Approve, Reject, Modify actions
- Implemented approval logic with `approvals` table entries
- Added auto-queue feature for approved statuses to `report_queue`
- Implemented rejection validation requiring comments
- Created Playwright tests for review workflow

#### Phase 7: Report Approver & Export
- Created PM/APM approver view for finalized reports
- Implemented "Finalize & Export" workflow
- Added client-side PDF export with jsPDF
- Implemented PM/APM review states: Approve, Approve with Changes, Reject
- Added month/contract locking after PDF generation
- Created Playwright tests for export functionality

#### Phase 8: Admin Panel Extended CRUD
- **Contracts CRUD**: Create, edit, archive/activate contracts with unique codes
- **Teams CRUD**: Create teams per contract, manage memberships with lead/member roles
- **PWS Line Items Lifecycle**: Create, edit, retire/activate PWS line items with periodicity
- **Contract Roles**: Assign PM/APM/Lead/Member roles per contract via `user_contract_roles`
- Added 6 tabs to Admin Panel: Users, Account Requests, Contracts, Teams, PWS Line Items, Contract Roles
- Implemented contract-based filtering across all admin tabs
- Added session invalidation on role changes
- Created 28 comprehensive Playwright tests (86% pass rate)

#### Phase 10: DevOps & CI/CD
- Configured GitHub Actions workflow for Vercel deployment
- Implemented continuous deployment (main → production, PR → preview)
- Added security headers in `vercel.json`
- Documented database migration workflow
- Created deployment documentation

#### Phase 12: Documentation & Handover
- Updated README with comprehensive setup, run, and deployment instructions
- Created Admin Runbook with account approval and role management procedures
- Created Developer Guide with code structure, testing strategy, and CI/CD documentation
- Created Reporting Runbook for PM/APM monthly reporting procedures
- Created Data Model Reference with ERD and complete table documentation
- Generated CHANGELOG documenting all features and changes

### Features

- **Multi-Contract Support**: Manage multiple contracts with separate teams and PWS line items
- **Role-Based Access Control**: Admin, PM/APM, Team Lead, and Team Member roles with RLS enforcement
- **Task Management**: Create, assign, and track tasks with multi-assignee support
- **Approval Workflow**: Team Lead review → PM/APM approval → PDF export
- **Monthly Reporting**: Automated report queue and client-side PDF generation
- **Admin Panel**: Comprehensive CRUD for contracts, teams, PWS line items, and roles
- **Cascading Filters**: Contract → Team → PWS → Task filtering with localStorage persistence
- **Session Management**: Automatic session invalidation on role changes
- **Audit Trail**: Track submitters, reviewers, and approval timestamps

### Technical Stack

- **Frontend**: HTML5, Bootstrap 5.x, jQuery 3.x, jsPDF
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Hosting**: Vercel with GitHub Actions CI/CD
- **Testing**: Playwright (local only)
- **Database**: PostgreSQL with 18 migration files

### Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control enforced at database level
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- Session invalidation on role changes
- No secrets exposed in client-side code

### Testing

- 100+ Playwright end-to-end tests
- Test coverage across all major features
- Tests organized by phase and feature
- Local-only test execution (not in CI/CD)

### Documentation

- Comprehensive README with quick start guide
- Admin Runbook for system administrators
- Developer Guide for technical contributors
- Reporting Runbook for PM/APM users
- Data Model Reference with complete schema documentation
- Phase completion summaries for all phases

### Database Schema

- 12 core tables with full RLS policies
- 5 helper functions for permission checks
- 20+ indexes for performance optimization
- Unique constraints for data integrity
- Cascading deletes for referential integrity

### Known Issues

- None blocking production deployment
- Minor test locator specificity issues (non-blocking)
- Storage bucket not implemented (client-side PDF generation used instead)

### Migration Notes

- All migrations located in `database/migrations/`
- Apply migrations in numerical order
- Use `node database/apply-phase1-migrations.js` for initial setup
- Manual application via Supabase SQL Editor recommended for production

---

## [Unreleased]

### Planned Features (Future Versions)

- Email notifications for account approvals and status updates
- LLM-powered narrative generation assistance
- External SSO integration (SAML, OAuth)
- Advanced analytics dashboards
- Mobile-responsive improvements
- Bulk task assignment
- Report templates and customization
- Export to multiple formats (Word, Excel)
- Automated testing in CI/CD pipeline
- Performance monitoring and logging

---

## Version History

- **v1.0.0** (2025-10-16) - Initial production release
  - Complete multi-contract architecture
  - Full admin panel with CRUD operations
  - Team Lead review workflow
  - PM/APM reporting and PDF export
  - Automated CI/CD with Vercel
  - Comprehensive documentation

---

## Contributors

- Brandon Flade - Project Lead & Developer
- ChatGPT (GPT-5 Thinking) - Development Assistant

---

## License

ISC

---

## Support

For issues, questions, or contributions:
1. Check documentation in `docs/` folder
2. Review phase completion summaries
3. Contact development team
4. Submit issues on GitHub repository
