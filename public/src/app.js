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
                    <a href="/" class="d-flex align-items-center mb-2 mb-lg-0 text-dark text-decoration-none"><h4>MSR Webform</h4></a>
                    <ul class="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0"></ul>
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
    function router() {
        const hash = window.location.hash.substring(1);
        if (currentUser) {
            $('#main-content').html(dashboardPage);
            initializeDashboard();
        } else {
            // If not logged in, show the login page
            $('#main-content').html(loginPage);
        }
    }

    function initializeDashboard() {
        const container = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h2 class="mb-0">Dashboard</h2>
                <button id="new-update-btn" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#new-update-modal">Create New Task Update</button>
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
                            <form id="new-update-form" novalidate>
                                <div class="mb-3">
                                    <label for="update-task" class="form-label">Task</label>
                                    <select id="update-task" class="form-select" required></select>
                                </div>
                                <div class="mb-3">
                                    <label for="update-narrative" class="form-label">Narrative</label>
                                    <textarea id="update-narrative" class="form-control" rows="3" required></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="update-percent" class="form-label">% Complete</label>
                                    <input id="update-percent" type="number" min="0" max="100" class="form-control" required />
                                </div>
                                <div class="mb-3">
                                    <label for="update-blockers" class="form-label">Blockers</label>
                                    <textarea id="update-blockers" class="form-control" rows="2"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="update-short-status" class="form-label">Short Status</label>
                                    <select id="update-short-status" class="form-select" required>
                                        <option value="In Progress">In Progress</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Complete">Complete</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-primary">Continue</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('#main-content').html(container);

        const state = { raw: [], filtered: [], mapTasks: [] };

        function readPrefs() {
            const f = localStorage.getItem('msr_dash_filter') || '';
            const s = localStorage.getItem('msr_dash_sort') || 'due_date_asc';
            $('#filter-status').val(f);
            $('#sort-by').val(s);
            return { f, s };
        }

        function writePrefs(f, s) {
            localStorage.setItem('msr_dash_filter', f);
            localStorage.setItem('msr_dash_sort', s);
        }

        function applyFilterSort() {
            const f = $('#filter-status').val();
            const s = $('#sort-by').val();
            let rows = [...state.raw];
            if (f) rows = rows.filter(r => (r.latest_update && r.latest_update.short_status) === f);
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
            const { data: tasks, error: tasksError } = await supabase
                .from('pws_tasks')
                .select('id, task_name, pws_line_item, start_date, due_date, assigned_to')
                .eq('assigned_to', user.id);
            if (tasksError) return [];
            const results = await Promise.all(tasks.map(async t => {
                const { data: updates } = await supabase
                    .from('updates')
                    .select('id, narrative, percent_complete, blockers, short_status, created_at')
                    .eq('task_id', t.id)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);
                const latest = updates && updates.length ? updates[0] : null;
                return {
                    ...t,
                    assigned_label: user.email || 'Me',
                    latest_update: latest
                };
            }));
            return results;
        }

        async function load() {
            readPrefs();
            const rows = await fetchTasksAndUpdates();
            state.raw = rows;
            populateTaskSelect(rows);
            updateModalState(rows);
            applyFilterSort();
        }

        function populateTaskSelect(rows) {
            const sel = $('#update-task');
            sel.empty();
            for (const t of rows) {
                sel.append(`<option value="${t.id}">${escapeHtml(t.task_name)}</option>`);
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

        $(document).off('submit', '#new-update-form').on('submit', '#new-update-form', function(e) {
            e.preventDefault();
            const modalEl = document.getElementById('new-update-modal');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            // Try to hide via Bootstrap API
            modal.hide();
            // Fallback cleanup for environments where transitions/dialogs interfere
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
            alert('Draft creation will be implemented in Phase 5.');
        });

        load();
    }

    // --- AUTHENTICATION ---
    async function checkSession() {
        const { data } = await supabase.auth.getSession();
        currentUser = data.session ? data.session.user : null;
        updateUI();
        router(); // Route after checking auth status
    }

    function updateUI() {
        if (currentUser) {
            $('#login-btn').hide();
            $('#logout-btn').show();
        } else {
            $('#login-btn').show();
            $('#logout-btn').hide();
        }
    }

    // --- EVENT HANDLERS ---
    $(document).on('submit', '#login-form', async function(e) {
        e.preventDefault();
        const email = $('#email').val();
        const password = $('#password').val();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            $('#error-message').text(error.message).show();
        } else {
            currentUser = data.user;
            window.location.hash = 'dashboard'; // Go to dashboard
            updateUI();
            router();
        }
    });

    $(document).on('click', '#logout-btn', async function() {
        await supabase.auth.signOut();
        currentUser = null;
        window.location.hash = ''; // Go to login page
        updateUI();
        router();
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
