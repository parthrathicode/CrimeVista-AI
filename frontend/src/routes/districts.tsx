import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { getDistrictInsights } from "@/services/api";
import { useSelectedDistrict } from "@/lib/selected-district";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, MapPin, Users, Target, Zap } from "lucide-react";
import type { RiskBand } from "@/types";
import { CATEGORY_COLORS } from "@/data/crimes";

export const Route = createFileRoute("/districts")({
  component: () => (
    <AppShell>
      <DistrictCardsPage />
    </AppShell>
  ),
});

const BAND_STYLES: Record<RiskBand, string> = {
  Low: "bg-risk-low/15 text-risk-low border-risk-low/40",
  Medium: "bg-risk-med/15 text-risk-med border-risk-med/40",
  High: "bg-risk-high/15 text-risk-high border-risk-high/40",
};

function DistrictCardsPage() {
  const { setDistrictId } = useSelectedDistrict();
  const navigate = useNavigate();
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["district-insights"],
    queryFn: getDistrictInsights,
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Intelligence Cards
        </div>
        <div className="text-lg font-semibold mt-0.5">District Snapshots</div>
        <div className="text-xs text-muted-foreground mt-1">
          One-glance situational awareness · Click a card to filter the app to that district.
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)
          : insights.map((d) => {
              const up = d.trendPct >= 0;
              return (
              <button
                  key={d.districtId}
                  onClick={() => {
                    setDistrictId(d.districtId);
                    navigate({ to: "/" });
                  }}
                  className="text-left rounded-2xl border border-white/5 bg-black/20 p-5 hover:bg-white/5 hover:border-accent-amber/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all shadow-inner group flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold">{d.districtName}</div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                        {d.districtId}
                      </div>
                    </div>
                    <Badge className={`${BAND_STYLES[d.highestRiskBand]} font-mono text-[10px]`}>
                      {d.highestRiskBand} · {d.highestRiskScore}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl bg-black/40 border border-white/5 p-3 shadow-inner">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Cases
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-bold tabular-nums notranslate text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                          {d.totalCases}
                        </span>
                        <span
                          className={`text-[10px] font-mono flex items-center gap-0.5 ${up ? "text-risk-high drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" : "text-risk-low drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"}`}
                        >
                          {up ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {Math.abs(d.trendPct)}%
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-black/40 border border-white/5 p-3 shadow-inner">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-accent-amber/70" />
                        Hotspots
                      </div>
                      <div className="text-xl font-bold tabular-nums notranslate mt-1 text-foreground">
                        {d.hotspotCount}
                      </div>
                    </div>
                    <div className="rounded-xl bg-black/40 border border-white/5 p-3 shadow-inner">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3 text-accent-amber/70" />
                        Repeat Offenders
                      </div>
                      <div className="text-xl font-bold tabular-nums notranslate mt-1 text-foreground">
                        {d.offenderCount}
                      </div>
                    </div>
                    <div className="rounded-xl bg-black/40 border border-white/5 p-3 shadow-inner">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                        <Target className="w-3 h-3 text-accent-amber/70" />
                        Dominant
                      </div>
                      <div className="text-xs font-medium mt-1.5 truncate flex items-center gap-1.5 text-foreground/90">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background:
                              CATEGORY_COLORS[d.dominantCategory as keyof typeof CATEGORY_COLORS] ??
                              "#F59E0B",
                          }}
                        />
                        {d.dominantSubType}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3 h-3 text-accent-amber/70" />
                    Predicted Hotspot
                  </div>
                  <div className="text-xs text-foreground/90 font-medium mb-4">{d.topHotspotLabel}</div>

                  <div className="mt-auto pt-4 w-full">
                    <div className="p-3 rounded-xl bg-accent-amber/10 border border-accent-amber/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                      <div className="text-[9px] uppercase tracking-wider text-accent-amber/90 font-semibold mb-1">
                        Suggested Action
                      </div>
                      <div className="text-[11px] text-accent-amber/80 leading-snug">
                        {d.suggestedAction}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
      </div>
    </div>
  );
}
