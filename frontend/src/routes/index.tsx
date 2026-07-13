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
import { AlertTriangle, X, ArrowLeft, Calendar, MapPin } from "lucide-react";
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
      {visibleAlerts.length > 0 && (
        <div className="shrink-0 flex flex-col gap-2 p-2 relative z-10 bg-background/30 backdrop-blur-sm border-b border-border">
          {visibleAlerts.map((a) => (
            <div
              key={a.id}
              className="relative flex items-center gap-2 px-3 py-1.5 mx-auto w-fit max-w-3xl rounded-full bg-[#1a140d]/90 border border-accent-amber/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
            >
              {/* Inner ambient gradient */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-amber/10 via-transparent to-transparent pointer-events-none" />

              <div className="relative p-1 rounded-full bg-accent-amber/20 border border-accent-amber/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <AlertTriangle className="w-3 h-3 text-accent-amber shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,1)]" />
              </div>

              <span className="relative text-[11px] font-medium text-amber-50/90 tracking-wide pr-2">
                {a.title}
              </span>

              <button
                onClick={() => setDismissedAlerts((s) => new Set(s).add(a.id))}
                className="relative p-1 hover:bg-accent-amber/20 text-accent-amber/60 hover:text-accent-amber rounded-full transition-colors ml-1"
              >
                <X className="w-3 h-3" />
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
            <SelectTrigger className="h-9 w-40 text-xs rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 hover:bg-white/[0.02] transition-colors shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-accent-amber/70" />
                <SelectValue />
              </div>
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
                className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-background/70 backdrop-blur px-2 py-0.5 rounded-xl"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: v }} />
                {k}
              </div>
            ))}
          </div>
        </div>

        <aside className="w-80 shrink-0 border-l border-border/50 bg-surface/80 backdrop-blur-xl overflow-y-auto shadow-[-4px_0_24px_rgba(0,0,0,0.2)] z-10 flex flex-col gap-4 p-4">
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-accent-amber/70" />
                {selectedDistrict ? "District Focus" : "State Overview"}
              </div>
            </div>
            <div className="text-xl font-bold mt-2 text-foreground tracking-tight">
              {selectedDistrict?.name ?? "Karnataka"}
            </div>
            <div className="mt-4 flex flex-col">
              <span className="text-4xl font-bold tabular-nums notranslate text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                {stats.total}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-semibold">
                Cases in view
              </span>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4 font-semibold">
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
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: 11,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                    itemStyle={{ color: "var(--foreground)" }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
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

          <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4 font-semibold">
              Case Status
            </div>
            <div className="h-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    stroke="#0b0f14"
                    strokeWidth={2}
                    cornerRadius={4}
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
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: 11,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                    itemStyle={{ color: "var(--foreground)" }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {stats.statusData.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ background: STATUS_COLORS[s.name as keyof typeof STATUS_COLORS] }}
                    />
                    <span className="text-muted-foreground font-medium">{s.name}</span>
                  </div>
                  <span className="tabular-nums notranslate text-foreground font-bold">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedDistrict && hotspots.length > 0 && (
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                Active Hotspots
              </div>
              <div className="space-y-2">
                {hotspots.map((h) => (
                  <div
                    key={h.id}
                    className="text-xs p-3 bg-surface/40 rounded-xl border border-border/40 hover:border-accent-amber/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-mono px-1.5 py-0">
                        {h.caseCount} cases
                      </Badge>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {h.lat.toFixed(3)}, {h.lng.toFixed(3)}
                      </span>
                    </div>
                    <div className="text-foreground/90 font-medium">
                      Dominant: {h.dominantCrime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
