import type { CrimeCategory } from "@/types";

export const CRIME_TAXONOMY: Record<CrimeCategory, string[]> = {
  "Crimes Against Property": ["Chain Snatching", "House Burglary", "Vehicle Theft", "Robbery"],
  "Crimes Against Body": ["Assault", "Murder", "Grievous Hurt"],
  "Crimes Against Women": ["Dowry Harassment", "Molestation", "Domestic Violence"],
  "Cyber Crime": ["Online Fraud", "Phishing", "Identity Theft", "Sextortion"],
  "Crimes Against Public Order": ["Rioting", "Unlawful Assembly", "Public Nuisance"],
};

export const CRIME_CATEGORIES = Object.keys(CRIME_TAXONOMY) as CrimeCategory[];

// Consistent color for each category across the app
export const CATEGORY_COLORS: Record<CrimeCategory, string> = {
  "Crimes Against Property": "#F59E0B",
  "Crimes Against Body": "#EF4444",
  "Crimes Against Women": "#EC4899",
  "Cyber Crime": "#3B82F6",
  "Crimes Against Public Order": "#10B981",
};

export const STATUS_COLORS = {
  "Under Investigation": "#F59E0B",
  "Charge Sheeted": "#3B82F6",
  Closed: "#10B981",
  Undetected: "#6B7280",
} as const;
