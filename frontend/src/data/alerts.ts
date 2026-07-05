import type { Alert } from "@/types";

export const ALERTS: Alert[] = [
  {
    id: "a1",
    severity: "warning",
    title: "Vehicle Theft up 38% in Ballari vs 90-day average",
    districtId: "d-bal",
    category: "Crimes Against Property",
  },
  {
    id: "a2",
    severity: "warning",
    title: "Cyber Fraud cluster detected in Bengaluru Urban (South Division)",
    districtId: "d-blr",
    category: "Cyber Crime",
  },
  {
    id: "a3",
    severity: "info",
    title: "Repeat offender network activity rising in Kalaburagi",
    districtId: "d-klb",
  },
];
