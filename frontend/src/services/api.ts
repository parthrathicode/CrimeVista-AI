// Real API layer connecting the React frontend to the FastAPI Python backend.

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

export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export interface MapFilters {
  hourRange?: [number, number];
  dateWindowDays?: number | null;
}

export async function getDistricts(): Promise<District[]> {
  const res = await fetch(`${API_BASE}/districts`);
  if (!res.ok) throw new Error("Failed to fetch districts");
  return res.json();
}

export async function getStations(districtId?: string): Promise<PoliceStation[]> {
  // Kept for backward compatibility with unused definitions, returns empty
  return [];
}

export async function getCases(
  districtId?: string,
  filters: MapFilters = {},
): Promise<CaseRecord[]> {
  const params = new URLSearchParams();
  if (filters.hourRange) {
    params.append("hour_from", String(filters.hourRange[0]));
    params.append("hour_to", String(filters.hourRange[1]));
  }
  if (filters.dateWindowDays != null) {
    params.append("dateWindowDays", String(filters.dateWindowDays));
  }
  const res = await fetch(
    `${API_BASE}/districts/${districtId ?? "all"}/cases?${params.toString()}`,
  );
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

export async function getHotspots(districtId?: string): Promise<HotspotCluster[]> {
  const res = await fetch(`${API_BASE}/districts/${districtId ?? "all"}/hotspots`);
  if (!res.ok) throw new Error("Failed to fetch hotspots");
  return res.json();
}

export async function getAlerts(): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function getRepeatOffenders(): Promise<RepeatOffender[]> {
  const res = await fetch(`${API_BASE}/network/repeat-offenders`);
  if (!res.ok) throw new Error("Failed to fetch repeat offenders");
  return res.json();
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
  const params = new URLSearchParams();
  if (filters.districtId) params.append("district_id", filters.districtId);
  if (filters.minLinks) params.append("min_cases", String(filters.minLinks));

  const res = await fetch(`${API_BASE}/network/graph?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch network graph");
  const data = await res.json();

  // Client side filtering for name query and category if needed
  let filteredNodes: NetworkNode[] = data.nodes;
  let filteredEdges: NetworkEdge[] = data.edges;

  if (filters.query || filters.category) {
    const q = filters.query ? filters.query.toLowerCase().trim() : null;
    const cat = filters.category;

    // Step 1: Filter edges by category
    if (cat) {
      filteredEdges = filteredEdges.filter((e) => e.crimeCategory === cat);
    }

    // Step 2: If query, find matching accused nodes and filter edges again
    const matchingAccused = new Set<string>();
    if (q) {
      data.nodes.forEach((n: NetworkNode) => {
        if (n.type === "accused" && n.label.toLowerCase().includes(q)) {
          matchingAccused.add(n.id);
        }
      });
      filteredEdges = filteredEdges.filter(
        (e) => matchingAccused.has(e.source) || matchingAccused.has(e.target),
      );
    }

    // Step 3: Determine which nodes to keep
    const activeNodeIds = new Set<string>();
    filteredEdges.forEach((e) => {
      activeNodeIds.add(e.source);
      activeNodeIds.add(e.target);
    });

    // Make sure we keep the matched accused nodes even if they have no edges left
    if (q) {
      matchingAccused.forEach((id) => activeNodeIds.add(id));
    }

    filteredNodes = data.nodes.filter((n: NetworkNode) => {
      if (activeNodeIds.has(n.id)) return true;
      // If we only filtered by category, we preserve stations for context
      if (!q && cat && n.type === "station") return true;
      return false;
    });
  }

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    stats: {
      offenderCount: filteredNodes.filter((n) => n.type === "accused").length,
      linkedCaseCount: filteredNodes.filter((n) => n.type === "victim").length,
    },
  };
}

export async function getRiskLeaderboard(topN = 5): Promise<RiskScore[]> {
  const res = await fetch(`${API_BASE}/risk/leaderboard`);
  if (!res.ok) throw new Error("Failed to fetch risk leaderboard");
  const data = await res.json();
  return data.slice(0, topN);
}

export async function getRiskScores(): Promise<RiskScore[]> {
  const res = await fetch(`${API_BASE}/risk/scores`);
  if (!res.ok) throw new Error("Failed to fetch risk scores");
  return res.json();
}

export async function getRiskDetail(
  districtId: string,
  category: string,
): Promise<RiskScore | undefined> {
  const scores = await getRiskScores();
  return scores.find((s) => s.districtId === districtId && s.subType === category);
}

export async function getOffenderDetail(offenderId: string) {
  const res = await fetch(`${API_BASE}/network/offender/${offenderId}`);
  if (!res.ok) throw new Error("Failed to fetch offender detail");
  return res.json();
}

// ---------- District Intelligence Cards ----------
export interface DistrictInsight {
  districtId: string;
  districtName: string;
  totalCases: number;
  priorPeriodCases: number;
  trendPct: number;
  hotspotCount: number;
  offenderCount: number;
  dominantSubType: string;
  dominantCategory: string;
  topHotspotLabel: string;
  highestRiskBand: "Low" | "Medium" | "High";
  highestRiskScore: number;
  suggestedAction: string;
}

export async function getDistrictInsights(): Promise<DistrictInsight[]> {
  const res = await fetch(`${API_BASE}/districts/insights`);
  if (!res.ok) throw new Error("Failed to fetch district insights");
  return res.json();
}

// ---------- Intelligence Briefing ----------
export interface Briefing {
  scope: string;
  dateRange: string;
  totalCases: number;
  trendPct: number;
  bullets: string[];
  recommendations: string[];
  plainText: string;
}

export async function getBriefing(districtId?: string): Promise<Briefing> {
  const params = new URLSearchParams();
  if (districtId) params.append("district_id", districtId);

  const res = await fetch(`${API_BASE}/briefing?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch briefing");
  return res.json();
}

// ---------- Anomalous Cases (Stretch Goal Integration) ----------
export interface AnomalyCase {
  id: string;
  crimeNo: string;
  caseNo: string;
  districtName: string;
  stationName: string;
  category: string;
  subType: string;
  date: string;
  hour: number;
  gravity: string;
  status: string;
  briefFacts: string;
  anomalyScore: number;
  reason: string;
}

export async function getAnomalyCases(): Promise<AnomalyCase[]> {
  const res = await fetch(`${API_BASE}/anomalies`);
  if (!res.ok) throw new Error("Failed to fetch anomaly cases");
  return res.json();
}
