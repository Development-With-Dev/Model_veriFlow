/**
 * Admin Panel — Flagged Sessions Dashboard
 * ─────────────────────────────────────────
 * • Seed 3 fake flagged sessions for demo realism
 * • Click-to-expand behavioral score timeline (Chart.js)
 * • Override → restore session     Delete Profile → DELETE /api/user-data
 */

/* =========================================================================
 *  SEED DATA — 3 fake flagged sessions
 * ========================================================================= */

const SEED_SESSIONS = [
    {
        id: 'sess_8f3a1b',
        user: 'priya.mehta',
        time: '2026-04-03 12:41:09',
        score: 0.82,
        tier: 'ALLOW',
        anomalies: 0,
        status: 'active',
        timeline: [0.91, 0.88, 0.85, 0.82, 0.84, 0.86, 0.83, 0.82]
    },
    {
        id: 'sess_d24b7c',
        user: 'rahul.kumar',
        time: '2026-04-03 12:38:22',
        score: 0.53,
        tier: 'STEP_UP',
        anomalies: 2,
        status: 'otp_pending',
        timeline: [0.89, 0.78, 0.65, 0.58, 0.53, 0.55, 0.51, 0.53]
    },
    {
        id: 'sess_a09e41',
        user: 'ankit.singh',
        time: '2026-04-03 12:32:57',
        score: 0.31,
        tier: 'BLOCK',
        anomalies: 5,
        status: 'suspended',
        timeline: [0.74, 0.61, 0.49, 0.42, 0.38, 0.35, 0.32, 0.31]
    }
];

let sessions = [...SEED_SESSIONS];
let expandedRow = null;
let activeCharts = {};

/* =========================================================================
 *  RENDER TABLE
 * ========================================================================= */

function renderTable() {
    const tbody = document.getElementById('flaggedTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Update stat cards
    document.getElementById('statTotal').textContent   = sessions.length;
    document.getElementById('statAllowed').textContent  = sessions.filter(s => s.tier === 'ALLOW').length;
    document.getElementById('statStepups').textContent  = sessions.filter(s => s.tier === 'STEP_UP').length;
    document.getElementById('statBlocked').textContent  = sessions.filter(s => s.tier === 'BLOCK').length;

    sessions.forEach((s, idx) => {
        // ── Data row ──
        const tr = document.createElement('tr');
        tr.dataset.idx = idx;
        tr.innerHTML = `
            <td><strong>${s.user}</strong><br><span style="color:var(--text-muted);font-size:0.7rem;">${s.id}</span></td>
            <td>${s.time}</td>
            <td style="font-weight:600; color:${scoreColour(s.score)}">${s.score.toFixed(2)}</td>
            <td><span class="tier-pill ${tierClass(s.tier)}">${s.tier}</span></td>
            <td>${s.anomalies}</td>
            <td>${statusBadge(s.status)}</td>
        `;
        tr.addEventListener('click', () => toggleTimeline(idx));
        tbody.appendChild(tr);

        // ── Timeline expansion row (hidden by default) ──
        const trExp = document.createElement('tr');
        trExp.className = 'timeline-row';
        trExp.id = `timeline-row-${idx}`;
        trExp.innerHTML = `
            <td colspan="6">
                <div class="timeline-panel" id="timeline-panel-${idx}">
                    <canvas id="timeline-chart-${idx}"></canvas>
                    <div class="timeline-actions">
                        <button class="btn btn-secondary" onclick="overrideSession(${idx})">
                            <i class="fas fa-unlock"></i> Override — Restore Session
                        </button>
                        <button class="btn btn-danger" onclick="promptDelete('${s.user}', ${idx})">
                            <i class="fas fa-user-slash"></i> Delete Profile
                        </button>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(trExp);
    });
}

/* =========================================================================
 *  TOGGLE TIMELINE — expand / collapse
 * ========================================================================= */

function toggleTimeline(idx) {
    const panel = document.getElementById(`timeline-panel-${idx}`);
    const row   = document.querySelector(`tr[data-idx="${idx}"]`);
    if (!panel) return;

    // Collapse previous
    if (expandedRow !== null && expandedRow !== idx) {
        const prev = document.getElementById(`timeline-panel-${expandedRow}`);
        const prevRow = document.querySelector(`tr[data-idx="${expandedRow}"]`);
        if (prev) prev.classList.remove('open');
        if (prevRow) prevRow.classList.remove('expanded');
        destroyChart(expandedRow);
    }

    // Toggle current
    const isOpen = panel.classList.toggle('open');
    row?.classList.toggle('expanded', isOpen);

    if (isOpen) {
        expandedRow = idx;
        renderChart(idx);
    } else {
        expandedRow = null;
        destroyChart(idx);
    }
}

/* =========================================================================
 *  CHART — behavioral score timeline
 * ========================================================================= */

function renderChart(idx) {
    const s   = sessions[idx];
    const ctx = document.getElementById(`timeline-chart-${idx}`)?.getContext('2d');
    if (!ctx) return;

    destroyChart(idx);

    const labels = s.timeline.map((_, i) => `t-${s.timeline.length - i}`);
    const colour = scoreColour(s.score);

    activeCharts[idx] = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Auth Score',
                data: s.timeline,
                borderColor: colour,
                backgroundColor: colour + '22',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: colour
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0, max: 1,
                    ticks: { color: '#64748b', stepSize: 0.25 },
                    grid: { color: 'rgba(255,255,255,0.06)' }
                },
                x: {
                    ticks: { color: '#64748b' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            }
        }
    });
}

function destroyChart(idx) {
    if (activeCharts[idx]) {
        activeCharts[idx].destroy();
        delete activeCharts[idx];
    }
}

/* =========================================================================
 *  ACTIONS
 * ========================================================================= */

function overrideSession(idx) {
    const s = sessions[idx];
    s.tier     = 'ALLOW';
    s.status   = 'active';
    s.score    = 0.85;
    s.anomalies = 0;
    s.timeline.push(0.85);

    console.log(`✅ Session ${s.id} overridden → ALLOW`);
    renderTable();
}

/* ── Delete Profile ────────────────────────────────────────── */

let pendingDeleteIdx = null;

function promptDelete(user, idx) {
    pendingDeleteIdx = idx;
    document.getElementById('confirmMsg').textContent =
        `This will permanently delete "${user}"'s profile and all behavioural data. This action cannot be undone.`;
    document.getElementById('confirmOverlay').classList.add('active');
}

document.getElementById('confirmCancel')?.addEventListener('click', () => {
    document.getElementById('confirmOverlay').classList.remove('active');
    pendingDeleteIdx = null;
});

document.getElementById('confirmDelete')?.addEventListener('click', async () => {
    if (pendingDeleteIdx === null) return;
    const s = sessions[pendingDeleteIdx];

    try {
        const res = await fetch('/api/user-data', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: localStorage.getItem('session_id') || '',
                target_user: s.user
            })
        });
        const data = await res.json();
        console.log('Delete response:', data);
    } catch (err) {
        console.warn('Delete API call failed (demo mode):', err);
    }

    // Remove from local list
    sessions.splice(pendingDeleteIdx, 1);
    document.getElementById('confirmOverlay').classList.remove('active');
    pendingDeleteIdx = null;
    renderTable();
});

