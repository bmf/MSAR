// Custom JavaScript for MSR Webform Application

$(document).ready(function() {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://rzwmnvbcwfbvwmsgfave.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6d21udmJjd2Zidndtc2dmYXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjA4ODYsImV4cCI6MjA3NTkzNjg4Nn0.JE2Kzye0h17SpBIo8A_qbyrfIFyY2JwQrRQ5mFaVXGY';

    // --- INITIALIZATION ---
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.msrSupabase = supabase; // expose for console diagnostics
    let currentUser = null;

    // --- HTML TEMPLATES ---
    const appLayout = `
        <header class="bg-light p-3 mb-4 border-bottom">
            <div class="container">
                <div class="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
                    <a href="#dashboard" class="d-flex align-items-center mb-2 mb-lg-0 text-dark text-decoration-none"><h4>MSR Webform</h4></a>
                    <ul class="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0" id="main-nav"></ul>
                    <div class="text-end">
                        <button type="button" class="btn btn-outline-primary me-2" id="login-btn">Login</button>
                        <button type="button" class="btn btn-primary" id="logout-btn" style="display: none;">Logout</button>
                    </div>
                </div>
            </div>
        </header>
        <main class="container" id="main-content"></main>
        <footer class="footer mt-auto py-3 bg-light border-top"><div class="container"><span class="text-muted">&copy; 2025 MSR Webform</span></div></footer>
        <div class="modal fade" id="request-account-modal" tabindex="-1" aria-labelledby="requestAccountModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="requestAccountModalLabel">Request an Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="request-account-form">
                            <div class="mb-3">
                                <label for="request-name" class="form-label">Full Name</label>
                                <input type="text" class="form-control" id="request-name" required>
                            </div>
                            <div class="mb-3">
                                <label for="request-email" class="form-label">Email address</label>
                                <input type="email" class="form-control" id="request-email" required>
                            </div>
                            <div class="mb-3">
                                <label for="request-reason" class="form-label">Reason for Access</label>
                                <textarea class="form-control" id="request-reason" rows="3" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Submit Request</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    const loginPage = `
        <h2>Login</h2>
        <form id="login-form">
            <div id="error-message" class="alert alert-danger" style="display: none;"></div>
            <div class="mb-3">
                <label for="email" class="form-label">Email address</label>
                <input type="email" class="form-control" id="email" required>
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" required>
            </div>
            <button type="submit" class="btn btn-primary">Login</button>
            <a href="#" class="ms-2" data-bs-toggle="modal" data-bs-target="#request-account-modal">Request an account</a>
        </form>
    `;

    const dashboardPage = `<h2>Dashboard</h2><p>Welcome! Your assigned tasks will appear here.</p>`;

    // --- ROUTER ---
    async function router() {
        const hash = window.location.hash.substring(1);
        if (currentUser) {
            // Get user profile to determine role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentUser.id)
                .single();
            
            if (profileError) {
                console.error('Error fetching profile:', profileError);
            }
            
            const userRole = profile ? profile.role : 'Team Member';
            
            // Route based on hash or default role-based landing
            if (hash === 'review') {
                if (userRole === 'Team Lead' || userRole === 'Admin') {
                    initializeReviewQueue();
                } else {
                    $('#main-content').html('<div class="alert alert-danger">Access Denied: Team Lead or Admin privileges required.</div>');
                }
            } else if (hash === 'admin') {
                if (userRole === 'Admin') {
                    initializeAdminPanel();
                } else {
                    $('#main-content').html('<div class="alert alert-danger">Access Denied: Admin privileges required.</div>');
                }
            } else if (hash === 'reporting') {
                if (userRole === 'Report Approver' || userRole === 'Admin') {
                    initializeReportingView();
                } else {
                    $('#main-content').html('<div class="alert alert-danger">Access Denied: Report Approver or Admin privileges required.</div>');
                }
            } else if (hash === 'dashboard') {
                // Dashboard shows tasks view for all roles
                if (userRole === 'Admin') {
                    // Admin sees all tasks across all contracts
                    initializeAdminDashboard();
                } else if (userRole === 'Team Lead') {
                    initializeTeamLeadDashboard();
                } else {
                    initializeMemberDashboard();
                }
            } else if (hash === '') {
                // Empty hash - route to role-based default landing
                if (userRole === 'Admin') {
                    initializeAdminPanel();
                } else if (userRole === 'Report Approver') {
                    initializeReportingView();
                } else if (userRole === 'Team Lead') {
                    initializeTeamLeadDashboard();
                } else {
                    initializeMemberDashboard();
                }
            } else {
                $('#main-content').html('<div class="alert alert-warning">Page not found.</div>');
            }
        } else {
            // If not logged in, show the login page
            $('#main-content').html(loginPage);
        }
    }

    // --- MEMBER DASHBOARD (My Tasks) ---
    function initializeMemberDashboard() {
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">My Tasks</h2>
                <button id="new-update-btn" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#new-update-modal">Create New Task Update</button>
            </div>
            
            <!-- Global Filters -->
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Filters</h5>
                    <div class="row g-2">
                        <div class="col-12 col-md-3">
                            <label for="filter-contract" class="form-label">Contract</label>
                            <select id="filter-contract" class="form-select">
                                <option value="">All Contracts</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="filter-team" class="form-label">Team</label>
                            <select id="filter-team" class="form-select">
                                <option value="">All Teams</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="filter-pws" class="form-label">PWS Line Item</label>
                            <select id="filter-pws" class="form-select">
                                <option value="">All Line Items</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="filter-task" class="form-label">Task</label>
                            <select id="filter-task" class="form-select">
                                <option value="">All Tasks</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row g-2 mb-3">
                <div class="col-12 col-md-4">
                    <label for="filter-status" class="form-label">Filter by Short Status</label>
                    <select id="filter-status" class="form-select">
                        <option value="">All</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Complete">Complete</option>
                    </select>
                </div>
                <div class="col-12 col-md-4">
                    <label for="sort-by" class="form-label">Sort by</label>
                    <select id="sort-by" class="form-select">
                        <option value="due_date_asc">Due Date ↑</option>
                        <option value="due_date_desc">Due Date ↓</option>
                    </select>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped align-middle" id="tasks-table">
                    <thead>
                        <tr>
                            <th>Task Name</th>
                            <th>Start Date</th>
                            <th>Due Date</th>
                            <th>Assigned To</th>
                            <th>PWS Line Item</th>
                            <th>% Complete</th>
                            <th>Narrative</th>
                            <th>Blockers</th>
                            <th>Short Status</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <div class="modal fade" id="new-update-modal" tabindex="-1" aria-labelledby="newUpdateModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="newUpdateModalLabel">Create Task Update</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="update-form-error" class="alert alert-danger" style="display: none;"></div>
                            <form id="new-update-form" novalidate>
                                <div class="mb-3">
                                    <label for="update-task" class="form-label">Task <span class="text-danger">*</span></label>
                                    <select id="update-task" class="form-select" required></select>
                                    <div class="invalid-feedback">Please select a task.</div>
                                </div>
                                <div class="mb-3">
                                    <label for="update-narrative" class="form-label">Narrative <span class="text-danger">*</span></label>
                                    <textarea id="update-narrative" class="form-control" rows="3" required></textarea>
                                    <div class="invalid-feedback">Please provide a narrative description.</div>
                                </div>
                                <div class="mb-3">
                                    <label for="update-percent" class="form-label">% Complete <span class="text-danger">*</span></label>
                                    <input id="update-percent" type="number" min="0" max="100" class="form-control" required />
                                    <div class="invalid-feedback">Please enter a value between 0 and 100.</div>
                                </div>
                                <div class="mb-3">
                                    <label for="update-blockers" class="form-label">Blockers</label>
                                    <textarea id="update-blockers" class="form-control" rows="2"></textarea>
                                    <small class="form-text text-muted">Optional: Describe any blockers or issues.</small>
                                </div>
                                <div class="mb-3">
                                    <label for="update-short-status" class="form-label">Short Status <span class="text-danger">*</span></label>
                                    <select id="update-short-status" class="form-select" required>
                                        <option value="">Select status...</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Complete">Complete</option>
                                    </select>
                                    <div class="invalid-feedback">Please select a status.</div>
                                </div>
                                <div class="d-flex gap-2">
                                    <button type="button" id="save-draft-btn" class="btn btn-secondary">Save Draft</button>
                                    <button type="submit" class="btn btn-primary">Submit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('#main-content').html(container);

        const state = { 
            raw: [], 
            filtered: [], 
            contracts: [],
            teams: [],
            pwsLineItems: [],
            tasks: [],
            globalFilters: {
                contract: '',
                team: '',
                pws: '',
                task: ''
            }
        };

        function readPrefs() {
            const f = localStorage.getItem('msr_dash_filter') || '';
            const s = localStorage.getItem('msr_dash_sort') || 'due_date_asc';
            const gf = localStorage.getItem('msr_global_filters');
            
            $('#filter-status').val(f);
            $('#sort-by').val(s);
            
            if (gf) {
                try {
                    state.globalFilters = JSON.parse(gf);
                    $('#filter-contract').val(state.globalFilters.contract || '');
                    $('#filter-team').val(state.globalFilters.team || '');
                    $('#filter-pws').val(state.globalFilters.pws || '');
                    $('#filter-task').val(state.globalFilters.task || '');
                } catch (e) {
                    console.error('Error parsing global filters:', e);
                }
            }
            
            return { f, s };
        }

        function writePrefs(f, s) {
            localStorage.setItem('msr_dash_filter', f);
            localStorage.setItem('msr_dash_sort', s);
            localStorage.setItem('msr_global_filters', JSON.stringify(state.globalFilters));
        }

        function applyFilterSort() {
            const f = $('#filter-status').val();
            const s = $('#sort-by').val();
            let rows = [...state.raw];
            
            // Apply global filters
            if (state.globalFilters.contract) {
                rows = rows.filter(r => r.contract_id === state.globalFilters.contract);
            }
            if (state.globalFilters.team) {
                rows = rows.filter(r => r.team_id === state.globalFilters.team);
            }
            if (state.globalFilters.pws) {
                rows = rows.filter(r => r.pws_line_item_id === state.globalFilters.pws);
            }
            if (state.globalFilters.task) {
                rows = rows.filter(r => r.task_id === state.globalFilters.task);
            }
            
            // Apply status filter
            if (f) rows = rows.filter(r => (r.latest_update && r.latest_update.short_status) === f);
            
            // Sort
            rows.sort((a, b) => {
                const da = a.due_date ? new Date(a.due_date).getTime() : 0;
                const db = b.due_date ? new Date(b.due_date).getTime() : 0;
                if (s === 'due_date_desc') return db - da;
                return da - db;
            });
            
            state.filtered = rows;
            renderTable();
            writePrefs(f, s);
        }

        function renderTable() {
            const tbody = $('#tasks-table tbody');
            tbody.empty();
            if (!state.filtered.length) {
                tbody.append('<tr><td colspan="9" class="text-muted">No tasks found.</td></tr>');
                return;
            }
            for (const t of state.filtered) {
                const u = t.latest_update || {};
                const tr = `
                    <tr>
                        <td>${escapeHtml(t.task_name || '')}</td>
                        <td>${formatDate(t.start_date)}</td>
                        <td>${formatDate(t.due_date)}</td>
                        <td>${escapeHtml(t.assigned_label || '')}</td>
                        <td>${escapeHtml(t.pws_line_item || '')}</td>
                        <td>${u.percent_complete != null ? u.percent_complete + '%' : ''}</td>
                        <td>${escapeHtml(u.narrative || '')}</td>
                        <td>${escapeHtml(u.blockers || '')}</td>
                        <td>${escapeHtml(u.short_status || '')}</td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        function formatDate(d) {
            if (!d) return '';
            const dt = new Date(d);
            return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString();
        }

        function escapeHtml(s) {
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        async function fetchTasksAndUpdates() {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session ? sessionData.session.user : null;
            if (!user) return [];
            
            // Fetch task assignments for current user
            const { data: assignments, error: assignError } = await supabase
                .from('task_assignments')
                .select(`
                    task_id,
                    tasks (
                        id,
                        title,
                        description,
                        start_date,
                        due_date,
                        status_short,
                        pws_line_item_id,
                        pws_line_items (
                            id,
                            code,
                            title,
                            contract_id,
                            contracts (
                                id,
                                name,
                                code
                            )
                        )
                    )
                `)
                .eq('user_id', user.id);
            
            if (assignError) {
                console.error('Error fetching assignments:', assignError);
                return [];
            }
            
            if (!assignments || assignments.length === 0) return [];
            
            // Process each assignment
            const results = await Promise.all(assignments.map(async a => {
                const task = a.tasks;
                if (!task) return null;
                
                const pwsLineItem = task.pws_line_items;
                const contract = pwsLineItem ? pwsLineItem.contracts : null;
                
                // Fetch latest approved task status for this task by current user
                const { data: statuses } = await supabase
                    .from('task_statuses')
                    .select('id, narrative, percent_complete, blockers, lead_review_status, submitted_at')
                    .eq('task_id', task.id)
                    .eq('submitted_by', user.id)
                    .eq('lead_review_status', 'approved')
                    .order('submitted_at', { ascending: false })
                    .limit(1);
                
                const latest = statuses && statuses.length ? statuses[0] : null;
                
                return {
                    task_id: task.id,
                    task_name: task.title,
                    description: task.description,
                    start_date: task.start_date,
                    due_date: task.due_date,
                    status_short: task.status_short,
                    pws_line_item_id: pwsLineItem ? pwsLineItem.id : null,
                    pws_line_item: pwsLineItem ? `${pwsLineItem.code} - ${pwsLineItem.title}` : 'N/A',
                    contract_id: contract ? contract.id : null,
                    contract_name: contract ? contract.name : 'N/A',
                    contract_code: contract ? contract.code : 'N/A',
                    team_id: null, // Will be populated if needed
                    assigned_label: user.email || 'Me',
                    latest_update: latest ? {
                        narrative: latest.narrative,
                        percent_complete: latest.percent_complete,
                        blockers: latest.blockers,
                        short_status: null // task_statuses doesn't have short_status, use task.status_short instead
                    } : null
                };
            }));
            
            return results.filter(r => r !== null);
        }

        async function load() {
            readPrefs();
            const rows = await fetchTasksAndUpdates();
            state.raw = rows;
            await populateGlobalFilters(rows);
            populateTaskSelect(rows);
            updateModalState(rows);
            applyFilterSort();
        }

        async function populateGlobalFilters(rows) {
            // Extract unique contracts
            const contracts = [...new Set(rows.map(r => ({ id: r.contract_id, name: r.contract_name, code: r.contract_code })).filter(c => c.id))];
            const uniqueContracts = contracts.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
            
            const contractSelect = $('#filter-contract');
            contractSelect.find('option:not(:first)').remove();
            uniqueContracts.forEach(c => {
                contractSelect.append(`<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.code)})</option>`);
            });
            
            // Restore saved filters and populate dependent dropdowns
            if (state.globalFilters.contract) {
                contractSelect.val(state.globalFilters.contract);
                await updateTeamFilter();
            }
            if (state.globalFilters.team) {
                $('#filter-team').val(state.globalFilters.team);
                await updatePWSFilter();
            }
            if (state.globalFilters.pws) {
                $('#filter-pws').val(state.globalFilters.pws);
                await updateTaskFilter();
            }
            if (state.globalFilters.task) {
                $('#filter-task').val(state.globalFilters.task);
            }
        }

        async function updateTeamFilter() {
            const contractId = $('#filter-contract').val();
            const teamSelect = $('#filter-team');
            teamSelect.find('option:not(:first)').remove();
            teamSelect.val('');
            
            if (!contractId) {
                $('#filter-pws').find('option:not(:first)').remove().end().val('');
                $('#filter-task').find('option:not(:first)').remove().end().val('');
                return;
            }
            
            // Fetch teams for selected contract
            const { data: teams } = await supabase
                .from('teams')
                .select('id, name')
                .eq('contract_id', contractId)
                .eq('is_active', true)
                .order('name');
            
            if (teams) {
                teams.forEach(t => {
                    teamSelect.append(`<option value="${t.id}">${escapeHtml(t.name)}</option>`);
                });
            }
        }

        async function updatePWSFilter() {
            const contractId = $('#filter-contract').val();
            const pwsSelect = $('#filter-pws');
            pwsSelect.find('option:not(:first)').remove();
            pwsSelect.val('');
            
            if (!contractId) {
                $('#filter-task').find('option:not(:first)').remove().end().val('');
                return;
            }
            
            // Fetch PWS line items for selected contract
            const { data: pwsItems } = await supabase
                .from('pws_line_items')
                .select('id, code, title')
                .eq('contract_id', contractId)
                .eq('is_active', true)
                .order('code');
            
            if (pwsItems) {
                pwsItems.forEach(p => {
                    pwsSelect.append(`<option value="${p.id}">${escapeHtml(p.code)} - ${escapeHtml(p.title)}</option>`);
                });
            }
        }

        async function updateTaskFilter() {
            const pwsId = $('#filter-pws').val();
            const taskSelect = $('#filter-task');
            taskSelect.find('option:not(:first)').remove();
            taskSelect.val('');
            
            if (!pwsId) return;
            
            // Fetch tasks for selected PWS line item
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, title')
                .eq('pws_line_item_id', pwsId)
                .eq('is_active', true)
                .order('title');
            
            if (tasks) {
                tasks.forEach(t => {
                    taskSelect.append(`<option value="${t.id}">${escapeHtml(t.title)}</option>`);
                });
            }
        }

        function populateTaskSelect(rows) {
            const sel = $('#update-task');
            sel.empty();
            for (const t of rows) {
                sel.append(`<option value="${t.task_id}">${escapeHtml(t.task_name)}</option>`);
            }
        }

        function updateModalState(rows) {
            const sel = $('#update-task');
            const helperId = 'no-tasks-help';
            $(`#${helperId}`).remove();
            if (!rows || rows.length === 0) {
                sel.prop('disabled', true);
                sel.removeAttr('required');
                sel.empty().append('<option value="">No assigned tasks</option>');
                const help = $(`<div id="${helperId}" class="alert alert-info mt-2">No tasks are assigned to you yet. Ask your Team Lead to assign a task before creating an update.</div>`);
                sel.closest('.mb-3').after(help);
            } else {
                sel.prop('disabled', false);
                sel.attr('required', '');
            }
        }

        function validateForm() {
            const form = document.getElementById('new-update-form');
            const taskId = $('#update-task').val();
            const narrative = $('#update-narrative').val().trim();
            const percent = $('#update-percent').val();
            const shortStatus = $('#update-short-status').val();

            let isValid = true;

            // Reset validation states
            form.querySelectorAll('.form-control, .form-select').forEach(el => {
                el.classList.remove('is-invalid');
            });
            $('#update-form-error').hide();

            // Validate task selection
            if (!taskId) {
                $('#update-task').addClass('is-invalid');
                isValid = false;
            }

            // Validate narrative
            if (!narrative) {
                $('#update-narrative').addClass('is-invalid');
                isValid = false;
            }

            // Validate percent complete
            const percentNum = parseInt(percent, 10);
            if (percent === '' || isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
                $('#update-percent').addClass('is-invalid');
                isValid = false;
            }

            // Validate short status
            if (!shortStatus) {
                $('#update-short-status').addClass('is-invalid');
                isValid = false;
            }

            return isValid;
        }

        async function saveUpdate(isDraft) {
            if (!isDraft && !validateForm()) {
                return false;
            }

            const taskId = $('#update-task').val();
            const narrative = $('#update-narrative').val().trim();
            const percent = $('#update-percent').val();
            const blockers = $('#update-blockers').val().trim();
            const shortStatus = $('#update-short-status').val();

            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session ? sessionData.session.user : null;
            if (!user) {
                $('#update-form-error').text('You must be logged in to save updates.').show();
                return false;
            }

            // Get current report month (first day of current month)
            const now = new Date();
            const reportMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            
            // Check if user can submit for this task/month (no pending/approved submission exists)
            const { data: existingStatus } = await supabase
                .from('task_statuses')
                .select('id, lead_review_status')
                .eq('task_id', taskId)
                .eq('submitted_by', user.id)
                .eq('report_month', reportMonth)
                .in('lead_review_status', ['pending', 'approved'])
                .maybeSingle();
            
            if (existingStatus && !isDraft) {
                $('#update-form-error').text('You have already submitted a status for this task this month. Wait for review or contact your Team Lead.').show();
                return false;
            }

            const statusData = {
                task_id: taskId,
                submitted_by: user.id,
                narrative: narrative || null,
                percent_complete: percent ? parseInt(percent, 10) : null,
                blockers: blockers || null,
                lead_review_status: isDraft ? 'pending' : 'pending', // Both draft and submit start as pending
                report_month: reportMonth,
                submitted_at: new Date().toISOString()
            };
            
            // Also update the task's short status
            if (shortStatus && !isDraft) {
                await supabase
                    .from('tasks')
                    .update({ status_short: shortStatus })
                    .eq('id', taskId);
            }

            const { data, error } = await supabase
                .from('task_statuses')
                .insert([statusData])
                .select();

            if (error) {
                $('#update-form-error').text('Error saving update: ' + error.message).show();
                return false;
            }

            return true;
        }

        function closeModal() {
            const modalEl = document.getElementById('new-update-modal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
            // Fallback cleanup
            setTimeout(() => {
                const stillVisible = modalEl.classList.contains('show') || modalEl.getAttribute('aria-hidden') !== 'true';
                if (stillVisible) {
                    modalEl.classList.remove('show');
                    modalEl.setAttribute('aria-hidden', 'true');
                    modalEl.style.display = 'none';
                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    backdrops.forEach(b => b.parentNode && b.parentNode.removeChild(b));
                    document.body.classList.remove('modal-open');
                    document.body.style.removeProperty('padding-right');
                }
            }, 50);
        }

        function resetForm() {
            const form = document.getElementById('new-update-form');
            form.reset();
            form.querySelectorAll('.form-control, .form-select').forEach(el => {
                el.classList.remove('is-invalid');
            });
            $('#update-form-error').hide();
        }

        // Handle Save Draft button
        $(document).off('click', '#save-draft-btn').on('click', '#save-draft-btn', async function(e) {
            e.preventDefault();
            const success = await saveUpdate(true);
            if (success) {
                closeModal();
                resetForm();
                alert('Draft saved successfully!');
                load(); // Reload dashboard to show updated data
            }
        });

        // Handle Submit button
        $(document).off('submit', '#new-update-form').on('submit', '#new-update-form', async function(e) {
            e.preventDefault();
            const success = await saveUpdate(false);
            if (success) {
                closeModal();
                resetForm();
                alert('Update submitted successfully!');
                load(); // Reload dashboard to show updated data
            }
        });

        // Reset form when modal is closed
        $(document).off('hidden.bs.modal', '#new-update-modal').on('hidden.bs.modal', '#new-update-modal', function() {
            resetForm();
        });

        // Handle global filter changes
        $(document).off('change', '#filter-contract').on('change', '#filter-contract', async function() {
            state.globalFilters.contract = $(this).val();
            state.globalFilters.team = '';
            state.globalFilters.pws = '';
            state.globalFilters.task = '';
            await updateTeamFilter();
            applyFilterSort();
        });

        $(document).off('change', '#filter-team').on('change', '#filter-team', async function() {
            state.globalFilters.team = $(this).val();
            state.globalFilters.pws = '';
            state.globalFilters.task = '';
            await updatePWSFilter();
            applyFilterSort();
        });

        $(document).off('change', '#filter-pws').on('change', '#filter-pws', async function() {
            state.globalFilters.pws = $(this).val();
            state.globalFilters.task = '';
            await updateTaskFilter();
            applyFilterSort();
        });

        $(document).off('change', '#filter-task').on('change', '#filter-task', function() {
            state.globalFilters.task = $(this).val();
            applyFilterSort();
        });

        // Handle status and sort filter changes
        $(document).off('change', '#filter-status').on('change', '#filter-status', function() {
            applyFilterSort();
        });

        $(document).off('change', '#sort-by').on('change', '#sort-by', function() {
            applyFilterSort();
        });

        load();
    }

    // --- ADMIN DASHBOARD (All Tasks) ---
    function initializeAdminDashboard() {
        // Admin sees all tasks across all contracts with global filters
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">Dashboard - All Tasks</h2>
            </div>
            
            <!-- Global Filters -->
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Filters</h5>
                    <div class="row g-2">
                        <div class="col-12 col-md-3">
                            <label for="filter-contract" class="form-label">Contract</label>
                            <select id="filter-contract" class="form-select">
                                <option value="">All Contracts</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="filter-team" class="form-label">Team</label>
                            <select id="filter-team" class="form-select">
                                <option value="">All Teams</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="filter-pws" class="form-label">PWS Line Item</label>
                            <select id="filter-pws" class="form-select">
                                <option value="">All Line Items</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="filter-task" class="form-label">Task</label>
                            <select id="filter-task" class="form-select">
                                <option value="">All Tasks</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row g-2 mb-3">
                <div class="col-12 col-md-4">
                    <label for="filter-status" class="form-label">Filter by Short Status</label>
                    <select id="filter-status" class="form-select">
                        <option value="">All</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Complete">Complete</option>
                    </select>
                </div>
                <div class="col-12 col-md-4">
                    <label for="sort-by" class="form-label">Sort by</label>
                    <select id="sort-by" class="form-select">
                        <option value="due_date_asc">Due Date ↑</option>
                        <option value="due_date_desc">Due Date ↓</option>
                    </select>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped align-middle" id="tasks-table">
                    <thead>
                        <tr>
                            <th>Contract</th>
                            <th>Task Name</th>
                            <th>Start Date</th>
                            <th>Due Date</th>
                            <th>Assigned To</th>
                            <th>PWS Line Item</th>
                            <th>% Complete</th>
                            <th>Narrative</th>
                            <th>Blockers</th>
                            <th>Short Status</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        $('#main-content').html(container);

        const state = { 
            raw: [], 
            filtered: [], 
            globalFilters: {
                contract: '',
                team: '',
                pws: '',
                task: ''
            }
        };

        function readPrefs() {
            const f = localStorage.getItem('msr_admin_dash_filter') || '';
            const s = localStorage.getItem('msr_admin_dash_sort') || 'due_date_asc';
            const gf = localStorage.getItem('msr_admin_global_filters');
            
            $('#filter-status').val(f);
            $('#sort-by').val(s);
            
            if (gf) {
                try {
                    state.globalFilters = JSON.parse(gf);
                    $('#filter-contract').val(state.globalFilters.contract || '');
                    $('#filter-team').val(state.globalFilters.team || '');
                    $('#filter-pws').val(state.globalFilters.pws || '');
                    $('#filter-task').val(state.globalFilters.task || '');
                } catch (e) {
                    console.error('Error parsing global filters:', e);
                }
            }
            
            return { f, s };
        }

        function writePrefs(f, s) {
            localStorage.setItem('msr_admin_dash_filter', f);
            localStorage.setItem('msr_admin_dash_sort', s);
            localStorage.setItem('msr_admin_global_filters', JSON.stringify(state.globalFilters));
        }

        function applyFilterSort() {
            const f = $('#filter-status').val();
            const s = $('#sort-by').val();
            let rows = [...state.raw];
            
            // Apply global filters
            if (state.globalFilters.contract) {
                rows = rows.filter(r => r.contract_id === state.globalFilters.contract);
            }
            if (state.globalFilters.team) {
                rows = rows.filter(r => r.team_id === state.globalFilters.team);
            }
            if (state.globalFilters.pws) {
                rows = rows.filter(r => r.pws_line_item_id === state.globalFilters.pws);
            }
            if (state.globalFilters.task) {
                rows = rows.filter(r => r.task_id === state.globalFilters.task);
            }
            
            // Apply status filter
            if (f) rows = rows.filter(r => (r.latest_update && r.latest_update.short_status) === f);
            
            // Sort
            rows.sort((a, b) => {
                const da = a.due_date ? new Date(a.due_date).getTime() : 0;
                const db = b.due_date ? new Date(b.due_date).getTime() : 0;
                if (s === 'due_date_desc') return db - da;
                return da - db;
            });
            
            state.filtered = rows;
            renderTable();
            writePrefs(f, s);
        }

        function renderTable() {
            const tbody = $('#tasks-table tbody');
            tbody.empty();
            if (!state.filtered.length) {
                tbody.append('<tr><td colspan="10" class="text-muted">No tasks found.</td></tr>');
                return;
            }
            for (const t of state.filtered) {
                const u = t.latest_update || {};
                const tr = `
                    <tr>
                        <td>${escapeHtml(t.contract_name || '')}</td>
                        <td>${escapeHtml(t.task_name || '')}</td>
                        <td>${formatDate(t.start_date)}</td>
                        <td>${formatDate(t.due_date)}</td>
                        <td>${escapeHtml(t.assigned_label || '')}</td>
                        <td>${escapeHtml(t.pws_line_item || '')}</td>
                        <td>${u.percent_complete != null ? u.percent_complete + '%' : ''}</td>
                        <td>${escapeHtml(u.narrative || '')}</td>
                        <td>${escapeHtml(u.blockers || '')}</td>
                        <td>${escapeHtml(u.short_status || '')}</td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        function formatDate(d) {
            if (!d) return '';
            const dt = new Date(d);
            return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString();
        }

        function escapeHtml(s) {
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        async function fetchAllTasks() {
            // Fetch ALL tasks with their PWS line items and contracts
            const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select(`
                    id,
                    title,
                    description,
                    start_date,
                    due_date,
                    status_short,
                    pws_line_item_id,
                    pws_line_items (
                        id,
                        code,
                        title,
                        contract_id,
                        contracts (
                            id,
                            name,
                            code
                        )
                    )
                `)
                .eq('is_active', true);
            
            if (tasksError) {
                console.error('Error fetching tasks:', tasksError);
                return [];
            }
            
            if (!tasks || tasks.length === 0) return [];
            
            // Process each task
            const results = await Promise.all(tasks.map(async task => {
                const pwsLineItem = task.pws_line_items;
                const contract = pwsLineItem ? pwsLineItem.contracts : null;
                
                // Fetch task assignments separately
                const { data: assignments } = await supabase
                    .from('task_assignments')
                    .select('user_id')
                    .eq('task_id', task.id);
                
                // Fetch assignee names
                let assigneeNames = 'Unassigned';
                if (assignments && assignments.length > 0) {
                    const userIds = assignments.map(a => a.user_id);
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .in('id', userIds);
                    
                    if (profiles && profiles.length > 0) {
                        assigneeNames = profiles.map(p => p.full_name || 'Unknown').join(', ');
                    }
                }
                
                // Fetch latest approved task status for this task (from any user)
                const { data: statuses } = await supabase
                    .from('task_statuses')
                    .select('id, narrative, percent_complete, blockers, lead_review_status, submitted_at')
                    .eq('task_id', task.id)
                    .eq('lead_review_status', 'approved')
                    .order('submitted_at', { ascending: false })
                    .limit(1);
                
                const latest = (statuses && statuses.length) ? statuses[0] : null;
                
                return {
                    task_id: task.id,
                    task_name: task.title,
                    description: task.description,
                    start_date: task.start_date,
                    due_date: task.due_date,
                    status_short: task.status_short,
                    pws_line_item_id: pwsLineItem ? pwsLineItem.id : null,
                    pws_line_item: pwsLineItem ? `${pwsLineItem.code} - ${pwsLineItem.title}` : 'N/A',
                    contract_id: contract ? contract.id : null,
                    contract_name: contract ? contract.name : 'N/A',
                    contract_code: contract ? contract.code : 'N/A',
                    team_id: null,
                    assigned_label: assigneeNames,
                    latest_update: latest ? {
                        narrative: latest.narrative,
                        percent_complete: latest.percent_complete,
                        blockers: latest.blockers,
                        short_status: null // Use task.status_short instead
                    } : null
                };
            }));
            
            return results;
        }

        async function populateGlobalFilters(rows) {
            // Extract unique contracts
            const contracts = [...new Set(rows.map(r => ({ id: r.contract_id, name: r.contract_name, code: r.contract_code })).filter(c => c.id))];
            const uniqueContracts = contracts.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
            
            const contractSelect = $('#filter-contract');
            contractSelect.find('option:not(:first)').remove();
            uniqueContracts.forEach(c => {
                contractSelect.append(`<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.code)})</option>`);
            });
            
            // Restore saved filters and populate dependent dropdowns
            if (state.globalFilters.contract) {
                contractSelect.val(state.globalFilters.contract);
                await updateTeamFilter();
            }
            if (state.globalFilters.team) {
                $('#filter-team').val(state.globalFilters.team);
                await updatePWSFilter();
            }
            if (state.globalFilters.pws) {
                $('#filter-pws').val(state.globalFilters.pws);
                await updateTaskFilter();
            }
            if (state.globalFilters.task) {
                $('#filter-task').val(state.globalFilters.task);
            }
        }

        async function updateTeamFilter() {
            const contractId = $('#filter-contract').val();
            const teamSelect = $('#filter-team');
            teamSelect.find('option:not(:first)').remove();
            teamSelect.val('');
            
            if (!contractId) {
                $('#filter-pws').find('option:not(:first)').remove().end().val('');
                $('#filter-task').find('option:not(:first)').remove().end().val('');
                return;
            }
            
            const { data: teams } = await supabase
                .from('teams')
                .select('id, name')
                .eq('contract_id', contractId)
                .eq('is_active', true)
                .order('name');
            
            if (teams) {
                teams.forEach(t => {
                    teamSelect.append(`<option value="${t.id}">${escapeHtml(t.name)}</option>`);
                });
            }
        }

        async function updatePWSFilter() {
            const contractId = $('#filter-contract').val();
            const pwsSelect = $('#filter-pws');
            pwsSelect.find('option:not(:first)').remove();
            pwsSelect.val('');
            
            if (!contractId) {
                $('#filter-task').find('option:not(:first)').remove().end().val('');
                return;
            }
            
            const { data: pwsItems } = await supabase
                .from('pws_line_items')
                .select('id, code, title')
                .eq('contract_id', contractId)
                .eq('is_active', true)
                .order('code');
            
            if (pwsItems) {
                pwsItems.forEach(p => {
                    pwsSelect.append(`<option value="${p.id}">${escapeHtml(p.code)} - ${escapeHtml(p.title)}</option>`);
                });
            }
        }

        async function updateTaskFilter() {
            const pwsId = $('#filter-pws').val();
            const taskSelect = $('#filter-task');
            taskSelect.find('option:not(:first)').remove();
            taskSelect.val('');
            
            if (!pwsId) return;
            
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, title')
                .eq('pws_line_item_id', pwsId)
                .eq('is_active', true)
                .order('title');
            
            if (tasks) {
                tasks.forEach(t => {
                    taskSelect.append(`<option value="${t.id}">${escapeHtml(t.title)}</option>`);
                });
            }
        }

        async function load() {
            readPrefs();
            const rows = await fetchAllTasks();
            state.raw = rows;
            await populateGlobalFilters(rows);
            applyFilterSort();
        }

        // Handle global filter changes
        $(document).off('change', '#filter-contract').on('change', '#filter-contract', async function() {
            state.globalFilters.contract = $(this).val();
            state.globalFilters.team = '';
            state.globalFilters.pws = '';
            state.globalFilters.task = '';
            await updateTeamFilter();
            applyFilterSort();
        });

        $(document).off('change', '#filter-team').on('change', '#filter-team', async function() {
            state.globalFilters.team = $(this).val();
            state.globalFilters.pws = '';
            state.globalFilters.task = '';
            await updatePWSFilter();
            applyFilterSort();
        });

        $(document).off('change', '#filter-pws').on('change', '#filter-pws', async function() {
            state.globalFilters.pws = $(this).val();
            state.globalFilters.task = '';
            await updateTaskFilter();
            applyFilterSort();
        });

        $(document).off('change', '#filter-task').on('change', '#filter-task', function() {
            state.globalFilters.task = $(this).val();
            applyFilterSort();
        });

        // Handle status and sort filter changes
        $(document).off('change', '#filter-status').on('change', '#filter-status', function() {
            applyFilterSort();
        });

        $(document).off('change', '#sort-by').on('change', '#sort-by', function() {
            applyFilterSort();
        });

        load();
    }

    // --- TEAM LEAD DASHBOARD ---
    function initializeTeamLeadDashboard() {
        // Team Lead sees their team's tasks and can assign tasks
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">Team Lead Dashboard</h2>
                <div>
                    <a href="#review" class="btn btn-primary me-2">Review Queue</a>
                    <button id="assign-task-btn" class="btn btn-success">Assign Task</button>
                </div>
            </div>
            <p class="text-muted">View and manage your team's tasks. Use the Review Queue to approve submissions.</p>
            <div class="alert alert-info">
                <strong>Note:</strong> Full Team Lead dashboard with task assignment will be implemented in Phase 5.
            </div>
        `;
        $('#main-content').html(container);
    }

    // --- REPORTING VIEW (PM/APM) ---
    function initializeReportingView() {
        // PM/APM sees monthly reports for their contracts
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">Monthly Reporting</h2>
            </div>
            <p class="text-muted">Review and approve monthly reports for your contracts.</p>
            <div class="alert alert-info">
                <strong>Note:</strong> PM/APM reporting dashboard will be implemented in Phase 7.
            </div>
        `;
        $('#main-content').html(container);
    }

    // --- REVIEW QUEUE ---
    async function initializeReviewQueue() {
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">Review Queue</h2>
            </div>
            <div class="table-responsive">
                <table class="table table-striped align-middle" id="review-table">
                    <thead>
                        <tr>
                            <th>Task Name</th>
                            <th>PWS Line Item</th>
                            <th>Submitted By</th>
                            <th>All Assignees</th>
                            <th>Submitted At</th>
                            <th>% Complete</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <div class="modal fade" id="review-detail-modal" tabindex="-1" aria-labelledby="reviewDetailModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="reviewDetailModalLabel">Review Submission</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="review-form-error" class="alert alert-danger" style="display: none;"></div>
                            <div id="review-details"></div>
                            <form id="review-form">
                                <input type="hidden" id="review-update-id" />
                                <div class="mb-3">
                                    <label for="review-narrative" class="form-label">Narrative</label>
                                    <textarea id="review-narrative" class="form-control" rows="3"></textarea>
                                    <small class="form-text text-muted">You can modify the narrative before approving.</small>
                                </div>
                                <div class="mb-3">
                                    <label for="review-percent" class="form-label">% Complete</label>
                                    <input id="review-percent" type="number" min="0" max="100" class="form-control" />
                                </div>
                                <div class="mb-3">
                                    <label for="review-blockers" class="form-label">Blockers</label>
                                    <textarea id="review-blockers" class="form-control" rows="2"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="review-short-status" class="form-label">Short Status</label>
                                    <select id="review-short-status" class="form-select">
                                        <option value="In Progress">In Progress</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Complete">Complete</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="review-comments" class="form-label">Comments</label>
                                    <textarea id="review-comments" class="form-control" rows="2" placeholder="Optional comments for the team member"></textarea>
                                </div>
                                <div class="d-flex gap-2">
                                    <button type="button" id="approve-btn" class="btn btn-success">Approve</button>
                                    <button type="button" id="approve-with-changes-btn" class="btn btn-primary">Approve with Changes</button>
                                    <button type="button" id="reject-btn" class="btn btn-danger">Reject</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('#main-content').html(container);

        const state = { submissions: [] };

        function escapeHtml(s) {
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function formatDateTime(d) {
            if (!d) return '';
            const dt = new Date(d);
            return isNaN(dt.getTime()) ? '' : dt.toLocaleString();
        }

        async function fetchPendingSubmissions() {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session ? sessionData.session.user : null;
            if (!user) return [];

            // Get current user's profile to check role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profile || profile.role !== 'Team Lead') {
                return [];
            }

            // Get teams where user is a lead (v3 schema)
            const { data: leadTeams } = await supabase
                .from('team_memberships')
                .select('team_id')
                .eq('user_id', user.id)
                .eq('role_in_team', 'lead');

            if (!leadTeams || leadTeams.length === 0) return [];

            const teamIds = leadTeams.map(t => t.team_id);

            // Get all team members from these teams
            const { data: teamMemberships } = await supabase
                .from('team_memberships')
                .select(`
                    user_id,
                    profiles:user_id (
                        id,
                        full_name
                    )
                `)
                .in('team_id', teamIds);

            if (!teamMemberships || teamMemberships.length === 0) return [];

            const teamMembers = teamMemberships.map(tm => ({
                id: tm.profiles.id,
                full_name: tm.profiles.full_name
            }));

            const teamMemberIds = teamMembers.map(m => m.id);
            const teamMemberMap = {};
            teamMembers.forEach(m => {
                teamMemberMap[m.id] = m.full_name;
            });

            // Get pending task statuses from team members
            const { data: statuses, error } = await supabase
                .from('task_statuses')
                .select('id, task_id, submitted_by, narrative, percent_complete, blockers, submitted_at, report_month')
                .eq('lead_review_status', 'pending')
                .in('submitted_by', teamMemberIds)
                .order('submitted_at', { ascending: false });

            if (error) {
                console.error('Error fetching submissions:', error);
                return [];
            }

            if (!statuses || statuses.length === 0) return [];

            // Get task details for all statuses
            const taskIds = [...new Set(statuses.map(s => s.task_id))];
            const { data: tasks } = await supabase
                .from('tasks')
                .select(`
                    id,
                    title,
                    status_short,
                    pws_line_items (
                        code,
                        title
                    )
                `)
                .in('id', taskIds);

            const taskMap = {};
            if (tasks) {
                tasks.forEach(t => {
                    const pwsLineItem = t.pws_line_items;
                    taskMap[t.id] = {
                        task_name: t.title,
                        status_short: t.status_short,
                        pws_line_item: pwsLineItem ? `${pwsLineItem.code} - ${pwsLineItem.title}` : 'N/A'
                    };
                });
            }
            
            // Get all assignees for each task to show multi-assignee info
            const assigneesMap = {};
            for (const taskId of taskIds) {
                const { data: assignments } = await supabase
                    .from('task_assignments')
                    .select('user_id')
                    .eq('task_id', taskId);
                
                if (assignments && assignments.length > 0) {
                    const userIds = assignments.map(a => a.user_id);
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .in('id', userIds);
                    
                    if (profiles) {
                        assigneesMap[taskId] = profiles.map(p => ({
                            id: p.id,
                            name: p.full_name || 'Unknown'
                        }));
                    }
                }
            }

            return statuses.map(s => {
                const taskInfo = taskMap[s.task_id] || { task_name: 'Unknown Task', status_short: '', pws_line_item: 'N/A' };
                const assignees = assigneesMap[s.task_id] || [];
                const assigneeNames = assignees.map(a => a.name).join(', ') || 'Unassigned';
                const isMultiAssignee = assignees.length > 1;
                
                return {
                    ...s,
                    task_name: taskInfo.task_name,
                    status_short: taskInfo.status_short,
                    pws_line_item: taskInfo.pws_line_item,
                    submitted_by_name: teamMemberMap[s.submitted_by] || 'Unknown User',
                    all_assignees: assigneeNames,
                    is_multi_assignee: isMultiAssignee,
                    assignee_count: assignees.length
                };
            });
        }

        function renderTable() {
            const tbody = $('#review-table tbody');
            tbody.empty();
            if (!state.submissions.length) {
                tbody.append('<tr><td colspan="7" class="text-muted">No pending submissions.</td></tr>');
                return;
            }
            for (const s of state.submissions) {
                const multiAssigneeBadge = s.is_multi_assignee ? `<span class="badge bg-info ms-1" title="${s.assignee_count} assignees">${s.assignee_count}</span>` : '';
                const tr = `
                    <tr>
                        <td>${escapeHtml(s.task_name)}</td>
                        <td><small>${escapeHtml(s.pws_line_item)}</small></td>
                        <td>${escapeHtml(s.submitted_by_name)}</td>
                        <td>${escapeHtml(s.all_assignees)}${multiAssigneeBadge}</td>
                        <td>${formatDateTime(s.submitted_at)}</td>
                        <td>${s.percent_complete != null ? s.percent_complete + '%' : ''}</td>
                        <td><button class="btn btn-sm btn-primary review-btn" data-id="${s.id}">Review</button></td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        async function load() {
            const submissions = await fetchPendingSubmissions();
            state.submissions = submissions;
            renderTable();
        }

        function openReviewModal(updateId) {
            const submission = state.submissions.find(s => s.id === updateId);
            if (!submission) return;

            $('#review-update-id').val(submission.id);
            $('#review-narrative').val(submission.narrative || '');
            $('#review-percent').val(submission.percent_complete || '');
            $('#review-blockers').val(submission.blockers || '');
            $('#review-short-status').val(submission.short_status || 'In Progress');
            $('#review-comments').val('');

            const multiAssigneeInfo = submission.is_multi_assignee 
                ? `<div class="alert alert-info"><strong>Multi-Assignee Task:</strong> This task has ${submission.assignee_count} assignees: ${escapeHtml(submission.all_assignees)}</div>` 
                : '';
            
            const details = `
                <div class="mb-3">
                    <strong>Task:</strong> ${escapeHtml(submission.task_name)}<br>
                    <strong>PWS Line Item:</strong> ${escapeHtml(submission.pws_line_item)}<br>
                    <strong>Submitted By:</strong> ${escapeHtml(submission.submitted_by_name)}<br>
                    <strong>Report Month:</strong> ${submission.report_month}<br>
                    <strong>Submitted At:</strong> ${formatDateTime(submission.submitted_at)}
                </div>
                ${multiAssigneeInfo}
            `;
            $('#review-details').html(details);

            const modalEl = document.getElementById('review-detail-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }

        async function processReview(action) {
            const statusId = $('#review-update-id').val();
            const comments = $('#review-comments').val().trim();
            
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session ? sessionData.session.user : null;
            if (!user) {
                $('#review-form-error').text('You must be logged in to review submissions.').show();
                return false;
            }

            let newReviewStatus = 'pending';

            if (action === 'approve' || action === 'approve_with_changes') {
                newReviewStatus = 'approved';
                
                // If approving with changes, update the submission with modified values
                if (action === 'approve_with_changes') {
                    const narrative = $('#review-narrative').val().trim();
                    const percent = $('#review-percent').val();
                    const blockers = $('#review-blockers').val().trim();
                    const shortStatus = $('#review-short-status').val();

                    const { error: updateError } = await supabase
                        .from('task_statuses')
                        .update({
                            narrative: narrative,
                            percent_complete: percent ? parseInt(percent, 10) : null,
                            blockers: blockers || null
                        })
                        .eq('id', statusId);

                    if (updateError) {
                        $('#review-form-error').text('Error updating submission: ' + updateError.message).show();
                        return false;
                    }
                    
                    // Update task's short status
                    const submission = state.submissions.find(s => s.id === statusId);
                    if (submission && shortStatus) {
                        await supabase
                            .from('tasks')
                            .update({ status_short: shortStatus })
                            .eq('id', submission.task_id);
                    }
                }
            } else if (action === 'reject') {
                newReviewStatus = 'rejected';
                if (!comments) {
                    $('#review-form-error').text('Comments are required when rejecting a submission.').show();
                    return false;
                }
            }

            // Update the lead review status
            const { error: statusError } = await supabase
                .from('task_statuses')
                .update({ 
                    lead_review_status: newReviewStatus,
                    lead_reviewer: user.id,
                    lead_reviewed_at: new Date().toISOString(),
                    lead_review_comment: comments || null
                })
                .eq('id', statusId);

            if (statusError) {
                $('#review-form-error').text('Error updating review status: ' + statusError.message).show();
                return false;
            }

            // Phase 5 Feature: Auto-queue approved statuses for monthly reporting
            if (newReviewStatus === 'approved') {
                const submission = state.submissions.find(s => s.id === statusId);
                if (submission) {
                    // Get the contract_id for this task
                    const { data: taskData } = await supabase
                        .from('tasks')
                        .select(`
                            pws_line_items (
                                contract_id
                            )
                        `)
                        .eq('id', submission.task_id)
                        .single();
                    
                    if (taskData && taskData.pws_line_items) {
                        const contractId = taskData.pws_line_items.contract_id;
                        
                        // Add to report_queue (unique constraint prevents duplicates)
                        const { error: queueError } = await supabase
                            .from('report_queue')
                            .insert([{
                                contract_id: contractId,
                                report_month: submission.report_month,
                                task_status_id: statusId
                            }]);
                        
                        // Silently ignore duplicate errors (23505 is PostgreSQL unique violation)
                        if (queueError && !queueError.message.includes('duplicate') && !queueError.code === '23505') {
                            console.warn('Error adding to report queue:', queueError);
                        }
                    }
                }
            }

            return true;
        }

        function closeModal() {
            const modalEl = document.getElementById('review-detail-modal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
        }

        // Event handlers
        $(document).off('click', '.review-btn').on('click', '.review-btn', function() {
            const updateId = $(this).data('id');
            openReviewModal(updateId);
        });

        $(document).off('click', '#approve-btn').on('click', '#approve-btn', async function() {
            const success = await processReview('approve');
            if (success) {
                closeModal();
                alert('Submission approved successfully!');
                load();
            }
        });

        $(document).off('click', '#approve-with-changes-btn').on('click', '#approve-with-changes-btn', async function() {
            const success = await processReview('approve_with_changes');
            if (success) {
                closeModal();
                alert('Submission approved with changes!');
                load();
            }
        });

        $(document).off('click', '#reject-btn').on('click', '#reject-btn', async function() {
            const comments = $('#review-comments').val().trim();
            if (!comments) {
                $('#review-form-error').text('Please provide comments when rejecting a submission.').show();
                return;
            }
            const success = await processReview('reject');
            if (success) {
                closeModal();
                alert('Submission rejected.');
                load();
            }
        });

        load();
    }

    // --- ADMIN PANEL ---
    async function initializeAdminPanel() {
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">Admin Panel</h2>
            </div>
            
            <ul class="nav nav-tabs mb-3" id="admin-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="users-tab" data-bs-toggle="tab" data-bs-target="#users-panel" type="button" role="tab">Users</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="requests-tab" data-bs-toggle="tab" data-bs-target="#requests-panel" type="button" role="tab">Account Requests</button>
                </li>
            </ul>
            
            <div class="tab-content" id="admin-tab-content">
                <div class="tab-pane fade show active" id="users-panel" role="tabpanel">
                    <h4>User Management</h4>
                    <div class="table-responsive">
                        <table class="table table-striped align-middle" id="users-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Full Name</th>
                                    <th>Role</th>
                                    <th>Team</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="tab-pane fade" id="requests-panel" role="tabpanel">
                    <h4>Pending Account Requests</h4>
                    <div class="table-responsive">
                        <table class="table table-striped align-middle" id="requests-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Reason</th>
                                    <th>Requested At</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Edit Role Modal -->
            <div class="modal fade" id="edit-role-modal" tabindex="-1" aria-labelledby="editRoleModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="editRoleModalLabel">Edit User Role</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="role-form-error" class="alert alert-danger" style="display: none;"></div>
                            <form id="edit-role-form">
                                <input type="hidden" id="edit-user-id" />
                                <div class="mb-3">
                                    <label class="form-label"><strong>User:</strong></label>
                                    <p id="edit-user-name"></p>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-role" class="form-label">Role</label>
                                    <select id="edit-role" class="form-select" required>
                                        <option value="Team Member">Team Member</option>
                                        <option value="Team Lead">Team Lead</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Report Approver">Report Approver</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-team" class="form-label">Team</label>
                                    <input type="text" id="edit-team" class="form-control" placeholder="e.g., Alpha, Bravo" />
                                </div>
                                <button type="submit" class="btn btn-primary">Update Role</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Approve Account Modal -->
            <div class="modal fade" id="approve-account-modal" tabindex="-1" aria-labelledby="approveAccountModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="approveAccountModalLabel">Approve Account Request</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="approve-form-error" class="alert alert-danger" style="display: none;"></div>
                            <form id="approve-account-form">
                                <input type="hidden" id="approve-request-id" />
                                <div class="mb-3">
                                    <label class="form-label"><strong>Name:</strong></label>
                                    <p id="approve-request-name"></p>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label"><strong>Email:</strong></label>
                                    <p id="approve-request-email"></p>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label"><strong>Reason:</strong></label>
                                    <p id="approve-request-reason"></p>
                                </div>
                                <div class="mb-3">
                                    <label for="approve-password" class="form-label">Initial Password</label>
                                    <input type="password" id="approve-password" class="form-control" required placeholder="Set initial password for user" />
                                    <small class="form-text text-muted">User will be able to change this after first login.</small>
                                </div>
                                <div class="mb-3">
                                    <label for="approve-role" class="form-label">Role</label>
                                    <select id="approve-role" class="form-select" required>
                                        <option value="Team Member">Team Member</option>
                                        <option value="Team Lead">Team Lead</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Report Approver">Report Approver</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="approve-team" class="form-label">Team</label>
                                    <input type="text" id="approve-team" class="form-control" placeholder="e.g., Alpha, Bravo" />
                                </div>
                                <button type="submit" class="btn btn-success">Approve & Create User</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('#main-content').html(container);

        const state = { users: [], requests: [] };

        function escapeHtml(s) {
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function formatDateTime(d) {
            if (!d) return '';
            const dt = new Date(d);
            return isNaN(dt.getTime()) ? '' : dt.toLocaleString();
        }

        // Check if current user is admin
        async function checkAdminAccess() {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session ? sessionData.session.user : null;
            if (!user) return false;

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profile || profile.role !== 'Admin') {
                $('#main-content').html('<div class="alert alert-danger">Access Denied: Admin privileges required.</div>');
                return false;
            }

            return true;
        }

        async function fetchUsers() {
            // Fetch all users from profiles
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, full_name, role, team, created_at, disabled')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
                return [];
            }

            // Get auth users to get email addresses
            // Note: We can't directly query auth.users from client, so we'll use the profile data
            // In a real implementation, you might need a server-side function to get emails
            return profiles || [];
        }

        async function fetchAccountRequests() {
            const { data: requests, error } = await supabase
                .from('account_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching account requests:', error);
                return [];
            }

            return requests || [];
        }

        function renderUsersTable() {
            const tbody = $('#users-table tbody');
            tbody.empty();
            if (!state.users.length) {
                tbody.append('<tr><td colspan="6" class="text-muted">No users found.</td></tr>');
                return;
            }
            for (const u of state.users) {
                const isDisabled = u.disabled || false;
                const disabledBadge = isDisabled ? '<span class="badge bg-secondary ms-2">Disabled</span>' : '';
                const disableButtonText = isDisabled ? 'Enable' : 'Disable';
                const disableButtonClass = isDisabled ? 'btn-success' : 'btn-warning';
                
                const tr = `
                    <tr class="${isDisabled ? 'table-secondary' : ''}">
                        <td>${escapeHtml(u.id.substring(0, 8))}...</td>
                        <td>${escapeHtml(u.full_name || 'N/A')}${disabledBadge}</td>
                        <td>${escapeHtml(u.role || 'Team Member')}</td>
                        <td>${escapeHtml(u.team || 'N/A')}</td>
                        <td>${formatDateTime(u.created_at)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary edit-role-btn" data-id="${u.id}" data-name="${escapeHtml(u.full_name || 'User')}" data-role="${escapeHtml(u.role || 'Team Member')}" data-team="${escapeHtml(u.team || '')}">Edit Role</button>
                            <button class="btn btn-sm ${disableButtonClass} ms-1 toggle-disable-btn" data-id="${u.id}" data-name="${escapeHtml(u.full_name || 'User')}" data-disabled="${isDisabled}">${disableButtonText}</button>
                            <button class="btn btn-sm btn-danger ms-1 delete-user-btn" data-id="${u.id}" data-name="${escapeHtml(u.full_name || 'User')}">Delete</button>
                        </td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        function renderRequestsTable() {
            const tbody = $('#requests-table tbody');
            tbody.empty();
            if (!state.requests.length) {
                tbody.append('<tr><td colspan="6" class="text-muted">No pending requests.</td></tr>');
                return;
            }
            for (const r of state.requests) {
                const tr = `
                    <tr>
                        <td>${escapeHtml(r.name)}</td>
                        <td>${escapeHtml(r.email)}</td>
                        <td>${escapeHtml(r.reason || 'N/A')}</td>
                        <td>${formatDateTime(r.created_at)}</td>
                        <td><span class="badge bg-warning">${escapeHtml(r.status)}</span></td>
                        <td>
                            <button class="btn btn-sm btn-success approve-request-btn" data-id="${r.id}" data-name="${escapeHtml(r.name)}" data-email="${escapeHtml(r.email)}" data-reason="${escapeHtml(r.reason || '')}">Approve</button>
                            <button class="btn btn-sm btn-danger reject-request-btn" data-id="${r.id}">Reject</button>
                        </td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        async function load() {
            const hasAccess = await checkAdminAccess();
            if (!hasAccess) return;

            state.users = await fetchUsers();
            state.requests = await fetchAccountRequests();
            renderUsersTable();
            renderRequestsTable();
        }

        // Event handler: Edit Role button
        $(document).off('click', '.edit-role-btn').on('click', '.edit-role-btn', function() {
            const userId = $(this).data('id');
            const userName = $(this).data('name');
            const userRole = $(this).data('role');
            const userTeam = $(this).data('team');

            $('#edit-user-id').val(userId);
            $('#edit-user-name').text(userName);
            $('#edit-role').val(userRole);
            $('#edit-team').val(userTeam);
            $('#role-form-error').hide();

            const modalEl = document.getElementById('edit-role-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        // Event handler: Edit Role form submit
        $(document).off('submit', '#edit-role-form').on('submit', '#edit-role-form', async function(e) {
            e.preventDefault();

            const userId = $('#edit-user-id').val();
            const newRole = $('#edit-role').val();
            const newTeam = $('#edit-team').val().trim();

            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole, team: newTeam || null })
                .eq('id', userId);

            if (error) {
                $('#role-form-error').text('Error updating role: ' + error.message).show();
                return;
            }

            const modalEl = document.getElementById('edit-role-modal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            alert('User role updated successfully!');
            load(); // Reload data
        });

        // Event handler: Approve Request button
        $(document).off('click', '.approve-request-btn').on('click', '.approve-request-btn', function() {
            const requestId = $(this).data('id');
            const requestName = $(this).data('name');
            const requestEmail = $(this).data('email');
            const requestReason = $(this).data('reason');

            $('#approve-request-id').val(requestId);
            $('#approve-request-name').text(requestName);
            $('#approve-request-email').text(requestEmail);
            $('#approve-request-reason').text(requestReason);
            $('#approve-password').val('');
            $('#approve-role').val('Team Member');
            $('#approve-team').val('');
            $('#approve-form-error').hide();

            const modalEl = document.getElementById('approve-account-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        // Event handler: Approve Account form submit
        $(document).off('submit', '#approve-account-form').on('submit', '#approve-account-form', async function(e) {
            e.preventDefault();

            const requestId = $('#approve-request-id').val();
            const email = $('#approve-request-email').text();
            const name = $('#approve-request-name').text();
            const password = $('#approve-password').val();
            const role = $('#approve-role').val();
            const team = $('#approve-team').val().trim();

            // Try to sign up the user (this will create them in Supabase Auth)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (authError) {
                $('#approve-form-error').text('Error creating user: ' + authError.message).show();
                return;
            }

            if (!authData.user) {
                $('#approve-form-error').text('Error: User was not created. Please try again.').show();
                return;
            }

            // Create profile for the user
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: authData.user.id,
                    full_name: name,
                    role: role,
                    team: team || null,
                    account_request_id: requestId
                }]);

            if (profileError) {
                $('#approve-form-error').text('Error creating profile: ' + profileError.message).show();
                return;
            }

            // Update account request status
            const { data: sessionData } = await supabase.auth.getSession();
            const currentUserId = sessionData.session ? sessionData.session.user.id : null;
            
            const { error: updateError } = await supabase
                .from('account_requests')
                .update({ 
                    status: 'approved',
                    approved_by: currentUserId,
                    approved_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (updateError) {
                console.error('Error updating request status:', updateError);
            }

            const modalEl = document.getElementById('approve-account-modal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            alert('Account approved and user created successfully!');
            load(); // Reload data
        });

        // Event handler: Reject Request button
        $(document).off('click', '.reject-request-btn').on('click', '.reject-request-btn', async function() {
            const requestId = $(this).data('id');
            
            if (!confirm('Are you sure you want to reject this account request?')) {
                return;
            }

            const { error } = await supabase
                .from('account_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);

            if (error) {
                alert('Error rejecting request: ' + error.message);
                return;
            }

            alert('Account request rejected.');
            load(); // Reload data
        });

        // Event handler: Toggle Disable/Enable User button
        $(document).off('click', '.toggle-disable-btn').on('click', '.toggle-disable-btn', async function() {
            const userId = $(this).data('id');
            const userName = $(this).data('name');
            const isCurrentlyDisabled = $(this).data('disabled') === true || $(this).data('disabled') === 'true';
            const newDisabledState = !isCurrentlyDisabled;
            const action = newDisabledState ? 'disable' : 'enable';
            
            if (!confirm(`Are you sure you want to ${action} user "${userName}"?`)) {
                return;
            }

            // Note: Supabase doesn't allow disabling users from client SDK
            // We'll mark them as disabled in the profile instead
            const { error } = await supabase
                .from('profiles')
                .update({ disabled: newDisabledState })
                .eq('id', userId);

            if (error) {
                alert(`Error ${action}ing user: ` + error.message);
                return;
            }

            alert(`User ${action}d successfully.${newDisabledState ? ' Note: To fully prevent login, you should also delete the user from Supabase Dashboard > Authentication > Users.' : ''}`);
            load(); // Reload data
        });

        // Event handler: Delete User button
        $(document).off('click', '.delete-user-btn').on('click', '.delete-user-btn', async function() {
            const userId = $(this).data('id');
            const userName = $(this).data('name');
            
            if (!confirm(`Are you sure you want to DELETE user "${userName}"? This action cannot be undone!`)) {
                return;
            }

            // Double confirmation for delete
            if (!confirm('This will permanently delete the user and all their data. Are you absolutely sure?')) {
                return;
            }

            // First delete the profile
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (profileError) {
                alert('Error deleting user profile: ' + profileError.message);
                return;
            }

            // Note: We cannot delete from auth.users via client SDK
            // The admin must delete from Supabase Dashboard: Authentication -> Users
            alert('User profile deleted successfully. IMPORTANT: You must also delete this user from Supabase Dashboard > Authentication > Users to complete the deletion.');
            load(); // Reload data
        });

        load();
    }

    // --- AUTHENTICATION ---
    async function checkSession() {
        const { data } = await supabase.auth.getSession();
        currentUser = data.session ? data.session.user : null;
        await updateUI();
        router(); // Route after checking auth status
    }

    async function updateUI() {
        if (currentUser) {
            $('#login-btn').hide();
            $('#logout-btn').show();
            
            // Update navigation based on user role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentUser.id)
                .single();
            
            const nav = $('#main-nav');
            nav.empty();
            nav.append('<li class="nav-item"><a href="#dashboard" class="nav-link">Dashboard</a></li>');
            
            if (profile && (profile.role === 'Team Lead' || profile.role === 'Admin')) {
                nav.append('<li class="nav-item"><a href="#review" class="nav-link">Review Queue</a></li>');
            }
            
            if (profile && (profile.role === 'Report Approver' || profile.role === 'Admin')) {
                nav.append('<li class="nav-item"><a href="#reporting" class="nav-link">Reporting</a></li>');
            }
            
            if (profile && profile.role === 'Admin') {
                nav.append('<li class="nav-item"><a href="#admin" class="nav-link">Admin Panel</a></li>');
            }
        } else {
            $('#login-btn').show();
            $('#logout-btn').hide();
            $('#main-nav').empty();
        }
    }

    // --- EVENT HANDLERS ---
    $(document).on('submit', '#login-form', async function(e) {
        e.preventDefault();
        const email = $('#email').val();
        const password = $('#password').val();
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                $('#error-message').text(error.message).show();
            } else {
                currentUser = data.user;
                await updateUI();
                // Set hash to empty to trigger role-based default landing
                window.location.hash = '';
                // Explicitly call router to ensure role-based routing happens
                await router();
            }
        } catch (err) {
            $('#error-message').text('An error occurred during login: ' + err.message).show();
        }
    });

    $(document).on('click', '#logout-btn', async function() {
        await supabase.auth.signOut();
        currentUser = null;
        await updateUI();
        window.location.hash = ''; // Go to login page - hashchange event will trigger router
    });

    $(document).on('submit', '#request-account-form', async function(e) {
        e.preventDefault();
        const name = $('#request-name').val();
        const email = $('#request-email').val();
        const reason = $('#request-reason').val();

        const { data, error } = await supabase
            .from('account_requests')
            .insert([{ name, email, reason }]);

        if (error) {
            alert('Error submitting request: ' + error.message);
        } else {
            alert('Your account request has been submitted for approval.');
            $('#request-account-modal').modal('hide');
            $(this).trigger('reset');
        }
    });

    // --- APP START ---
    $('#app').html(appLayout);
    checkSession();
    $(window).on('hashchange', router);
});
