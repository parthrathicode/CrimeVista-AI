// Mock API layer. Every component consumes data via these functions.
// Swap the internals with real fetch() calls later without touching the UI.

import type {
  Alert,
  CaseRecord,
  District,
  HotspotCluster,
  NetworkEdge,
  NetworkNode,
  PoliceStation,
  RepeatOffender,
  RiskScore,
} from "@/types";
import { DISTRICTS, STATIONS } from "@/data/districts";
import { CASES, HOTSPOTS } from "@/data/cases";
import { REPEAT_OFFENDERS } from "@/data/offenders";
import { RISK_SCORES } from "@/data/risk";
import { ALERTS } from "@/data/alerts";

const delay = <T>(v: T, ms = 250): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));

export interface MapFilters {
  hourRange?: [number, number];
  dateWindowDays?: number | null; // null = all time
}

export async function getDistricts(): Promise<District[]> {
  return delay(DISTRICTS);
}

export async function getStations(districtId?: string): Promise<PoliceStation[]> {
  return delay(districtId ? STATIONS.filter((s) => s.districtId === districtId) : STATIONS);
}

export async function getCases(
  districtId?: string,
  filters: MapFilters = {},
): Promise<CaseRecord[]> {
  const now = Date.now();
  const [hMin, hMax] = filters.hourRange ?? [0, 23];
  const windowMs =
    filters.dateWindowDays != null ? filters.dateWindowDays * 24 * 60 * 60 * 1000 : null;

  const filtered = CASES.filter((c) => {
    if (districtId && c.districtId !== districtId) return false;
    if (c.hour < hMin || c.hour > hMax) return false;
    if (windowMs != null && now - new Date(c.date).getTime() > windowMs) return false;
    return true;
  });
  return delay(filtered);
}

export async function getHotspots(districtId?: string): Promise<HotspotCluster[]> {
  return delay(districtId ? HOTSPOTS.filter((h) => h.districtId === districtId) : HOTSPOTS);
}

export async function getAlerts(): Promise<Alert[]> {
  return delay(ALERTS, 120);
}

export async function getRepeatOffenders(): Promise<RepeatOffender[]> {
  return delay(REPEAT_OFFENDERS);
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: { offenderCount: number; linkedCaseCount: number };
}

export interface NetworkFilters {
  query?: string;
  districtId?: string;
  category?: string;
  minLinks?: number;
}

export async function getNetworkGraph(filters: NetworkFilters = {}): Promise<NetworkGraph> {
  const minLinks = filters.minLinks ?? 2;
  const q = (filters.query ?? "").trim().toLowerCase();

  const offenders = REPEAT_OFFENDERS.filter((o) => {
    if (o.linkedCaseIds.length < minLinks) return false;
    if (filters.districtId && o.districtId !== filters.districtId) return false;
    if (q && !o.name.toLowerCase().includes(q)) return false;
    if (filters.category) {
      const cats = o.linkedCaseIds
        .map((cid) => CASES.find((c) => c.id === cid)?.category)
        .filter(Boolean);
      if (!cats.includes(filters.category as any)) return false;
    }
    return true;
  });

  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const stationSet = new Set<string>();
  const linkedCaseIds = new Set<string>();

  offenders.forEach((o) => {
    nodes.push({
      id: `off-${o.id}`,
      label: o.name,
      type: "accused",
      districtId: o.districtId,
      linkedCaseCount: o.linkedCaseIds.length,
      age: o.age,
      gender: o.gender,
    });
    o.linkedCaseIds.forEach((cid) => {
      const c = CASES.find((cc) => cc.id === cid);
      if (!c) return;
      linkedCaseIds.add(cid);
      // victim node per case
      const victimId = `vic-${cid}`;
      nodes.push({
        id: victimId,
        label: `Victim (${cid})`,
        type: "victim",
        districtId: c.districtId,
        linkedCaseCount: 1,
      });
      edges.push({
        source: `off-${o.id}`,
        target: victimId,
        caseId: cid,
        crimeCategory: c.category,
      });
      // station node
      const stationNodeId = `stn-${c.stationId}`;
      if (!stationSet.has(c.stationId)) {
        stationSet.add(c.stationId);
        const s = STATIONS.find((ss) => ss.id === c.stationId);
        nodes.push({
          id: stationNodeId,
          label: s?.name ?? c.stationId,
          type: "station",
          districtId: c.districtId,
          linkedCaseCount: 0,
        });
      }
      edges.push({
        source: `off-${o.id}`,
        target: stationNodeId,
        caseId: cid,
        crimeCategory: c.category,
      });
    });
  });

  // Count station link counts
  nodes.forEach((n) => {
    if (n.type === "station") {
      n.linkedCaseCount = edges.filter((e) => e.target === n.id).length;
    }
  });

  return delay({
    nodes,
    edges,
    stats: {
      offenderCount: offenders.length,
      linkedCaseCount: linkedCaseIds.size,
    },
  });
}

