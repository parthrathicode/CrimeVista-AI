import type { RepeatOffender } from "@/types";
import { CASES } from "./cases";
import { DISTRICTS } from "./districts";

const FIRST_NAMES = [
  "Ramesh",
  "Suresh",
  "Vinod",
  "Anil",
  "Manoj",
  "Prakash",
  "Ravi",
  "Kiran",
  "Deepak",
  "Arjun",
  "Vikram",
  "Rahul",
  "Naveen",
  "Ganesh",
  "Mahesh",
  "Ashok",
  "Vijay",
  "Shankar",
  "Krishna",
  "Bhaskar",
];
const LAST_NAMES = [
  "Gowda",
  "Reddy",
  "Naik",
  "Shetty",
  "Patil",
  "Kumar",
  "Rao",
  "Singh",
  "Hegde",
  "Bhat",
  "Iyer",
  "Nayak",
];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rand = seeded(1337);

export const REPEAT_OFFENDERS: RepeatOffender[] = (() => {
  const offenders: RepeatOffender[] = [];
  const casesById = new Map(CASES.map((c) => [c.id, c]));
  const availableCaseIds = CASES.map((c) => c.id);

  const NUM = 18;
  for (let i = 0; i < NUM; i++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const linkCount = 2 + Math.floor(rand() * 4); // 2-5
    // sample distinct case ids
    const chosen = new Set<string>();
    while (chosen.size < linkCount) {
      chosen.add(availableCaseIds[Math.floor(rand() * availableCaseIds.length)]);
    }
    const linkedCaseIds = Array.from(chosen);
    const firstCase = casesById.get(linkedCaseIds[0])!;
    offenders.push({
      id: `O${String(i + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      age: 22 + Math.floor(rand() * 35),
      gender: rand() > 0.15 ? "M" : "F",
      districtId: firstCase.districtId,
      linkedCaseIds,
    });
  }
  // ensure at least a few link cases across DIFFERENT stations for interest
  return offenders;
})();

export function districtName(id: string) {
  return DISTRICTS.find((d) => d.id === id)?.name ?? id;
}
