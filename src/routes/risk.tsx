import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { getRiskLeaderboard, getRiskScores } from "@/services/api";
import { useSelectedDistrict } from "@/lib/selected-district";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, TrendingUp, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import type { RiskBand, RiskScore } from "@/types";
import { CATEGORY_COLORS } from "@/data/crimes";

export const Route = createFileRoute("/risk")({
  component: () => (
    <AppShell>
      <RiskPage />
    </AppShell>
  ),
});

const BAND_STYLES: Record<RiskBand, string> = {
  Low: "bg-risk-low/15 text-risk-low border-risk-low/40",
  Medium: "bg-risk-med/15 text-risk-med border-risk-med/40",
  High: "bg-risk-high/15 text-risk-high border-risk-high/40",
};

type SortKey = "district" | "category" | "score";

function RiskPage() {
  const { districtId } = useSelectedDistrict();
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["risk-leaderboard"],
    queryFn: () => getRiskLeaderboard(5),
  });
  const { data: allScores = [], isLoading } = useQuery({
    queryKey: ["risk-scores"],
    queryFn: getRiskScores,
  });

  const rows = useMemo(() => {
    const filtered = districtId ? allScores.filter((r) => r.districtId === districtId) : allScores;
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score") cmp = a.score - b.score;
      if (sortKey === "district") cmp = a.districtName.localeCompare(b.districtName);
      if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [allScores, districtId, sortKey, sortDir]);

  const selectedScore: RiskScore | null = selectedKey
    ? (allScores.find((r) => riskRowKey(r) === selectedKey) ?? null)
    : null;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Leaderboard */}
      <div className="shrink-0 p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent-amber" />
          <h2 className="text-xs uppercase tracking-wider font-semibold">
            Top 5 Highest Risk (State-wide)
          </h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {leaderboard.map((r, i) => (
            <button
              key={`${r.districtId}-${r.category}`}
              onClick={() => setSelectedKey(riskRowKey(r))}
              className="text-left rounded-sm border border-border bg-surface p-3 hover:border-accent-amber/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
                <Badge className={`${BAND_STYLES[r.band]} font-mono text-[10px]`}>{r.band}</Badge>
              </div>
              <div className="text-3xl font-semibold tabular-nums text-accent-amber leading-none">
                {r.score}
              </div>
              <div className="mt-2 text-xs text-foreground/90 leading-tight">{r.districtName}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: CATEGORY_COLORS[r.category] }}
                />
                {r.category}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Table */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Risk Matrix · {rows.length} district × crime combinations
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-surface z-10">
                  <TableRow>
                    <SortHead
                      label="District"
                      active={sortKey === "district"}
                      dir={sortDir}
                      onClick={() => toggleSort("district")}
                    />
                    <SortHead
                      label="Crime Type"
                      active={sortKey === "category"}
                      dir={sortDir}
                      onClick={() => toggleSort("category")}
                    />
                    <TableHead className="text-[10px]">Sub-Type</TableHead>
                    <SortHead
                      label="Risk Score"
                      active={sortKey === "score"}
                      dir={sortDir}
                      onClick={() => toggleSort("score")}
                      className="text-right"
                    />
                    <TableHead className="text-[10px] w-24">Band</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const rowKey = riskRowKey(r);
                    const active = selectedKey === rowKey;
                    return (
                      <TableRow
                        key={rowKey}
                        onClick={() => setSelectedKey(rowKey)}
                        data-state={active ? "selected" : undefined}
                        className={`cursor-pointer ${active ? "bg-accent-amber/10" : "hover:bg-white/5"}`}
                      >
                        <TableCell className="text-xs py-2">{r.districtName}</TableCell>
                        <TableCell className="text-xs py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: CATEGORY_COLORS[r.category] }}
                            />
                            {r.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">
                          {r.subType}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-20 h-1 rounded-full bg-border overflow-hidden">
                              <div
                                className="h-full"
                                style={{
                                  width: `${r.score}%`,
                                  background:
                                    r.band === "High"
                                      ? "#EF4444"
                                      : r.band === "Medium"
                                        ? "#F59E0B"
                                        : "#10B981",
                                }}
                              />
                            </div>
                            <span className="tabular-nums font-mono text-xs w-8 text-right">
                              {r.score}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge className={`${BAND_STYLES[r.band]} font-mono text-[10px]`}>
                            {r.band}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <aside className="w-[440px] shrink-0 border-l border-border bg-surface overflow-y-auto">
          {!selectedScore ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Select a row to inspect the risk breakdown.
            </div>
          ) : (
            <RiskDetail score={selectedScore} />
          )}
        </aside>
      </div>
    </div>
  );
}

