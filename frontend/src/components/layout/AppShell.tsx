import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Map,
  Network,
  Activity,
  FileText,
  Sparkles,
  IdCard,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  MapPin,
} from "lucide-react";
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

const LANGUAGES = [
  { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
  { code: "en", name: "English (English)" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "mwr", name: "Marwari (मारवाड़ी)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "ur", name: "Urdu (اردو)" },
];

const NAV = [
  { to: "/", label: "Crime Map", icon: Map },
  { to: "/network", label: "Network Analysis", icon: Network },
  { to: "/risk", label: "Predictive Risk", icon: Activity },
  { to: "/districts", label: "District Cards", icon: IdCard },
  { to: "/briefing", label: "Intelligence Briefing", icon: BookOpen },
  { to: "/reports", label: "PDF Reports", icon: FileText },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { districtId, setDistrictId } = useSelectedDistrict();
  const { data: districts = [] } = useQuery({
    queryKey: ["districts"],
    queryFn: getDistricts,
  });

  const [lang, setLang] = useState("en");
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar_collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (match) {
      setLang(match[1]);
    }
  }, []);

  const handleLanguageChange = (newLang: string) => {
    if (newLang === "en") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" +
        window.location.hostname +
        "; path=/;";
    } else {
      document.cookie = `googtrans=/en/${newLang}; path=/`;
      document.cookie = `googtrans=/en/${newLang}; domain=${window.location.hostname}; path=/`;
    }
    window.location.reload();
  };

  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element",
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "shrink-0 border-r border-border bg-surface flex flex-col transition-all duration-300 relative",
          isCollapsed ? "w-[68px]" : "w-56",
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-4 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent-amber z-50 transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-3 h-3" />
          ) : (
            <PanelLeftClose className="w-3 h-3" />
          )}
        </button>

        <div className="h-16 flex items-center px-4 border-b border-border overflow-hidden select-none">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:border-accent-amber/50 transition-all">
              <Activity className="w-4 h-4 shrink-0 text-accent-amber drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
            </div>
            {!isCollapsed && (
              <div className="leading-none shrink-0 whitespace-nowrap">
                <div className="text-[15px] font-bold tracking-tight text-foreground">
                  CrimeVista{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-200">
                    AI
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="p-2 space-y-0.5 mt-2">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors overflow-hidden whitespace-nowrap",
                  active
                    ? "bg-accent-amber/10 text-accent-amber border-l-2 border-accent-amber pl-2"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-l-2 border-transparent pl-2",
                  isCollapsed ? "justify-center border-l-0 pl-2.5" : "",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isCollapsed && active ? "text-accent-amber" : "",
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 shrink-0 border-b border-border bg-surface flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-tight uppercase">
              CrimeVista <span className="text-accent-amber">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div id="google_translate_element" className="hidden"></div>
            <Select value={lang} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[200px] shrink-0 h-9 rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 hover:bg-white/[0.02] transition-colors notranslate shadow-sm">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Language" />
                </div>
              </SelectTrigger>
              <SelectContent className="notranslate">
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-2">
              District
            </span>
            <Select
              value={districtId ?? "all"}
              onValueChange={(v) => setDistrictId(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[220px] h-9 rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 hover:bg-white/[0.02] transition-colors shadow-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-accent-amber/70" />
                  <SelectValue placeholder="All Karnataka">
                    <span className={!districtId || districtId === "all" ? "" : "hidden"}>
                      All Karnataka
                    </span>
                    {districts.map((d) => (
                      <span key={d.id} className={districtId === d.id ? "" : "hidden"}>
                        {d.name}
                      </span>
                    ))}
                  </SelectValue>
                </div>
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
