/**
 * SQL safety helpers for central query distribution.
 */

const BLOCKED_PATTERN = /\b(insert|update|delete|drop|alter|create|truncate|replace|grant|revoke|call|do|set|use)\b/i;

function stripComments(sql = '') {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .trim();
}

function normalizeSql(sql = '') {
  return stripComments(sql).replace(/\s+/g, ' ').trim();
}

function isSafeSelectQuery(sql = '') {
  const normalized = normalizeSql(sql);
  if (!normalized) {
    return false;
  }

  if (!/^select\b/i.test(normalized)) {
    return false;
  }

  if (normalized.includes(';')) {
    return false;
  }

  return !BLOCKED_PATTERN.test(normalized);
}

module.exports = {
  normalizeSql,
  isSafeSelectQuery,
};
