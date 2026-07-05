import { useMemo, useState, lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { getCases, getHotspots, getDistricts, getAlerts } from "@/services/api";
import { useSelectedDistrict } from "@/lib/selected-district";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, X, ArrowLeft } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CATEGORY_COLORS, STATUS_COLORS } from "@/data/crimes";

const CrimeMapClient = lazy(() => import("@/components/map/CrimeMapClient"));

export const Route = createFileRoute("/")({
  component: () => (
    <AppShell>
      <CrimeMapPage />
    </AppShell>
  ),
});

const DATE_WINDOWS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" },
];

function CrimeMapPage() {
  const { districtId, setDistrictId } = useSelectedDistrict();
  const [hourRange, setHourRange] = useState<[number, number]>([0, 23]);
  const [dateWindow, setDateWindow] = useState<string>("90");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const dateWindowDays = dateWindow === "all" ? null : Number(dateWindow);

  const { data: districts = [] } = useQuery({
    queryKey: ["districts"],
    queryFn: getDistricts,
  });
  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: getAlerts });
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ["cases", districtId, hourRange, dateWindowDays],
    queryFn: () => getCases(districtId ?? undefined, { hourRange, dateWindowDays }),
  });
  const { data: hotspots = [] } = useQuery({
    queryKey: ["hotspots", districtId],
    queryFn: () => getHotspots(districtId ?? undefined),
  });

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  const selectedDistrict = districts.find((d) => d.id === districtId) ?? null;

  // side panel derived stats
  const stats = useMemo(() => {
    const catCounts: Record<string, number> = {};
    const allStatuses = ["Under Investigation", "Charge Sheeted", "Closed", "Undetected"] as const;
    const statusCounts: Record<string, number> = Object.fromEntries(allStatuses.map((s) => [s, 0]));
    cases.forEach((c) => {
      catCounts[c.category] = (catCounts[c.category] ?? 0) + 1;
      statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
    });
    const topCats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value]) => ({ name, value }));
    const statusData = allStatuses.map((name) => ({ name, value: statusCounts[name] }));
    return { topCats, statusData, total: cases.length };
  }, [cases]);

  return (
    <div className="h-full flex flex-col">
      {/* Alerts strip */}
      {visibleAlerts.length > 0 && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border bg-background/60 overflow-x-auto">
          {visibleAlerts.map((a) => (
            <div
              key={a.id}
              className="shrink-0 flex items-center gap-2 pl-2 pr-1 py-1 rounded-sm bg-accent-amber/10 border border-accent-amber/30 text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-accent-amber shrink-0" />
              <span className="text-foreground/90">{a.title}</span>
              <button
                onClick={() => setDismissedAlerts((s) => new Set(s).add(a.id))}
                className="ml-1 p-0.5 hover:bg-white/10 rounded"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Controls bar */}
      <div className="shrink-0 flex items-center gap-6 px-4 py-2.5 border-b border-border bg-surface/50">
        {selectedDistrict && (
          <button
            onClick={() => setDistrictId(null)}
            className="flex items-center gap-1.5 text-xs text-accent-amber hover:text-accent-amber/80"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All districts
          </button>
        )}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap">
            Hour {String(hourRange[0]).padStart(2, "0")}:00 –{" "}
            {String(hourRange[1]).padStart(2, "0")}:00
          </span>
          <Slider
            value={hourRange}
            onValueChange={(v) => setHourRange([v[0], v[1]] as [number, number])}
            min={0}
            max={23}
            step={1}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Window
          </span>
          <Select value={dateWindow} onValueChange={setDateWindow}>
            <SelectTrigger className="h-7 w-36 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_WINDOWS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground font-mono ml-auto">
          {casesLoading ? "…" : `${cases.length} cases`}
        </div>
      </div>

      {/* Map + side panel */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative bg-[#0b0f14] min-w-[520px]">
          <ClientOnly fallback={<Skeleton className="w-full h-full" />}>
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <CrimeMapClient
                districts={districts}
                cases={cases}
                hotspots={hotspots}
                focusDistrictId={districtId}
                onDistrictClick={(id) => setDistrictId(id)}
              />
            </Suspense>
          </ClientOnly>
          <div className="absolute bottom-3 left-3 flex flex-col gap-1 z-[500] pointer-events-none">
            {Object.entries(CATEGORY_COLORS).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-background/70 backdrop-blur px-2 py-0.5 rounded-sm"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: v }} />
                {k}
              </div>
            ))}
          </div>
        </div>

        <aside className="w-80 shrink-0 border-l border-border bg-surface overflow-y-auto">
          <div className="p-4 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {selectedDistrict ? "District" : "State"}
            </div>
            <div className="text-lg font-semibold mt-0.5">
              {selectedDistrict?.name ?? "Karnataka"}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums text-accent-amber">
                {stats.total}
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                cases in view
              </span>
            </div>
          </div>

          <div className="p-4 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
              Top Crime Types
            </div>
            <div className="h-32">
              <ResponsiveContainer>
                <BarChart
                  data={stats.topCats}
                  layout="vertical"
                  margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1f26",
                      border: "1px solid #2a3038",
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                    {stats.topCats.map((c) => (
                      <Cell
                        key={c.name}
                        fill={CATEGORY_COLORS[c.name as keyof typeof CATEGORY_COLORS] ?? "#F59E0B"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
              Case Status
            </div>
            <div className="h-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                  >
                    {stats.statusData.map((d) => (
                      <Cell
                        key={d.name}
                        fill={STATUS_COLORS[d.name as keyof typeof STATUS_COLORS] ?? "#6B7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1a1f26",
                      border: "1px solid #2a3038",
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              {stats.statusData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: STATUS_COLORS[s.name as keyof typeof STATUS_COLORS] }}
                    />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="tabular-nums text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedDistrict && (
            <div className="p-4 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Hotspots
              </div>
              {hotspots.map((h) => (
                <div key={h.id} className="text-xs py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-accent-amber/15 text-accent-amber border-accent-amber/30 text-[10px] font-mono">
                      {h.caseCount} cases
                    </Badge>
                    <span className="text-muted-foreground font-mono text-[10px]">
                      {h.lat.toFixed(3)}, {h.lng.toFixed(3)}
                    </span>
                  </div>
                  <div className="mt-1 text-foreground/90">Dominant: {h.dominantCrime}</div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
