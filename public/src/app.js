// Custom JavaScript for MSR Webform Application

$(document).ready(function() {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://rzwmnvbcwfbvwmsgfave.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6d21udmJjd2Zidndtc2dmYXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjA4ODYsImV4cCI6MjA3NTkzNjg4Nn0.JE2Kzye0h17SpBIo8A_qbyrfIFyY2JwQrRQ5mFaVXGY';

    // --- INITIALIZATION ---
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.msrSupabase = supabase; // expose for console diagnostics
    let currentUser = null;
    
    // --- UTILITY FUNCTIONS ---
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

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
            
            <!-- Lock Status Alert -->
            <div id="lock-status-alert" class="alert alert-warning d-none" role="alert">
                <i class="bi bi-lock-fill"></i> <strong>Reporting Period Locked:</strong> 
                <span id="lock-status-message"></span>
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

        async function checkLockedReports() {
            // Check if any contracts have locked reports for current month
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            
            const { data: lockedReports, error } = await supabase
                .from('monthly_reports')
                .select(`
                    id,
                    contract_id,
                    pm_review_status,
                    contracts (
                        name
                    )
                `)
                .eq('report_month', currentMonth)
                .in('pm_review_status', ['approved', 'approved-with-changes']);
            
            if (error) {
                console.error('Error checking locked reports:', error);
                return;
            }
            
            if (lockedReports && lockedReports.length > 0) {
                const contractNames = lockedReports.map(r => r.contracts.name).join(', ');
                $('#lock-status-message').text(`The following contracts have finalized reports for this month: ${contractNames}. Contact your PM/APM to re-open if changes are needed.`);
                $('#lock-status-alert').removeClass('d-none');
                
                // Disable the create update button
                $('#new-update-btn').prop('disabled', true).attr('title', 'Reporting period is locked');
            } else {
                $('#lock-status-alert').addClass('d-none');
                $('#new-update-btn').prop('disabled', false).removeAttr('title');
            }
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
            await checkLockedReports(); // Check for locked reports first
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
            
            // Check if report is locked (approved or approved-with-changes)
            // First get the contract_id for this task
            const { data: taskData } = await supabase
                .from('tasks')
                .select('pws_line_items(contract_id)')
                .eq('id', taskId)
                .single();
            
            if (taskData && taskData.pws_line_items) {
                const { data: lockedReport } = await supabase
                    .from('monthly_reports')
                    .select('id, pm_review_status')
                    .eq('contract_id', taskData.pws_line_items.contract_id)
                    .eq('report_month', reportMonth)
                    .in('pm_review_status', ['approved', 'approved-with-changes'])
                    .maybeSingle();
                
                if (lockedReport) {
                    $('#update-form-error').text('This reporting period has been finalized and is locked. No further submissions are allowed.').show();
                    return false;
                }
            }
            
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
    async function initializeTeamLeadDashboard() {
        // Team Lead sees their team's tasks and can assign tasks
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">Team Lead Dashboard</h2>
                <div>
                    <a href="#review" class="btn btn-primary me-2">Review Queue</a>
                    <button id="assign-task-btn" class="btn btn-success" disabled>Assign Task</button>
                </div>
            </div>
            <p class="text-muted">View and manage your team's tasks. Use the Review Queue to approve submissions.</p>
            
            <div class="table-responsive">
                <table class="table table-striped align-middle" id="team-tasks-table">
                    <thead>
                        <tr>
                            <th>Task Name</th>
                            <th>PWS Line Item</th>
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th>% Complete</th>
                            <th>Latest Update</th>
                            <th>Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="7" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        $('#main-content').html(container);
        
        // Load team tasks
        await loadTeamTasks();
    }
    
    async function loadTeamTasks() {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session ? sessionData.session.user : null;
        if (!user) return;
        
        // Get teams where user is a lead
        const { data: leadTeams } = await supabase
            .from('team_memberships')
            .select('team_id')
            .eq('user_id', user.id)
            .eq('role_in_team', 'lead');
        
        if (!leadTeams || leadTeams.length === 0) {
            $('#team-tasks-table tbody').html('<tr><td colspan="7" class="text-muted">You are not a lead of any team.</td></tr>');
            return;
        }
        
        const teamIds = leadTeams.map(t => t.team_id);
        
        // Get all team members from these teams
        const { data: teamMemberships } = await supabase
            .from('team_memberships')
            .select('user_id')
            .in('team_id', teamIds);
        
        if (!teamMemberships || teamMemberships.length === 0) {
            $('#team-tasks-table tbody').html('<tr><td colspan="7" class="text-muted">No team members found.</td></tr>');
            return;
        }
        
        const teamMemberIds = teamMemberships.map(tm => tm.user_id);
        
        // Get profiles for team members
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', teamMemberIds);
        
        // Get all tasks assigned to team members
        const { data: assignments } = await supabase
            .from('task_assignments')
            .select(`
                task_id,
                user_id,
                tasks (
                    id,
                    title,
                    status_short,
                    due_date,
                    pws_line_items (
                        code,
                        title
                    )
                )
            `)
            .in('user_id', teamMemberIds);
        
        if (!assignments || assignments.length === 0) {
            $('#team-tasks-table tbody').html('<tr><td colspan="7" class="text-muted">No tasks assigned to team members.</td></tr>');
            return;
        }
        
        // Get latest approved statuses for these tasks
        const taskIds = [...new Set(assignments.map(a => a.task_id))];
        const { data: statuses } = await supabase
            .from('task_statuses')
            .select('task_id, submitted_by, narrative, percent_complete, submitted_at, lead_review_status')
            .in('task_id', taskIds)
            .eq('lead_review_status', 'approved')
            .order('submitted_at', { ascending: false });
        
        // Build task map with latest status
        const taskStatusMap = {};
        if (statuses) {
            statuses.forEach(s => {
                const key = `${s.task_id}_${s.submitted_by}`;
                if (!taskStatusMap[key]) {
                    taskStatusMap[key] = s;
                }
            });
        }
        
        // Build user map
        const userMap = {};
        if (profiles) {
            profiles.forEach(p => {
                userMap[p.id] = p.full_name || 'Unknown';
            });
        }
        
        // Render table
        const tbody = $('#team-tasks-table tbody');
        tbody.empty();
        
        assignments.forEach(a => {
            const task = a.tasks;
            const pwsLineItem = task.pws_line_items;
            const assignedTo = userMap[a.user_id] || 'Unknown';
            const statusKey = `${a.task_id}_${a.user_id}`;
            const latestStatus = taskStatusMap[statusKey];
            
            const row = `
                <tr>
                    <td>${escapeHtml(task.title)}</td>
                    <td>${pwsLineItem ? escapeHtml(`${pwsLineItem.code} - ${pwsLineItem.title}`) : 'N/A'}</td>
                    <td>${escapeHtml(assignedTo)}</td>
                    <td><span class="badge bg-secondary">${escapeHtml(task.status_short || 'N/A')}</span></td>
                    <td>${latestStatus ? latestStatus.percent_complete + '%' : 'N/A'}</td>
                    <td>${latestStatus ? escapeHtml(latestStatus.narrative.substring(0, 50) + '...') : 'No updates'}</td>
                    <td>${task.due_date || 'N/A'}</td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    // --- REPORTING VIEW (PM/APM) ---
    async function initializeReportingView() {
        // PM/APM sees monthly reports for their contracts
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">Monthly Reporting</h2>
                <button class="btn btn-primary" id="create-report-btn">
                    <i class="bi bi-plus-circle"></i> Create New Report
                </button>
            </div>
            <p class="text-muted">Review and approve monthly reports for your contracts.</p>
            
            <!-- Filters -->
            <div class="row mb-3">
                <div class="col-md-4">
                    <label for="report-contract-filter" class="form-label">Contract</label>
                    <select id="report-contract-filter" class="form-select">
                        <option value="">All Contracts</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label for="report-month-filter" class="form-label">Report Month</label>
                    <input type="month" id="report-month-filter" class="form-control">
                </div>
                <div class="col-md-4">
                    <label for="report-status-filter" class="form-label">Status</label>
                    <select id="report-status-filter" class="form-select">
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="approved-with-changes">Approved with Changes</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <!-- Reports Table -->
            <div class="table-responsive">
                <table class="table table-striped align-middle" id="reports-table">
                    <thead>
                        <tr>
                            <th>Contract</th>
                            <th>Report Month</th>
                            <th>Items in Queue</th>
                            <th>Status</th>
                            <th>Reviewed By</th>
                            <th>Reviewed At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <!-- Create Report Modal -->
            <div class="modal fade" id="reporting-create-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Create New Report</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="new-report-contract" class="form-label">Contract</label>
                                <select id="new-report-contract" class="form-select" required>
                                    <option value="">Select Contract</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="new-report-month" class="form-label">Report Month</label>
                                <input type="month" id="new-report-month" class="form-control" required>
                            </div>
                            <div class="alert alert-info">
                                <small>This will create a new monthly report for review. Items in the report queue for this contract and month will be included.</small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-new-report-btn">Create Report</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Review Report Modal -->
            <div class="modal fade" id="reporting-review-modal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Review Monthly Report</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="review-report-content">
                            <!-- Report content will be loaded here -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-success" id="approve-report-btn">Approve</button>
                            <button type="button" class="btn btn-warning" id="approve-with-changes-btn">Approve with Changes</button>
                            <button type="button" class="btn btn-danger" id="reject-report-btn">Reject</button>
                            <button type="button" class="btn btn-primary" id="export-pdf-btn">Export PDF</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#main-content').html(container);
        
        // Load contracts for filters
        await loadReportContracts();
        
        // Set default month to current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        $('#report-month-filter').val(currentMonth);
        $('#new-report-month').val(currentMonth);
        
        // Load reports
        await loadReports();
        
        // Event handlers
        $('#create-report-btn').on('click', openCreateReportModal);
        $('#save-new-report-btn').on('click', createNewReport);
        $('#report-contract-filter, #report-month-filter, #report-status-filter').on('change', loadReports);
        $('#approve-report-btn').on('click', () => reviewReport('approved'));
        $('#approve-with-changes-btn').on('click', () => reviewReport('approved-with-changes'));
        $('#reject-report-btn').on('click', () => reviewReport('rejected'));
        $('#export-pdf-btn').on('click', exportReportToPDF);
    }

    async function loadReportContracts() {
        try {
            // Get contracts for PM/APM user
            const { data: userContracts, error } = await supabase
                .from('user_contract_roles')
                .select('contract_id, contracts(id, name, code)')
                .eq('user_id', currentUser.id)
                .in('role', ['PM', 'APM']);
            
            if (error) throw error;
            
            const contracts = userContracts.map(uc => uc.contracts);
            
            // Populate contract filters
            const contractSelect = $('#report-contract-filter, #new-report-contract');
            contracts.forEach(contract => {
                contractSelect.append(`<option value="${contract.id}">${escapeHtml(contract.name)} (${escapeHtml(contract.code)})</option>`);
            });
        } catch (error) {
            console.error('Error loading contracts:', error);
            alert('Error loading contracts: ' + error.message);
        }
    }

    async function loadReports() {
        try {
            const contractFilter = $('#report-contract-filter').val();
            const monthFilter = $('#report-month-filter').val();
            const statusFilter = $('#report-status-filter').val();
            
            // Build query - don't join profiles here since pm_reviewer is FK to auth.users
            let query = supabase
                .from('monthly_reports')
                .select(`
                    *,
                    contracts(name, code)
                `)
                .order('report_month', { ascending: false });
            
            if (contractFilter) {
                query = query.eq('contract_id', contractFilter);
            }
            
            if (monthFilter) {
                const monthDate = monthFilter + '-01';
                query = query.eq('report_month', monthDate);
            }
            
            if (statusFilter) {
                query = query.eq('pm_review_status', statusFilter);
            }
            
            const { data: reports, error } = await query;
            
            if (error) throw error;
            
            // Get queue counts and reviewer names for each report
            const reportsWithCounts = await Promise.all(reports.map(async (report) => {
                const { count, error: countError } = await supabase
                    .from('report_queue')
                    .select('*', { count: 'exact', head: true })
                    .eq('contract_id', report.contract_id)
                    .eq('report_month', report.report_month);
                
                // Get reviewer name from profiles if pm_reviewer exists
                let reviewerName = null;
                if (report.pm_reviewer) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', report.pm_reviewer)
                        .single();
                    reviewerName = profileData?.full_name;
                }
                
                return {
                    ...report,
                    queueCount: countError ? 0 : count,
                    reviewerName: reviewerName
                };
            }));
            
            displayReports(reportsWithCounts);
        } catch (error) {
            console.error('Error loading reports:', error);
            alert('Error loading reports: ' + error.message);
        }
    }

    function displayReports(reports) {
        const tbody = $('#reports-table tbody');
        tbody.empty();
        
        if (reports.length === 0) {
            tbody.append('<tr><td colspan="7" class="text-center text-muted">No reports found</td></tr>');
            return;
        }
        
        reports.forEach(report => {
            const statusBadge = getStatusBadge(report.pm_review_status);
            const reviewedBy = report.reviewerName ? escapeHtml(report.reviewerName) : '-';
            const reviewedAt = report.pm_reviewed_at ? new Date(report.pm_reviewed_at).toLocaleString() : '-';
            const reportMonth = new Date(report.report_month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            
            const row = `
                <tr>
                    <td>${escapeHtml(report.contracts.name)}</td>
                    <td>${reportMonth}</td>
                    <td><span class="badge bg-info">${report.queueCount} items</span></td>
                    <td>${statusBadge}</td>
                    <td>${reviewedBy}</td>
                    <td>${reviewedAt}</td>
                    <td>
                        <button class="btn btn-sm btn-primary view-report-btn" data-report-id="${report.id}">
                            View/Review
                        </button>
                        ${report.pm_review_status === 'approved' || report.pm_review_status === 'approved-with-changes' ? 
                            `<button class="btn btn-sm btn-success export-report-btn" data-report-id="${report.id}">
                                <i class="bi bi-file-pdf"></i> Export PDF
                            </button>
                            <button class="btn btn-sm btn-warning reopen-report-btn" data-report-id="${report.id}" title="Re-open report for edits">
                                <i class="bi bi-unlock"></i> Re-open
                            </button>` : ''}
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
        
        // Attach event handlers
        $('.view-report-btn').on('click', function() {
            const reportId = $(this).data('report-id');
            openReviewReportModal(reportId);
        });
        
        $('.export-report-btn').on('click', function() {
            const reportId = $(this).data('report-id');
            exportReportToPDF(reportId);
        });
        
        $('.reopen-report-btn').on('click', function() {
            const reportId = $(this).data('report-id');
            reopenReport(reportId);
        });
    }

    function getStatusBadge(status) {
        const badges = {
            'pending': '<span class="badge bg-warning">Pending</span>',
            'approved': '<span class="badge bg-success">Approved</span>',
            'approved-with-changes': '<span class="badge bg-info">Approved with Changes</span>',
            'rejected': '<span class="badge bg-danger">Rejected</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
    }

    function openCreateReportModal() {
        const modalEl = document.getElementById('reporting-create-modal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    async function createNewReport() {
        try {
            const contractId = $('#new-report-contract').val();
            const reportMonth = $('#new-report-month').val();
            
            if (!contractId || !reportMonth) {
                alert('Please select both contract and report month');
                return;
            }
            
            const reportMonthDate = reportMonth + '-01';
            
            // Check if report already exists
            const { data: existing, error: checkError } = await supabase
                .from('monthly_reports')
                .select('id')
                .eq('contract_id', contractId)
                .eq('report_month', reportMonthDate)
                .single();
            
            if (existing) {
                alert('A report for this contract and month already exists');
                return;
            }
            
            // Create new report
            const { data: newReport, error } = await supabase
                .from('monthly_reports')
                .insert([{
                    contract_id: contractId,
                    report_month: reportMonthDate,
                    pm_review_status: 'pending'
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            const modalEl = document.getElementById('reporting-create-modal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            await loadReports();
            alert('Report created successfully');
        } catch (error) {
            console.error('Error creating report:', error);
            alert('Error creating report: ' + error.message);
        }
    }

    let currentReportId = null;
    
    async function openReviewReportModal(reportId) {
        try {
            currentReportId = reportId;
            
            // Get report details
            const { data: report, error: reportError } = await supabase
                .from('monthly_reports')
                .select(`
                    *,
                    contracts(name, code)
                `)
                .eq('id', reportId)
                .single();
            
            if (reportError) throw reportError;
            
            // Get queue items for this report
            const { data: queueItems, error: queueError } = await supabase
                .from('report_queue')
                .select(`
                    *,
                    task_statuses(
                        *,
                        tasks(
                            title,
                            pws_line_items(code, title)
                        )
                    )
                `)
                .eq('contract_id', report.contract_id)
                .eq('report_month', report.report_month);
            
            if (queueError) throw queueError;
            
            // Get submitter names for all task statuses
            const submitterIds = [...new Set(queueItems.map(item => item.task_statuses.submitted_by))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', submitterIds);
            
            const profileMap = {};
            if (profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p.full_name;
                });
            }
            
            // Group by PWS line item
            const groupedItems = {};
            queueItems.forEach(item => {
                const ts = item.task_statuses;
                const pwsCode = ts.tasks.pws_line_items.code;
                const pwsTitle = ts.tasks.pws_line_items.title;
                const key = `${pwsCode}|${pwsTitle}`;
                
                if (!groupedItems[key]) {
                    groupedItems[key] = {
                        code: pwsCode,
                        title: pwsTitle,
                        items: []
                    };
                }
                
                groupedItems[key].items.push({
                    taskTitle: ts.tasks.title,
                    submittedBy: profileMap[ts.submitted_by] || 'Unknown',
                    narrative: ts.narrative,
                    percentComplete: ts.percent_complete,
                    blockers: ts.blockers,
                    submittedAt: ts.submitted_at
                });
            });
            
            // Build report HTML
            const reportMonth = new Date(report.report_month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            let reportHtml = `
                <div class="report-preview" id="report-preview-content">
                    <h3 class="text-center mb-4">Monthly Status Report</h3>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <strong>Contract:</strong> ${escapeHtml(report.contracts.name)} (${escapeHtml(report.contracts.code)})
                        </div>
                        <div class="col-md-6">
                            <strong>Report Month:</strong> ${reportMonth}
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <strong>Status:</strong> ${getStatusBadge(report.pm_review_status)}
                        </div>
                        <div class="col-md-6">
                            <strong>Total Items:</strong> ${queueItems.length}
                        </div>
                    </div>
                    
                    ${report.pm_review_comment ? `
                        <div class="alert alert-info mb-3">
                            <strong>Review Comment:</strong> ${escapeHtml(report.pm_review_comment)}
                        </div>
                    ` : ''}
                    
                    <hr class="my-4">
            `;
            
            // Add grouped items
            Object.values(groupedItems).forEach(group => {
                reportHtml += `
                    <div class="pws-section mb-4">
                        <h5 class="bg-light p-2">${escapeHtml(group.code)} - ${escapeHtml(group.title)}</h5>
                `;
                
                group.items.forEach(item => {
                    reportHtml += `
                        <div class="task-item mb-3 ps-3">
                            <h6>${escapeHtml(item.taskTitle)}</h6>
                            <p><strong>Submitted by:</strong> ${escapeHtml(item.submittedBy)} on ${new Date(item.submittedAt).toLocaleDateString()}</p>
                            <p><strong>Progress:</strong> ${item.percentComplete}% complete</p>
                            <p><strong>Status Update:</strong></p>
                            <p class="ms-3">${escapeHtml(item.narrative || 'No narrative provided')}</p>
                            ${item.blockers ? `
                                <p><strong>Blockers:</strong></p>
                                <p class="ms-3 text-danger">${escapeHtml(item.blockers)}</p>
                            ` : ''}
                        </div>
                    `;
                });
                
                reportHtml += `</div>`;
            });
            
            reportHtml += `</div>`;
            
            // Add comment section if pending
            if (report.pm_review_status === 'pending') {
                reportHtml += `
                    <div class="mt-4">
                        <label for="pm-review-comment" class="form-label">Review Comment (required for rejection)</label>
                        <textarea class="form-control" id="pm-review-comment" rows="3"></textarea>
                    </div>
                `;
            }
            
            $('#review-report-content').html(reportHtml);
            
            // Show/hide buttons based on status
            if (report.pm_review_status === 'pending') {
                $('#approve-report-btn, #approve-with-changes-btn, #reject-report-btn').show();
                $('#export-pdf-btn').hide();
            } else {
                $('#approve-report-btn, #approve-with-changes-btn, #reject-report-btn').hide();
                $('#export-pdf-btn').show();
            }
            
            const modalEl = document.getElementById('reporting-review-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } catch (error) {
            console.error('Error loading report:', error);
            alert('Error loading report: ' + error.message);
        }
    }

    async function reviewReport(action) {
        try {
            const comment = $('#pm-review-comment').val();
            
            if (action === 'rejected' && !comment) {
                alert('Comment is required when rejecting a report');
                return;
            }
            
            const updateData = {
                pm_review_status: action,
                pm_reviewer: currentUser.id,
                pm_reviewed_at: new Date().toISOString(),
                pm_review_comment: comment || null
            };
            
            const { error } = await supabase
                .from('monthly_reports')
                .update(updateData)
                .eq('id', currentReportId);
            
            if (error) throw error;
            
            $('#review-report-modal').modal('hide');
            await loadReports();
            alert(`Report ${action.replace('-', ' ')} successfully`);
        } catch (error) {
            console.error('Error reviewing report:', error);
            alert('Error reviewing report: ' + error.message);
        }
    }

    async function reopenReport(reportId) {
        try {
            if (!confirm('Are you sure you want to re-open this report? This will allow team members to submit new status updates for this reporting period.')) {
                return;
            }
            
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session ? sessionData.session.user : null;
            if (!user) {
                alert('You must be logged in to re-open reports');
                return;
            }
            
            // Update report status back to pending
            const { error } = await supabase
                .from('monthly_reports')
                .update({
                    pm_review_status: 'pending',
                    pm_reviewer: null,
                    pm_reviewed_at: null,
                    pm_review_comment: null
                })
                .eq('id', reportId);
            
            if (error) throw error;
            
            alert('Report has been re-opened successfully. Team members can now submit updates for this period.');
            await loadReports(); // Reload the reports list
        } catch (error) {
            console.error('Error re-opening report:', error);
            alert('Error re-opening report: ' + error.message);
        }
    }

    async function exportReportToPDF(reportId) {
        try {
            // If reportId is an event object, get it from currentReportId
            if (typeof reportId === 'object') {
                reportId = currentReportId;
            }
            
            if (!reportId) {
                alert('No report selected for export');
                return;
            }
            
            // Get report details
            const { data: report, error: reportError } = await supabase
                .from('monthly_reports')
                .select(`
                    *,
                    contracts(name, code)
                `)
                .eq('id', reportId)
                .single();
            
            if (reportError) throw reportError;
            
            // Get queue items
            const { data: queueItems, error: queueError } = await supabase
                .from('report_queue')
                .select(`
                    *,
                    task_statuses(
                        *,
                        tasks(
                            title,
                            pws_line_items(code, title)
                        )
                    )
                `)
                .eq('contract_id', report.contract_id)
                .eq('report_month', report.report_month);
            
            if (queueError) throw queueError;
            
            // Get submitter names
            const submitterIds = [...new Set(queueItems.map(item => item.task_statuses.submitted_by))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', submitterIds);
            
            const profileMap = {};
            if (profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p.full_name;
                });
            }
            
            // Generate PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            let yPos = 20;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            const lineHeight = 7;
            
            // Helper function to add text with page break
            function addText(text, x, y, options = {}) {
                if (y > pageHeight - margin) {
                    doc.addPage();
                    return margin;
                }
                doc.text(text, x, y, options);
                return y;
            }
            
            // Title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            yPos = addText('Monthly Status Report', 105, yPos, { align: 'center' });
            yPos += lineHeight * 2;
            
            // Header info
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            const reportMonth = new Date(report.report_month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            yPos = addText(`Contract: ${report.contracts.name} (${report.contracts.code})`, margin, yPos);
            yPos += lineHeight;
            yPos = addText(`Report Month: ${reportMonth}`, margin, yPos);
            yPos += lineHeight;
            yPos = addText(`Status: ${report.pm_review_status}`, margin, yPos);
            yPos += lineHeight;
            yPos = addText(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
            yPos += lineHeight * 2;
            
            // Group by PWS line item
            const groupedItems = {};
            queueItems.forEach(item => {
                const ts = item.task_statuses;
                const pwsCode = ts.tasks.pws_line_items.code;
                const pwsTitle = ts.tasks.pws_line_items.title;
                const key = `${pwsCode}|${pwsTitle}`;
                
                if (!groupedItems[key]) {
                    groupedItems[key] = {
                        code: pwsCode,
                        title: pwsTitle,
                        items: []
                    };
                }
                
                groupedItems[key].items.push({
                    taskTitle: ts.tasks.title,
                    submittedBy: profileMap[ts.submitted_by] || 'Unknown',
                    narrative: ts.narrative,
                    percentComplete: ts.percent_complete,
                    blockers: ts.blockers
                });
            });
            
            // Add grouped items
            Object.values(groupedItems).forEach(group => {
                if (yPos > pageHeight - margin - 40) {
                    doc.addPage();
                    yPos = margin;
                }
                
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                yPos = addText(`${group.code} - ${group.title}`, margin, yPos);
                yPos += lineHeight;
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                
                group.items.forEach(item => {
                    if (yPos > pageHeight - margin - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    
                    doc.setFont(undefined, 'bold');
                    yPos = addText(`  ${item.taskTitle}`, margin, yPos);
                    yPos += lineHeight;
                    
                    doc.setFont(undefined, 'normal');
                    yPos = addText(`    Submitted by: ${item.submittedBy}`, margin, yPos);
                    yPos += lineHeight;
                    yPos = addText(`    Progress: ${item.percentComplete}% complete`, margin, yPos);
                    yPos += lineHeight;
                    
                    // Narrative (wrap text)
                    const narrativeLines = doc.splitTextToSize(`    ${item.narrative || 'No narrative provided'}`, 170);
                    narrativeLines.forEach(line => {
                        if (yPos > pageHeight - margin) {
                            doc.addPage();
                            yPos = margin;
                        }
                        doc.text(line, margin, yPos);
                        yPos += lineHeight;
                    });
                    
                    if (item.blockers) {
                        const blockerLines = doc.splitTextToSize(`    Blockers: ${item.blockers}`, 170);
                        blockerLines.forEach(line => {
                            if (yPos > pageHeight - margin) {
                                doc.addPage();
                                yPos = margin;
                            }
                            doc.text(line, margin, yPos);
                            yPos += lineHeight;
                        });
                    }
                    
                    yPos += lineHeight;
                });
                
                yPos += lineHeight;
            });
            
            // Save PDF
            const filename = `MSR_${report.contracts.code}_${report.report_month}.pdf`;
            doc.save(filename);
            
            alert('PDF exported successfully');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF: ' + error.message);
        }
    }

    // --- REVIEW QUEUE ---
    async function initializeReviewQueue() {
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">Review Queue</h2>
                <div>
                    <label for="status-filter" class="form-label me-2">Filter:</label>
                    <select id="status-filter" class="form-select form-select-sm" style="width: auto; display: inline-block;">
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All</option>
                    </select>
                </div>
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
                            <th>Status</th>
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

        const state = { submissions: [], currentFilter: 'pending' };

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

        function getStatusBadge(status) {
            const badges = {
                'pending': '<span class="badge rounded-pill" style="background-color: #ffc107; color: #000;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #ff9800; margin-right: 6px;"></span>Pending</span>',
                'approved': '<span class="badge rounded-pill" style="background-color: #28a745; color: #fff;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #20c997; margin-right: 6px;"></span>Approved</span>',
                'rejected': '<span class="badge rounded-pill" style="background-color: #dc3545; color: #fff;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #ff6b6b; margin-right: 6px;"></span>Rejected</span>'
            };
            return badges[status] || '<span class="badge rounded-pill bg-secondary">Unknown</span>';
        }

        async function fetchSubmissions(statusFilter = 'pending') {
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
                .select('user_id')
                .in('team_id', teamIds);

            if (!teamMemberships || teamMemberships.length === 0) return [];

            const memberUserIds = teamMemberships.map(tm => tm.user_id);
            
            // Get profiles for team members
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', memberUserIds);

            const teamMembers = profiles || [];

            const teamMemberIds = teamMembers.map(m => m.id);
            const teamMemberMap = {};
            teamMembers.forEach(m => {
                teamMemberMap[m.id] = m.full_name;
            });

            // Get task statuses from team members based on filter
            let query = supabase
                .from('task_statuses')
                .select('id, task_id, submitted_by, narrative, percent_complete, blockers, submitted_at, report_month, lead_review_status, lead_review_comment, lead_reviewed_at')
                .in('submitted_by', teamMemberIds);
            
            if (statusFilter !== 'all') {
                query = query.eq('lead_review_status', statusFilter);
            }
            
            const { data: statuses, error } = await query.order('submitted_at', { ascending: false });

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
                tbody.append('<tr><td colspan="8" class="text-muted">No submissions found.</td></tr>');
                return;
            }
            for (const s of state.submissions) {
                const multiAssigneeBadge = s.is_multi_assignee ? `<span class="badge bg-info ms-1" title="${s.assignee_count} assignees">${s.assignee_count}</span>` : '';
                const statusBadge = getStatusBadge(s.lead_review_status || 'pending');
                const reviewButton = s.lead_review_status === 'pending' 
                    ? `<button class="btn btn-sm btn-primary review-btn" data-id="${s.id}">Review</button>`
                    : `<button class="btn btn-sm btn-secondary review-btn" data-id="${s.id}">View</button>`;
                const tr = `
                    <tr>
                        <td>${escapeHtml(s.task_name)}</td>
                        <td><small>${escapeHtml(s.pws_line_item)}</small></td>
                        <td>${escapeHtml(s.submitted_by_name)}</td>
                        <td>${escapeHtml(s.all_assignees)}${multiAssigneeBadge}</td>
                        <td>${formatDateTime(s.submitted_at)}</td>
                        <td>${s.percent_complete != null ? s.percent_complete + '%' : ''}</td>
                        <td>${statusBadge}</td>
                        <td>${reviewButton}</td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        async function load() {
            const submissions = await fetchSubmissions(state.currentFilter);
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
                // Switch to "All" view to show the status change
                state.currentFilter = 'all';
                $('#status-filter').val('all');
                load();
            }
        });

        $(document).off('click', '#approve-with-changes-btn').on('click', '#approve-with-changes-btn', async function() {
            const success = await processReview('approve_with_changes');
            if (success) {
                closeModal();
                alert('Submission approved with changes!');
                // Switch to "All" view to show the status change
                state.currentFilter = 'all';
                $('#status-filter').val('all');
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
                // Switch to "All" view to show the status change
                state.currentFilter = 'all';
                $('#status-filter').val('all');
                load();
            }
        });

        $(document).off('change', '#status-filter').on('change', '#status-filter', function() {
            state.currentFilter = $(this).val();
            load();
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
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="contracts-tab" data-bs-toggle="tab" data-bs-target="#contracts-panel" type="button" role="tab">Contracts</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="teams-tab" data-bs-toggle="tab" data-bs-target="#teams-panel" type="button" role="tab">Teams</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="pws-tab" data-bs-toggle="tab" data-bs-target="#pws-panel" type="button" role="tab">PWS Line Items</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="contract-roles-tab" data-bs-toggle="tab" data-bs-target="#contract-roles-panel" type="button" role="tab">Contract Roles</button>
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
                
                <div class="tab-pane fade" id="contracts-panel" role="tabpanel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="mb-0">Contracts</h4>
                        <button class="btn btn-primary" id="new-contract-btn">New Contract</button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped align-middle" id="contracts-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="tab-pane fade" id="teams-panel" role="tabpanel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="mb-0">Teams</h4>
                        <button class="btn btn-primary" id="new-team-btn">New Team</button>
                    </div>
                    <div class="mb-3">
                        <label for="teams-contract-filter" class="form-label">Filter by Contract:</label>
                        <select id="teams-contract-filter" class="form-select" style="max-width: 300px;">
                            <option value="">All Contracts</option>
                        </select>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped align-middle" id="teams-table">
                            <thead>
                                <tr>
                                    <th>Contract</th>
                                    <th>Team Name</th>
                                    <th>Status</th>
                                    <th>Members</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="tab-pane fade" id="pws-panel" role="tabpanel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="mb-0">PWS Line Items</h4>
                        <button class="btn btn-primary" id="new-pws-btn">New PWS Line Item</button>
                    </div>
                    <div class="mb-3">
                        <label for="pws-contract-filter" class="form-label">Filter by Contract:</label>
                        <select id="pws-contract-filter" class="form-select" style="max-width: 300px;">
                            <option value="">All Contracts</option>
                        </select>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped align-middle" id="pws-table">
                            <thead>
                                <tr>
                                    <th>Contract</th>
                                    <th>Code</th>
                                    <th>Title</th>
                                    <th>Periodicity</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="tab-pane fade" id="contract-roles-panel" role="tabpanel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="mb-0">Contract Roles</h4>
                        <button class="btn btn-primary" id="new-contract-role-btn">Assign Role</button>
                    </div>
                    <div class="mb-3">
                        <label for="roles-contract-filter" class="form-label">Filter by Contract:</label>
                        <select id="roles-contract-filter" class="form-select" style="max-width: 300px;">
                            <option value="">All Contracts</option>
                        </select>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped align-middle" id="contract-roles-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Contract</th>
                                    <th>Role</th>
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
            
            <!-- Contract Modal -->
            <div class="modal fade" id="contract-modal" tabindex="-1" aria-labelledby="contractModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="contractModalLabel">Contract</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="contract-form-error" class="alert alert-danger" style="display: none;"></div>
                            <form id="contract-form">
                                <input type="hidden" id="contract-id" />
                                <div class="mb-3">
                                    <label for="contract-code" class="form-label">Code *</label>
                                    <input type="text" id="contract-code" class="form-control" required placeholder="e.g., NMC-2025" />
                                    <small class="form-text text-muted">Unique identifier for the contract</small>
                                </div>
                                <div class="mb-3">
                                    <label for="contract-name" class="form-label">Name *</label>
                                    <input type="text" id="contract-name" class="form-control" required placeholder="e.g., Navy Maintenance Contract" />
                                </div>
                                <button type="submit" class="btn btn-primary">Save Contract</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Team Modal -->
            <div class="modal fade" id="team-modal" tabindex="-1" aria-labelledby="teamModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="teamModalLabel">Team</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="team-form-error" class="alert alert-danger" style="display: none;"></div>
                            <form id="team-form">
                                <input type="hidden" id="team-id" />
                                <div class="mb-3">
                                    <label for="team-contract" class="form-label">Contract *</label>
                                    <select id="team-contract" class="form-select" required>
                                        <option value="">Select Contract</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="team-name" class="form-label">Team Name *</label>
                                    <input type="text" id="team-name" class="form-control" required placeholder="e.g., Maintenance Team Alpha" />
                                </div>
                                <button type="submit" class="btn btn-primary">Save Team</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Team Membership Modal -->
            <div class="modal fade" id="team-membership-modal" tabindex="-1" aria-labelledby="teamMembershipModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="teamMembershipModalLabel">Manage Team Members</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="membership-form-error" class="alert alert-danger" style="display: none;"></div>
                            <input type="hidden" id="membership-team-id" />
                            <h6 id="membership-team-name"></h6>
                            
                            <h6 class="mt-3">Add Member</h6>
                            <form id="add-membership-form" class="mb-4">
                                <div class="row g-2">
                                    <div class="col-md-5">
                                        <label for="membership-user" class="form-label">User *</label>
                                        <select id="membership-user" class="form-select" required>
                                            <option value="">Select User</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="membership-role" class="form-label">Role *</label>
                                        <select id="membership-role" class="form-select" required>
                                            <option value="member">Member</option>
                                            <option value="lead">Lead</option>
                                        </select>
                                    </div>
                                    <div class="col-md-3 d-flex align-items-end">
                                        <button type="submit" class="btn btn-success w-100">Add</button>
                                    </div>
                                </div>
                            </form>
                            
                            <h6>Current Members</h6>
                            <div class="table-responsive">
                                <table class="table table-sm" id="memberships-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- PWS Line Item Modal -->
            <div class="modal fade" id="pws-modal" tabindex="-1" aria-labelledby="pwsModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="pwsModalLabel">PWS Line Item</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="pws-form-error" class="alert alert-danger" style="display: none;"></div>
                            <form id="pws-form">
                                <input type="hidden" id="pws-id" />
                                <div class="mb-3">
                                    <label for="pws-contract" class="form-label">Contract *</label>
                                    <select id="pws-contract" class="form-select" required>
                                        <option value="">Select Contract</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="pws-code" class="form-label">Code *</label>
                                    <input type="text" id="pws-code" class="form-control" required placeholder="e.g., 4.1.1.2" />
                                    <small class="form-text text-muted">PWS line item code (e.g., 4.1.1.2)</small>
                                </div>
                                <div class="mb-3">
                                    <label for="pws-title" class="form-label">Title *</label>
                                    <input type="text" id="pws-title" class="form-control" required placeholder="e.g., Maintenance Planning" />
                                </div>
                                <div class="mb-3">
                                    <label for="pws-description" class="form-label">Description</label>
                                    <textarea id="pws-description" class="form-control" rows="3" placeholder="Detailed description"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="pws-periodicity" class="form-label">Periodicity</label>
                                    <select id="pws-periodicity" class="form-select">
                                        <option value="">Select...</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="as-needed">As Needed</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-primary">Save PWS Line Item</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Contract Role Modal -->
            <div class="modal fade" id="contract-role-modal" tabindex="-1" aria-labelledby="contractRoleModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="contractRoleModalLabel">Assign Contract Role</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="contract-role-form-error" class="alert alert-danger" style="display: none;"></div>
                            <form id="contract-role-form">
                                <input type="hidden" id="contract-role-id" />
                                <div class="mb-3">
                                    <label for="contract-role-user" class="form-label">User *</label>
                                    <select id="contract-role-user" class="form-select" required>
                                        <option value="">Select User</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="contract-role-contract" class="form-label">Contract *</label>
                                    <select id="contract-role-contract" class="form-select" required>
                                        <option value="">Select Contract</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="contract-role-role" class="form-label">Role *</label>
                                    <select id="contract-role-role" class="form-select" required>
                                        <option value="">Select Role</option>
                                        <option value="Admin">Admin</option>
                                        <option value="PM">PM</option>
                                        <option value="APM">APM</option>
                                        <option value="Team Lead">Team Lead</option>
                                        <option value="Team Member">Team Member</option>
                                    </select>
                                    <small class="form-text text-muted">This role applies only to the selected contract</small>
                                </div>
                                <button type="submit" class="btn btn-primary">Assign Role</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('#main-content').html(container);

        const state = { 
            users: [], 
            requests: [],
            contracts: [],
            teams: [],
            pwsLineItems: [],
            contractRoles: [],
            teamMemberships: {}
        };

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
            // Fetch all users from profiles (now includes email column)
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, team, created_at, disabled')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
                return [];
            }

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
                        <td>${escapeHtml(u.email || 'N/A')}</td>
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

        // Fetch functions for new tabs
        async function fetchContracts() {
            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching contracts:', error);
                return [];
            }
            return data || [];
        }

        async function fetchTeams() {
            const { data, error } = await supabase
                .from('teams')
                .select('*, contracts(name, code)')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching teams:', error);
                return [];
            }
            return data || [];
        }

        async function fetchPWSLineItems() {
            const { data, error } = await supabase
                .from('pws_line_items')
                .select('*, contracts(name, code)')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching PWS line items:', error);
                return [];
            }
            return data || [];
        }

        async function fetchContractRoles() {
            const { data, error } = await supabase
                .from('user_contract_roles')
                .select('*, contracts(name, code)')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching contract roles:', error);
                return [];
            }
            
            // Fetch user names separately since user_contract_roles references auth.users
            if (data && data.length > 0) {
                const userIds = [...new Set(data.map(r => r.user_id))];
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);
                
                // Map profiles to roles
                const profileMap = {};
                if (profiles) {
                    profiles.forEach(p => profileMap[p.id] = p);
                }
                
                return data.map(role => ({
                    ...role,
                    profiles: profileMap[role.user_id] || null
                }));
            }
            
            return data || [];
        }

        async function fetchTeamMemberships(teamId) {
            const { data, error } = await supabase
                .from('team_memberships')
                .select('*')
                .eq('team_id', teamId);
            if (error) {
                console.error('Error fetching team memberships:', error);
                return [];
            }
            
            // Fetch user names separately since team_memberships references auth.users
            if (data && data.length > 0) {
                const userIds = [...new Set(data.map(m => m.user_id))];
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);
                
                // Map profiles to memberships
                const profileMap = {};
                if (profiles) {
                    profiles.forEach(p => profileMap[p.id] = p);
                }
                
                return data.map(membership => ({
                    ...membership,
                    profiles: profileMap[membership.user_id] || null
                }));
            }
            
            return data || [];
        }

        // Render functions for new tabs
        function renderContractsTable() {
            const tbody = $('#contracts-table tbody');
            tbody.empty();
            if (!state.contracts.length) {
                tbody.append('<tr><td colspan="5" class="text-muted">No contracts found.</td></tr>');
                return;
            }
            for (const c of state.contracts) {
                const statusBadge = c.is_active ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Archived</span>';
                const archiveBtn = c.is_active 
                    ? `<button class="btn btn-sm btn-warning ms-1 archive-contract-btn" data-id="${c.id}" data-name="${escapeHtml(c.name)}">Archive</button>`
                    : `<button class="btn btn-sm btn-success ms-1 activate-contract-btn" data-id="${c.id}" data-name="${escapeHtml(c.name)}">Activate</button>`;
                const tr = `
                    <tr>
                        <td>${escapeHtml(c.code)}</td>
                        <td>${escapeHtml(c.name)}</td>
                        <td>${statusBadge}</td>
                        <td>${formatDateTime(c.created_at)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary edit-contract-btn" data-id="${c.id}" data-code="${escapeHtml(c.code)}" data-name="${escapeHtml(c.name)}">Edit</button>
                            ${archiveBtn}
                        </td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        function renderTeamsTable() {
            const tbody = $('#teams-table tbody');
            tbody.empty();
            
            const filterContractId = $('#teams-contract-filter').val();
            const filteredTeams = filterContractId 
                ? state.teams.filter(t => t.contract_id === filterContractId)
                : state.teams;
            
            if (!filteredTeams.length) {
                tbody.append('<tr><td colspan="5" class="text-muted">No teams found.</td></tr>');
                return;
            }
            for (const t of filteredTeams) {
                const statusBadge = t.is_active ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>';
                const memberCount = state.teamMemberships[t.id] ? state.teamMemberships[t.id].length : 0;
                const tr = `
                    <tr>
                        <td>${escapeHtml(t.contracts?.name || 'N/A')}</td>
                        <td>${escapeHtml(t.name)}</td>
                        <td>${statusBadge}</td>
                        <td>${memberCount} member(s)</td>
                        <td>
                            <button class="btn btn-sm btn-primary edit-team-btn" data-id="${t.id}" data-contract-id="${t.contract_id}" data-name="${escapeHtml(t.name)}">Edit</button>
                            <button class="btn btn-sm btn-info ms-1 manage-members-btn" data-id="${t.id}" data-name="${escapeHtml(t.name)}">Members</button>
                            <button class="btn btn-sm btn-warning ms-1 toggle-team-btn" data-id="${t.id}" data-active="${t.is_active}">${t.is_active ? 'Deactivate' : 'Activate'}</button>
                        </td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        function renderPWSTable() {
            const tbody = $('#pws-table tbody');
            tbody.empty();
            
            const filterContractId = $('#pws-contract-filter').val();
            const filteredPWS = filterContractId 
                ? state.pwsLineItems.filter(p => p.contract_id === filterContractId)
                : state.pwsLineItems;
            
            if (!filteredPWS.length) {
                tbody.append('<tr><td colspan="6" class="text-muted">No PWS line items found.</td></tr>');
                return;
            }
            for (const p of filteredPWS) {
                const statusBadge = p.is_active ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-danger">Retired</span>';
                const tr = `
                    <tr>
                        <td>${escapeHtml(p.contracts?.name || 'N/A')}</td>
                        <td>${escapeHtml(p.code)}</td>
                        <td>${escapeHtml(p.title)}</td>
                        <td>${escapeHtml(p.periodicity || 'N/A')}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-primary edit-pws-btn" data-id="${p.id}" data-contract-id="${p.contract_id}" data-code="${escapeHtml(p.code)}" data-title="${escapeHtml(p.title)}" data-description="${escapeHtml(p.description || '')}" data-periodicity="${escapeHtml(p.periodicity || '')}">Edit</button>
                            <button class="btn btn-sm btn-${p.is_active ? 'warning' : 'success'} ms-1 toggle-pws-btn" data-id="${p.id}" data-active="${p.is_active}">${p.is_active ? 'Retire' : 'Activate'}</button>
                        </td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        function renderContractRolesTable() {
            const tbody = $('#contract-roles-table tbody');
            tbody.empty();
            
            const filterContractId = $('#roles-contract-filter').val();
            const filteredRoles = filterContractId 
                ? state.contractRoles.filter(r => r.contract_id === filterContractId)
                : state.contractRoles;
            
            if (!filteredRoles.length) {
                tbody.append('<tr><td colspan="4" class="text-muted">No contract roles assigned.</td></tr>');
                return;
            }
            for (const r of filteredRoles) {
                const tr = `
                    <tr>
                        <td>${escapeHtml(r.profiles?.full_name || 'Unknown User')}</td>
                        <td>${escapeHtml(r.contracts?.name || 'N/A')}</td>
                        <td><span class="badge bg-primary">${escapeHtml(r.role)}</span></td>
                        <td>
                            <button class="btn btn-sm btn-danger delete-contract-role-btn" data-id="${r.id}" data-user="${escapeHtml(r.profiles?.full_name || 'User')}" data-contract="${escapeHtml(r.contracts?.name || 'Contract')}">Remove</button>
                        </td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        function renderMembershipsTable() {
            const tbody = $('#memberships-table tbody');
            tbody.empty();
            const teamId = $('#membership-team-id').val();
            const memberships = state.teamMemberships[teamId] || [];
            
            if (!memberships.length) {
                tbody.append('<tr><td colspan="3" class="text-muted">No members assigned.</td></tr>');
                return;
            }
            for (const m of memberships) {
                const roleBadge = m.role_in_team === 'lead' 
                    ? '<span class="badge bg-warning">Lead</span>' 
                    : '<span class="badge bg-info">Member</span>';
                const tr = `
                    <tr>
                        <td>${escapeHtml(m.profiles?.full_name || 'Unknown User')}</td>
                        <td>${roleBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-danger remove-membership-btn" data-id="${m.id}" data-user="${escapeHtml(m.profiles?.full_name || 'User')}">Remove</button>
                        </td>
                    </tr>
                `;
                tbody.append(tr);
            }
        }

        // Populate dropdowns
        function populateContractDropdowns() {
            const selects = ['#team-contract', '#pws-contract', '#contract-role-contract', '#teams-contract-filter', '#pws-contract-filter', '#roles-contract-filter'];
            selects.forEach(sel => {
                const $select = $(sel);
                const currentVal = $select.val();
                const isFilter = sel.includes('-filter');
                $select.find('option:not(:first)').remove();
                state.contracts.filter(c => c.is_active).forEach(c => {
                    $select.append(`<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.code)})</option>`);
                });
                if (currentVal) $select.val(currentVal);
            });
        }

        function populateUserDropdowns() {
            const selects = ['#membership-user', '#contract-role-user'];
            selects.forEach(sel => {
                const $select = $(sel);
                $select.find('option:not(:first)').remove();
                state.users.filter(u => !u.disabled).forEach(u => {
                    $select.append(`<option value="${u.id}">${escapeHtml(u.full_name || 'Unknown')}</option>`);
                });
            });
        }

        async function load() {
            const hasAccess = await checkAdminAccess();
            if (!hasAccess) return;

            state.users = await fetchUsers();
            state.requests = await fetchAccountRequests();
            state.contracts = await fetchContracts();
            state.teams = await fetchTeams();
            state.pwsLineItems = await fetchPWSLineItems();
            state.contractRoles = await fetchContractRoles();
            
            // Fetch memberships for all teams
            for (const team of state.teams) {
                state.teamMemberships[team.id] = await fetchTeamMemberships(team.id);
            }
            
            renderUsersTable();
            renderRequestsTable();
            renderContractsTable();
            renderTeamsTable();
            renderPWSTable();
            renderContractRolesTable();
            populateContractDropdowns();
            populateUserDropdowns();
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

        // ===== CONTRACT EVENT HANDLERS =====
        $(document).off('click', '#new-contract-btn').on('click', '#new-contract-btn', function() {
            $('#contract-id').val('');
            $('#contract-code').val('').prop('disabled', false);
            $('#contract-name').val('');
            $('#contract-form-error').hide();
            $('#contractModalLabel').text('New Contract');
            const modalEl = document.getElementById('contract-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        $(document).off('click', '.edit-contract-btn').on('click', '.edit-contract-btn', function() {
            const id = $(this).data('id');
            const code = $(this).data('code');
            const name = $(this).data('name');
            $('#contract-id').val(id);
            $('#contract-code').val(code).prop('disabled', true);
            $('#contract-name').val(name);
            $('#contract-form-error').hide();
            $('#contractModalLabel').text('Edit Contract');
            const modalEl = document.getElementById('contract-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        $(document).off('submit', '#contract-form').on('submit', '#contract-form', async function(e) {
            e.preventDefault();
            const id = $('#contract-id').val();
            const code = $('#contract-code').val().trim();
            const name = $('#contract-name').val().trim();

            if (id) {
                // Update
                const { error } = await supabase
                    .from('contracts')
                    .update({ name, updated_at: new Date().toISOString() })
                    .eq('id', id);
                if (error) {
                    $('#contract-form-error').text('Error updating contract: ' + error.message).show();
                    return;
                }
            } else {
                // Insert
                const { error } = await supabase
                    .from('contracts')
                    .insert([{ code, name }]);
                if (error) {
                    $('#contract-form-error').text('Error creating contract: ' + error.message).show();
                    return;
                }
            }

            const modalEl = document.getElementById('contract-modal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            alert('Contract saved successfully!');
            load();
        });

        $(document).off('click', '.archive-contract-btn').on('click', '.archive-contract-btn', async function() {
            const id = $(this).data('id');
            const name = $(this).data('name');
            if (!confirm(`Archive contract "${name}"? This will hide it from dropdowns but preserve all data.`)) return;
            const { error } = await supabase
                .from('contracts')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) {
                alert('Error archiving contract: ' + error.message);
                return;
            }
            alert('Contract archived successfully!');
            load();
        });

        $(document).off('click', '.activate-contract-btn').on('click', '.activate-contract-btn', async function() {
            const id = $(this).data('id');
            const { error } = await supabase
                .from('contracts')
                .update({ is_active: true, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) {
                alert('Error activating contract: ' + error.message);
                return;
            }
            alert('Contract activated successfully!');
            load();
        });

        // ===== TEAM EVENT HANDLERS =====
        $(document).off('click', '#new-team-btn').on('click', '#new-team-btn', function() {
            $('#team-id').val('');
            $('#team-contract').val('');
            $('#team-name').val('');
            $('#team-form-error').hide();
            $('#teamModalLabel').text('New Team');
            const modalEl = document.getElementById('team-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        $(document).off('click', '.edit-team-btn').on('click', '.edit-team-btn', function() {
            const id = $(this).data('id');
            const contractId = $(this).data('contract-id');
            const name = $(this).data('name');
            $('#team-id').val(id);
            $('#team-contract').val(contractId);
            $('#team-name').val(name);
            $('#team-form-error').hide();
            $('#teamModalLabel').text('Edit Team');
            const modalEl = document.getElementById('team-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        $(document).off('submit', '#team-form').on('submit', '#team-form', async function(e) {
            e.preventDefault();
            const id = $('#team-id').val();
            const contractId = $('#team-contract').val();
            const name = $('#team-name').val().trim();

            if (id) {
                // Update
                const { error } = await supabase
                    .from('teams')
                    .update({ contract_id: contractId, name, updated_at: new Date().toISOString() })
                    .eq('id', id);
                if (error) {
                    $('#team-form-error').text('Error updating team: ' + error.message).show();
                    return;
                }
            } else {
                // Insert
                const { error } = await supabase
                    .from('teams')
                    .insert([{ contract_id: contractId, name }]);
                if (error) {
                    $('#team-form-error').text('Error creating team: ' + error.message).show();
                    return;
                }
            }

            const modalEl = document.getElementById('team-modal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            alert('Team saved successfully!');
            load();
        });

        $(document).off('click', '.toggle-team-btn').on('click', '.toggle-team-btn', async function() {
            const id = $(this).data('id');
            const isActive = $(this).data('active');
            const newState = !isActive;
            const { error } = await supabase
                .from('teams')
                .update({ is_active: newState, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) {
                alert('Error toggling team status: ' + error.message);
                return;
            }
            alert(`Team ${newState ? 'activated' : 'deactivated'} successfully!`);
            load();
        });

        $(document).off('change', '#teams-contract-filter').on('change', '#teams-contract-filter', function() {
            renderTeamsTable();
        });

        // ===== TEAM MEMBERSHIP EVENT HANDLERS =====
        $(document).off('click', '.manage-members-btn').on('click', '.manage-members-btn', async function() {
            const teamId = $(this).data('id');
            const teamName = $(this).data('name');
            $('#membership-team-id').val(teamId);
            $('#membership-team-name').text(teamName);
            $('#membership-user').val('');
            $('#membership-role').val('member');
            $('#membership-form-error').hide();
            
            // Fetch and render memberships
            state.teamMemberships[teamId] = await fetchTeamMemberships(teamId);
            renderMembershipsTable();
            
            const modalEl = document.getElementById('team-membership-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        $(document).off('submit', '#add-membership-form').on('submit', '#add-membership-form', async function(e) {
            e.preventDefault();
            const teamId = $('#membership-team-id').val();
            const userId = $('#membership-user').val();
            const role = $('#membership-role').val();

            const { error } = await supabase
                .from('team_memberships')
                .insert([{ team_id: teamId, user_id: userId, role_in_team: role }]);
            
            if (error) {
                $('#membership-form-error').text('Error adding member: ' + error.message).show();
                return;
            }

            $('#membership-form-error').hide();
            $('#membership-user').val('');
            state.teamMemberships[teamId] = await fetchTeamMemberships(teamId);
            renderMembershipsTable();
            renderTeamsTable(); // Update member count
            alert('Member added successfully!');
        });

        $(document).off('click', '.remove-membership-btn').on('click', '.remove-membership-btn', async function() {
            const id = $(this).data('id');
            const userName = $(this).data('user');
            if (!confirm(`Remove ${userName} from this team?`)) return;

            const { error } = await supabase
                .from('team_memberships')
                .delete()
                .eq('id', id);
            
            if (error) {
                alert('Error removing member: ' + error.message);
                return;
            }

            const teamId = $('#membership-team-id').val();
            state.teamMemberships[teamId] = await fetchTeamMemberships(teamId);
            renderMembershipsTable();
            renderTeamsTable(); // Update member count
            alert('Member removed successfully!');
        });

        // ===== PWS LINE ITEM EVENT HANDLERS =====
        $(document).off('click', '#new-pws-btn').on('click', '#new-pws-btn', function() {
            $('#pws-id').val('');
            $('#pws-contract').val('');
            $('#pws-code').val('');
            $('#pws-title').val('');
            $('#pws-description').val('');
            $('#pws-periodicity').val('');
            $('#pws-form-error').hide();
            $('#pwsModalLabel').text('New PWS Line Item');
            const modalEl = document.getElementById('pws-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        $(document).off('click', '.edit-pws-btn').on('click', '.edit-pws-btn', function() {
            const id = $(this).data('id');
            const contractId = $(this).data('contract-id');
            const code = $(this).data('code');
            const title = $(this).data('title');
            const description = $(this).data('description');
            const periodicity = $(this).data('periodicity');
            $('#pws-id').val(id);
            $('#pws-contract').val(contractId);
            $('#pws-code').val(code);
            $('#pws-title').val(title);
            $('#pws-description').val(description);
            $('#pws-periodicity').val(periodicity);
            $('#pws-form-error').hide();
            $('#pwsModalLabel').text('Edit PWS Line Item');
            const modalEl = document.getElementById('pws-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        $(document).off('submit', '#pws-form').on('submit', '#pws-form', async function(e) {
            e.preventDefault();
            const id = $('#pws-id').val();
            const contractId = $('#pws-contract').val();
            const code = $('#pws-code').val().trim();
            const title = $('#pws-title').val().trim();
            const description = $('#pws-description').val().trim();
            const periodicity = $('#pws-periodicity').val();

            if (id) {
                // Update
                const { error } = await supabase
                    .from('pws_line_items')
                    .update({ 
                        contract_id: contractId,
                        code,
                        title,
                        description: description || null,
                        periodicity: periodicity || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);
                if (error) {
                    $('#pws-form-error').text('Error updating PWS line item: ' + error.message).show();
                    return;
                }
            } else {
                // Insert
                const { error } = await supabase
                    .from('pws_line_items')
                    .insert([{ 
                        contract_id: contractId,
                        code,
                        title,
                        description: description || null,
                        periodicity: periodicity || null
                    }]);
                if (error) {
                    $('#pws-form-error').text('Error creating PWS line item: ' + error.message).show();
                    return;
                }
            }

            const modalEl = document.getElementById('pws-modal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            alert('PWS line item saved successfully!');
            load();
        });

        $(document).off('click', '.toggle-pws-btn').on('click', '.toggle-pws-btn', async function() {
            const id = $(this).data('id');
            const isActive = $(this).data('active');
            const newState = !isActive;
            const action = newState ? 'activate' : 'retire';
            if (!confirm(`Are you sure you want to ${action} this PWS line item?`)) return;
            
            const { error } = await supabase
                .from('pws_line_items')
                .update({ is_active: newState, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) {
                alert(`Error ${action}ing PWS line item: ` + error.message);
                return;
            }
            alert(`PWS line item ${action}d successfully!`);
            load();
        });

        $(document).off('change', '#pws-contract-filter').on('change', '#pws-contract-filter', function() {
            renderPWSTable();
        });

        // ===== CONTRACT ROLE EVENT HANDLERS =====
        $(document).off('click', '#new-contract-role-btn').on('click', '#new-contract-role-btn', function() {
            $('#contract-role-id').val('');
            $('#contract-role-user').val('');
            $('#contract-role-contract').val('');
            $('#contract-role-role').val('');
            $('#contract-role-form-error').hide();
            const modalEl = document.getElementById('contract-role-modal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });

        $(document).off('submit', '#contract-role-form').on('submit', '#contract-role-form', async function(e) {
            e.preventDefault();
            const userId = $('#contract-role-user').val();
            const contractId = $('#contract-role-contract').val();
            const role = $('#contract-role-role').val();

            const { error } = await supabase
                .from('user_contract_roles')
                .insert([{ user_id: userId, contract_id: contractId, role }]);
            
            if (error) {
                $('#contract-role-form-error').text('Error assigning role: ' + error.message).show();
                return;
            }

            const modalEl = document.getElementById('contract-role-modal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            alert('Contract role assigned successfully!');
            load();
        });

        $(document).off('click', '.delete-contract-role-btn').on('click', '.delete-contract-role-btn', async function() {
            const id = $(this).data('id');
            const userName = $(this).data('user');
            const contractName = $(this).data('contract');
            if (!confirm(`Remove ${userName}'s role from ${contractName}?`)) return;

            const { error } = await supabase
                .from('user_contract_roles')
                .delete()
                .eq('id', id);
            
            if (error) {
                alert('Error removing contract role: ' + error.message);
                return;
            }

            alert('Contract role removed successfully!');
            load();
        });

        $(document).off('change', '#roles-contract-filter').on('change', '#roles-contract-filter', function() {
            renderContractRolesTable();
        });

        load();
    }

    // --- AUTHENTICATION ---
    async function checkSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            
            // If there's an error or no session, clear everything
            if (error || !data.session) {
                currentUser = null;
                await updateUI();
                router();
                return;
            }
            
            // Validate the session by trying to get the user
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            if (userError || !userData.user) {
                // Session is invalid, clear it
                console.warn('Invalid session detected, clearing:', userError);
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    // Ignore signOut errors, just clear local state
                    console.warn('SignOut failed during session validation:', e);
                }
                currentUser = null;
            } else {
                // Session is valid
                currentUser = userData.user;
            }
        } catch (error) {
            // Any error during session check, clear the session
            console.error('Error checking session:', error);
            currentUser = null;
        }
        
        await updateUI();
        router(); // Route after checking auth status
    }

    // Store current user role and session version for change detection
    let currentUserRole = null;
    let currentSessionVersion = null;

    async function updateUI() {
        if (currentUser) {
            $('#login-btn').hide();
            $('#logout-btn').show();
            
            // Update navigation based on user role and check session validity
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, session_version, disabled')
                .eq('id', currentUser.id)
                .single();
            
            // If profile not found or user is disabled, force logout
            if (!profile || profile.disabled) {
                console.log('User profile not found or disabled - forcing logout');
                await supabase.auth.signOut();
                currentUser = null;
                currentUserRole = null;
                currentSessionVersion = null;
                await updateUI();
                window.location.hash = '';
                await router();
                return;
            }
            
            // Check if session version has changed (user was disabled/enabled or role changed)
            if (currentSessionVersion !== null && profile.session_version !== currentSessionVersion) {
                console.log('Session invalidated (version changed from', currentSessionVersion, 'to', profile.session_version, ') - forcing logout');
                await supabase.auth.signOut();
                currentUser = null;
                currentUserRole = null;
                currentSessionVersion = null;
                alert('Your session has been terminated. Please log in again.');
                window.location.reload();
                return;
            }
            
            // Check if role has changed (admin changed it)
            if (currentUserRole && profile && profile.role !== currentUserRole) {
                console.log('Role changed from', currentUserRole, 'to', profile.role, '- reloading page');
                currentUserRole = profile.role;
                currentSessionVersion = profile.session_version;
                // Force page reload to update navigation and route to correct page
                window.location.reload();
                return;
            }
            
            // Store current role and session version
            if (profile) {
                currentUserRole = profile.role;
                currentSessionVersion = profile.session_version;
            }
            
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
        try {
            // Try to sign out from Supabase
            await supabase.auth.signOut();
        } catch (error) {
            // If server logout fails (403, network error, etc.), still clear local session
            console.warn('Server logout failed, clearing local session:', error);
            
            // Forcefully clear Supabase session from localStorage
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('sb-') || key.includes('supabase')) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (e) {
                console.warn('Could not clear localStorage:', e);
            }
        }
        
        // Always clear local state regardless of server response
        currentUser = null;
        await updateUI();
        
        // Clear hash and explicitly call router to show login page
        window.location.hash = '';
        await router();
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

    // Periodic session validation check
    setInterval(async () => {
        if (currentUser) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, session_version, disabled')
                .eq('id', currentUser.id)
                .single();
            
            // If profile not found, user disabled, or session version changed, trigger updateUI
            if (!profile || profile.disabled || 
                (currentSessionVersion !== null && profile.session_version !== currentSessionVersion) ||
                (currentUserRole && profile.role !== currentUserRole)) {
                console.log('Session state change detected in background check');
                await updateUI();
            }
        }
    }, 5000); // Check every 5 seconds for faster response

    // --- APP START ---
    $('#app').html(appLayout);
    checkSession();
    $(window).on('hashchange', router);
});
