# MSR Webform

**Version:** 1.0.0  
**Status:** Production Ready

The Monthly Status Report (MSR) Webform application allows team members to submit task updates based on assigned PWS line items. These updates are reviewed and approved by team leads and project managers. The system aims to streamline data collection, review, and report generation for monthly project summaries.

## Features

- **Multi-Contract Support**: Manage multiple contracts with separate teams and PWS line items
- **Role-Based Access**: Admin, PM/APM, Team Lead, and Team Member roles with appropriate permissions
- **Task Management**: Create, assign, and track tasks with multi-assignee support
- **Approval Workflow**: Team Lead review → PM/APM approval → PDF export
- **Monthly Reporting**: Automated report queue and PDF generation
- **Admin Panel**: Comprehensive CRUD for contracts, teams, PWS line items, and roles

## Tech Stack

- **Frontend**: HTML5, Bootstrap 5.x, jQuery 3.x
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **Version Control**: Git / GitHub
- **Testing**: Playwright (local only)

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bmf/MSAR.git
   cd MSAR
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set up the database**
   
   Run migrations in order from `database/migrations/`:
   ```bash
   node database/apply-phase1-migrations.js
   ```
   
   Or manually apply each migration in the Supabase SQL Editor:
   - `0001_initial_schema.sql`
   - `0002_rls_policies.sql`
   - `0003_seed_data.sql`
   - ... (continue through all migrations)

5. **Start the development server**
   ```bash
   node server.js
   ```
   
   Open http://localhost:3000 in your browser.

### Default Test Accounts

After running seed data, you can log in with:

- **Admin**: `admin@example.com` / `password123`
- **PM**: `pm@example.com` / `password123`
- **Team Lead**: `lead@example.com` / `password123`
- **Member**: `member@example.com` / `password123`

## Running Tests

Playwright tests run locally only (not in CI/CD):

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/auth.spec.js

# Run with UI
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed
```

## Deployment

### Vercel Deployment

The application automatically deploys to Vercel via GitHub Actions:

1. **Push to main branch** → Production deployment
2. **Create pull request** → Preview deployment

### Required Vercel Environment Variables

Set in Vercel dashboard (Settings → Environment Variables):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

Apply to both **Production** and **Preview** environments.

### GitHub Secrets

Add to repository (Settings → Secrets and variables → Actions):

- `VERCEL_TOKEN` - Generate from Vercel dashboard

See [PHASE10_COMPLETE.md](PHASE10_COMPLETE.md) for detailed deployment instructions.

## Project Structure

```
MSAR/
├── .github/
│   └── workflows/
│       └── vercel-deploy.yml    # CI/CD workflow
├── database/
│   ├── migrations/              # SQL migration files
│   └── apply-phase1-migrations.js
├── docs/
│   ├── MSR_Webform_PRD_v3.md   # Product requirements
│   ├── Admin_Runbook.md         # Admin procedures
│   ├── Developer_Guide.md       # Developer documentation
│   ├── Reporting_Runbook.md     # PM/APM procedures
│   └── Data_Model_Reference.md  # Database schema
├── public/
│   ├── components/              # Reusable UI components
│   ├── pages/                   # Page templates
│   ├── src/
│   │   ├── app.js              # Main application logic
│   │   └── style.css           # Custom styles
│   └── index.html              # Entry point
├── tests/                       # Playwright test suites
├── .env.example                 # Environment template
├── package.json
├── playwright.config.js
├── server.js                    # Local dev server
└── vercel.json                  # Vercel configuration
```

## Documentation

**See [docs/README.md](docs/README.md) for complete documentation index.**

**Quick Links:**
- **[Admin Runbook](docs/runbooks/Admin_Runbook.md)** - Account approval, role management, contract setup
- **[Developer Guide](docs/reference/Developer_Guide.md)** - Code structure, testing, CI/CD
- **[Reporting Runbook](docs/runbooks/Reporting_Runbook.md)** - PM/APM monthly reporting procedures
- **[Data Model Reference](docs/reference/Data_Model_Reference.md)** - Database schema and relationships
- **[PRD v3](docs/development/MSR_Webform_PRD_v3.md)** - Complete product requirements
- **[CHANGELOG](docs/CHANGELOG.md)** - Version history and release notes

## Support

For issues or questions:
1. Check the documentation in the `docs/` folder (see [docs/README.md](docs/README.md))
2. Review phase completion summaries in `docs/phase-summaries/`
3. Contact the development team

## License

ISC

## Version History

### v1.0.0 (October 2025)
- Initial production release
- Multi-contract support with v3 schema
- Complete admin panel with CRUD operations
- Team Lead review workflow
- PM/APM reporting and PDF export
- Automated CI/CD with Vercel
- Comprehensive Playwright test suite
