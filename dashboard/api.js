/**
 * JHCIS Dashboard API Module
 * Handles all API calls to the Central backend
 */

const API_BASE_URL = 'http://localhost:9021/api/v1';

function buildApiUrl(path, params = {}) {
    const url = new URL(`${API_BASE_URL}${path}`);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            url.searchParams.append(key, value);
        }
    });

    return url;
}

async function fetchDashboardData(date = null) {
    try {
        const url = buildApiUrl('/dashboard/summary', { date });
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

async function fetchFacilitiesList(date = null, search = null, status = 'all') {
    try {
        const url = buildApiUrl('/dashboard/facilities', {
            date,
            search,
            status: status !== 'all' ? status : null
        });

        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching facilities list:', error);
        throw error;
    }
}

async function fetchOPStatistics(days = 30) {
    try {
        const url = buildApiUrl('/dashboard/op-stats', { days });
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching OP statistics:', error);
        throw error;
    }
}

async function fetchFacilitiesStats() {
    try {
        const url = buildApiUrl('/dashboard/facilities-stats');
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching facilities stats:', error);
        throw error;
    }
}

function exportToCSV(data) {
    const headers = [
        'hcode',
        'facility_name',
        'status',
        'last_sync_time',
        'total_records',
        'op_count',
        'pp_count',
        'pharmacy_count',
        'lab_count',
        'financial_total',
        'resource_count',
        'person_count',
        'general_count'
    ];

    const csvRows = [headers.join(',')];

    data.forEach((facility) => {
        const row = [
            facility.hcode || '',
            facility.facility_name || '',
            facility.status || '',
            facility.last_sync_time || '',
            facility.total_records || 0,
            facility.data_counts?.op || 0,
            facility.data_counts?.pp || 0,
            facility.data_counts?.drug || 0,
            facility.data_counts?.lab || 0,
            facility.data_counts?.financial || 0,
            facility.data_counts?.resource || 0,
            facility.data_counts?.person || 0,
            facility.data_counts?.general || 0
        ];
        csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
}

function downloadCSV(csvContent, filename = 'jhcis_dashboard_export.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.DashboardAPI = {
    fetchDashboardData,
    fetchFacilitiesList,
    fetchOPStatistics,
    fetchFacilitiesStats,
    exportToCSV,
    downloadCSV
};