export async function getRiskLeaderboard(topN = 5): Promise<RiskScore[]> {
  return delay([...RISK_SCORES].sort((a, b) => b.score - a.score).slice(0, topN));
}

export async function getRiskScores(): Promise<RiskScore[]> {
  return delay(RISK_SCORES);
}

export async function getRiskDetail(
  districtId: string,
  category: string,
): Promise<RiskScore | undefined> {
  return delay(RISK_SCORES.find((r) => r.districtId === districtId && r.category === category));
}

// Enrich offender with linked case detail for the side panel
export async function getOffenderDetail(offenderId: string) {
  const raw = REPEAT_OFFENDERS.find((o) => o.id === offenderId);
  if (!raw) return delay(null);
  const linkedCases = raw.linkedCaseIds
    .map((cid) => CASES.find((c) => c.id === cid))
    .filter(Boolean) as CaseRecord[];

  const catCounts: Record<string, number> = {};
  const hourBuckets: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  linkedCases.forEach((c) => {
    catCounts[c.category] = (catCounts[c.category] ?? 0) + 1;
    const b =
      c.hour < 6 ? "Night" : c.hour < 12 ? "Morning" : c.hour < 18 ? "Afternoon" : "Evening";
    hourBuckets[b] += 1;
  });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const topBucket = Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return delay({
    ...raw,
    linkedCases,
    moSignature: `${topCat} · ${topBucket}`,
    stationsInvolved: Array.from(new Set(linkedCases.map((c) => c.stationId))).length,
  });
}

// ---------- District Intelligence Cards ----------
export interface DistrictInsight {
  districtId: string;
  districtName: string;
  totalCases: number;
  priorPeriodCases: number;
  trendPct: number; // positive = up
  hotspotCount: number;
  offenderCount: number;
  dominantSubType: string;
  dominantCategory: string;
  topHotspotLabel: string;
  highestRiskBand: "Low" | "Medium" | "High";
  highestRiskScore: number;
  suggestedAction: string;
}

function suggestAction(dominantCategory: string): string {
  if (dominantCategory === "Cyber Crime")
    return "Increase cyber cell monitoring and public awareness campaigns.";
  if (dominantCategory === "Crimes Against Women")
    return "Deploy women's safety patrol units and strengthen helpline response in flashpoint areas.";
  if (dominantCategory === "Crimes Against Property")
    return "Increase patrol frequency and CCTV coverage in identified hotspot zones during peak hours.";
  if (dominantCategory === "Crimes Against Body")
    return "Coordinate rapid-response teams and community policing in flashpoint wards.";
  if (dominantCategory === "Crimes Against Public Order")
    return "Enhance crowd monitoring and preventive intelligence for public gatherings.";
  return "Review station-level deployment against recent case density.";
}

