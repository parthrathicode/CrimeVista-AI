import type { CaseRecord, CaseStatus, CrimeCategory, HotspotCluster } from "@/types";
import { DISTRICTS, STATIONS } from "./districts";
import { CRIME_TAXONOMY, CRIME_CATEGORIES } from "./crimes";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seeded(42);

const STATUSES: CaseStatus[] = ["Under Investigation", "Charge Sheeted", "Closed", "Undetected"];

// pre-defined hotspots: 1-2 per district
export const HOTSPOTS: HotspotCluster[] = DISTRICTS.flatMap((d) => {
  const count = 1 + Math.round(rand());
  return Array.from({ length: count }).map((_, i) => {
    const offset = 0.015 + rand() * 0.02;
    const angle = rand() * Math.PI * 2;
    const cats = CRIME_CATEGORIES;
    return {
      id: `${d.id}-h${i + 1}`,
      districtId: d.id,
      lat: d.lat + Math.cos(angle) * offset,
      lng: d.lng + Math.sin(angle) * offset,
      caseCount: 0,
      dominantCrime: cats[Math.floor(rand() * cats.length)],
      radiusMeters: 800 + Math.floor(rand() * 1200),
    };
  });
});

function biasedHour(cat: CrimeCategory, sub: string): number {
  // chain snatching 18-22, burglary 0-5, cyber 10-22, domestic 19-23
  if (sub === "Chain Snatching") return 18 + Math.floor(rand() * 5);
  if (sub === "House Burglary") return Math.floor(rand() * 5);
  if (cat === "Cyber Crime") return 10 + Math.floor(rand() * 13);
  if (cat === "Crimes Against Women") return 18 + Math.floor(rand() * 6);
  if (sub === "Vehicle Theft") return 20 + Math.floor(rand() * 4);
  return Math.floor(rand() * 24);
}

export const CASES: CaseRecord[] = (() => {
  const out: CaseRecord[] = [];
  let counter = 1;
  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  DISTRICTS.forEach((d) => {
    const districtStations = STATIONS.filter((s) => s.districtId === d.id);
    const districtHotspots = HOTSPOTS.filter((h) => h.districtId === d.id);
    const total = 18 + Math.floor(rand() * 15); // 18-32

    for (let i = 0; i < total; i++) {
      const hotspotChance = rand();
      let lat: number, lng: number;
      let hotspot: HotspotCluster | null = null;
      if (hotspotChance < 0.7 && districtHotspots.length) {
        hotspot = districtHotspots[Math.floor(rand() * districtHotspots.length)];
        lat = hotspot.lat + (rand() - 0.5) * 0.01;
        lng = hotspot.lng + (rand() - 0.5) * 0.01;
      } else {
        lat = d.lat + (rand() - 0.5) * 0.12;
        lng = d.lng + (rand() - 0.5) * 0.12;
      }

      const cat = CRIME_CATEGORIES[Math.floor(rand() * CRIME_CATEGORIES.length)];
      const subs = CRIME_TAXONOMY[cat];
      const sub = subs[Math.floor(rand() * subs.length)];
      const hour = biasedHour(cat, sub);
      const daysAgo = Math.floor(rand() * 90);
      const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - hour * 3600 * 1000);
      const station = districtStations[Math.floor(rand() * districtStations.length)];
      const gravity = ["Murder", "Robbery", "Grievous Hurt"].includes(sub)
        ? "Heinous"
        : rand() > 0.75
          ? "Heinous"
          : "Non-Heinous";
      const status = STATUSES[Math.floor(rand() * STATUSES.length)];

      const c: CaseRecord = {
        id: `C${String(counter++).padStart(5, "0")}`,
        districtId: d.id,
        stationId: station.id,
        category: cat,
        subType: sub,
        lat,
        lng,
        date: date.toISOString(),
        hour,
        gravity,
        status,
      };
      out.push(c);
      if (hotspot) hotspot.caseCount += 1;
    }
  });

  // update district counts + hotspot dominant crime
  DISTRICTS.forEach((d) => {
    d.totalCases = out.filter((c) => c.districtId === d.id).length;
  });
  HOTSPOTS.forEach((h) => {
    const hCases = out.filter(
      (c) =>
        c.districtId === h.districtId &&
        Math.abs(c.lat - h.lat) < 0.015 &&
        Math.abs(c.lng - h.lng) < 0.015,
    );
    if (hCases.length) {
      const counts: Record<string, number> = {};
      hCases.forEach((c) => (counts[c.subType] = (counts[c.subType] ?? 0) + 1));
      h.dominantCrime = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      h.caseCount = hCases.length;
    }
  });
  return out;
})();
