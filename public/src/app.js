// Custom JavaScript for MSR Webform Application

$(document).ready(function() {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://rzwmnvbcwfbvwmsgfave.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6d21udmJjd2Zidndtc2dmYXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjA4ODYsImV4cCI6MjA3NTkzNjg4Nn0.JE2Kzye0h17SpBIo8A_qbyrfIFyY2JwQrRQ5mFaVXGY';

    // --- INITIALIZATION ---
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
            // If logged in, show the dashboard
            $('#main-content').html(dashboardPage);
        } else {
            // If not logged in, show the login page
            $('#main-content').html(loginPage);
        }
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
