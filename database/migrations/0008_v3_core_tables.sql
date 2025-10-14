-- 0008_v3_core_tables.sql
-- Phase 1.5: Create Contract-Scoped Core Tables per PRD v3

-- Contracts Table
CREATE TABLE public.contracts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- PWS Line Items Table
CREATE TABLE public.pws_line_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    code text NOT NULL,
    title text NOT NULL,
    description text,
    periodicity text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(contract_id, code)
);

-- Teams Table
CREATE TABLE public.teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(contract_id, name)
);

-- Team Memberships Table
CREATE TABLE public.team_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_in_team text NOT NULL CHECK (role_in_team IN ('lead', 'member')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(team_id, user_id, role_in_team)
);

-- Tasks Table (replaces pws_tasks)
CREATE TABLE public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pws_line_item_id uuid NOT NULL REFERENCES public.pws_line_items(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    start_date date,
    due_date date,
    status_short text CHECK (status_short IN ('not-started', 'in-progress', 'on-hold', 'complete')) DEFAULT 'not-started',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Task Assignments Table (many-to-many)
CREATE TABLE public.task_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES auth.users(id),
    assigned_at timestamptz DEFAULT now(),
    UNIQUE(task_id, user_id)
);

-- Task Statuses Table (replaces updates)
CREATE TABLE public.task_statuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    narrative text,
    percent_complete numeric CHECK (percent_complete BETWEEN 0 AND 100),
    blockers text,
    submitted_at timestamptz DEFAULT now(),
    lead_review_status text CHECK (lead_review_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    lead_reviewer uuid REFERENCES auth.users(id),
    lead_reviewed_at timestamptz,
    lead_review_comment text,
    report_month date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Report Queue Table
CREATE TABLE public.report_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    report_month date NOT NULL,
    task_status_id uuid NOT NULL REFERENCES public.task_statuses(id) ON DELETE CASCADE,
    added_at timestamptz DEFAULT now(),
    UNIQUE(contract_id, report_month, task_status_id)
);

-- Monthly Reports Table
CREATE TABLE public.monthly_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    report_month date NOT NULL,
    pm_review_status text CHECK (pm_review_status IN ('pending', 'approved', 'approved-with-changes', 'rejected')) DEFAULT 'pending',
    pm_reviewer uuid REFERENCES auth.users(id),
    pm_reviewed_at timestamptz,
    pm_review_comment text,
    pdf_storage_path text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(contract_id, report_month)
);

-- Create Indexes for Performance
CREATE INDEX idx_pws_line_items_contract ON public.pws_line_items(contract_id);
CREATE INDEX idx_pws_line_items_active ON public.pws_line_items(is_active);
CREATE INDEX idx_teams_contract ON public.teams(contract_id);
CREATE INDEX idx_team_memberships_team ON public.team_memberships(team_id);
CREATE INDEX idx_team_memberships_user ON public.team_memberships(user_id);
CREATE INDEX idx_tasks_pws_line_item ON public.tasks(pws_line_item_id);
CREATE INDEX idx_tasks_active ON public.tasks(is_active);
CREATE INDEX idx_task_assignments_task ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user ON public.task_assignments(user_id);
CREATE INDEX idx_task_statuses_task ON public.task_statuses(task_id);
CREATE INDEX idx_task_statuses_submitted_by ON public.task_statuses(submitted_by);
CREATE INDEX idx_task_statuses_report_month ON public.task_statuses(report_month);
CREATE INDEX idx_task_statuses_review_status ON public.task_statuses(lead_review_status);
CREATE INDEX idx_report_queue_contract_month ON public.report_queue(contract_id, report_month);
CREATE INDEX idx_monthly_reports_contract_month ON public.monthly_reports(contract_id, report_month);

-- Enable RLS on all new tables
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pws_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE public.contracts IS 'Stores contract information';
COMMENT ON TABLE public.pws_line_items IS 'PWS line items scoped to contracts';
COMMENT ON TABLE public.teams IS 'Teams scoped to contracts';
COMMENT ON TABLE public.team_memberships IS 'User membership in teams with role (lead/member)';
COMMENT ON TABLE public.tasks IS 'Tasks linked to PWS line items';
COMMENT ON TABLE public.task_assignments IS 'Many-to-many assignment of users to tasks';
COMMENT ON TABLE public.task_statuses IS 'Task status submissions with lead review workflow';
COMMENT ON TABLE public.report_queue IS 'Approved statuses queued for monthly reporting';
COMMENT ON TABLE public.monthly_reports IS 'Monthly report metadata and PM/APM approval';
