import { n as useSelectedDistrict } from "./selected-district-Bs_Yq7D_.js";
import { t as AppShell, u as getBriefing } from "./AppShell-DuzYQILm.js";
import { t as Button } from "./button-jxJOI0wY.js";
import { t as Skeleton } from "./skeleton-3BxFvER_.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, FileText, TrendingDown, TrendingUp } from "lucide-react";
//#region src/routes/briefing.tsx?tsr-split=component
function BriefingPage() {
	const { districtId } = useSelectedDistrict();
	const [copied, setCopied] = useState(false);
	const { data: b, isLoading, isError, error } = useQuery({
		queryKey: ["briefing", districtId],
		queryFn: () => getBriefing(districtId ?? void 0)
	});
	const copy = async () => {
		if (!b) return;
		await navigator.clipboard.writeText(b.plainText);
		setCopied(true);
		setTimeout(() => setCopied(false), 1600);
	};
	return /* @__PURE__ */ jsx("div", {
		className: "h-full overflow-y-auto",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-3xl mx-auto p-8",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between mb-8 pb-6 border-b border-border",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "w-10 h-10 rounded-xl bg-accent-amber/10 border border-accent-amber/40 flex items-center justify-center",
						children: /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-accent-amber" })
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground",
						children: "Karnataka State Police · Auto-generated"
					}), /* @__PURE__ */ jsx("h1", {
						className: "text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70",
						children: "Weekly Crime Intelligence Briefing"
					})] })]
				}), /* @__PURE__ */ jsxs(Button, {
					size: "sm",
					variant: "outline",
					onClick: copy,
					disabled: !b,
					className: "rounded-xl bg-black/20 border-white/5 hover:bg-white/5 hover:border-accent-amber/50 text-foreground transition-all shadow-inner",
					children: [copied ? /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 mr-1.5 text-green-500" }) : /* @__PURE__ */ jsx(Copy, { className: "w-3.5 h-3.5 mr-1.5" }), copied ? "Copied" : "Copy Briefing"]
				})]
			}), isError ? /* @__PURE__ */ jsxs("div", {
				className: "rounded-2xl border border-white/5 bg-black/20 p-8 shadow-inner",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm font-semibold text-foreground/80 mb-2",
					children: "Briefing could not be loaded"
				}), /* @__PURE__ */ jsx("div", {
					className: "text-xs text-muted-foreground leading-relaxed",
					children: error instanceof Error ? error.message : "Please refresh and try again."
				})]
			}) : isLoading || !b ? /* @__PURE__ */ jsxs("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-1/2" }),
					/* @__PURE__ */ jsx(Skeleton, { className: "h-32 w-full" }),
					/* @__PURE__ */ jsx(Skeleton, { className: "h-32 w-full" })
				]
			}) : /* @__PURE__ */ jsxs("article", {
				className: "space-y-8 rounded-2xl border border-white/5 bg-black/20 p-8 shadow-inner",
				children: [
					/* @__PURE__ */ jsxs("header", {
						className: "grid grid-cols-3 gap-6 pb-8 border-b border-white/5",
						children: [
							/* @__PURE__ */ jsx(Meta, {
								label: "Scope",
								value: b.scope
							}),
							/* @__PURE__ */ jsx(Meta, {
								label: "Period",
								value: b.dateRange
							}),
							/* @__PURE__ */ jsx(Meta, {
								label: "Total Cases (30d)",
								value: String(b.totalCases)
							})
						]
					}),
					/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3",
						children: "Executive Summary"
					}), /* @__PURE__ */ jsxs("p", {
						className: "text-[15px] leading-relaxed text-foreground/90 flex items-start gap-3",
						children: [/* @__PURE__ */ jsxs("span", {
							className: `inline-flex items-center gap-1 shrink-0 mt-1 font-mono text-xs ${b.trendPct >= 0 ? "text-risk-high drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" : "text-risk-low drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"}`,
							children: [
								b.trendPct >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "w-4 h-4" }),
								b.trendPct >= 0 ? "+" : "",
								b.trendPct,
								"%"
							]
						}), /* @__PURE__ */ jsxs("span", { children: [
							b.scope,
							" recorded",
							" ",
							/* @__PURE__ */ jsx("strong", {
								className: "text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 font-bold tabular-nums text-lg drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]",
								children: b.totalCases
							}),
							" ",
							"cases in the last 30 days, ",
							b.trendPct >= 0 ? "up" : "down",
							" ",
							Math.abs(b.trendPct),
							"% versus the prior 30-day window."
						] })]
					})] }),
					/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-4",
						children: "Key Observations"
					}), /* @__PURE__ */ jsx("ul", {
						className: "space-y-4",
						children: b.bullets.map((line, i) => /* @__PURE__ */ jsxs("li", {
							className: "flex gap-4 text-[15px] leading-relaxed",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-accent-amber font-mono font-semibold text-sm shrink-0",
								children: String(i + 1).padStart(2, "0")
							}), /* @__PURE__ */ jsx("span", {
								className: "text-foreground/90",
								children: line
							})]
						}, i))
					})] }),
					/* @__PURE__ */ jsxs("section", {
						className: "p-6 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "text-[10px] uppercase tracking-wider text-accent-amber/90 font-semibold mb-4 flex items-center gap-2",
							children: [/* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }), "Recommended Actions"]
						}), /* @__PURE__ */ jsx("ul", {
							className: "space-y-3",
							children: b.recommendations.map((r, i) => /* @__PURE__ */ jsxs("li", {
								className: "flex gap-3 text-sm text-foreground/90 font-medium",
								children: [/* @__PURE__ */ jsx("span", {
									className: "text-accent-amber/70 mt-0.5",
									children: "→"
								}), /* @__PURE__ */ jsx("span", { children: r })]
							}, i))
						})]
					})
				]
			})]
		})
	});
}
function Meta({ label, value }) {
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
		className: "text-[10px] uppercase tracking-wider text-muted-foreground",
		children: label
	}), /* @__PURE__ */ jsx("div", {
		className: "text-sm font-medium mt-0.5",
		children: value
	})] });
}
var SplitComponent = () => /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(BriefingPage, {}) });
//#endregion
export { SplitComponent as component };
