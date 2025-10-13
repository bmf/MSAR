-- 0002_rls_policies.sql

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pws_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- RLS Policies for pws_tasks
CREATE POLICY "Team members can view their assigned tasks" ON public.pws_tasks FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Team leads can view tasks assigned to their team" ON public.pws_tasks FOR SELECT USING (assigned_to IN (SELECT id FROM public.profiles WHERE team = (SELECT team FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "Admins can manage all tasks" ON public.pws_tasks FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- RLS Policies for updates
CREATE POLICY "Users can manage their own updates" ON public.updates FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Team leads can view updates for their team" ON public.updates FOR SELECT USING (task_id IN (SELECT id FROM public.pws_tasks WHERE assigned_to IN (SELECT id FROM public.profiles WHERE team = (SELECT team FROM public.profiles WHERE id = auth.uid()))));
CREATE POLICY "Admins can view all updates" ON public.updates FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- RLS Policies for approvals
CREATE POLICY "Team leads can manage approvals for their team" ON public.approvals FOR ALL USING (approver_id = auth.uid());
CREATE POLICY "Admins can view all approvals" ON public.approvals FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- RLS Policies for account_requests
CREATE POLICY "Admins can manage account requests" ON public.account_requests FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));
