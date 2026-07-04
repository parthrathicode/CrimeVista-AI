import type { RiskScore, RiskBand, ShapContribution } from "@/types";
import { DISTRICTS } from "./districts";
import { CRIME_CATEGORIES, CRIME_TAXONOMY } from "./crimes";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rand = seeded(9);

function bandFor(score: number): RiskBand {
  if (score >= 71) return "High";
  if (score >= 41) return "Medium";
  return "Low";
}

const FEATURES = [
  "Recent Trend",
  "Seasonal Factor",
  "Hotspot Density",
  "Repeat Offenders",
  "Historical Baseline",
  "Nearby District Spillover",
];

function makeContributions(target: number): ShapContribution[] {
  // Split target into 4-6 feature contributions that sum to target
  const n = 4 + Math.floor(rand() * 2);
  const raw = Array.from({ length: n }).map(() => rand() + 0.2);
  const sum = raw.reduce((a, b) => a + b, 0);
  const picks = [...FEATURES].sort(() => rand() - 0.5).slice(0, n);
  const contribs = raw.map((r, i) => ({
    feature: picks[i],
    points: Math.round((r / sum) * target),
  }));
  // fix rounding drift
  const drift = target - contribs.reduce((a, b) => a + b.points, 0);
  contribs[0].points += drift;
  return contribs;
}

function monthlyTrend(baseline: number) {
  const months = [
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
  ];
  const trend = months.map((m, i) => ({
    month: m,
    cases: Math.max(0, Math.round(baseline + Math.sin(i / 2) * 4 + (rand() - 0.5) * 6 + i * 0.4)),
    isPredicted: false,
  }));
  // Mark last month as predicted
  trend[trend.length - 1].isPredicted = true;
  trend[trend.length - 1].cases = Math.round(
    trend[trend.length - 2].cases * (1 + (rand() - 0.3) * 0.4),
  );
  return trend;
}

// Pre-select 3 high risk combos
const HIGH_TARGETS = new Set([
  "d-bal|Crimes Against Property",
  "d-blr|Cyber Crime",
  "d-klb|Crimes Against Women",
]);

export const RISK_SCORES: RiskScore[] = (() => {
  const out: RiskScore[] = [];
  DISTRICTS.forEach((d) => {
    CRIME_CATEGORIES.forEach((cat) => {
      const subs = CRIME_TAXONOMY[cat];
      const sub = subs[Math.floor(rand() * subs.length)];
      const key = `${d.id}|${cat}`;
      let score: number;
      if (HIGH_TARGETS.has(key)) {
        score = 74 + Math.floor(rand() * 22);
      } else {
        score = Math.floor(rand() * 78);
      }
      out.push({
        districtId: d.id,
        districtName: d.name,
        category: cat,
        subType: sub,
        score,
        band: bandFor(score),
        contributions: makeContributions(score),
        monthlyTrend: monthlyTrend(6 + rand() * 8),
      });
    });
  });
  return out;
})();
