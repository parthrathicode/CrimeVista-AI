import { useState, lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ClientOnly } from "@/components/ClientOnly";
import { getNetworkGraph, getOffenderDetail, getDistricts } from "@/services/api";
import { useSelectedDistrict } from "@/lib/selected-district";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Network } from "lucide-react";
import { CRIME_CATEGORIES, CATEGORY_COLORS, STATUS_COLORS } from "@/data/crimes";

const NetworkGraphClient = lazy(() => import("@/components/network/NetworkGraphClient"));

export const Route = createFileRoute("/network")({
  component: () => (
    <AppShell>
      <NetworkPage />
    </AppShell>
  ),
});

function NetworkPage() {
  const { districtId } = useSelectedDistrict();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [minLinks, setMinLinks] = useState<string>("2");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { data: districts = [] } = useQuery({ queryKey: ["districts"], queryFn: getDistricts });
  const { data: graph, isLoading } = useQuery({
    queryKey: ["network", query, districtId, category, minLinks],
    queryFn: () =>
      getNetworkGraph({
        query,
        districtId: districtId ?? undefined,
        category: category === "all" ? undefined : category,
        minLinks: Number(minLinks),
      }),
  });

  const offenderId = selectedNode?.startsWith("off-") ? selectedNode.slice(4) : null;
  const { data: detail } = useQuery({
    queryKey: ["offender", offenderId],
    queryFn: () => (offenderId ? getOffenderDetail(offenderId) : Promise.resolve(null)),
    enabled: !!offenderId,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Filter bar */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-md shadow-sm">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-amber/70" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search offender by name…"
            className="h-9 pl-9 text-xs rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 focus-visible:ring-accent-amber/30 transition-colors shadow-sm"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-52 text-xs rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 hover:bg-white/[0.02] transition-colors shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All crime types</SelectItem>
            {CRIME_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 bg-surface/30 px-3 py-1 rounded-xl border border-border/50">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <Network className="w-3 h-3 text-accent-amber/70" />
            Min links
          </span>
          <Select value={minLinks} onValueChange={setMinLinks}>
            <SelectTrigger className="h-7 w-16 text-xs rounded-lg bg-black/20 border-white/5 hover:border-accent-amber/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground bg-black/20 px-4 py-1.5 rounded-xl border border-white/5 shadow-inner">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 font-bold tabular-nums text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            {graph?.stats.offenderCount ?? 0}
          </span>
          <span className="font-medium">repeat offenders across</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 font-bold tabular-nums text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            {graph?.stats.linkedCaseCount ?? 0}
          </span>
          <span className="font-medium">linked cases</span>
          {districtId && (
            <Badge
              variant="outline"
              className="text-[10px] border-accent-amber/40 text-accent-amber ml-2 bg-accent-amber/10"
            >
              {districts.find((d) => d.id === districtId)?.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 relative min-h-0 bg-[#0b0f14]">
        <ClientOnly fallback={<Skeleton className="w-full h-full" />}>
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            {graph && !isLoading ? (
              <NetworkGraphClient graph={graph} onNodeClick={setSelectedNode} />
            ) : (
              <Skeleton className="w-full h-full" />
            )}
          </Suspense>
        </ClientOnly>

        {/* Legend */}
        <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur border border-border rounded-xl p-3 text-[11px] space-y-1.5 z-10">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Accused
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Victim
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#94A3B8]" /> Police Station
          </div>
        </div>
      </div>

      <Sheet open={!!selectedNode} onOpenChange={(o) => !o && setSelectedNode(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] bg-surface/90 backdrop-blur-2xl border-l border-white/5 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              {detail ? detail.name : (selectedNode ?? "Node")}
            </SheetTitle>
          </SheetHeader>
          {offenderId && detail ? (
            <div className="mt-4 space-y-4 px-1">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="Age" value={detail.age} />
                <Stat label="Gender" value={detail.gender} />
                <Stat label="Stations" value={detail.stationsInvolved} />
                <Stat label="Linked Cases" value={detail.linkedCases.length} highlight />
                <Stat
                  label={detail.districtIds && detail.districtIds.length > 1 ? "Districts" : "District"}
                  value={
                    detail.districtIds && detail.districtIds.length > 0
                      ? detail.districtIds
                          .map((id: string) => districts.find((d) => d.id === id)?.name)
                          .filter(Boolean)
                          .join(", ")
                      : districts.find((d) => d.id === detail.districtId)?.name ?? "—"
                  }
                  span={2}
                />
              </div>

              <div className="p-4 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <div className="text-[10px] uppercase tracking-wider text-accent-amber/90 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Network className="w-3 h-3" />
                  MO Signature
                </div>
                <div className="text-sm font-mono text-accent-amber drop-shadow-[0_0_4px_rgba(245,158,11,0.5)] leading-relaxed">{detail.moSignature}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3 pl-1">
                  Linked Cases
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/20 p-2 overflow-hidden shadow-inner">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-8 text-[10px]">Case</TableHead>
                        <TableHead className="h-8 text-[10px]">Type</TableHead>
                        <TableHead className="h-8 text-[10px]">Date</TableHead>
                        <TableHead className="h-8 text-[10px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.linkedCases.map((c) => (
                        <TableRow key={c.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-mono text-[11px] py-2">{c.id}</TableCell>
                          <TableCell className="text-[11px] py-2">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full shadow-sm"
                                style={{ background: CATEGORY_COLORS[c.category] }}
                              />
                              <span className="font-medium text-white/80">{c.subType}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-[11px] py-2 font-mono text-muted-foreground">
                            {new Date(c.date).toISOString().slice(0, 10)}
                          </TableCell>
                          <TableCell className="text-[11px] py-2">
                            <span className="font-mono font-semibold" style={{ color: STATUS_COLORS[c.status] }}>
                              {c.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs text-muted-foreground px-1">
              {selectedNode?.startsWith("vic-") &&
                "Victim node — click on an accused (red) node for a full offender profile."}
              {selectedNode?.startsWith("stn-") &&
                "Police station node — click on an accused (red) node for a full offender profile."}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  span,
}: {
  label: string;
  value: any;
  highlight?: boolean;
  span?: number;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/5 bg-black/20 p-3 shadow-inner ${span === 2 ? "col-span-2" : ""}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div
        className={`mt-1 tabular-nums tracking-tight ${
          highlight
            ? "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"
            : "text-lg font-medium text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
