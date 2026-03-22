const ADMIN_API_BASE_URL = 'http://localhost:4444/api/v1/admin';
const ADMIN_TOKEN_KEY = 'jhcis_admin_token';
const QUERY_TYPES = ['op', 'pp', 'pharmacy', 'lab', 'financial', 'resource', 'person', 'general'];

function buildAdminUrl(path) {
    return `${ADMIN_API_BASE_URL}${path}`;
}

function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

function setAdminToken(token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function updateAuthState(isAuthenticated) {
    document.getElementById('queryLoginSection').style.display = isAuthenticated ? 'none' : 'flex';
    document.getElementById('queryApp').style.display = isAuthenticated ? 'block' : 'none';
}

function showLoginResult(message) {
    const box = document.getElementById('queryLoginResult');
    box.textContent = message;
    box.style.display = 'block';
}

function hideLoginResult() {
    const box = document.getElementById('queryLoginResult');
    box.style.display = 'none';
    box.textContent = '';
}

function showQueryResult(message, variant = 'info') {
    const box = document.getElementById('queryResult');
    box.className = `alert alert-${variant}`;
    box.textContent = message;
    box.style.display = 'block';
}

async function requestJson(url, options = {}) {
    const headers = {
        ...(options.headers || {})
    };
    const token = getAdminToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        mode: 'cors',
        headers,
        ...options
    });

    const payload = await response.json();
    if (!response.ok) {
        if (response.status === 401) {
            clearAdminToken();
            updateAuthState(false);
        }
        throw new Error(payload.message || `HTTP ${response.status}`);
    }

    return payload;
}

async function loginAdmin(event) {
    event.preventDefault();
    hideLoginResult();

    const response = await fetch(buildAdminUrl('/login'), {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: document.getElementById('queryAdminEmail').value.trim(),
            password: document.getElementById('queryAdminPassword').value,
        }),
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.message || `HTTP ${response.status}`);
    }

    setAdminToken(payload.data.token);
    updateAuthState(true);
    await loadQueries();
    showQueryResult(`เข้าสู่ระบบเป็น ${payload.data.admin.email}`, 'success');
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderQueryCards(queries) {
    const byType = new Map(queries.map((item) => [item.summaryType, item]));
    const container = document.getElementById('queryCards');

    container.innerHTML = QUERY_TYPES.map((summaryType) => {
        const item = byType.get(summaryType);
        const sql = item?.sql || '';
        const updatedAt = item?.updatedAt ? new Date(item.updatedAt).toLocaleString('th-TH') : '-';
        const isActive = item ? item.isActive !== false : true;

        return `
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${summaryType.toUpperCase()}</strong>
                            <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'} ms-2">${isActive ? 'active' : 'inactive'}</span>
                        </div>
                        <small class="text-muted">อัปเดตล่าสุด: ${updatedAt}</small>
                    </div>
                    <div class="card-body">
                        <form class="query-form" data-summary-type="${summaryType}">
                            <div class="mb-3">
                                <label class="form-label">SQL</label>
                                <textarea class="form-control" name="sql" rows="8" spellcheck="false">${escapeHtml(sql)}</textarea>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" name="isActive" id="isActive-${summaryType}" ${isActive ? 'checked' : ''}>
                                <label class="form-check-label" for="isActive-${summaryType}">เปิดใช้งาน query นี้</label>
                            </div>
                            <button type="submit" class="btn btn-primary">บันทึก ${summaryType.toUpperCase()}</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadQueries() {
    const payload = await requestJson(buildAdminUrl('/queries'));
    renderQueryCards(payload.data || []);
}

async function saveQuery(form) {
    const summaryType = form.dataset.summaryType;
    const sql = form.querySelector('[name="sql"]').value.trim();
    const isActive = form.querySelector('[name="isActive"]').checked;

    await requestJson(buildAdminUrl(`/queries/${summaryType}`), {
        method: 'PUT',
        body: JSON.stringify({ sql, isActive }),
    });

    showQueryResult(`บันทึก query ของ ${summaryType.toUpperCase()} แล้ว`, 'success');
    await loadQueries();
}

document.addEventListener('DOMContentLoaded', async () => {
    updateAuthState(Boolean(getAdminToken()));

    document.getElementById('queryLoginForm').addEventListener('submit', async (event) => {
        try {
            await loginAdmin(event);
        } catch (error) {
            showLoginResult(error.message);
        }
    });

    document.getElementById('refreshQueriesBtn').addEventListener('click', async () => {
        try {
            await loadQueries();
            showQueryResult('รีเฟรช query แล้ว', 'info');
        } catch (error) {
            showQueryResult(error.message, 'danger');
        }
    });

    document.getElementById('queryLogoutBtn').addEventListener('click', () => {
        clearAdminToken();
        updateAuthState(false);
        showQueryResult('ออกจากระบบแล้ว', 'info');
    });

    document.getElementById('queryCards').addEventListener('submit', async (event) => {
        const form = event.target.closest('.query-form');
        if (!form) {
            return;
        }

        event.preventDefault();

        try {
            await saveQuery(form);
        } catch (error) {
            showQueryResult(error.message, 'danger');
        }
    });

    if (getAdminToken()) {
        try {
            await loadQueries();
        } catch (error) {
            showLoginResult('กรุณาเข้าสู่ระบบใหม่');
        }
    }
});
