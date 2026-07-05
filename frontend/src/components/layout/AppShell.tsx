import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Map, Network, Activity, FileText, Sparkles, IdCard, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDistricts } from "@/services/api";
import { useSelectedDistrict } from "@/lib/selected-district";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Crime Map", icon: Map },
  { to: "/network", label: "Network Analysis", icon: Network },
  { to: "/risk", label: "Predictive Risk", icon: Activity },
  { to: "/districts", label: "District Cards", icon: IdCard },
  { to: "/briefing", label: "Intelligence Briefing", icon: BookOpen },
];

const COMING = [
  { label: "NLP MO Discovery", icon: Sparkles },
  { label: "PDF Reports", icon: FileText },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { districtId, setDistrictId } = useSelectedDistrict();
  const { data: districts = [] } = useQuery({
    queryKey: ["districts"],
    queryFn: getDistricts,
  });

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-accent-amber/20 border border-accent-amber/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-accent-amber" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">CrimeVista AI</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                KSP Datathon
              </div>
            </div>
          </div>
        </div>

        <nav className="p-2 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-accent-amber/10 text-accent-amber border-l-2 border-accent-amber pl-2"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-l-2 border-transparent pl-2",
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 px-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 px-1">
            Coming Soon
          </div>
          <div className="space-y-0.5">
            {COMING.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground/40 cursor-not-allowed"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {c.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto px-4 py-3 border-t border-border text-[10px] text-muted-foreground/60">
          v0.1 · Prototype
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 shrink-0 border-b border-border bg-surface flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-tight uppercase">
              CrimeVista <span className="text-accent-amber">AI</span>
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-accent-amber/40 text-accent-amber/90 bg-accent-amber/5"
            >
              PROTOTYPE · SYNTHETIC DATA
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">District</span>
            <Select
              value={districtId ?? "all"}
              onValueChange={(v) => setDistrictId(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[220px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Karnataka" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Karnataka</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