function riskRowKey(score: Pick<RiskScore, "districtId" | "category">) {
  return `${score.districtId}|${score.category}`;
}

function SortHead({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <TableHead
      className={`text-[10px] cursor-pointer select-none ${className ?? ""}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`w-3 h-3 ${active ? "text-accent-amber" : "text-muted-foreground/50"}`}
        />
        {active && (
          <span className="text-accent-amber text-[9px] font-mono">
            {dir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </TableHead>
  );
}

function RiskDetail({ score }: { score: RiskScore }) {
  const bandColor =
    score.band === "High" ? "#EF4444" : score.band === "Medium" ? "#F59E0B" : "#10B981";

  return (
    <div className="p-4 space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Risk Assessment
        </div>
        <div className="text-sm font-semibold mt-0.5">{score.districtName}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: CATEGORY_COLORS[score.category] }}
          />
          {score.category} · {score.subType}
        </div>
        <div className="mt-4 flex items-end gap-3">
          <div
            className="text-6xl font-semibold tabular-nums leading-none"
            style={{ color: bandColor }}
          >
            {score.score}
          </div>
          <div className="pb-1">
            <Badge className={`${BAND_STYLES[score.band]} font-mono`}>{score.band} risk</Badge>
            <div className="text-[10px] text-muted-foreground mt-1 font-mono">/ 100</div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Contribution Breakdown (SHAP)
        </div>
        <div className="text-[10px] text-muted-foreground/70 mb-3 font-mono">
          Points contributed by each factor · sums to {score.score}
        </div>
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart
              data={score.contributions}
              layout="vertical"
              margin={{ left: 0, right: 40, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide domain={[0, "dataMax + 4"]} />
              <YAxis
                type="category"
                dataKey="feature"
                width={150}
                tick={{ fill: "#cbd5e1", fontSize: 11 }}
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
                formatter={(v: number) => [`+${v} pts`, "Contribution"]}
              />
              <Bar
                dataKey="points"
                radius={[0, 2, 2, 0]}
                label={{
                  position: "right",
                  fill: "#F59E0B",
                  fontSize: 11,
                  fontFamily: "JetBrains Mono",
                  formatter: (v: number) => `+${v}`,
                }}
              >
                {score.contributions.map((c) => (
                  <Cell key={c.feature} fill={bandColor} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          12-Month Trend
        </div>
        <div className="text-[10px] text-muted-foreground/70 mb-3 font-mono">
          Historical case counts · last point is model prediction
        </div>
        <div className="h-40">
          <ResponsiveContainer>
            <LineChart
              data={score.monthlyTrend}
              margin={{ top: 8, right: 12, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="2 4" stroke="#2a3038" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={{ stroke: "#2a3038" }}
                tickLine={false}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#1a1f26",
                  border: "1px solid #2a3038",
                  borderRadius: 4,
                  fontSize: 11,
                }}
              />
              <Line
                type="monotone"
                dataKey="cases"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isPredicted) {
                    return (
                      <circle
                        key={props.index}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={bandColor}
                        stroke="#0b0f14"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle key={props.index} cx={cx} cy={cy} r={2.5} fill="#F59E0B" />;
                }}
              />
              {score.monthlyTrend
                .filter((m) => m.isPredicted)
                .map((m) => (
                  <ReferenceDot
                    key={m.month}
                    x={m.month}
                    y={m.cases}
                    r={0}
                    label={{
                      value: "Predicted",
                      position: "top",
                      fill: bandColor,
                      fontSize: 10,
                      fontFamily: "JetBrains Mono",
                    }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
