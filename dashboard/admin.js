const ADMIN_API_BASE_URL = 'http://localhost:4444/api/v1/admin';
const ADMIN_TOKEN_KEY = 'jhcis_admin_token';

let editFacilityModal = null;

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

function showFormResult(message, variant = 'info') {
    const box = document.getElementById('formResult');
    box.className = `alert alert-${variant} mt-3 mb-0`;
    box.textContent = message;
    box.style.display = 'block';
}

function showLoginResult(message) {
    const box = document.getElementById('loginResult');
    box.textContent = message;
    box.style.display = 'block';
}

function hideLoginResult() {
    const box = document.getElementById('loginResult');
    box.style.display = 'none';
    box.textContent = '';
}

function updateAuthState(isAuthenticated) {
    document.getElementById('adminLoginSection').style.display = isAuthenticated ? 'none' : 'flex';
    document.getElementById('adminApp').style.display = isAuthenticated ? 'block' : 'none';
}

function formatDateTime(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('th-TH');
}

function renderFacilities(rows) {
    const tbody = document.querySelector('#adminFacilitiesTable tbody');
    tbody.innerHTML = '';
    document.getElementById('facilityCount').textContent = rows.length;

    rows.forEach((facility) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${facility.hcode}</strong></td>
            <td>${facility.facility_name}</td>
            <td>${facility.status}</td>
            <td><code>${facility.api_key}</code></td>
            <td>${formatDateTime(facility.updated_at || facility.created_at)}</td>
            <td class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" data-action="toggle" data-hcode="${facility.hcode}" data-status="${facility.status}" data-name="${facility.facility_name}">${facility.status === 'active' ? 'ปิด' : 'เปิด'}</button>
                <button class="btn btn-sm btn-outline-dark" data-action="edit" data-hcode="${facility.hcode}" data-status="${facility.status}" data-name="${facility.facility_name}">แก้ชื่อ</button>
                <button class="btn btn-sm btn-outline-primary" data-action="regen" data-hcode="${facility.hcode}">สร้าง Key ใหม่</button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-hcode="${facility.hcode}" data-name="${facility.facility_name}">ลบ</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openEditFacilityModal(facility) {
    document.getElementById('editFacilityHcode').value = facility.hcode;
    document.getElementById('editFacilityStatus').value = facility.status;
    document.getElementById('editFacilityHcodeDisplay').value = facility.hcode;
    document.getElementById('editFacilityName').value = facility.name;
    editFacilityModal.show();
}

async function loadFacilities() {
    const payload = await requestJson(buildAdminUrl('/facilities'));
    renderFacilities(payload.data || []);
}

async function loginAdmin(event) {
    event.preventDefault();
    hideLoginResult();

    const body = {
        email: document.getElementById('adminEmail').value.trim(),
        password: document.getElementById('adminPassword').value,
    };

    const response = await fetch(buildAdminUrl('/login'), {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload.message || `HTTP ${response.status}`);
    }

    setAdminToken(payload.data.token);
    updateAuthState(true);
    await loadFacilities();
    showFormResult(`เข้าสู่ระบบเป็น ${payload.data.admin.email}`, 'success');
}

async function createFacility(event) {
    event.preventDefault();

    const body = {
        hcode: document.getElementById('facilityHcode').value.trim(),
        facility_name: document.getElementById('facilityName').value.trim(),
        status: document.getElementById('facilityStatus').value,
        api_key: document.getElementById('facilityApiKey').value.trim(),
    };

    const payload = await requestJson(buildAdminUrl('/facilities'), {
        method: 'POST',
        body: JSON.stringify(body),
    });

    showFormResult(`บันทึกสำเร็จ: ${payload.data.hcode} / ${payload.data.api_key}`, 'success');
    event.target.reset();
    await loadFacilities();
}

async function handleTableClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const hcode = button.dataset.hcode;

    if (action === 'regen') {
        const payload = await requestJson(buildAdminUrl(`/facilities/${hcode}/regenerate-key`), {
            method: 'POST',
        });
        showFormResult(`สร้าง API key ใหม่ให้ ${hcode}: ${payload.data.api_key}`, 'warning');
        await loadFacilities();
        return;
    }

    if (action === 'toggle') {
        const nextStatus = button.dataset.status === 'active' ? 'inactive' : 'active';
        await requestJson(buildAdminUrl(`/facilities/${hcode}`), {
            method: 'PUT',
            body: JSON.stringify({
                facility_name: button.dataset.name,
                status: nextStatus,
            }),
        });
        showFormResult(`อัปเดตสถานะ ${hcode} เป็น ${nextStatus} แล้ว`, 'success');
        await loadFacilities();
        return;
    }

    if (action === 'edit') {
        openEditFacilityModal({
            hcode,
            status: button.dataset.status,
            name: button.dataset.name || '',
        });
        return;
    }

    if (action === 'delete') {
        const facilityName = button.dataset.name || hcode;
        const confirmed = confirm(`ยืนยันการลบหน่วยบริการ "${facilityName}" (${hcode})?\n\nระบบจะตรวจสอบก่อนว่ามีข้อมูลที่เกี่ยวข้องหรือไม่`);
        if (!confirmed) {
            return;
        }

        try {
            const payload = await requestJson(buildAdminUrl(`/facilities/${hcode}`), {
                method: 'DELETE',
            });
            showFormResult(payload.message || `ลบหน่วยบริการ ${hcode} แล้ว`, 'success');
            await loadFacilities();
        } catch (error) {
            // Show detailed error message for dependencies
            showFormResult(error.message, 'danger');
        }
        return;
    }
}

async function submitEditFacility(event) {
    event.preventDefault();

    const hcode = document.getElementById('editFacilityHcode').value;
    const status = document.getElementById('editFacilityStatus').value;
    const facilityName = document.getElementById('editFacilityName').value.trim();

    if (!facilityName) {
        return;
    }

    await requestJson(buildAdminUrl(`/facilities/${hcode}`), {
        method: 'PUT',
        body: JSON.stringify({
            facility_name: facilityName,
            status,
        }),
    });

    editFacilityModal.hide();
    showFormResult(`อัปเดตชื่อหน่วย ${hcode} แล้ว`, 'success');
    await loadFacilities();
}

document.addEventListener('DOMContentLoaded', async () => {
    editFacilityModal = new bootstrap.Modal(document.getElementById('editFacilityModal'));
    updateAuthState(Boolean(getAdminToken()));

    document.getElementById('adminLoginForm').addEventListener('submit', async (event) => {
        try {
            await loginAdmin(event);
        } catch (error) {
            showLoginResult(error.message);
        }
    });

    document.getElementById('facilityForm').addEventListener('submit', async (event) => {
        try {
            await createFacility(event);
        } catch (error) {
            showFormResult(error.message, 'danger');
        }
    });

    document.getElementById('refreshFacilitiesBtn').addEventListener('click', async () => {
        try {
            await loadFacilities();
            showFormResult('รีเฟรชข้อมูลแล้ว', 'info');
        } catch (error) {
            showFormResult(error.message, 'danger');
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        clearAdminToken();
        updateAuthState(false);
        showFormResult('ออกจากระบบแล้ว', 'info');
    });

    document.querySelector('#adminFacilitiesTable tbody').addEventListener('click', async (event) => {
        try {
            await handleTableClick(event);
        } catch (error) {
            showFormResult(error.message, 'danger');
        }
    });

    document.getElementById('editFacilityForm').addEventListener('submit', async (event) => {
        try {
            await submitEditFacility(event);
        } catch (error) {
            showFormResult(error.message, 'danger');
        }
    });

    if (getAdminToken()) {
        try {
            await loadFacilities();
        } catch (error) {
            showLoginResult('กรุณาเข้าสู่ระบบใหม่');
        }
    }
});
