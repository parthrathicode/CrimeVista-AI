import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSelectedDistrict } from "@/lib/selected-district";
import { FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/reports")({
  component: () => (
    <AppShell>
      <ReportsPage />
    </AppShell>
  ),
});

const REPORT_TYPES = [
  "Monthly Crime Summary",
  "Hotspot Analysis",
  "Network Intelligence",
  "Predictive Risk Forecast",
];

function ReportsPage() {
  const { districtId } = useSelectedDistrict();
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0]);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const params = new URLSearchParams({ report_type: selectedType });
      if (districtId) {
        params.append("district_id", districtId);
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/reports/generate?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to generate report");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KSP_Analytics_${selectedType.replace(/ /g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
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
                <label className="text-sm font-semibold text-foreground/90">Select Report Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {REPORT_TYPES.map(type => (
                    <div
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`p-5 rounded-2xl border text-sm cursor-pointer transition-all flex items-center gap-4 shadow-inner ${
                        selectedType === type
                          ? "bg-accent-amber/10 border-accent-amber/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)] text-accent-amber"
                          : "bg-black/40 border-white/5 hover:border-accent-amber/40 hover:bg-white/5 hover:-translate-y-1 text-foreground/80 hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
                      }`}
                    >
                      <FileText className={`w-5 h-5 ${selectedType === type ? "text-accent-amber drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-muted-foreground"}`} />
                      <span className="font-medium">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-2xl border border-white/5 bg-black/40 shadow-inner">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Generate {selectedType}</h3>
                  <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                    The report will be generated for <strong className="text-foreground">{districtId ? "the selected district" : "All Karnataka"}</strong>. 
                    It includes key metrics, summaries, and executive recommendations.
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
