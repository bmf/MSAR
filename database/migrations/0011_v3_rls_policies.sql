-- 0011_v3_rls_policies.sql
-- Phase 1.7: RLS Policies by Contract and Role

-- ============================================================================
-- CONTRACTS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to contracts"
ON public.contracts FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- PM/APM/Leads/Members can view contracts they're assigned to
CREATE POLICY "Users can view assigned contracts"
ON public.contracts FOR SELECT
USING (
    public.is_admin() OR
    id IN (SELECT contract_id FROM public.get_user_contracts())
);

-- ============================================================================
-- PWS LINE ITEMS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to pws_line_items"
ON public.pws_line_items FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view line items for their assigned contracts
CREATE POLICY "Users can view pws_line_items for assigned contracts"
ON public.pws_line_items FOR SELECT
USING (
    public.is_admin() OR
    contract_id IN (SELECT contract_id FROM public.get_user_contracts())
);

-- ============================================================================
-- TEAMS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to teams"
ON public.teams FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view teams for their assigned contracts
CREATE POLICY "Users can view teams for assigned contracts"
ON public.teams FOR SELECT
USING (
    public.is_admin() OR
    contract_id IN (SELECT contract_id FROM public.get_user_contracts())
);

-- ============================================================================
-- TEAM MEMBERSHIPS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to team_memberships"
ON public.team_memberships FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view memberships for teams in their contracts
CREATE POLICY "Users can view team_memberships for assigned contracts"
ON public.team_memberships FOR SELECT
USING (
    public.is_admin() OR
    team_id IN (
        SELECT t.id 
        FROM public.teams t
        WHERE t.contract_id IN (SELECT contract_id FROM public.get_user_contracts())
    )
);

-- Team leads can manage memberships for their teams
CREATE POLICY "Team leads can manage their team memberships"
ON public.team_memberships FOR ALL
USING (
    public.is_admin() OR
    team_id IN (SELECT team_id FROM public.get_user_led_teams())
)
WITH CHECK (
    public.is_admin() OR
    team_id IN (SELECT team_id FROM public.get_user_led_teams())
);

-- ============================================================================
-- TASKS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to tasks"
ON public.tasks FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- PM/APM can view all tasks for their contracts
CREATE POLICY "PM/APM can view tasks for their contracts"
ON public.tasks FOR SELECT
USING (
    public.is_admin() OR
    pws_line_item_id IN (
        SELECT pli.id 
        FROM public.pws_line_items pli
        WHERE pli.contract_id IN (SELECT contract_id FROM public.get_user_contracts())
        AND (
            public.has_contract_role(pli.contract_id, 'PM') OR
            public.has_contract_role(pli.contract_id, 'APM')
        )
    )
);

-- Team leads can manage tasks for their teams' PWS line items
CREATE POLICY "Team leads can manage tasks for their teams"
ON public.tasks FOR ALL
USING (
    public.is_admin() OR
    pws_line_item_id IN (
        SELECT pli.id 
        FROM public.pws_line_items pli
        JOIN public.teams t ON t.contract_id = pli.contract_id
        WHERE t.id IN (SELECT team_id FROM public.get_user_led_teams())
    )
)
WITH CHECK (
    public.is_admin() OR
    pws_line_item_id IN (
        SELECT pli.id 
        FROM public.pws_line_items pli
        JOIN public.teams t ON t.contract_id = pli.contract_id
        WHERE t.id IN (SELECT team_id FROM public.get_user_led_teams())
    )
);

-- Team members can view tasks assigned to them
CREATE POLICY "Team members can view assigned tasks"
ON public.tasks FOR SELECT
USING (
    public.is_admin() OR
    id IN (
        SELECT task_id 
        FROM public.task_assignments 
        WHERE user_id = auth.uid()
    )
);

-- ============================================================================
-- TASK ASSIGNMENTS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to task_assignments"
ON public.task_assignments FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Team leads can manage assignments for their tasks
CREATE POLICY "Team leads can manage task assignments"
ON public.task_assignments FOR ALL
USING (
    public.is_admin() OR
    task_id IN (
        SELECT t.id 
        FROM public.tasks t
        JOIN public.pws_line_items pli ON t.pws_line_item_id = pli.id
        JOIN public.teams tm ON tm.contract_id = pli.contract_id
        WHERE tm.id IN (SELECT team_id FROM public.get_user_led_teams())
    )
)
WITH CHECK (
    public.is_admin() OR
    task_id IN (
        SELECT t.id 
        FROM public.tasks t
        JOIN public.pws_line_items pli ON t.pws_line_item_id = pli.id
        JOIN public.teams tm ON tm.contract_id = pli.contract_id
        WHERE tm.id IN (SELECT team_id FROM public.get_user_led_teams())
    )
);

-- Users can view their own assignments
CREATE POLICY "Users can view their own task assignments"
ON public.task_assignments FOR SELECT
USING (
    public.is_admin() OR
    user_id = auth.uid()
);

