import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { getBriefing } from "@/services/api";
import { useSelectedDistrict } from "@/lib/selected-district";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, FileText, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/briefing")({
  component: () => (
    <AppShell>
      <BriefingPage />
    </AppShell>
  ),
});

function BriefingPage() {
  const { districtId } = useSelectedDistrict();
  const [copied, setCopied] = useState(false);
  const { data: b, isLoading } = useQuery({
    queryKey: ["briefing", districtId],
    queryFn: () => getBriefing(districtId ?? undefined),
  });

  const copy = async () => {
    if (!b) return;
    await navigator.clipboard.writeText(b.plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-amber/10 border border-accent-amber/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-amber" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Karnataka State Police · Auto-generated
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                Weekly Crime Intelligence Briefing
              </h1>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={copy} disabled={!b} className="rounded-xl bg-black/20 border-white/5 hover:bg-white/5 hover:border-accent-amber/50 text-foreground transition-all shadow-inner">
            {copied ? (
              <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1.5" />
            )}
            {copied ? "Copied" : "Copy Briefing"}
          </Button>
        </div>

        {isLoading || !b ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <article className="space-y-8 rounded-2xl border border-white/5 bg-black/20 p-8 shadow-inner">
            <header className="grid grid-cols-3 gap-6 pb-8 border-b border-white/5">
              <Meta label="Scope" value={b.scope} />
              <Meta label="Period" value={b.dateRange} />
              <Meta label="Total Cases (30d)" value={String(b.totalCases)} />
            </header>

            <section>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Executive Summary
              </div>
              <p className="text-[15px] leading-relaxed text-foreground/90 flex items-start gap-3">
                <span
                  className={`inline-flex items-center gap-1 shrink-0 mt-1 font-mono text-xs ${b.trendPct >= 0 ? "text-risk-high drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" : "text-risk-low drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"}`}
                >
                  {b.trendPct >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {b.trendPct >= 0 ? "+" : ""}
                  {b.trendPct}%
                </span>
                <span>
                  {b.scope} recorded{" "}
                  <strong className="text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 font-bold tabular-nums text-lg drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">{b.totalCases}</strong> cases
                  in the last 30 days, {b.trendPct >= 0 ? "up" : "down"} {Math.abs(b.trendPct)}%
                  versus the prior 30-day window.
                </span>
              </p>
            </section>

            <section>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-4">
                Key Observations
              </div>
              <ul className="space-y-4">
                {b.bullets.map((line, i) => (
                  <li key={i} className="flex gap-4 text-[15px] leading-relaxed">
                    <span className="text-accent-amber font-mono font-semibold text-sm shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-foreground/90">{line}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="p-6 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <div className="text-[10px] uppercase tracking-wider text-accent-amber/90 font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Recommended Actions
              </div>
              <ul className="space-y-3">
                {b.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground/90 font-medium">
                    <span className="text-accent-amber/70 mt-0.5">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </section>


          </article>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
