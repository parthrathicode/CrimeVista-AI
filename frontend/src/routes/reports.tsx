import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNetworkGraph } from "@/services/api";
import { useSelectedDistrict } from "@/lib/selected-district";
import { FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/reports")({
  component: () => (
    <AppShell>
      <ReportsPage />
    </AppShell>
  ),
});

const REPORT_TYPES = [
  {
    id: "Monthly Crime Summary",
    desc: "A comprehensive overview of crime trends, volume, and clearance statistics for the selected period.",
  },
  {
    id: "Hotspot Analysis",
    desc: "Geographic concentration of incidents, highlighting priority zones and exact micro-hotspots requiring immediate deployment.",
  },
  {
    id: "Network Intelligence",
    desc: "Detailed breakdown of criminal syndicates, repeat offenders, and inter-district links to aid in dismantling organized networks.",
  },
  {
    id: "Predictive Risk Forecast",
    desc: "AI-driven forecast of potential incident spikes, vulnerable times of day, and high-risk sub-types for preemptive action.",
  },
  {
    id: "Suspect/Offender Profile",
    desc: "An official subject profile dossier including Age, Gender, MO signature, active districts, and all linked FIRs.",
  },
];

function ReportsPage() {
  const { districtId } = useSelectedDistrict();
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0].id);
  const [isDownloading, setIsDownloading] = useState(false);
  const [offenderQuery, setOffenderQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const { data: graph } = useQuery({
    queryKey: ["network", offenderQuery, districtId, "all", "2"],
    queryFn: () =>
      getNetworkGraph({
        query: offenderQuery,
        districtId: districtId ?? undefined,
        category: undefined,
        minLinks: 2,
      }),
    enabled: selectedType === "Suspect/Offender Profile",
  });

  const handleDownload = async () => {
    if (selectedType === "Suspect/Offender Profile" && !offenderQuery) {
      alert("Please enter a suspect name.");
      return;
    }

    setIsDownloading(true);
    try {
      let url = "";
      if (selectedType === "Suspect/Offender Profile") {
        url = `http://127.0.0.1:8000/api/reports/offender/${encodeURIComponent(offenderQuery)}`;
      } else {
        const params = new URLSearchParams({ report_type: selectedType });
        if (districtId) {
          params.append("district_id", districtId);
        }
        url = `http://127.0.0.1:8000/api/reports/generate?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Offender not found.");
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `KSP_Analytics_${selectedType.replace(/ /g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Delay revocation and removal slightly to allow the browser to initiate the download with the correct filename
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error(err);
      alert("Error generating report. Check console for details.");
    } finally {
      setIsDownloading(false);
    }
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
                Karnataka State Police · Document Generator
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                PDF Reports Generator
              </h1>
            </div>
          </div>
        </div>

        <article className="space-y-8 rounded-2xl border border-white/5 bg-black/20 p-8 shadow-inner">
          <section>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-5">
              Report Configuration
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground/90">
                  Select Report Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  <div>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="h-11 bg-black/40 border-white/10 text-foreground rounded-xl shadow-sm hover:border-accent-amber/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-accent-amber" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-muted-foreground leading-relaxed shadow-inner">
                    <span className="font-semibold text-accent-amber block mb-1">Overview</span>
                    {REPORT_TYPES.find((t) => t.id === selectedType)?.desc}
                  </div>
                </div>

                {selectedType === "Suspect/Offender Profile" && (
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <label className="text-sm font-semibold text-foreground/90 block mb-2">
                      Target Suspect Name
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="e.g. Janaki Srinivas"
                        value={offenderQuery}
                        onChange={(e) => {
                          setOffenderQuery(e.target.value);
                          setShowAutocomplete(true);
                        }}
                        onFocus={() => setShowAutocomplete(true)}
                        onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                        className="bg-black/40 border-white/10 text-foreground"
                      />
                      {showAutocomplete && graph && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 max-h-64 overflow-y-auto">
                          {graph.nodes.filter((n: any) => n.type === "accused").length === 0 ? (
                            <div className="p-3 text-xs text-muted-foreground text-center">
                              No offenders found
                            </div>
                          ) : (
                            <ul className="py-1">
                              {graph.nodes
                                .filter((n: any) => n.type === "accused")
                                .map((n: any) => (
                                  <li
                                    key={n.id}
                                    className="px-3 py-2 text-xs hover:bg-white/5 cursor-pointer text-foreground flex justify-between items-center"
                                    onClick={() => {
                                      setOffenderQuery(n.label);
                                      setShowAutocomplete(false);
                                    }}
                                  >
                                    <span className="font-medium">{n.label}</span>
                                    <span className="text-[10px] text-muted-foreground bg-black/40 px-1.5 py-0.5 rounded">
                                      {n.linkedCaseCount} cases
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter the name of the repeat offender to generate a complete intelligence
                      dossier.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-black/40 shadow-inner">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">
                  Generate {selectedType}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  {selectedType === "Suspect/Offender Profile" ? (
                    "The report will be generated as an official subject profile dossier including MO signature and linked cases."
                  ) : (
                    <span>
                      The report will be generated for{" "}
                      <strong className="text-foreground">
                        {districtId ? "the selected district" : "All Karnataka"}
                      </strong>
                      . It includes key metrics, summaries, and executive recommendations.
                    </span>
                  )}
                </p>
              </div>
              <Button
                className="shrink-0 bg-gradient-to-r from-accent-amber to-amber-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-300 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] px-6"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
