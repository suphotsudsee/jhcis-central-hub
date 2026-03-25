/**
 * JHCIS Dashboard Application
 * Main frontend logic and chart rendering
 */

const METRIC_OPTIONS = {
    op: {
        title: 'ยอด OP วันนี้',
        subtitle: 'ผู้ป่วยนอก',
        shortLabel: 'OP',
        field: 'op'
    },
    pp: {
        title: 'ยอด PP',
        subtitle: 'ส่งเสริมป้องกัน',
        shortLabel: 'PP',
        field: 'pp'
    },
    drug: {
        title: 'ยอด PHARMACY',
        subtitle: 'ข้อมูลเภสัชกรรม',
        shortLabel: 'PHARMACY',
        field: 'drug'
    },
    lab: {
        title: 'ยอด LAB',
        subtitle: 'ข้อมูลห้องปฏิบัติการ',
        shortLabel: 'LAB',
        field: 'lab'
    },
    financial: {
        title: 'ยอด FINANCIAL',
        subtitle: 'รายรับที่ส่งมา',
        shortLabel: 'FINANCIAL',
        field: 'financial'
    },
    resource: {
        title: 'ยอด RESOURCE',
        subtitle: 'จำนวนบุคลากร',
        shortLabel: 'RESOURCE',
        field: 'resource'
    },
    person: {
        title: 'PERSON',
        subtitle: 'ข้อมูลประชากร',
        shortLabel: 'PERSON',
        field: 'person'
    },
    general: {
        title: 'GENERAL',
        subtitle: 'จำนวนรายการทั่วไป',
        shortLabel: 'GENERAL',
        field: 'general'
    }
};

let dashboardData = null;
let facilitiesData = [];
let charts = {};
let refreshInterval = null;
let countdownInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    startAutoRefresh();
});

function getSelectedMetric() {
    return document.getElementById('metricFilter').value || 'op';
}

function getMetricConfig(metricKey = getSelectedMetric()) {
    return METRIC_OPTIONS[metricKey] || METRIC_OPTIONS.op;
}

async function initializeDashboard() {
    showLoading(true);

    try {
        await loadDashboardData();
        renderCharts();
        updateFacilitiesTable();
        updateSummaryCards();
        updateLastUpdateTime();
        document.getElementById('dateFilter').valueAsDate = new Date();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showDashboardError('โหลดข้อมูลจาก API ไม่สำเร็จ');
    } finally {
        showLoading(false);
    }
}

async function loadDashboardData(date = null) {
    const data = await DashboardAPI.fetchDashboardData(date);
    dashboardData = data;
    facilitiesData = data.facilities || [];
    return data;
}

function renderCharts() {
    renderOPChart();
    renderStatusChart();
    renderFacilitiesChart();
}

