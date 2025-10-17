# Reporting Runbook

**Document:** Reporting_Runbook.md  
**Version:** 1.0.0  
**Last Updated:** October 2025  
**Audience:** Project Managers (PM) and Assistant Project Managers (APM)

## Overview

This runbook provides step-by-step procedures for Project Managers (PM) and Assistant Project Managers (APM) to review, approve, and export monthly status reports. The reporting workflow aggregates approved task statuses from Team Leads into a comprehensive monthly report that can be exported to PDF.

## Table of Contents

1. [Reporting Workflow Overview](#reporting-workflow-overview)
2. [Accessing the Reporting Dashboard](#accessing-the-reporting-dashboard)
3. [Reviewing the Report Queue](#reviewing-the-report-queue)
4. [Approving Reports](#approving-reports)
5. [Exporting to PDF](#exporting-to-pdf)
6. [Re-opening Reports](#re-opening-reports)
7. [Troubleshooting](#troubleshooting)

---

## Reporting Workflow Overview

### The Complete Flow

```
1. Team Members submit task statuses
   ↓
2. Team Leads review and approve statuses
   ↓
3. Approved statuses automatically added to Report Queue
   ↓
4. PM/APM reviews Report Queue for the month
   ↓
5. PM/APM approves, approves with changes, or rejects
   ↓
6. PM/APM exports approved report to PDF
   ↓
7. Report is locked for the month (can be re-opened if needed)
```

### Key Concepts

**Report Month:**
- Reports are organized by calendar month
- System uses the first day of the month as the identifier
- Example: October 2025 report = 2025-10-01

**Report Queue:**
- Staging area for approved task statuses
- Automatically populated when Team Leads approve statuses
- One entry per task per month

**Monthly Report:**
- Final approved report for a contract and month
- Contains all task narratives, % complete, and blockers
- Can be exported to PDF
- Locked after PDF generation (prevents edits)

**Review States:**
- **Pending** - Awaiting PM/APM review
- **Approved** - Ready for PDF export
- **Approved with Changes** - Approved but with PM/APM modifications
- **Rejected** - Sent back to Team Leads for revision

---

## Accessing the Reporting Dashboard

### Login and Navigation

1. **Log in** to the MSR Webform application
   - Use your PM/APM credentials
   - URL: https://msar.vercel.app (or your deployment URL)

2. **Navigate to Reporting**
   - After login, you're automatically directed to the Reporting dashboard
   - Or click **"Reporting"** in the top navigation

3. **Select Contract**
   - Use the **Contract** dropdown to filter by your assigned contract(s)
   - Only contracts you have PM/APM access to will appear

4. **Select Report Month**
   - Use the **Report Month** dropdown
   - Shows months with pending or completed reports
   - Format: "October 2025", "November 2025", etc.

### Dashboard Overview

The Reporting dashboard displays:

**Top Section:**
- Contract filter dropdown
- Report month selector
- Report status indicator
- Action buttons (Approve, Reject, Export PDF)

**Main Section:**
- List of all tasks in the report queue
- Grouped by PWS Line Item
- Shows for each task:
  - Task name
  - Assignee(s)
  - Narrative
  - % Complete
  - Blockers
  - Short Status
  - Submitted by
  - Approved by (Team Lead)

---

## Reviewing the Report Queue

### Understanding the Report Queue

The Report Queue contains all task statuses that have been:
1. Submitted by team members
2. Approved by Team Leads
3. Automatically queued for monthly reporting

### Review Process

**Step 1: Select Month and Contract**
1. Choose the contract from the dropdown
2. Select the report month
3. Click **"Load Report"** or **"View Queue"**

**Step 2: Review Task Statuses**

For each task in the queue, review:

**Narrative:**
- Is it clear and complete?
- Does it accurately describe work performed?
- Is it appropriate for external stakeholders?

**% Complete:**
- Does it align with the narrative?
- Is progress reasonable for the time period?

**Blockers:**
- Are blockers clearly identified?
- Are they actionable?
- Do they require escalation?

**Short Status:**
- On Track
- At Risk
- Blocked

**Step 3: Check for Completeness**

Verify:
- [ ] All expected tasks are present
- [ ] All PWS line items are covered
- [ ] No missing narratives
- [ ] All required fields populated
- [ ] Consistent formatting

**Step 4: Identify Issues**

Common issues to look for:
- Vague or incomplete narratives
- Unrealistic % complete values
- Missing blocker details
- Inconsistent status across related tasks
- Grammar or spelling errors

---

## Approving Reports

### Approval Options

You have three options when reviewing a report:

#### 1. Approve (No Changes)

Use when the report is complete and accurate as-is.

**Steps:**
1. Review all task statuses
2. Click **"Approve Report"** button
3. Confirm approval in the dialog
4. Report status changes to "Approved"
5. Report is ready for PDF export

**When to Use:**
- All narratives are clear and complete
- No edits needed
- Ready for external distribution

#### 2. Approve with Changes

Use when minor edits are needed but overall report is acceptable.

**Steps:**
1. Review all task statuses
2. Click **"Edit"** button next to any task that needs changes
3. Modify the narrative, % complete, or blockers
4. Click **"Save Changes"**
5. Repeat for all tasks needing edits
6. Click **"Approve with Changes"** button
7. Add comment explaining changes made
8. Confirm approval

**When to Use:**
- Minor wording improvements needed
- Clarification required
- Formatting adjustments
- Grammar/spelling corrections

**Best Practices:**
- Document all changes in the comment field
- Notify Team Leads of significant changes
- Maintain original meaning and intent

#### 3. Reject

Use when the report needs substantial revision.

**Steps:**
1. Review all task statuses
2. Click **"Reject Report"** button
3. **Required:** Add detailed comment explaining:
   - What needs to be revised
   - Why the report is being rejected
   - Specific tasks that need attention
4. Confirm rejection
5. Report returns to Team Leads for revision

**When to Use:**
- Multiple tasks have incomplete narratives
- Significant inaccuracies
- Missing critical information
- Inconsistent data

**Required Information in Rejection Comment:**
- Specific tasks that need revision
- What needs to be changed
- Deadline for resubmission
- Contact info for questions

**Example Rejection Comment:**
```
Tasks 3, 5, and 7 need more detailed narratives. 
Please include specific accomplishments and metrics.
Task 5 blocker needs more detail on the vendor delay.
Please resubmit by October 15th.
Contact me if you have questions.
```

---

## Exporting to PDF

### Prerequisites

Before exporting:
- [ ] Report must be in "Approved" or "Approved with Changes" status
- [ ] All task statuses reviewed
- [ ] Any necessary edits completed

### Export Process

**Step 1: Initiate Export**
1. Ensure report is approved
2. Click **"Export to PDF"** button
3. System generates PDF in browser

**Step 2: Review PDF Preview**

The PDF includes:
- **Header:**
  - Contract name and code
  - Report month
  - Generation date
  - PM/APM name
  
- **Body (grouped by PWS Line Item):**
  - PWS Line Item code and title
  - For each task:
    - Task name
    - Assignee(s)
    - Narrative
    - % Complete
    - Blockers (if any)
    - Status indicator

- **Footer:**
  - Page numbers
  - Report metadata

**Step 3: Download PDF**
1. PDF opens in new browser tab
2. Use browser's "Save" or "Download" function
3. Save with naming convention: `MSR_[CONTRACT]_[YYYY-MM].pdf`
   - Example: `MSR_CONT001_2025-10.pdf`

**Step 4: Distribute Report**
1. Save PDF to appropriate location (SharePoint, shared drive, etc.)
2. Distribute to stakeholders per your organization's process
3. Archive copy for records

### Post-Export Actions

**Automatic Lock:**
- After PDF generation, the report is **locked** for the month
- Team members cannot submit new statuses for that month
- Team Leads cannot approve new statuses for that month
- Prevents changes after report distribution

**If Changes Needed:**
- See [Re-opening Reports](#re-opening-reports) section

---

## Re-opening Reports

### When to Re-open

Re-open a report when:
- Errors discovered after PDF generation
- New information becomes available
- Stakeholder requests revisions
- Compliance requirements change

### Re-open Process

**Step 1: Access Locked Report**
1. Navigate to Reporting dashboard
2. Select contract and month
3. Locked reports show **"Locked"** badge

**Step 2: Re-open Report**
1. Click **"Re-open Report"** button
2. **Required:** Add comment explaining reason for re-opening
3. Confirm action

**Example Re-open Comment:**
```
Re-opening to correct Task 5 narrative per stakeholder feedback.
Vendor name was incorrect. Will regenerate PDF after correction.
```

**Step 3: Make Corrections**
1. Report returns to "Pending" status
2. Team Leads can now submit/approve new statuses
3. PM/APM can edit existing statuses
4. Make necessary corrections

**Step 4: Re-approve and Re-export**
1. Review corrections
2. Approve report again
3. Export new PDF
4. Report is locked again

### Re-open Best Practices

- Document reason for re-opening
- Notify Team Leads of re-opening
- Track version numbers if multiple PDFs generated
- Update stakeholders with revised report
- Maintain audit trail of changes

---

## Troubleshooting

### Common Issues

#### Issue: Report Queue is Empty

**Possible Causes:**
- No task statuses approved by Team Leads yet
- Wrong month selected
- Wrong contract selected
- RLS policies blocking access

**Solutions:**
1. Verify correct month and contract selected
2. Check with Team Leads on approval status
3. Verify you have PM/APM role for the contract
4. Check `report_queue` table in Supabase dashboard

#### Issue: Cannot Approve Report

**Possible Causes:**
- Report already approved
- Missing required fields
- Insufficient permissions

**Solutions:**
1. Check report status (may already be approved)
2. Verify all tasks have complete data
3. Confirm PM/APM role assignment
4. Check browser console for errors

#### Issue: PDF Export Fails

**Possible Causes:**
- Browser popup blocker
- Large report size
- JavaScript error

**Solutions:**
1. Allow popups for the site
2. Try different browser (Chrome recommended)
3. Check browser console for errors
4. Try exporting smaller date range

#### Issue: Cannot Re-open Locked Report

**Possible Causes:**
- Insufficient permissions
- Report not actually locked
- Database error

**Solutions:**
1. Verify PM/APM role for contract
2. Check report status in database
3. Contact system administrator

#### Issue: Edited Changes Not Saving

**Possible Causes:**
- Network connectivity
- Session timeout
- RLS policy blocking update

**Solutions:**
1. Check internet connection
2. Log out and log back in
3. Verify PM/APM permissions
4. Try refreshing page and re-editing

#### Issue: Missing Tasks in Report

**Possible Causes:**
- Tasks not approved by Team Lead
- Tasks for different month
- Contract filter incorrect

**Solutions:**
1. Verify tasks were approved by Team Lead
2. Check task submission dates
3. Confirm correct contract selected
4. Review `report_queue` table

---

## Best Practices

### Monthly Reporting Cycle

**Week 1 (Days 1-7):**
- Team members submit task statuses
- Monitor submission progress

**Week 2 (Days 8-14):**
- Team Leads review and approve statuses
- Follow up on pending approvals

**Week 3 (Days 15-21):**
- PM/APM reviews report queue
- Request revisions if needed
- Approve report

**Week 4 (Days 22-28):**
- Export final PDF
- Distribute to stakeholders
- Archive report

### Review Guidelines

**Quality Checks:**
- Narratives are clear and professional
- Progress is realistic and measurable
- Blockers are specific and actionable
- Consistent terminology across tasks

**Communication:**
- Provide timely feedback to Team Leads
- Be specific in rejection comments
- Acknowledge good work
- Escalate issues promptly

**Documentation:**
- Keep audit trail of all changes
- Document reasons for rejections
- Track version numbers for re-opened reports
- Maintain archive of all PDFs

### Efficiency Tips

**Use Filters:**
- Filter by contract to focus on your assignments
- Use month selector to quickly navigate

**Keyboard Shortcuts:**
- Tab through form fields
- Enter to submit
- Esc to close modals

**Batch Processing:**
- Review all tasks before making edits
- Make all edits before approving
- Export multiple months at once if needed

**Templates:**
- Create standard rejection comment templates
- Use consistent PDF naming conventions
- Maintain checklist for review process

---

## Reporting Metrics

### Key Performance Indicators

Track these metrics for reporting health:

**Timeliness:**
- % of reports approved by target date
- Average days from submission to approval
- Number of reports requiring re-opening

**Quality:**
- % of reports approved without changes
- Number of rejections per month
- Average revision cycles per report

**Completeness:**
- % of tasks with complete narratives
- % of tasks with blockers identified
- % of PWS line items covered

### Monthly Reporting Checklist

Use this checklist for each monthly report:

**Pre-Review:**
- [ ] All Team Leads have approved their tasks
- [ ] Correct contract selected
- [ ] Correct month selected
- [ ] All expected tasks present

**Review:**
- [ ] All narratives reviewed for clarity
- [ ] All % complete values reasonable
- [ ] All blockers documented
- [ ] Consistent formatting
- [ ] No grammar/spelling errors

**Approval:**
- [ ] All edits completed
- [ ] Comments added if changes made
- [ ] Approval confirmed
- [ ] Team Leads notified

**Export:**
- [ ] PDF generated successfully
- [ ] PDF reviewed for accuracy
- [ ] PDF saved with correct naming
- [ ] PDF distributed to stakeholders
- [ ] PDF archived

**Post-Export:**
- [ ] Report locked
- [ ] Stakeholders notified
- [ ] Archive updated
- [ ] Metrics recorded

---

## Appendix: Report Formats

### PDF Report Structure

```
┌─────────────────────────────────────────┐
│ Monthly Status Report                    │
│ Contract: [CONTRACT NAME]                │
│ Report Month: [MONTH YEAR]              │
│ Generated: [DATE]                        │
│ Prepared by: [PM/APM NAME]              │
└─────────────────────────────────────────┘

PWS Line Item: [CODE] - [TITLE]
────────────────────────────────────────

Task: [TASK NAME]
Assignee(s): [NAMES]
Status: [On Track / At Risk / Blocked]

Narrative:
[Detailed narrative text describing work 
performed, accomplishments, and progress]

Progress: [XX]% Complete

Blockers:
[Description of any blockers or issues]

────────────────────────────────────────
[Repeat for each task]

[Next PWS Line Item]
...

────────────────────────────────────────
Page X of Y
```

### Naming Conventions

**PDF Files:**
- Format: `MSR_[CONTRACT_CODE]_[YYYY-MM].pdf`
- Example: `MSR_CONT001_2025-10.pdf`

**Revised PDFs:**
- Format: `MSR_[CONTRACT_CODE]_[YYYY-MM]_v[N].pdf`
- Example: `MSR_CONT001_2025-10_v2.pdf`

---

## Support

For questions or issues:
1. Check this runbook
2. Review [Admin Runbook](Admin_Runbook.md) for role/permission issues
3. Contact system administrator
4. Contact development team for technical issues

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | October 2025 | Initial release |