-- ============================================================================
-- TASK STATUSES TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to task_statuses"
ON public.task_statuses FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- PM/APM can view all statuses for their contracts
CREATE POLICY "PM/APM can view task_statuses for their contracts"
ON public.task_statuses FOR SELECT
USING (
    public.is_admin() OR
    task_id IN (
        SELECT t.id 
        FROM public.tasks t
        JOIN public.pws_line_items pli ON t.pws_line_item_id = pli.id
        WHERE pli.contract_id IN (SELECT contract_id FROM public.get_user_contracts())
        AND (
            public.has_contract_role(pli.contract_id, 'PM') OR
            public.has_contract_role(pli.contract_id, 'APM')
        )
    )
);

-- Team leads can view and update statuses for their teams
CREATE POLICY "Team leads can manage task_statuses for their teams"
ON public.task_statuses FOR ALL
USING (
    public.is_admin() OR
    task_id IN (
        SELECT t.id 
        FROM public.tasks t
        JOIN public.pws_line_items pli ON t.pws_line_item_id = pli.id
        JOIN public.teams tm ON tm.contract_id = pli.contract_id
        WHERE tm.id IN (SELECT team_id FROM public.get_user_led_teams())
    )
)
WITH CHECK (
    public.is_admin() OR
    (
        -- Leads can submit their own statuses
        submitted_by = auth.uid() AND
        task_id IN (
            SELECT task_id 
            FROM public.task_assignments 
            WHERE user_id = auth.uid()
        )
    ) OR
    (
        -- Leads can update review fields for their team's statuses
        task_id IN (
            SELECT t.id 
            FROM public.tasks t
            JOIN public.pws_line_items pli ON t.pws_line_item_id = pli.id
            JOIN public.teams tm ON tm.contract_id = pli.contract_id
            WHERE tm.id IN (SELECT team_id FROM public.get_user_led_teams())
        )
    )
);

-- Team members can create and view their own statuses
CREATE POLICY "Team members can manage their own task_statuses"
ON public.task_statuses FOR INSERT
WITH CHECK (
    public.is_admin() OR
    (
        submitted_by = auth.uid() AND
        task_id IN (
            SELECT task_id 
            FROM public.task_assignments 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Team members can view their own task_statuses"
ON public.task_statuses FOR SELECT
USING (
    public.is_admin() OR
    submitted_by = auth.uid()
);

-- ============================================================================
-- REPORT QUEUE TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to report_queue"
ON public.report_queue FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- PM/APM can view report queue for their contracts
CREATE POLICY "PM/APM can view report_queue for their contracts"
ON public.report_queue FOR SELECT
USING (
    public.is_admin() OR
    contract_id IN (
        SELECT contract_id FROM public.get_user_contracts()
        WHERE EXISTS (
            SELECT 1 FROM public.user_contract_roles ucr
            WHERE ucr.user_id = auth.uid()
            AND ucr.contract_id = report_queue.contract_id
            AND ucr.role IN ('PM', 'APM')
        )
    )
);

-- System can insert (via triggers or lead approval)
CREATE POLICY "System can insert into report_queue"
ON public.report_queue FOR INSERT
WITH CHECK (public.is_admin());

-- ============================================================================
-- MONTHLY REPORTS TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to monthly_reports"
ON public.monthly_reports FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- PM/APM can view and manage reports for their contracts
CREATE POLICY "PM/APM can manage monthly_reports for their contracts"
ON public.monthly_reports FOR ALL
USING (
    public.is_admin() OR
    (
        contract_id IN (SELECT contract_id FROM public.get_user_contracts()) AND
        EXISTS (
            SELECT 1 FROM public.user_contract_roles ucr
            WHERE ucr.user_id = auth.uid()
            AND ucr.contract_id = monthly_reports.contract_id
            AND ucr.role IN ('PM', 'APM')
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    (
        contract_id IN (SELECT contract_id FROM public.get_user_contracts()) AND
        EXISTS (
            SELECT 1 FROM public.user_contract_roles ucr
            WHERE ucr.user_id = auth.uid()
            AND ucr.contract_id = monthly_reports.contract_id
            AND ucr.role IN ('PM', 'APM')
        )
    )
);

-- ============================================================================
-- USER CONTRACT ROLES TABLE POLICIES
-- ============================================================================

-- Admins can do everything
CREATE POLICY "Admins full access to user_contract_roles"
ON public.user_contract_roles FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view their own roles
CREATE POLICY "Users can view their own contract roles"
ON public.user_contract_roles FOR SELECT
USING (
    public.is_admin() OR
    user_id = auth.uid()
);

-- Comments
COMMENT ON POLICY "Admins full access to contracts" ON public.contracts IS 'Admins have unrestricted access to all contracts';
COMMENT ON POLICY "Users can view assigned contracts" ON public.contracts IS 'Users can view contracts they are assigned to via user_contract_roles';