function renderOPChart() {
    const ctx = document.getElementById('opChart').getContext('2d');

    if (charts.op) {
        charts.op.destroy();
    }

    const opStats = dashboardData?.op_stats || [];
    const labels = opStats.map((item) => {
        const date = new Date(item.date);
        const buddhistYear = date.getFullYear() + 543;
        return `${date.getDate()}/${date.getMonth() + 1}/${buddhistYear}`;
    });
    const data = opStats.map((item) => item.op_count || 0);

    charts.op = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'ยอดผู้ป่วยนอก (OP)',
                data,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label(context) {
                            return `OP: ${context.parsed.y.toLocaleString()} คน`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function renderStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');

    if (charts.status) {
        charts.status.destroy();
    }

    const summary = dashboardData?.summary || {};
    const sent = summary.sent || 0;
    const notSent = summary.not_sent || 0;

    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['ส่งแล้ว', 'ยังไม่ส่ง'],
            datasets: [{
                data: [sent, notSent],
                backgroundColor: ['#198754', '#dc3545'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            const total = sent + notSent;
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderFacilitiesChart() {
    const ctx = document.getElementById('facilitiesChart').getContext('2d');

    if (charts.facilities) {
        charts.facilities.destroy();
    }

    const facilitiesStats = dashboardData?.facilities_stats || [];
    const labels = facilitiesStats.map((item) => {
        const date = new Date(item.date);
        const buddhistYear = date.getFullYear() + 543;
        return `${date.getDate()}/${date.getMonth() + 1}/${buddhistYear}`;
    });
    const sentData = facilitiesStats.map((item) => item.sent_count || 0);
    const notSentData = facilitiesStats.map((item) => item.not_sent_count || 0);

    charts.facilities = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'ส่งแล้ว',
                    data: sentData,
                    backgroundColor: '#198754',
                    borderWidth: 0
                },
                {
                    label: 'ยังไม่ส่ง',
                    data: notSentData,
                    backgroundColor: '#dc3545',
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 80,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
}

function updateFacilitiesTable() {
    const tbody = document.querySelector('#facilitiesTable tbody');
    tbody.innerHTML = '';

    const searchValue = document.getElementById('searchBox').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const metric = getMetricConfig();

    let filteredData = facilitiesData;

    if (searchValue) {
        filteredData = filteredData.filter((facility) =>
            (facility.facility_name && facility.facility_name.toLowerCase().includes(searchValue)) ||
            (facility.hcode && facility.hcode.toLowerCase().includes(searchValue))
        );
    }

    if (statusFilter !== 'all') {
        filteredData = filteredData.filter((facility) => facility.status === statusFilter);
    }

    document.getElementById('tableCount').textContent = `${filteredData.length}/80`;
    document.getElementById('selectedMetricColumnHeader').textContent = metric.shortLabel;

    filteredData.forEach((facility) => {
        const row = document.createElement('tr');
        const statusClass = facility.status === 'sent' ? 'status-sent' : 'status-not-sent';
        const statusText = facility.status === 'sent' ? 'ส่งแล้ว' : 'ยังไม่ส่ง';
        const lastSync = facility.last_sync_time
            ? new Date(facility.last_sync_time).toLocaleString('th-TH')
            : '-';
        const metricValue = facility.data_counts?.[metric.field] || 0;

        row.innerHTML = `
            <td><strong>${facility.hcode || '-'}</strong></td>
            <td>${facility.facility_name || '-'}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${lastSync}</td>
            <td><span class="count-item">${metric.shortLabel}: ${Number(metricValue).toLocaleString()}</span></td>
        `;

        tbody.appendChild(row);
    });
}

function updateSummaryCards() {
    const summary = dashboardData?.summary || {};
    const metric = getMetricConfig();
    const total = summary.total || 0;
    const sent = summary.sent || 0;
    const notSent = summary.not_sent || 0;
    const selectedTotal = facilitiesData.reduce((sum, facility) => (
        sum + Number(facility.data_counts?.[metric.field] || 0)
    ), 0);

    const sentPercent = total > 0 ? ((sent / total) * 100).toFixed(1) : 0;
    const notSentPercent = total > 0 ? ((notSent / total) * 100).toFixed(1) : 0;

    document.getElementById('totalFacilities').textContent = total;
    document.getElementById('sentCount').textContent = sent;
    document.getElementById('sentPercent').textContent = `${sentPercent}%`;
    document.getElementById('notSentCount').textContent = notSent;
    document.getElementById('notSentPercent').textContent = `${notSentPercent}%`;
    document.getElementById('selectedMetricTitle').textContent = metric.title;
    document.getElementById('selectedMetricSubtitle').textContent = metric.subtitle;
    document.getElementById('selectedMetricTotal').textContent = selectedTotal.toLocaleString();
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeStr;
}

function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', function() {
        refreshData();
    });

    document.getElementById('dateFilter').addEventListener('change', function() {
        refreshData();
    });

    document.getElementById('searchBox').addEventListener('input', function() {
        updateFacilitiesTable();
    });

    document.getElementById('statusFilter').addEventListener('change', function() {
        updateFacilitiesTable();
    });

    document.getElementById('metricFilter').addEventListener('change', function() {
        updateSummaryCards();
        updateFacilitiesTable();
    });

    document.getElementById('exportBtn').addEventListener('click', function() {
        exportData();
    });

    document.getElementById('autoRefresh').addEventListener('change', function() {
        if (this.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });
}

async function refreshData() {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('refreshing');

    try {
        const date = document.getElementById('dateFilter').value;
        await loadDashboardData(date);
        renderCharts();
        updateFacilitiesTable();
        updateSummaryCards();
        updateLastUpdateTime();
    } catch (error) {
        console.error('Refresh failed:', error);
        showDashboardError('รีเฟรชข้อมูลไม่สำเร็จ');
    } finally {
        btn.classList.remove('refreshing');
    }
}

function exportData() {
    const csvContent = DashboardAPI.exportToCSV(facilitiesData);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `jhcis_dashboard_${timestamp}.csv`;
    DashboardAPI.downloadCSV(csvContent, filename);
}

function startAutoRefresh() {
    stopAutoRefresh();

    refreshInterval = setInterval(() => {
        refreshData();
        resetCountdown();
    }, 60000);

    startCountdown();
    updateRefreshStatus(true);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    updateRefreshStatus(false);
}

function startCountdown() {
    let seconds = 60;
    document.getElementById('countdown').textContent = seconds;

    countdownInterval = setInterval(() => {
        seconds -= 1;
        if (seconds < 0) {
            seconds = 60;
        }
        document.getElementById('countdown').textContent = seconds;
    }, 1000);
}

function resetCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    startCountdown();
}

function updateRefreshStatus(isActive) {
    document.getElementById('refreshStatus').textContent = isActive ? 'เปิด' : 'ปิด';
}

function showDashboardError(message) {
    const tbody = document.querySelector('#facilitiesTable tbody');
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-danger py-4">${message}</td>
        </tr>
    `;

    dashboardData = {
        summary: {
            total: 0,
            sent: 0,
            not_sent: 0
        },
        op_stats: [],
        facilities_stats: []
    };
    facilitiesData = [];
    renderCharts();
    updateSummaryCards();
    updateLastUpdateTime();
}

function showLoading(show) {
    const modalElement = document.getElementById('loadingModal');

    if (show) {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-modal', 'true');
        modalElement.removeAttribute('aria-hidden');
        document.body.classList.add('modal-open');
    } else {
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
    }
}

window.DashboardApp = {
    initializeDashboard,
    refreshData,
    exportData,
    startAutoRefresh,
    stopAutoRefresh
};
