/**
 * sp500-engine.js
 * Pure classification functions for S&P 500 Watchlist.
 * No market logic, no APIs, no live data.
 */
'use strict';

// ── Valuation caution label ────────────────────────────────────────────────────
// Deterministic from CAPE percentile only. High valuation ≠ short signal.
const CAUTION_THRESHOLDS = { NORMAL: 70, ELEVATED: 85 }; // percentile cutoffs

/**
 * @param {number} capePercentile  — 0–100
 * @returns {'Normal'|'Elevated'|'Extreme'}
 */
function classifyValuationCaution(capePercentile) {
  if (typeof capePercentile !== 'number' || !isFinite(capePercentile)) return 'Normal';
  if (capePercentile >= CAUTION_THRESHOLDS.ELEVATED) return 'Extreme';
  if (capePercentile >= CAUTION_THRESHOLDS.NORMAL)   return 'Elevated';
  return 'Normal';
}

// ── Watchlist status ───────────────────────────────────────────────────────────
// Deterministic from above20d / above200d / extension flag only.

/**
 * @param {{ above20d: boolean, above200d: boolean, extended?: boolean }} row
 * @returns {{ status: string, note_auto: string }}
 */
function classifyWatchlistStatus(row) {
  if (!row || typeof row !== 'object') return { status: 'Neutral', note_auto: 'Insufficient data.' };

  const a20  = !!row.above20d;
  const a200 = !!row.above200d;
  const ext  = !!row.extended;

  if (!a200) {
    return { status: 'Weakening', note_auto: 'Below 200D MA. Wait for reclaim before adding.' };
  }
  if (!a20) {
    return { status: 'Neutral', note_auto: 'Above 200D but below 20D. No clear near-term trend.' };
  }
  if (ext) {
    return { status: 'Extended', note_auto: 'Large extension above 20D. Profit-taking zone — do not chase.' };
  }
  return { status: 'Bullish', note_auto: 'Above both 20D and 200D. Trend intact.' };
}

/**
 * Classify all watchlist rows from fixture, adding status field.
 * Extension heuristic: daily move >1.5% AND above20d = flag as extended.
 */
function classifyAll(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(function (r) {
    var extended = r.above20d && typeof r.dayChg === 'number' && r.dayChg > 1.5;
    var cls = classifyWatchlistStatus({ above20d: r.above20d, above200d: r.above200d, extended: extended });
    return Object.assign({}, r, { status: cls.status, _autoNote: cls.note_auto });
  });
}

const SP500Engine = {
  CAUTION_THRESHOLDS,
  classifyValuationCaution,
  classifyWatchlistStatus,
  classifyAll,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SP500Engine;
} else {
  window.SP500Engine = SP500Engine;
}
