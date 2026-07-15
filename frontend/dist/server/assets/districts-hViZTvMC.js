import { n as CATEGORY_COLORS, t as Badge } from "./badge-C0L_ZYno.js";
import { n as useSelectedDistrict } from "./selected-district-Bs_Yq7D_.js";
import { f as getDistrictInsights, t as AppShell } from "./AppShell-DuzYQILm.js";
import { t as Skeleton } from "./skeleton-3BxFvER_.js";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, MapPin, Target, Users, Zap } from "lucide-react";
//#region src/routes/districts.tsx?tsr-split=component
var BAND_STYLES = {
	Low: "bg-risk-low/15 text-risk-low border-risk-low/40",
	Medium: "bg-risk-med/15 text-risk-med border-risk-med/40",
	High: "bg-risk-high/15 text-risk-high border-risk-high/40"
};
function DistrictCardsPage() {
	const { setDistrictId } = useSelectedDistrict();
	const navigate = useNavigate();
	const { data: insights = [], isLoading, isError, error } = useQuery({
		queryKey: ["district-insights"],
		queryFn: getDistrictInsights
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "h-full overflow-y-auto",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "p-4 border-b border-border",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "text-[10px] uppercase tracking-wider text-muted-foreground",
					children: "Intelligence Cards"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "text-lg font-semibold mt-0.5",
					children: "District Snapshots"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "text-xs text-muted-foreground mt-1",
					children: "One-glance situational awareness · Click a card to filter the app to that district."
				})
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3",
			children: isError ? /* @__PURE__ */ jsxs("div", {
				className: "col-span-full rounded-2xl border border-white/5 bg-black/20 p-8 shadow-inner",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm font-semibold text-foreground/80 mb-2",
					children: "District cards could not be loaded"
				}), /* @__PURE__ */ jsx("div", {
					className: "text-xs text-muted-foreground leading-relaxed",
					children: error instanceof Error ? error.message : "Please refresh and try again."
				})]
			}) : isLoading ? Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-56" }, i)) : insights.map((d) => {
				const up = d.trendPct >= 0;
				return /* @__PURE__ */ jsxs("button", {
					onClick: () => {
						setDistrictId(d.districtId);
						navigate({ to: "/" });
					},
					className: "text-left rounded-2xl border border-white/5 bg-black/20 p-5 hover:bg-white/5 hover:border-accent-amber/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all shadow-inner group flex flex-col h-full",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-start justify-between mb-4",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
								className: "text-sm font-semibold",
								children: d.districtName
							}), /* @__PURE__ */ jsx("div", {
								className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5",
								children: d.districtId
							})] }), /* @__PURE__ */ jsxs(Badge, {
								className: `${BAND_STYLES[d.highestRiskBand]} font-mono text-[10px]`,
								children: [
									d.highestRiskBand,
									" · ",
									d.highestRiskScore
								]
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-2 gap-3 mb-4",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "rounded-xl bg-black/40 border border-white/5 p-3 shadow-inner",
									children: [/* @__PURE__ */ jsx("div", {
										className: "text-[9px] uppercase tracking-wider text-muted-foreground font-semibold",
										children: "Cases"
									}), /* @__PURE__ */ jsxs("div", {
										className: "flex items-baseline gap-1.5 mt-1",
										children: [/* @__PURE__ */ jsx("span", {
											className: "text-2xl font-bold tabular-nums notranslate text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]",
											children: d.totalCases
										}), /* @__PURE__ */ jsxs("span", {
											className: `text-[10px] font-mono flex items-center gap-0.5 ${up ? "text-risk-high drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" : "text-risk-low drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"}`,
											children: [
												up ? /* @__PURE__ */ jsx(ArrowUpRight, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(ArrowDownRight, { className: "w-3 h-3" }),
												Math.abs(d.trendPct),
												"%"
											]
										})]
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "rounded-xl bg-black/40 border border-white/5 p-3 shadow-inner",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "text-[9px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1",
										children: [/* @__PURE__ */ jsx(Zap, { className: "w-3 h-3 text-accent-amber/70" }), "Hotspots"]
									}), /* @__PURE__ */ jsx("div", {
										className: "text-xl font-bold tabular-nums notranslate mt-1 text-foreground",
										children: d.hotspotCount
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "rounded-xl bg-black/40 border border-white/5 p-3 shadow-inner",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "text-[9px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1",
										children: [/* @__PURE__ */ jsx(Users, { className: "w-3 h-3 text-accent-amber/70" }), "Repeat Offenders"]
									}), /* @__PURE__ */ jsx("div", {
										className: "text-xl font-bold tabular-nums notranslate mt-1 text-foreground",
										children: d.offenderCount
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "rounded-xl bg-black/40 border border-white/5 p-3 shadow-inner",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "text-[9px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1",
										children: [/* @__PURE__ */ jsx(Target, { className: "w-3 h-3 text-accent-amber/70" }), "Dominant"]
									}), /* @__PURE__ */ jsxs("div", {
										className: "text-xs font-medium mt-1.5 truncate flex items-center gap-1.5 text-foreground/90",
										children: [/* @__PURE__ */ jsx("span", {
											className: "w-1.5 h-1.5 rounded-full shrink-0",
											style: { background: CATEGORY_COLORS[d.dominantCategory] ?? "#F59E0B" }
										}), d.dominantSubType]
									})]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1.5",
							children: [/* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-accent-amber/70" }), "Predicted Hotspot"]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "text-xs text-foreground/90 font-medium mb-4",
							children: d.topHotspotLabel
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-auto pt-4 w-full",
							children: /* @__PURE__ */ jsxs("div", {
								className: "p-3 rounded-xl bg-accent-amber/10 border border-accent-amber/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]",
								children: [/* @__PURE__ */ jsx("div", {
									className: "text-[9px] uppercase tracking-wider text-accent-amber/90 font-semibold mb-1",
									children: "Suggested Action"
								}), /* @__PURE__ */ jsx("div", {
									className: "text-[11px] text-accent-amber/80 leading-snug",
									children: d.suggestedAction
								})]
							})
						})
					]
				}, d.districtId);
			})
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(DistrictCardsPage, {}) });
//#endregion
export { SplitComponent as component };
