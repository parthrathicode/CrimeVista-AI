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
import { Search } from "lucide-react";
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
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface/50">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search offender by name…"
            className="h-8 pl-7 text-xs bg-background"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-52 text-xs bg-background">
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
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Min links
          </span>
          <Select value={minLinks} onValueChange={setMinLinks}>
            <SelectTrigger className="h-8 w-16 text-xs bg-background">
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
        <div className="ml-auto flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="text-accent-amber font-semibold tabular-nums">
            {graph?.stats.offenderCount ?? 0}
          </span>
          repeat offenders across
          <span className="text-accent-amber font-semibold tabular-nums">
            {graph?.stats.linkedCaseCount ?? 0}
          </span>
          linked cases
          {districtId && (
            <Badge
              variant="outline"
              className="text-[10px] border-accent-amber/40 text-accent-amber"
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
        <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur border border-border rounded-sm p-3 text-[11px] space-y-1.5 z-10">
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
        <SheetContent className="w-[480px] sm:max-w-[480px] bg-surface border-l border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground">
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
                  label="District"
                  value={districts.find((d) => d.id === detail.districtId)?.name ?? "—"}
                  span={2}
                />
              </div>

              <div className="p-3 rounded-sm border border-accent-amber/30 bg-accent-amber/5">
                <div className="text-[10px] uppercase tracking-wider text-accent-amber/80 mb-1">
                  MO Signature
                </div>
                <div className="text-sm font-mono text-accent-amber">{detail.moSignature}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Linked Cases
                </div>
                <div className="rounded-sm border border-border overflow-hidden">
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
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-[11px] py-1.5">{c.id}</TableCell>
                          <TableCell className="text-[11px] py-1.5">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: CATEGORY_COLORS[c.category] }}
                              />
                              {c.subType}
                            </span>
                          </TableCell>
                          <TableCell className="text-[11px] py-1.5 font-mono text-muted-foreground">
                            {new Date(c.date).toISOString().slice(0, 10)}
                          </TableCell>
                          <TableCell className="text-[11px] py-1.5">
                            <span className="font-mono" style={{ color: STATUS_COLORS[c.status] }}>
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
      className={`rounded-sm border border-border bg-background/50 p-2 ${span === 2 ? "col-span-2" : ""}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`text-sm mt-0.5 tabular-nums ${highlight ? "text-accent-amber font-semibold" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
