# Developer Guide

**Document:** Developer_Guide.md  
**Version:** 1.0.0  
**Last Updated:** October 2025

## Overview

This guide provides technical documentation for developers working on the MSR Webform application. It covers code structure, architecture patterns, testing strategies, and CI/CD workflows.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Code Structure](#code-structure)
3. [Development Workflow](#development-workflow)
4. [Testing Strategy](#testing-strategy)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Database Management](#database-management)
7. [Common Development Tasks](#common-development-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Technology Stack

**Frontend:**
- HTML5 with semantic markup
- Bootstrap 5.x for responsive UI
- jQuery 3.x for DOM manipulation and AJAX
- jsPDF for client-side PDF generation

**Backend:**
- Supabase PostgreSQL for data storage
- Supabase Auth for authentication
- Row Level Security (RLS) for authorization
- Supabase Storage for file storage (optional)

**Hosting & Deployment:**
- Vercel for static hosting
- GitHub Actions for CI/CD
- GitHub for version control

**Testing:**
- Playwright for end-to-end testing (local only)

### Application Architecture

**Single Page Application (SPA):**
- Hash-based client-side routing
- Dynamic content loading via jQuery
- No server-side rendering
- All business logic in `public/src/app.js`

**Authentication Flow:**
```
User Login → Supabase Auth → Session Token → RLS Policies → Data Access
```

**Data Flow:**
```
UI Event → jQuery Handler → Supabase Client → PostgreSQL + RLS → Response → UI Update
```

---

## Code Structure

### Directory Layout

```
MSAR/
├── .github/
│   └── workflows/
│       └── vercel-deploy.yml      # CI/CD workflow
├── database/
│   ├── migrations/                # SQL migration files (numbered)
│   └── apply-phase1-migrations.js # Migration runner script
├── docs/                          # Documentation
├── public/                        # Static assets (served by Vercel)
│   ├── components/                # Reusable UI components
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── nav.html
│   │   └── request-account-modal.html
│   ├── pages/                     # Page templates
│   │   ├── login.html
│   │   └── dashboard.html
│   ├── src/
│   │   ├── app.js                # Main application logic (~5000 lines)
│   │   ├── api.js                # Empty (logic in app.js)
│   │   ├── router.js             # Empty (logic in app.js)
│   │   └── style.css             # Custom styles
│   └── index.html                # Entry point
├── tests/                         # Playwright test suites
│   ├── auth.spec.js
│   ├── dashboard.spec.js
│   ├── admin.spec.js
│   ├── phase4.spec.js
│   ├── phase5.spec.js
│   ├── phase8.spec.js
│   ├── reporting.spec.js
│   └── review.spec.js
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment template
├── package.json                   # Dependencies and scripts
├── playwright.config.js           # Playwright configuration
├── server.js                      # Local dev server (Node.js)
└── vercel.json                    # Vercel deployment config
```

### Key Files

#### `public/index.html`
- Entry point for the application
- Loads Bootstrap, jQuery, Supabase client, jsPDF
- Single `<div id="app"></div>` container
- All content dynamically loaded

#### `public/src/app.js`
- **~5000 lines** - All application logic
- Supabase client initialization
- Authentication state management
- Client-side routing
- All page rendering functions
- All event handlers
- All API calls to Supabase

**Major Sections:**
```javascript
// 1. Supabase Client Initialization
const supabaseUrl = 'https://...';
const supabaseKey = '...';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Authentication State
let currentUser = null;
let userRole = null;
let userContracts = [];

// 3. Router
function navigate(page) { ... }
window.addEventListener('hashchange', handleRoute);

// 4. Page Render Functions
function renderLoginPage() { ... }
function renderDashboard() { ... }
function renderAdminPanel() { ... }
function renderReviewQueue() { ... }
function renderReporting() { ... }

// 5. Data Fetch Functions
async function fetchUserProfile() { ... }
async function fetchTasks() { ... }
async function fetchContracts() { ... }
// ... etc

// 6. Event Handlers
$(document).on('click', '#login-btn', handleLogin);
$(document).on('click', '#create-task-btn', handleCreateTask);
// ... etc

// 7. Utility Functions
function formatDate(date) { ... }
function showToast(message, type) { ... }
// ... etc
```

#### `server.js`
- Simple Node.js static file server
- Used for local development only
- Serves files from `public/` directory
- Runs on port 3000

#### `vercel.json`
- Vercel deployment configuration
- Serves static files from `public/`
- SPA routing (all routes → index.html)
- Security headers

---

## Development Workflow

### Setting Up Development Environment

1. **Clone and Install:**
   ```bash
   git clone https://github.com/bmf/MSAR.git
   cd MSAR
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Set Up Database:**
   ```bash
   # Apply migrations in order
   node database/apply-phase1-migrations.js
   ```

4. **Start Dev Server:**
   ```bash
   node server.js
   # Open http://localhost:3000
   ```

### Branch Strategy

**Main Branch:**
- Production-ready code only
- Protected branch (requires PR)
- Auto-deploys to Vercel production

**Feature Branches:**
- Create from main: `git checkout -b feature/description`
- Naming convention: `feature/`, `bugfix/`, `hotfix/`
- Create PR when ready for review
- Auto-deploys to Vercel preview

**Development Process:**
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and test locally
npm test

# 3. Commit changes
git add .
git commit -m "Add new feature"

# 4. Push to GitHub
git push origin feature/new-feature

# 5. Create Pull Request on GitHub
# 6. Review preview deployment
# 7. Merge to main after approval
```

### Code Style Guidelines

**JavaScript:**
- Use `async/await` for asynchronous operations
- Use jQuery for DOM manipulation
- Use template literals for HTML strings
- Comment complex logic
- Keep functions focused and small

**HTML:**
- Use Bootstrap classes for styling
- Use semantic HTML5 elements
- Include ARIA labels for accessibility
- Keep inline styles minimal

**CSS:**
- Use Bootstrap utilities first
- Custom styles in `style.css`
- Use CSS variables for theming
- Mobile-first responsive design

---

## Testing Strategy

### Test Framework

**Playwright** is used for end-to-end testing. Tests run **locally only**, not in CI/CD.

### Test Organization

Tests are organized by feature/phase:

- `auth.spec.js` - Authentication flows
- `dashboard.spec.js` - Dashboard functionality
- `admin.spec.js` - Admin panel CRUD operations
- `phase4.spec.js` - Phase 4 features (filters, role-based views)
- `phase5.spec.js` - Phase 5 features (task updates, status submission)
- `phase8.spec.js` - Phase 8 features (contracts, teams, PWS, roles)
- `reporting.spec.js` - Reporting workflow (PM/APM)
- `review.spec.js` - Review queue (Team Lead)

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/auth.spec.js

# Run with UI (interactive mode)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test tests/auth.spec.js --debug

# Generate test report
npx playwright show-report
```

### Writing Tests

**Test Structure:**
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate, login, etc.
    await page.goto('http://localhost:3000');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.fill('#input', 'value');
    
    // Act
    await page.click('#submit-btn');
    
    // Assert
    await expect(page.locator('#result')).toContainText('Expected');
  });
});
```

**Best Practices:**
- Use data-testid attributes for stable selectors
- Test user workflows, not implementation details
- Use fixtures for test data
- Clean up after tests (delete test data)
- Run tests against local dev server

### Test Data Management

**Seed Data:**
- Located in `database/migrations/0003_seed_data.sql`
- Creates default users, contracts, teams, tasks
- Use for local development and testing

**Test-Specific Data:**
- Some test files create their own data
- Clean up in `afterEach` hooks
- Use unique identifiers to avoid conflicts

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/vercel-deploy.yml`

**Triggers:**
- Push to `main` branch → Production deployment
- Pull request → Preview deployment

**Steps:**
1. Checkout code
2. Install Vercel CLI
3. Pull Vercel environment info
4. Build project artifacts
5. Deploy to Vercel

**No Test Execution:**
- Tests run locally only (per requirements)
- Faster deployment pipeline
- Developer responsibility to test before pushing

### Vercel Deployment

**Configuration:** `vercel.json`

**Features:**
- Static file serving from `public/`
- SPA routing (all routes → index.html)
- Security headers:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block

**Environment Variables:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- Set in Vercel dashboard for Production and Preview

**Deployment URLs:**
- Production: `https://msar.vercel.app` (or custom domain)
- Preview: `https://msar-{branch}-{hash}.vercel.app`

### Secrets Management

**GitHub Secrets:**
- `VERCEL_TOKEN` - Vercel API token for deployments

**Vercel Environment Variables:**
- `SUPABASE_URL` - Public, safe to expose
- `SUPABASE_ANON_KEY` - Public, safe to expose (RLS protects data)

**Never Commit:**
- `.env` file (gitignored)
- Service role keys
- Private API keys

---

## Database Management

### Schema Overview

**Core Tables:**
- `profiles` - User accounts
- `contracts` - Contract master data
- `teams` - Teams scoped to contracts
- `team_memberships` - User-team-role relationships
- `pws_line_items` - PWS line items scoped to contracts
- `tasks` - Tasks under PWS line items
- `task_assignments` - Task-user assignments (many-to-many)
- `task_statuses` - Task status submissions
- `report_queue` - Approved statuses for reporting
- `monthly_reports` - Finalized monthly reports

**Supporting Tables:**
- `account_requests` - Pending access requests
- `user_contract_roles` - Contract-scoped role assignments
- `task_status_history` - Audit trail for status changes

See [Data_Model_Reference.md](Data_Model_Reference.md) for complete schema.

### Migrations

**Location:** `database/migrations/`

**Naming Convention:** `XXXX_description.sql`
- `0001_initial_schema.sql`
- `0002_rls_policies.sql`
- `0003_seed_data.sql`
- ... etc

**Applying Migrations:**

**Option 1: Script (Recommended for initial setup)**
```bash
node database/apply-phase1-migrations.js
```

**Option 2: Manual (Recommended for new migrations)**
1. Open Supabase dashboard
2. Navigate to SQL Editor
3. Copy migration SQL
4. Execute
5. Verify results

**Creating New Migrations:**
1. Create new file: `XXXX_description.sql`
2. Write SQL (CREATE, ALTER, INSERT, etc.)
3. Test locally first
4. Apply to production via Supabase dashboard
5. Commit migration file to repository

### Row Level Security (RLS)

**All tables have RLS enabled.** Policies enforce role-based access:

**Admin:**
- Full access to all tables

**PM/APM:**
- Read all tasks for assigned contracts
- Write to `monthly_reports`
- Read `report_queue` for assigned contracts

**Team Lead:**
- Read/write tasks for teams they lead
- Read/write `task_statuses` for team tasks
- Write to `report_queue` (auto on approval)

**Team Member:**
- Read tasks assigned to them
- Write `task_statuses` for their tasks only

**Policy Examples:**
```sql
-- Team Member can read their assigned tasks
CREATE POLICY "Members can view assigned tasks"
ON tasks FOR SELECT
USING (
  id IN (
    SELECT task_id FROM task_assignments 
    WHERE user_id = auth.uid()
  )
);

-- Team Lead can approve statuses for their team
CREATE POLICY "Leads can update team task statuses"
ON task_statuses FOR UPDATE
USING (
  task_id IN (
    SELECT t.id FROM tasks t
    JOIN task_assignments ta ON t.id = ta.task_id
    JOIN team_memberships tm ON ta.user_id = tm.user_id
    WHERE tm.user_id = auth.uid() AND tm.role = 'lead'
  )
);
```

---

## Common Development Tasks

### Adding a New Page

1. **Create page template** (optional):
   ```html
   <!-- public/pages/newpage.html -->
   <div class="container">
     <h1>New Page</h1>
   </div>
   ```

2. **Add render function in app.js:**
   ```javascript
   function renderNewPage() {
     const html = `
       <div class="container">
         <h1>New Page</h1>
       </div>
     `;
     $('#app').html(html);
   }
   ```

3. **Add route to router:**
   ```javascript
   function handleRoute() {
     const page = window.location.hash.slice(1) || 'login';
     switch(page) {
       case 'newpage':
         renderNewPage();
         break;
       // ... other cases
     }
   }
   ```

4. **Add navigation link:**
   ```html
   <a href="#newpage" class="nav-link">New Page</a>
   ```

### Adding a New Database Table

1. **Create migration file:**
   ```sql
   -- database/migrations/XXXX_add_new_table.sql
   CREATE TABLE new_table (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Enable RLS
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   
   -- Add policies
   CREATE POLICY "Users can view new_table"
   ON new_table FOR SELECT
   USING (true);
   ```

2. **Apply migration** in Supabase dashboard

3. **Add fetch function in app.js:**
   ```javascript
   async function fetchNewTableData() {
     const { data, error } = await supabase
       .from('new_table')
       .select('*');
     
     if (error) {
       console.error('Error fetching data:', error);
       return [];
     }
     return data;
   }
   ```

4. **Add render function:**
   ```javascript
   function renderNewTableData(data) {
     const rows = data.map(item => `
       <tr>
         <td>${item.name}</td>
       </tr>
     `).join('');
     
     return `
       <table class="table">
         <thead><tr><th>Name</th></tr></thead>
         <tbody>${rows}</tbody>
       </table>
     `;
   }
   ```

### Adding a New Test

1. **Create test file:**
   ```javascript
   // tests/newfeature.spec.js
   const { test, expect } = require('@playwright/test');
   
   test.describe('New Feature', () => {
     test('should work correctly', async ({ page }) => {
       await page.goto('http://localhost:3000');
       // ... test steps
     });
   });
   ```

2. **Run test:**
   ```bash
   npx playwright test tests/newfeature.spec.js
   ```

3. **Debug if needed:**
   ```bash
   npx playwright test tests/newfeature.spec.js --debug
   ```

---

## Troubleshooting

### Common Issues

**1. Supabase Connection Errors**

**Symptoms:** Console errors about failed requests

**Solutions:**
- Check `.env` file has correct credentials
- Verify Supabase project is active
- Check RLS policies aren't blocking access
- Verify user is authenticated

**2. RLS Policy Blocking Data Access**

**Symptoms:** Empty data arrays, no errors

**Solutions:**
- Check user role in `profiles` table
- Verify RLS policies in Supabase dashboard
- Test policy with SQL Editor:
  ```sql
  SELECT * FROM tasks WHERE <policy_condition>;
  ```
- Check `user_contract_roles` for contract access

**3. Tests Failing**

**Symptoms:** Playwright tests timeout or fail assertions

**Solutions:**
- Ensure dev server is running (`node server.js`)
- Check test data exists in database
- Verify selectors are correct
- Run in headed mode to see what's happening:
  ```bash
  npx playwright test --headed
  ```

**4. Deployment Fails**

**Symptoms:** GitHub Actions workflow fails

**Solutions:**
- Check GitHub Actions logs
- Verify `VERCEL_TOKEN` secret is set
- Check Vercel dashboard for errors
- Ensure `vercel.json` is valid

**5. User Cannot See Data After Login**

**Symptoms:** Dashboard empty, no errors

**Solutions:**
- Check user has correct role in `profiles`
- Verify user is assigned to contract/team
- Check `user_contract_roles` table
- Verify RLS policies allow access

### Debugging Tools

**Browser DevTools:**
- Console: Check for JavaScript errors
- Network: Inspect Supabase API calls
- Application: Check localStorage for session

**Supabase Dashboard:**
- Table Editor: View/edit data directly
- SQL Editor: Run queries to test RLS
- Auth: Check user accounts and sessions
- Logs: View API request logs

**Playwright:**
- `--debug` flag: Step through tests
- `--ui` flag: Interactive test runner
- Screenshots: Capture on failure
- Video: Record test execution

---

## Performance Considerations

### Frontend Optimization

- Minimize DOM manipulation
- Use event delegation for dynamic content
- Cache Supabase queries when possible
- Lazy load large datasets

### Database Optimization

- Use indexes on foreign keys
- Limit query results with pagination
- Use `select('specific, columns')` not `select('*')`
- Avoid N+1 queries (use joins)

### Deployment Optimization

- Vercel serves static files from CDN
- Enable compression in Vercel
- Use Bootstrap CDN (already cached by users)
- Minimize custom CSS/JS

---

## Security Best Practices

### Authentication

- Never store passwords in code
- Use Supabase Auth for all authentication
- Validate user sessions on page load
- Implement session timeout

### Authorization

- Rely on RLS policies, not client-side checks
- Never trust client-side role checks
- Validate permissions on every request
- Use `auth.uid()` in RLS policies

### Data Protection

- Never expose service role key
- Use anon key for client-side (RLS protects data)
- Sanitize user input before display
- Use parameterized queries (Supabase does this)

### Secrets Management

- Never commit `.env` file
- Use environment variables for all secrets
- Rotate keys periodically
- Use different keys for dev/prod

---

## Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Bootstrap Docs**: https://getbootstrap.com/docs/5.3
- **jQuery Docs**: https://api.jquery.com
- **Playwright Docs**: https://playwright.dev
- **Vercel Docs**: https://vercel.com/docs

---

## Contributing

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New features have tests
- [ ] Documentation updated
- [ ] No console errors
- [ ] RLS policies secure
- [ ] Migrations tested
- [ ] Commit messages clear

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] Preview deployment verified

## Checklist
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No breaking changes
```

---

## Dark Mode (Phase 13)

### Overview

The application includes a Section 508 compliant dark mode implementation that meets WCAG 2.1 AA contrast requirements. Users can toggle between light and dark themes, with their preference persisted across sessions.

### CSS Variables

All colors are defined using CSS custom properties (variables) in `/public/src/style.css`:

**Light Theme (Default):**
```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --text-primary: #212529;
    --text-secondary: #6c757d;
    --link-color: #0d6efd;
    --border-color: #dee2e6;
    /* ... additional variables */
}
```

**Dark Theme:**
```css
[data-theme="dark"] {
    --bg-primary: #1a1d23;
    --bg-secondary: #22252b;
    --text-primary: #e9ecef;
    --text-secondary: #adb5bd;
    --link-color: #6ea8fe;
    --border-color: #495057;
    /* ... additional variables */
}
```

### Theme Toggle API

**Functions (in app.js):**

```javascript
// Initialize theme on page load
initTheme()

// Apply a specific theme
applyTheme(theme) // theme: 'light' or 'dark'

// Toggle between themes
toggleTheme()
```

**Usage Example:**
```javascript
// Manually set theme
applyTheme('dark');

// Toggle current theme
toggleTheme();

// Get current theme
const currentTheme = document.body.getAttribute('data-theme');
```

### Adding New Components

When adding new UI components, ensure they use CSS variables:

```css
.my-new-component {
    background-color: var(--surface);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.my-new-component:hover {
    background-color: var(--surface-hover);
}

.my-new-component:focus {
    outline: var(--focus-outline);
    outline-offset: var(--focus-outline-offset);
}
```

### Contrast Requirements

All components must meet WCAG 2.1 AA standards:
- **Body text:** ≥4.5:1 contrast ratio
- **Large text (18pt+ or 14pt+ bold):** ≥3:1 contrast ratio
- **UI components:** ≥3:1 contrast ratio

Use the WebAIM Contrast Checker to verify: https://webaim.org/resources/contrastchecker/

### Accessibility Guidelines

1. **Focus Indicators:** All interactive elements must have visible focus outlines
2. **Non-Color Cues:** Don't rely solely on color to convey information
3. **ARIA Attributes:** Use appropriate ARIA labels and states
4. **Keyboard Navigation:** All functionality must be keyboard accessible

### Testing Dark Mode

**Manual Testing:**
1. Click theme toggle button
2. Verify theme switches correctly
3. Reload page and verify theme persists
4. Test keyboard navigation (Tab, Enter, Space)
5. Check all pages and components in both themes

**Automated Testing:**
```bash
# Run dark mode tests
npm test -- dark-mode.spec.js
```

**Contrast Verification:**
- Use Chrome DevTools Accessibility Inspector
- Check `docs/testing/Dark_Mode_Contrast_Report.md` for verified components

### Browser Compatibility

Dark mode is tested and supported on:
- Chrome (latest)
- Edge (latest)
- Firefox (latest)

See `docs/testing/Dark_Mode_CrossBrowser.md` for detailed test results.

### Troubleshooting

**Theme not persisting:**
- Check localStorage is enabled
- Verify `localStorage.getItem('theme')` returns correct value
- Check browser console for errors

**Colors not changing:**
- Verify `data-theme` attribute on `<body>` element
- Check CSS variables are defined in style.css
- Ensure components use CSS variables, not hard-coded colors

**Focus outline not visible:**
- Check `--focus-outline` variable is defined
- Verify `:focus-visible` styles are not overridden
- Test with keyboard navigation (Tab key)

---

## Support

For questions or issues:
1. Check this guide and other documentation
2. Review phase completion summaries
3. Check Supabase/Vercel/Playwright docs
4. Contact the development team