/* ── "Delete Profile" button in topbar (deletes current user) ── */
document.getElementById('deleteAllBtn')?.addEventListener('click', () => {
    pendingDeleteIdx = -1;   // sentinel for "self"
    document.getElementById('confirmMsg').textContent =
        'This will permanently delete YOUR profile and all your behavioural data. You will be logged out.';
    document.getElementById('confirmOverlay').classList.add('active');
});

// Intercept confirm for self-delete
const _origConfirm = document.getElementById('confirmDelete');
if (_origConfirm) {
    const original = _origConfirm.onclick;
    _origConfirm.addEventListener('click', async () => {
        if (pendingDeleteIdx === -1) {
            try {
                await fetch('/api/user-data', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: localStorage.getItem('session_id') || '' })
                });
            } catch (e) { /* silent */ }
            localStorage.clear();
            window.location.href = '/login';
        }
    });
}

/* ── Refresh ── */
document.getElementById('refreshTableBtn')?.addEventListener('click', () => {
    sessions = [...SEED_SESSIONS];
    renderTable();
});

/* =========================================================================
 *  HELPERS
 * ========================================================================= */

function scoreColour(score) {
    if (score > 0.75) return '#10b981';
    if (score >= 0.45) return '#f59e0b';
    return '#ef4444';
}

function tierClass(tier) {
    if (tier === 'ALLOW')   return 'allow';
    if (tier === 'STEP_UP') return 'stepup';
    return 'block';
}

function statusBadge(status) {
    const map = {
        active:      '<span style="color:#10b981">● Active</span>',
        otp_pending: '<span style="color:#f59e0b">◐ OTP Pending</span>',
        suspended:   '<span style="color:#ef4444">⊘ Suspended</span>'
    };
    return map[status] || status;
}

/* =========================================================================
 *  INIT
 * ========================================================================= */
renderTable();
console.log('🛡️ Admin Panel initialised');
