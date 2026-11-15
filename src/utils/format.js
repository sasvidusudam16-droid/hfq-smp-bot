// Number formatting for stats.

/** 1234 -> "1.23K", 20000000000 -> "20B". Rounds DOWN so 999999 never shows as "1000K". */
function compact(n) {
  n = Number(n) || 0;
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  const units = [['T', 1e12], ['B', 1e9], ['M', 1e6], ['K', 1e3]];
  for (const [unit, size] of units) {
    if (n >= size) {
      const x = n / size;
      const digits = x >= 100 ? 0 : x >= 10 ? 1 : 2;
      const f = 10 ** digits;
      return `${sign}${Math.floor(x * f) / f}${unit}`;
    }
  }
  return `${sign}${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

/** 400 -> "$400", 1000 -> "$1K", 1500 -> "$1.5K", 20e9 -> "$20B" */
function formatMoney(n) {
  const s = compact(n);
  return s.startsWith('-') ? `-$${s.slice(1)}` : `$${s}`;
}

/** minutes -> "5D 9H", "12H 30M", "45M" */
function formatPlaytime(minutes) {
  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d) return `${d}D ${h}H`;
  if (h) return `${h}H ${mm}M`;
  return `${mm}M`;
}

module.exports = { compact, formatMoney, formatPlaytime };
