const db = require('../db/database');

const SUMMARY_TABLES = [
  { table: 'summary_op', key: 'op', valueField: 'total_visits' },
  { table: 'summary_pp', key: 'pp', valueField: 'total_services' },
  { table: 'summary_pharmacy', key: 'drug', valueField: 'total_prescriptions' },
  { table: 'summary_lab', key: 'lab', valueField: 'total_tests' },
  { table: 'summary_financial', key: 'financial', valueField: 'total_revenue' },
  { table: 'summary_resource', key: 'resource', valueField: 'staff_count' },
  { table: 'summary_person', key: 'person', valueField: 'total_person' },
  { table: 'summary_general', key: 'general', valueField: null },
];

function formatDateOnly(value = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function getTargetDate(input) {
  return input ? formatDateOnly(input) : formatDateOnly(new Date());
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parsePayload(raw) {
  if (!raw) {
    return {};
  }

  if (typeof raw === 'object') {
    return raw;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function getFacilitiesBase() {
  const result = await db.query(`
    SELECT hcode, facility_name, status
    FROM health_facilities
    ORDER BY facility_name ASC, hcode ASC
  `);

  return result.rows;
}

async function getSummaryRowsForDate(reportDate) {
  const rowsByTable = {};

  for (const { table } of SUMMARY_TABLES) {
    const result = await db.query(
      `SELECT hcode, report_date, updated_at, data FROM ${table} WHERE report_date = ?`,
      [reportDate]
    );
    rowsByTable[table] = result.rows;
  }

  return rowsByTable;
}

function buildFacilitiesDataset(facilities, rowsByTable, reportDate) {
  const facilityMap = new Map();

  facilities.forEach((facility) => {
    facilityMap.set(facility.hcode, {
      hcode: facility.hcode,
      facility_name: facility.facility_name,
      status: 'not_sent',
      last_sync_time: null,
      total_records: 0,
      data_counts: {
        op: 0,
        pp: 0,
        drug: 0,
        lab: 0,
        financial: 0,
        resource: 0,
        person: 0,
        general: 0,
      },
    });
  });

  SUMMARY_TABLES.forEach(({ table, key, valueField }) => {
    const rows = rowsByTable[table] || [];

    rows.forEach((row) => {
      const facility = facilityMap.get(row.hcode);
      if (!facility) {
        return;
      }

      const payload = parsePayload(row.data);
      const countValue = valueField ? toNumber(payload[valueField]) : 1;

      facility.data_counts[key] += countValue;
      facility.total_records += 1;
      facility.status = 'sent';

      if (!facility.last_sync_time || new Date(row.updated_at) > new Date(facility.last_sync_time)) {
        facility.last_sync_time = row.updated_at;
      }
    });
  });

  return Array.from(facilityMap.values()).map((facility) => ({
    ...facility,
    report_date: reportDate,
  }));
}

async function getDashboardPayload({
  reportDate = getTargetDate(),
  days = 30,
  search = null,
  status = 'all',
} = {}) {
  const facilities = await getFacilitiesBase();
  const rowsByTable = await getSummaryRowsForDate(reportDate);
  let facilityRows = buildFacilitiesDataset(facilities, rowsByTable, reportDate);

  if (search) {
    const keyword = search.toLowerCase();
    facilityRows = facilityRows.filter(
      (row) =>
        row.hcode.toLowerCase().includes(keyword) ||
        row.facility_name.toLowerCase().includes(keyword)
    );
  }

  if (status && status !== 'all') {
    facilityRows = facilityRows.filter((row) => row.status === status);
  }

  const opStats = await getOpStatsData(days);
  const facilitiesStats = await getFacilitiesStatsData(7, facilities.length);

  const summary = {
    total: facilities.length,
    sent: facilityRows.filter((row) => row.status === 'sent').length,
    not_sent: facilityRows.filter((row) => row.status === 'not_sent').length,
  };

  return {
    facilities: facilityRows,
    summary,
    op_stats: opStats,
    facilities_stats: facilitiesStats,
    report_date: reportDate,
  };
}

async function getOpStatsData(days = 30) {
  const totalDays = Math.max(1, toNumber(days) || 30);
  const result = await db.query(
    `
      SELECT report_date, hcode, data
      FROM summary_op
      WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY report_date ASC
    `,
    [Math.max(totalDays - 1, 0)]
  );

  const statsMap = new Map();

  result.rows.forEach((row) => {
    const date = formatDateOnly(row.report_date);
    const payload = parsePayload(row.data);
    const current = statsMap.get(date) || {
      date,
      op_count: 0,
      facility_set: new Set(),
    };

    current.op_count += toNumber(payload.total_visits);
    current.facility_set.add(row.hcode);
    statsMap.set(date, current);
  });

  const dates = [];
  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    dates.push(formatDateOnly(date));
  }

  return dates.map((date) => {
    const item = statsMap.get(date);
    return {
      date,
      op_count: item ? item.op_count : 0,
      facility_count: item ? item.facility_set.size : 0,
    };
  });
}

async function getFacilitiesStatsData(days = 7, totalFacilities = 0) {
  const totalDays = Math.max(1, toNumber(days) || 7);
  const sentMap = new Map();

  for (const { table } of SUMMARY_TABLES) {
    const result = await db.query(
      `
        SELECT report_date, hcode
        FROM ${table}
        WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      `,
      [Math.max(totalDays - 1, 0)]
    );

    result.rows.forEach((row) => {
      const date = formatDateOnly(row.report_date);
      const current = sentMap.get(date) || new Set();
      current.add(row.hcode);
      sentMap.set(date, current);
    });
  }

  const stats = [];
  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = formatDateOnly(date);
    const sentCount = sentMap.has(key) ? sentMap.get(key).size : 0;
    stats.push({
      date: key,
      sent_count: sentCount,
      not_sent_count: Math.max(totalFacilities - sentCount, 0),
    });
  }

  return stats;
}

async function getDashboardSummary(req, res) {
  try {
    const reportDate = getTargetDate(req.query.date);
    const payload = await getDashboardPayload({ reportDate });

    return res.status(200).json({
      success: true,
      ...payload,
      statusCode: 200,
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to load dashboard summary',
      statusCode: 500,
    });
  }
}

async function getFacilitiesList(req, res) {
  try {
    const reportDate = getTargetDate(req.query.date);
    const payload = await getDashboardPayload({
      reportDate,
      search: req.query.search || null,
      status: req.query.status || 'all',
    });

    return res.status(200).json({
      success: true,
      data: payload.facilities,
      report_date: reportDate,
      statusCode: 200,
    });
  } catch (error) {
    console.error('Facilities list error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to load facilities list',
      statusCode: 500,
    });
  }
}

async function getOpStats(req, res) {
  try {
    const days = toNumber(req.query.days) || 30;
    const data = await getOpStatsData(days);

    return res.status(200).json({
      success: true,
      data,
      statusCode: 200,
    });
  } catch (error) {
    console.error('OP stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to load OP statistics',
      statusCode: 500,
    });
  }
}

async function getFacilitiesStats(req, res) {
  try {
    const totalFacilities = (await getFacilitiesBase()).length;
    const data = await getFacilitiesStatsData(7, totalFacilities);

    return res.status(200).json({
      success: true,
      data,
      statusCode: 200,
    });
  } catch (error) {
    console.error('Facilities stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to load facilities statistics',
      statusCode: 500,
    });
  }
}

module.exports = {
  getDashboardSummary,
  getFacilitiesList,
  getOpStats,
  getFacilitiesStats,
};
