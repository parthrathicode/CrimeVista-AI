export type CrimeCategory =
  | "Crimes Against Property"
  | "Crimes Against Body"
  | "Crimes Against Women"
  | "Cyber Crime"
  | "Crimes Against Public Order";

export type CaseStatus = "Under Investigation" | "Charge Sheeted" | "Closed" | "Undetected";

export type CaseGravity = "Heinous" | "Non-Heinous";

export type RiskBand = "Low" | "Medium" | "High";

export interface District {
  id: string;
  name: string;
  lat: number;
  lng: number;
  totalCases: number;
}

export interface PoliceStation {
  id: string;
  name: string;
  districtId: string;
  lat: number;
  lng: number;
}

export interface CaseRecord {
  id: string;
  districtId: string;
  stationId: string;
  category: CrimeCategory;
  subType: string;
  lat: number;
  lng: number;
  date: string; // ISO
  hour: number; // 0-23
  gravity: CaseGravity;
  status: CaseStatus;
}

export interface HotspotCluster {
  id: string;
  districtId: string;
  lat: number;
  lng: number;
  caseCount: number;
  dominantCrime: string;
  radiusMeters: number;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: "accused" | "victim" | "station";
  districtId?: string;
  linkedCaseCount: number;
  age?: number;
  gender?: "M" | "F";
}

export interface NetworkEdge {
  source: string;
  target: string;
  caseId: string;
  crimeCategory: CrimeCategory;
}

export interface RepeatOffender {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  districtId: string;
  linkedCaseIds: string[];
}

export interface ShapContribution {
  feature: string;
  points: number;
}

export interface RiskScore {
  districtId: string;
  districtName: string;
  category: CrimeCategory;
  subType: string;
  score: number; // 0-100
  band: RiskBand;
  contributions: ShapContribution[];
  monthlyTrend: { month: string; cases: number; isPredicted?: boolean }[];
}

export interface Alert {
  id: string;
  severity: "warning" | "info";
  title: string;
  districtId?: string;
  category?: CrimeCategory;
}
