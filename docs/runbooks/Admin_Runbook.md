# Admin Runbook

**Document:** Admin_Runbook.md  
**Version:** 1.0.0  
**Last Updated:** October 2025

## Overview

This runbook provides step-by-step procedures for administrators to manage the MSR Webform application. Admins have full system access and are responsible for user management, contract setup, team configuration, and role assignments.

## Table of Contents

1. [Account Management](#account-management)
2. [Contract Management](#contract-management)
3. [Team Management](#team-management)
4. [PWS Line Item Management](#pws-line-item-management)
5. [Role Management](#role-management)
6. [Troubleshooting](#troubleshooting)

---

## Account Management

### Approving New Account Requests

When users request access to the system, they appear in the Admin Panel under the **Account Requests** tab.

**Steps:**

1. Log in as Admin
2. Navigate to **Admin Panel** (top navigation)
3. Click the **Account Requests** tab
4. Review pending requests showing:
   - Full Name
   - Email
   - Reason for access
   - Request date
5. For each request:
   - Click **Approve** to create the account
   - Click **Reject** to deny access
6. Upon approval:
   - User account is created in Supabase Auth
   - Profile is created with default "Member" role
   - User receives email with login credentials (if email configured)

**Default Password:** `password123` (users should change on first login)

### Managing Existing Users

**View Users:**
- Navigate to **Admin Panel** → **Users** tab
- View all users with columns: Username, Email, Role, Team, Created At

**Edit User Role:**
1. Click **Edit** button next to user
2. Select new role from dropdown:
   - Admin
   - PM (Project Manager)
   - APM (Assistant Project Manager)
   - Team Lead
   - Team Member
3. Optionally assign to a team
4. Click **Save**

**Disable/Enable User:**
1. Click **Disable** button next to active user
2. Confirm action
3. User cannot log in while disabled
4. Click **Enable** to restore access

**Delete User:**
1. Click **Delete** button next to user
2. Confirm action (requires double confirmation)
3. User profile is removed from database
4. **Note:** Auth user must be manually deleted from Supabase dashboard

---

## Contract Management

Contracts are the top-level organizational unit. Each contract has its own teams, PWS line items, and tasks.

### Creating a New Contract

**Steps:**

1. Navigate to **Admin Panel** → **Contracts** tab
2. Click **Create Contract** button
3. Fill in the form:
   - **Contract Code**: Unique identifier (e.g., "CONT-001")
   - **Contract Name**: Descriptive name (e.g., "Project Alpha")
4. Click **Save**

**Validation:**
- Contract code must be unique
- Both fields are required

### Editing a Contract

**Steps:**

1. Navigate to **Admin Panel** → **Contracts** tab
2. Click **Edit** button next to contract
3. Modify the **Contract Name** (code is immutable)
4. Click **Save**

### Archiving/Activating a Contract

**Archive:**
1. Click **Archive** button next to active contract
2. Confirm action
3. Contract is hidden from dropdowns but data is preserved

**Activate:**
1. Click **Activate** button next to archived contract
2. Contract becomes available in dropdowns again

**Status Badges:**
- 🟢 **Active** - Green badge
- 🔴 **Archived** - Red badge

---

## Team Management

Teams are scoped to contracts and consist of members with assigned roles.

### Creating a New Team

**Steps:**

1. Navigate to **Admin Panel** → **Teams** tab
2. Select contract from **Filter by Contract** dropdown
3. Click **Create Team** button
4. Fill in the form:
   - **Team Name**: Descriptive name (e.g., "Engineering Team")
   - **Contract**: Pre-selected from filter
5. Click **Save**

**Validation:**
- Team name must be unique within the contract
- Contract selection is required

### Managing Team Memberships

**Add Members:**

1. Navigate to **Admin Panel** → **Teams** tab
2. Click **Manage Members** button next to team
3. In the modal, click **Add Member**
4. Select:
   - **User**: From dropdown of all users
   - **Role**: Either "Lead" or "Member"
5. Click **Add**

**Remove Members:**

1. In the **Manage Members** modal
2. Click **Remove** button next to member
3. Confirm action

**Role Types:**
- **Lead**: Can review and approve task statuses for the team
- **Member**: Can submit task statuses for assigned tasks

**Constraints:**
- A user can only have one role per team
- A user can be a member of multiple teams across contracts

### Activating/Deactivating Teams

**Deactivate:**
1. Click **Deactivate** button next to active team
2. Team is hidden from task assignment dropdowns

**Activate:**
1. Click **Activate** button next to inactive team
2. Team becomes available for task assignments

---

## PWS Line Item Management

PWS (Performance Work Statement) Line Items define the work scope for a contract. Each line item can have multiple tasks.

### Creating a PWS Line Item

**Steps:**

1. Navigate to **Admin Panel** → **PWS Line Items** tab
2. Select contract from **Filter by Contract** dropdown
3. Click **Create PWS Line Item** button
4. Fill in the form:
   - **Code**: Unique identifier (e.g., "PWS-001")
   - **Title**: Short descriptive title
   - **Description**: Detailed description of work
   - **Periodicity**: How often status is reported
     - Daily
     - Weekly
     - Monthly
     - Quarterly
     - As-Needed
   - **Contract**: Pre-selected from filter
5. Click **Save**

**Validation:**
- Code must be unique within the contract
- All fields are required

### Editing a PWS Line Item

**Steps:**

1. Navigate to **Admin Panel** → **PWS Line Items** tab
2. Click **Edit** button next to line item
3. Modify any field except the code (immutable)
4. Click **Save**

### Retiring/Activating PWS Line Items

**Retire:**
1. Click **Retire** button next to active line item
2. Confirm action
3. Line item cannot receive new tasks
4. Existing tasks remain visible with "Retired" badge

**Activate:**
1. Click **Activate** button next to retired line item
2. Line item becomes available for new tasks

**Status Badges:**
- 🟢 **Active** - Green badge
- 🔴 **Retired** - Red badge

---

## Role Management

Contract roles define user permissions at the contract level, separate from team memberships.

### Assigning Contract Roles

**Steps:**

1. Navigate to **Admin Panel** → **Contract Roles** tab
2. Select contract from **Filter by Contract** dropdown
3. Click **Assign Role** button
4. Fill in the form:
   - **User**: Select from dropdown
   - **Contract**: Pre-selected from filter
   - **Role**: Select from:
     - Admin
     - PM (Project Manager)
     - APM (Assistant Project Manager)
     - Team Lead
     - Team Member
5. Click **Assign**

**Role Permissions:**

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, all CRUD operations |
| **PM/APM** | View all tasks for contract, approve monthly reports, export PDF |
| **Team Lead** | View team tasks, approve task statuses, assign tasks |
| **Team Member** | View assigned tasks, submit task statuses |

### Removing Contract Roles

**Steps:**

1. Navigate to **Admin Panel** → **Contract Roles** tab
2. Click **Remove** button next to role assignment
3. Confirm action (requires double confirmation)
4. User loses contract-level permissions immediately

**Session Invalidation:**
- When roles are changed, user sessions are invalidated
- Users must log out and log back in for changes to take effect

---

## Troubleshooting

### User Cannot Log In

**Possible Causes:**
1. Account is disabled
2. Incorrect credentials
3. Account not yet approved

**Resolution:**
1. Check **Admin Panel** → **Users** tab
2. Verify account status (enabled/disabled)
3. Check **Account Requests** tab for pending approvals
4. Reset password in Supabase dashboard if needed

### User Cannot See Expected Data

**Possible Causes:**
1. Incorrect role assignment
2. Not assigned to correct contract/team
3. RLS policies restricting access

**Resolution:**
1. Verify user's contract roles in **Contract Roles** tab
2. Check team memberships in **Teams** tab
3. Ensure contract is active (not archived)
4. Verify RLS policies in Supabase dashboard

### Contract/Team Not Appearing in Dropdowns

**Possible Causes:**
1. Contract is archived
2. Team is deactivated
3. Browser cache issue

**Resolution:**
1. Check contract status in **Contracts** tab
2. Check team status in **Teams** tab
3. Activate if needed
4. Refresh browser page

### Cannot Create New PWS Line Item

**Possible Causes:**
1. Duplicate code within contract
2. Missing required fields
3. Contract is archived

**Resolution:**
1. Use unique code for the contract
2. Fill in all required fields
3. Activate contract if archived

### Role Changes Not Taking Effect

**Possible Causes:**
1. User session not invalidated
2. Browser cache

**Resolution:**
1. User must log out and log back in
2. Clear browser cache if needed
3. Check session invalidation in Supabase dashboard

---

## Best Practices

### Account Management
- Review account requests promptly (within 24 hours)
- Verify user identity before approval
- Assign appropriate roles based on job function
- Regularly audit user accounts and disable inactive users

### Contract Setup
- Use consistent naming conventions for contract codes
- Document contract details thoroughly
- Archive completed contracts rather than deleting

### Team Organization
- Keep team sizes manageable (5-10 members)
- Assign at least one lead per team
- Review team memberships quarterly

### PWS Line Items
- Use clear, descriptive titles
- Set appropriate periodicity based on reporting needs
- Retire completed line items rather than deleting

### Role Assignment
- Follow principle of least privilege
- Document role assignments and reasons
- Review contract roles quarterly
- Remove roles promptly when users change positions

---

## Emergency Procedures

### System Administrator Locked Out

**Resolution:**
1. Access Supabase dashboard directly
2. Use SQL Editor to update user role:
   ```sql
   UPDATE profiles 
   SET role = 'Admin' 
   WHERE email = 'admin@example.com';
   ```
3. User must log out and log back in

### Mass User Deactivation Needed

**Resolution:**
1. Access Supabase dashboard
2. Use SQL Editor:
   ```sql
   UPDATE profiles 
   SET disabled = true 
   WHERE email LIKE '%@contractor.com';
   ```
3. Affected users cannot log in immediately

### Restore Archived Contract

**Resolution:**
1. Navigate to **Admin Panel** → **Contracts** tab
2. Click **Activate** button next to archived contract
3. All associated data becomes accessible again

---

## Support Contacts

For technical issues beyond this runbook:
- **Database Issues**: Contact Supabase support
- **Deployment Issues**: Check Vercel dashboard
- **Application Bugs**: Contact development team

---

## Appendix: Database Tables

### Key Tables Managed by Admin

- **profiles** - User accounts and roles
- **account_requests** - Pending access requests
- **contracts** - Contract master data
- **teams** - Teams scoped to contracts
- **team_memberships** - User-team-role relationships
- **pws_line_items** - PWS line items scoped to contracts
- **user_contract_roles** - Contract-scoped role assignments

See [Data_Model_Reference.md](Data_Model_Reference.md) for complete schema documentation.
