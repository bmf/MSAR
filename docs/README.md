# Documentation Directory

**Last Updated:** October 16, 2025  
**Project:** MSR Webform v1.0.0

## Overview

This directory contains all project documentation organized by purpose and audience. All markdown files have been organized into logical subdirectories for easy navigation.

## Directory Structure

```
docs/
├── README.md                          # This file
├── CHANGELOG.md                       # Version history and release notes
├── development/                       # Development planning documents
│   ├── Todo_v3_interleaved.md        # Master todo list with all phases
│   └── MSR_Webform_PRD_v3.md         # Product Requirements Document v3
├── runbooks/                          # Operational procedures by role
│   ├── Admin_Runbook.md              # Administrator procedures
│   ├── Reporting_Runbook.md          # PM/APM reporting procedures
│   └── Review_Queue_User_Guide.md    # Team Lead review guide
├── reference/                         # Technical reference documentation
│   ├── Data_Model_Reference.md       # Database schema and ERD
│   ├── Developer_Guide.md            # Developer technical guide
│   ├── Schema_Deprecation_Analysis.md # Deprecated schema analysis
│   └── 0012_storage_setup.md         # Storage setup reference
├── phase-summaries/                   # Phase completion summaries
│   ├── PHASE1_COMPLETE.md            # Phase 1: Supabase Setup
│   ├── PHASE5_COMPLETE.md            # Phase 5: Task Update Workflow
│   ├── PHASE6_COMPLETE.md            # Phase 6: Team Lead Review
│   ├── PHASE7_COMPLETE.md            # Phase 7: PM/APM Reporting
│   ├── PHASE8_COMPLETE.md            # Phase 8: Admin Panel
│   ├── PHASE10_COMPLETE.md           # Phase 10: DevOps & CI/CD
│   ├── PHASE12_COMPLETE.md           # Phase 12: Documentation
│   └── [other phase summaries]       # Additional phase documentation
├── testing/                           # Testing documentation
│   ├── Test_Database_Setup.md        # Test database configuration
│   ├── Test_Suite_Summary.md         # Test suite overview
│   └── setup_phase6_test_data.md     # Phase 6 test data setup
└── old/                               # Archived/deprecated documents
    ├── MSR_Webform_PRD_v2.md         # PRD version 2 (superseded)
    ├── Todo.md                        # Original todo (superseded)
    └── Todo_v3.md                     # Todo v3 (superseded)
```

---

## Quick Links by Audience

### For End Users

**Getting Started:**
- [Main README](../README.md) - Setup and quick start guide

**Operational Guides:**
- [Admin Runbook](runbooks/Admin_Runbook.md) - Account management, contracts, teams, roles
- [Reporting Runbook](runbooks/Reporting_Runbook.md) - Monthly reporting for PM/APM
- [Review Queue Guide](runbooks/Review_Queue_User_Guide.md) - Task review for Team Leads

---

### For Developers

**Essential Reading:**
- [Developer Guide](reference/Developer_Guide.md) - Code structure, testing, CI/CD
- [Data Model Reference](reference/Data_Model_Reference.md) - Database schema and relationships
- [PRD v3](development/MSR_Webform_PRD_v3.md) - Product requirements

**Development Planning:**
- [Todo List](development/Todo_v3_interleaved.md) - Master task list with all phases
- [CHANGELOG](CHANGELOG.md) - Version history

**Technical Reference:**
- [Schema Deprecation Analysis](reference/Schema_Deprecation_Analysis.md) - Deprecated tables/columns
- [Storage Setup](reference/0012_storage_setup.md) - Storage configuration reference

---

### For Project Managers

**Project Status:**
- [CHANGELOG](CHANGELOG.md) - Release notes and version history
- [Phase 12 Complete](phase-summaries/PHASE12_COMPLETE.md) - Final phase summary
- [Todo List](development/Todo_v3_interleaved.md) - All phases and completion status

**Requirements:**
- [PRD v3](development/MSR_Webform_PRD_v3.md) - Complete product requirements

**Phase Summaries:**
- [Phase Summaries Directory](phase-summaries/) - All phase completion documents

---

### For System Administrators

**Operational Procedures:**
- [Admin Runbook](runbooks/Admin_Runbook.md) - Complete admin procedures
- [Main README](../README.md) - Deployment and environment setup

**Technical Reference:**
- [Data Model Reference](reference/Data_Model_Reference.md) - Database schema
- [Developer Guide](reference/Developer_Guide.md) - Database migrations section

---

## Document Types

### Runbooks
**Purpose:** Step-by-step operational procedures  
**Audience:** Administrators, PM/APM, Team Leads  
**Location:** `docs/runbooks/`

- Account approval and management
- Role assignment procedures
- Monthly reporting workflows
- Review queue operations

### Reference Documentation
**Purpose:** Technical specifications and architecture  
**Audience:** Developers, Database Administrators  
**Location:** `docs/reference/`

- Database schema and ERD
- Code structure and architecture
- Testing strategies
- Deprecated schema documentation

### Development Documents
**Purpose:** Planning and requirements  
**Audience:** Developers, Project Managers  
**Location:** `docs/development/`

- Product requirements (PRD)
- Task lists and phase planning
- Development roadmap

### Phase Summaries
**Purpose:** Historical record of phase completions  
**Audience:** All stakeholders  
**Location:** `docs/phase-summaries/`

- Acceptance criteria verification
- Implementation details
- Known issues and resolutions
- Lessons learned

### Testing Documentation
**Purpose:** Test setup and execution guides  
**Audience:** Developers, QA Engineers  
**Location:** `docs/testing/`

- Test database configuration
- Test suite documentation
- Test data setup procedures

---

## Documentation Standards

All documentation in this project follows these standards:

### Format
- Markdown (.md) format
- Clear heading hierarchy (H1 → H2 → H3)
- Table of contents for documents >500 lines
- Code blocks with language syntax highlighting

### Structure
- Document metadata at top (version, date, author)
- Overview/summary section
- Logical section organization
- Cross-references to related docs

### Content
- Clear, concise language
- Step-by-step procedures where applicable
- Examples and code snippets
- Troubleshooting sections
- Acceptance criteria for tasks

### Maintenance
- Update version numbers when changed
- Update "Last Updated" dates
- Archive old versions to `docs/old/`
- Keep CHANGELOG current

---

## Version History

### v1.1.0 (October 16, 2025)
- Organized all markdown files into subdirectories
- Created this README for navigation
- Added Schema Deprecation Analysis
- Updated Data Model Reference with deprecated items

### v1.0.0 (October 16, 2025)
- Initial documentation suite complete
- All Phase 12 deliverables created
- README, runbooks, and reference docs published

---

## Contributing to Documentation

When adding or updating documentation:

1. **Choose the right directory:**
   - Operational procedures → `runbooks/`
   - Technical specs → `reference/`
   - Planning docs → `development/`
   - Phase summaries → `phase-summaries/`
   - Test docs → `testing/`

2. **Follow naming conventions:**
   - Use descriptive names (e.g., `Admin_Runbook.md`)
   - Use underscores for spaces
   - Use title case

3. **Update this README:**
   - Add new documents to directory structure
   - Update quick links if applicable
   - Update version history

4. **Archive old versions:**
   - Move superseded docs to `docs/old/`
   - Update references in other documents

---

## Support

For questions about documentation:
1. Check the appropriate runbook or guide
2. Review phase completion summaries
3. Consult the Developer Guide
4. Contact the development team

---

**Project:** MSR Webform  
**Version:** 1.0.0  
**Documentation Status:** Complete  
**Last Review:** October 16, 2025