export async function getDistrictInsights(): Promise<DistrictInsight[]> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const insights: DistrictInsight[] = DISTRICTS.map((d) => {
    const dCases = CASES.filter((c) => c.districtId === d.id);
    const recent = dCases.filter((c) => now - new Date(c.date).getTime() <= 30 * day);
    const prior = dCases.filter((c) => {
      const age = now - new Date(c.date).getTime();
      return age > 30 * day && age <= 60 * day;
    });
    const trendPct =
      prior.length === 0
        ? recent.length > 0
          ? 100
          : 0
        : Math.round(((recent.length - prior.length) / prior.length) * 100);

    const subCounts: Record<string, number> = {};
    const catCounts: Record<string, number> = {};
    dCases.forEach((c) => {
      subCounts[c.subType] = (subCounts[c.subType] ?? 0) + 1;
      catCounts[c.category] = (catCounts[c.category] ?? 0) + 1;
    });
    const dominantCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const subtypeCountsForDominantCategory: Record<string, number> = {};
    dCases
      .filter((c) => c.category === dominantCategory)
      .forEach((c) => {
        subtypeCountsForDominantCategory[c.subType] =
          (subtypeCountsForDominantCategory[c.subType] ?? 0) + 1;
      });
    const dominantSubType =
      Object.entries(subtypeCountsForDominantCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      Object.entries(subCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "—";

    const dHotspots = HOTSPOTS.filter((h) => h.districtId === d.id);
    const topHotspot = [...dHotspots].sort((a, b) => b.caseCount - a.caseCount)[0];
    const offenderCount = REPEAT_OFFENDERS.filter((o) => o.districtId === d.id).length;
    const dRisks = RISK_SCORES.filter((r) => r.districtId === d.id).sort(
      (a, b) => b.score - a.score,
    );
    const topRisk = dRisks[0];

    return {
      districtId: d.id,
      districtName: d.name,
      totalCases: dCases.length,
      priorPeriodCases: prior.length,
      trendPct,
      hotspotCount: dHotspots.length,
      offenderCount,
      dominantSubType,
      dominantCategory,
      topHotspotLabel: topHotspot
        ? `${topHotspot.dominantCrime} cluster (${topHotspot.caseCount} cases)`
        : "—",
      highestRiskBand: topRisk?.band ?? "Low",
      highestRiskScore: topRisk?.score ?? 0,
      suggestedAction: suggestAction(dominantCategory),
    };
  });
  return delay(insights);
}

// ---------- Intelligence Briefing ----------
export interface Briefing {
  scope: string; // "State-wide" or district name
  dateRange: string;
  totalCases: number;
  trendPct: number;
  bullets: string[];
  recommendations: string[];
  plainText: string;
}

export async function getBriefing(districtId?: string): Promise<Briefing> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const scopeCases = districtId ? CASES.filter((c) => c.districtId === districtId) : CASES;
  const recent = scopeCases.filter((c) => now - new Date(c.date).getTime() <= 30 * day);
  const prior = scopeCases.filter((c) => {
    const age = now - new Date(c.date).getTime();
    return age > 30 * day && age <= 60 * day;
  });
  const trendPct =
    prior.length === 0 ? 0 : Math.round(((recent.length - prior.length) / prior.length) * 100);

  const scopeName = districtId
    ? (DISTRICTS.find((d) => d.id === districtId)?.name ?? "Unknown district")
    : "State-wide (Karnataka)";

  const startDate = new Date(now - 30 * day).toISOString().slice(0, 10);
  const endDate = new Date(now).toISOString().slice(0, 10);

  const bullets: string[] = [];

  // Alerts relevant to scope
  const relevantAlerts = ALERTS.filter((a) => !districtId || a.districtId === districtId).slice(
    0,
    3,
  );
  relevantAlerts.forEach((a) => bullets.push(a.title + "."));

  // Repeat offenders
  const offenders = REPEAT_OFFENDERS.filter((o) => !districtId || o.districtId === districtId);
  const threePlus = offenders.filter((o) => o.linkedCaseIds.length >= 3);
  if (threePlus.length > 0) {
    const dCounts: Record<string, number> = {};
    threePlus.forEach((o) => {
      dCounts[o.districtId] = (dCounts[o.districtId] ?? 0) + 1;
    });
    const topDId = Object.entries(dCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topDName = DISTRICTS.find((d) => d.id === topDId)?.name ?? "multiple districts";
    bullets.push(
      `${threePlus.length} repeat offenders are currently linked to 3 or more cases each, concentrated in ${topDName}.`,
    );
  }

  // Highest predicted risk
  const scopeRisks = districtId
    ? RISK_SCORES.filter((r) => r.districtId === districtId)
    : RISK_SCORES;
  const topRisk = [...scopeRisks].sort((a, b) => b.score - a.score)[0];
  if (topRisk) {
    const topFactor = [...topRisk.contributions].sort((a, b) => b.points - a.points)[0];
    bullets.push(
      `${topRisk.districtName} shows the highest predicted risk for ${topRisk.category} (score ${topRisk.score}/100). Dominant factor: ${topFactor?.feature ?? "n/a"} (+${topFactor?.points ?? 0} pts).`,
    );
  }

  // Recommendations (state-wide or district)
  const catCounts: Record<string, number> = {};
  scopeCases.forEach((c) => {
    catCounts[c.category] = (catCounts[c.category] ?? 0) + 1;
  });
  const topCats = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const recommendations: string[] = [];
  topCats.forEach(([cat]) => {
    const rec = suggestAction(cat);
    if (!recommendations.includes(rec)) recommendations.push(rec);
  });
  if (recommendations.length < 2) {
    recommendations.push(
      "Increase inter-district intelligence sharing for repeat offender networks.",
    );
  }

  const opening = `${scopeName}: ${recent.length} cases recorded in the last 30 days, ${trendPct >= 0 ? "up" : "down"} ${Math.abs(trendPct)}% versus the prior 30-day window.`;

  const plainText = [
    `WEEKLY CRIME INTELLIGENCE BRIEFING`,
    `Scope: ${scopeName}`,
    `Period: ${startDate} to ${endDate}`,
    ``,
    opening,
    ``,
    `KEY OBSERVATIONS`,
    ...bullets.map((b) => `- ${b}`),
    ``,
    `RECOMMENDED ACTIONS`,
    ...recommendations.map((r) => `- ${r}`),
  ].join("\n");

  return delay({
    scope: scopeName,
    dateRange: `${startDate} — ${endDate}`,
    totalCases: recent.length,
    trendPct,
    bullets,
    recommendations,
    plainText,
  });
}
