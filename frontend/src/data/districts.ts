import type { District, PoliceStation } from "@/types";

export const DISTRICTS: District[] = [
  { id: "d-blr", name: "Bengaluru Urban", lat: 12.9716, lng: 77.5946, totalCases: 0 },
  { id: "d-mys", name: "Mysuru", lat: 12.2958, lng: 76.6394, totalCases: 0 },
  { id: "d-dk", name: "Dakshina Kannada", lat: 12.9141, lng: 74.856, totalCases: 0 },
  { id: "d-blg", name: "Belagavi", lat: 15.8497, lng: 74.4977, totalCases: 0 },
  { id: "d-klb", name: "Kalaburagi", lat: 17.3297, lng: 76.8343, totalCases: 0 },
  { id: "d-dwd", name: "Dharwad", lat: 15.4589, lng: 75.0078, totalCases: 0 },
  { id: "d-tmk", name: "Tumakuru", lat: 13.3379, lng: 77.1022, totalCases: 0 },
  { id: "d-shi", name: "Shivamogga", lat: 13.9299, lng: 75.5681, totalCases: 0 },
  { id: "d-bal", name: "Ballari", lat: 15.1394, lng: 76.9214, totalCases: 0 },
  { id: "d-vjp", name: "Vijayapura", lat: 16.8302, lng: 75.71, totalCases: 0 },
];

const STATION_NAMES = [
  "Central Division",
  "North Division",
  "South Division",
  "Cyber Cell",
  "Rural PS",
];

export const STATIONS: PoliceStation[] = DISTRICTS.flatMap((d) => {
  const count = 3 + (Math.abs(hashStr(d.id)) % 3); // 3-5
  return Array.from({ length: count }).map((_, i) => ({
    id: `${d.id}-s${i + 1}`,
    name: `${d.name} ${STATION_NAMES[i % STATION_NAMES.length]}`,
    districtId: d.id,
    lat: d.lat + (rand(d.id + i) - 0.5) * 0.06,
    lng: d.lng + (rand(d.id + i + "x") - 0.5) * 0.06,
  }));
});

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
function rand(seed: string): number {
  const x = Math.sin(hashStr(seed)) * 10000;
  return x - Math.floor(x);
}
