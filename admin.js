// API Base URL
const API_BASE_URL = 'http://localhost:8000';

let allSessions = [];
let currentFilter = null;

// Load sessions on page load
window.addEventListener('DOMContentLoaded', () => {
    loadSessions();
});

// Load all sessions
async function loadSessions() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/sessions`);

        if (!response.ok) {
            throw new Error('Failed to fetch sessions');
        }

        const result = await response.json();
        allSessions = result.sessions;

        renderStats();
        renderTable();

    } catch (error) {
        console.error('Error loading sessions:', error);
        document.getElementById('tableContainer').innerHTML = `
            <div class="error">
                Failed to load sessions. Please make sure the backend server is running.
            </div>
        `;
    }
}

// Render statistics
function renderStats() {
    const total = allSessions.length;
    const notStarted = allSessions.filter(s => s.state === 'not_started').length;
    const inProgress = allSessions.filter(s => s.state === 'in_progress').length;
    const submitted = allSessions.filter(s => s.state === 'submitted').length;

    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Sessions</div>
            <div class="stat-value">${total}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Not Started</div>
            <div class="stat-value">${notStarted}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">In Progress</div>
            <div class="stat-value">${inProgress}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Submitted</div>
            <div class="stat-value">${submitted}</div>
        </div>
    `;
}

// Render sessions table
function renderTable() {
    const filteredSessions = currentFilter
        ? allSessions.filter(s => s.state === currentFilter)
        : allSessions;

    if (filteredSessions.length === 0) {
        document.getElementById('tableContainer').innerHTML = `
            <div class="loading">No sessions found.</div>
        `;
        return;
    }

    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Candidate Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Score</th>
                    <th>Tab Switches</th>
                </tr>
            </thead>
            <tbody>
                ${filteredSessions.map(session => `
                    <tr onclick="viewDetails('${session.session_id}')">
                        <td>${escapeHtml(session.candidate_name)}</td>
                        <td>${escapeHtml(session.candidate_email)}</td>
                        <td><span class="status-badge status-${session.state}">${formatState(session.state)}</span></td>
                        <td>${formatDate(session.created_at)}</td>
                        <td>${session.has_submission && session.scores ? `<span class="score-badge">${session.scores.total}/25</span>` : '-'}</td>
                        <td>${session.tab_switch_count || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('tableContainer').innerHTML = tableHTML;
}

// Filter sessions
function filterSessions(state) {
    currentFilter = state;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderTable();
}

// Refresh data
function refreshData() {
    document.getElementById('tableContainer').innerHTML = `
        <div class="loading">Refreshing...</div>
    `;
    loadSessions();
}

// View session details
async function viewDetails(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/session/${sessionId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch session details');
        }

        const result = await response.json();
        const data = result.data;

        renderModal(data);

    } catch (error) {
        console.error('Error loading session details:', error);
        alert('Failed to load session details');
    }
}

// Render modal with session details
function renderModal(data) {
    const modalBody = document.getElementById('modalBody');

    const hasSubmission = data.submission !== null;

    modalBody.innerHTML = `
        <div class="detail-section">
            <h3>Session Information</h3>
            <div class="detail-row">
                <div class="detail-label">Session ID</div>
                <div class="detail-value"><code>${data.session_id}</code></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Candidate Name</div>
                <div class="detail-value">${escapeHtml(data.candidate_name)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Email</div>
                <div class="detail-value">${escapeHtml(data.candidate_email)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status</div>
                <div class="detail-value"><span class="status-badge status-${data.state}">${formatState(data.state)}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Created At</div>
                <div class="detail-value">${formatDate(data.created_at)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Started At</div>
                <div class="detail-value">${data.started_at ? formatDate(data.started_at) : 'Not started'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Submitted At</div>
                <div class="detail-value">${data.submitted_at ? formatDate(data.submitted_at) : 'Not submitted'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">IP Address</div>
                <div class="detail-value">${data.ip_address || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Tab Switches</div>
                <div class="detail-value">${data.tab_switch_count || 0}</div>
            </div>
        </div>

        ${hasSubmission ? `
            <div class="detail-section">
                <h3>Scores</h3>
                <div class="detail-row">
                    <div class="detail-label">MCQ</div>
                    <div class="detail-value">${data.submission.mcq_score}/10</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Python</div>
                    <div class="detail-value">${data.submission.python_score}/10</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">SQL</div>
                    <div class="detail-value">${data.submission.sql_score}/5</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label"><strong>Total</strong></div>
                    <div class="detail-value"><strong>${data.submission.total_score}/25</strong></div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Python Code - Problem 1</h3>
                <div class="code-preview">${escapeHtml(data.submission.python_code.problem1 || 'No code submitted')}</div>
            </div>

            <div class="detail-section">
                <h3>Python Code - Problem 2</h3>
                <div class="code-preview">${escapeHtml(data.submission.python_code.problem2 || 'No code submitted')}</div>
            </div>
        ` : '<p style="color: #718096; font-style: italic;">No submission yet</p>'}
    `;

    document.getElementById('detailModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// Close modal when clicking outside
document.getElementById('detailModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Utility functions
function formatState(state) {
    return state.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}
