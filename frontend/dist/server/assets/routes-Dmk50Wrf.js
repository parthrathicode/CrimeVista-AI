import { i as STATUS_COLORS, n as CATEGORY_COLORS, t as Badge } from "./badge-C0L_ZYno.js";
import { n as useSelectedDistrict } from "./selected-district-Bs_Yq7D_.js";
import { a as SelectTrigger, d as getCases, i as SelectItem, l as getAlerts, m as getHotspots, n as Select, o as SelectValue, p as getDistricts, r as SelectContent, s as cn, t as AppShell } from "./AppShell-DuzYQILm.js";
import { t as Skeleton } from "./skeleton-3BxFvER_.js";
import { t as ClientOnly } from "./ClientOnly-DrAnJiVa.js";
import * as React from "react";
import { Suspense, lazy, useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Calendar, MapPin, X } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
//#region src/components/ui/slider.tsx
var Slider = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(SliderPrimitive.Root, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ jsx(SliderPrimitive.Track, {
		className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-highlight",
		children: /* @__PURE__ */ jsx(SliderPrimitive.Range, { className: "absolute h-full bg-gradient-to-r from-accent-amber/70 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" })
	}), (props.value || props.defaultValue || [0]).map((_, i) => /* @__PURE__ */ jsx(SliderPrimitive.Thumb, { className: "block h-4 w-4 cursor-grab rounded-full border-2 border-accent-amber bg-background shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber/50 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent-amber/10 active:cursor-grabbing" }, i))]
}));
Slider.displayName = SliderPrimitive.Root.displayName;
//#endregion
//#region src/routes/index.tsx?tsr-split=component
var CrimeMapClient = lazy(() => import("./CrimeMapClient-9e9xpi_Y.js"));
var DATE_WINDOWS = [
	{
		label: "Last 7 days",
		value: "7"
	},
	{
		label: "Last 30 days",
		value: "30"
	},
	{
		label: "Last 90 days",
		value: "90"
	},
	{
		label: "All time",
		value: "all"
	}
];
function CrimeMapPage() {
	const { districtId, setDistrictId } = useSelectedDistrict();
	const [hourRange, setHourRange] = useState([0, 23]);
	const [dateWindow, setDateWindow] = useState("90");
	const [dismissedAlerts, setDismissedAlerts] = useState(/* @__PURE__ */ new Set());
	const dateWindowDays = dateWindow === "all" ? null : Number(dateWindow);
	const { data: districts = [] } = useQuery({
		queryKey: ["districts"],
		queryFn: getDistricts
	});
	const { data: alerts = [] } = useQuery({
		queryKey: ["alerts"],
		queryFn: getAlerts
	});
	const { data: cases = [], isLoading: casesLoading } = useQuery({
		queryKey: [
			"cases",
			districtId,
			hourRange,
			dateWindowDays
		],
		queryFn: () => getCases(districtId ?? void 0, {
			hourRange,
			dateWindowDays
		})
	});
	const { data: hotspots = [] } = useQuery({
		queryKey: ["hotspots", districtId],
		queryFn: () => getHotspots(districtId ?? void 0)
	});
	const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));
	const selectedDistrict = districts.find((d) => d.id === districtId) ?? null;
	const stats = useMemo(() => {
		const catCounts = {};
		const allStatuses = [
			"Under Investigation",
			"Charge Sheeted",
			"Closed",
			"Undetected"
		];
		const statusCounts = Object.fromEntries(allStatuses.map((s) => [s, 0]));
		cases.forEach((c) => {
			catCounts[c.category] = (catCounts[c.category] ?? 0) + 1;
			statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
		});
		return {
			topCats: Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, value]) => ({
				name,
				value
			})),
			statusData: allStatuses.map((name) => ({
				name,
				value: statusCounts[name]
			})),
			total: cases.length
		};
	}, [cases]);
	return /* @__PURE__ */ jsxs("div", {
		className: "h-full flex flex-col",
		children: [
			visibleAlerts.length > 0 && /* @__PURE__ */ jsx("div", {
				className: "shrink-0 flex flex-col gap-2 p-2 relative z-10 bg-background/30 backdrop-blur-sm border-b border-border",
				children: visibleAlerts.map((a) => /* @__PURE__ */ jsxs("div", {
					className: "relative flex items-center gap-2 px-3 py-1.5 mx-auto w-fit max-w-3xl rounded-full bg-amber-50/90 dark:bg-[#1a140d]/90 border border-amber-300 dark:border-accent-amber/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
					children: [
						/* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full bg-gradient-to-r from-accent-amber/10 via-transparent to-transparent pointer-events-none" }),
						/* @__PURE__ */ jsx("div", {
							className: "relative p-1 rounded-full bg-accent-amber/20 border border-accent-amber/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
							children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3 text-accent-amber shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,1)]" })
						}),
						/* @__PURE__ */ jsx("span", {
							className: "relative text-[11px] font-medium text-amber-950 dark:text-amber-50/90 tracking-wide pr-2",
							children: a.title
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => setDismissedAlerts((s) => new Set(s).add(a.id)),
							className: "relative p-1 hover:bg-accent-amber/20 text-accent-amber/60 hover:text-accent-amber rounded-full transition-colors ml-1",
							children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
						})
					]
				}, a.id))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "shrink-0 flex items-center gap-6 px-4 py-2.5 border-b border-border bg-surface/50",
				children: [
					selectedDistrict && /* @__PURE__ */ jsxs("button", {
						onClick: () => setDistrictId(null),
						className: "flex items-center gap-1.5 text-xs text-accent-amber hover:text-accent-amber/80",
						children: [/* @__PURE__ */ jsx(ArrowLeft, { className: "w-3.5 h-3.5" }), " All districts"]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3 flex-1 max-w-md",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap",
							children: [
								"Hour ",
								String(hourRange[0]).padStart(2, "0"),
								":00 –",
								" ",
								String(hourRange[1]).padStart(2, "0"),
								":00"
							]
						}), /* @__PURE__ */ jsx(Slider, {
							value: hourRange,
							onValueChange: (v) => setHourRange([v[0], v[1]]),
							min: 0,
							max: 23,
							step: 1,
							className: "flex-1"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono",
							children: "Window"
						}), /* @__PURE__ */ jsxs(Select, {
							value: dateWindow,
							onValueChange: setDateWindow,
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "h-9 w-40 text-xs rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 hover:bg-white/[0.02] transition-colors shadow-sm",
								children: /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx(Calendar, { className: "w-3.5 h-3.5 text-accent-amber/70" }), /* @__PURE__ */ jsx(SelectValue, {})]
								})
							}), /* @__PURE__ */ jsx(SelectContent, { children: DATE_WINDOWS.map((w) => /* @__PURE__ */ jsx(SelectItem, {
								value: w.value,
								children: w.label
							}, w.value)) })]
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "text-xs text-muted-foreground font-mono ml-auto",
						children: casesLoading ? "…" : `${cases.length} cases`
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex-1 flex min-h-0",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex-1 relative bg-[#0b0f14] min-w-[520px]",
					children: [/* @__PURE__ */ jsx(ClientOnly, {
						fallback: /* @__PURE__ */ jsx(Skeleton, { className: "w-full h-full" }),
						children: /* @__PURE__ */ jsx(Suspense, {
							fallback: /* @__PURE__ */ jsx(Skeleton, { className: "w-full h-full" }),
							children: /* @__PURE__ */ jsx(CrimeMapClient, {
								districts,
								cases,
								hotspots,
								focusDistrictId: districtId,
								onDistrictClick: (id) => setDistrictId(id)
							})
						})
					}), /* @__PURE__ */ jsx("div", {
						className: "absolute bottom-3 left-3 flex flex-col gap-1 z-[500] pointer-events-none",
						children: Object.entries(CATEGORY_COLORS).map(([k, v]) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-background/70 backdrop-blur px-2 py-0.5 rounded-xl",
							children: [/* @__PURE__ */ jsx("span", {
								className: "w-2 h-2 rounded-full",
								style: { background: v }
							}), k]
						}, k))
					})]
				}), /* @__PURE__ */ jsxs("aside", {
					className: "w-80 shrink-0 border-l border-border/50 bg-surface/80 backdrop-blur-xl overflow-y-auto shadow-[-4px_0_24px_rgba(0,0,0,0.2)] z-10 flex flex-col gap-4 p-4",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "bg-black/20 rounded-2xl p-4 border border-white/5 shadow-inner",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "flex items-center justify-between",
									children: /* @__PURE__ */ jsxs("div", {
										className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5",
										children: [/* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3 text-accent-amber/70" }), selectedDistrict ? "District Focus" : "State Overview"]
									})
								}),
								/* @__PURE__ */ jsx("div", {
									className: "text-xl font-bold mt-2 text-foreground tracking-tight",
									children: selectedDistrict?.name ?? "Karnataka"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-4 flex flex-col",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-4xl font-bold tabular-nums notranslate text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]",
										children: stats.total
									}), /* @__PURE__ */ jsx("span", {
										className: "text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-semibold",
										children: "Cases in view"
									})]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "bg-black/20 rounded-2xl p-4 border border-white/5",
							children: [/* @__PURE__ */ jsx("div", {
								className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-4 font-semibold",
								children: "Top Crime Types"
							}), /* @__PURE__ */ jsx("div", {
								className: "h-32",
								children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(BarChart, {
									data: stats.topCats,
									layout: "vertical",
									margin: {
										left: 0,
										right: 8,
										top: 0,
										bottom: 0
									},
									children: [
										/* @__PURE__ */ jsx(XAxis, {
											type: "number",
											hide: true
										}),
										/* @__PURE__ */ jsx(YAxis, {
											type: "category",
											dataKey: "name",
											width: 140,
											tick: {
												fill: "var(--muted-foreground)",
												fontSize: 10,
												fontWeight: 500
											},
											axisLine: false,
											tickLine: false
										}),
										/* @__PURE__ */ jsx(Tooltip, {
											cursor: { fill: "rgba(255,255,255,0.05)" },
											contentStyle: {
												background: "var(--surface)",
												border: "1px solid var(--border)",
												borderRadius: "12px",
												fontSize: 11,
												boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
											},
											itemStyle: { color: "var(--foreground)" },
											labelStyle: { color: "var(--foreground)" }
										}),
										/* @__PURE__ */ jsx(Bar, {
											dataKey: "value",
											radius: [
												0,
												6,
												6,
												0
											],
											barSize: 16,
											children: stats.topCats.map((c) => /* @__PURE__ */ jsx(Cell, { fill: CATEGORY_COLORS[c.name] ?? "#F59E0B" }, c.name))
										})
									]
								}) })
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "bg-black/20 rounded-2xl p-4 border border-white/5",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-4 font-semibold",
									children: "Case Status"
								}),
								/* @__PURE__ */ jsx("div", {
									className: "h-40",
									children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(PieChart, { children: [/* @__PURE__ */ jsx(Pie, {
										data: stats.statusData,
										dataKey: "value",
										nameKey: "name",
										innerRadius: 45,
										outerRadius: 65,
										paddingAngle: 4,
										stroke: "#0b0f14",
										strokeWidth: 2,
										cornerRadius: 4,
										children: stats.statusData.map((d) => /* @__PURE__ */ jsx(Cell, { fill: STATUS_COLORS[d.name] ?? "#6B7280" }, d.name))
									}), /* @__PURE__ */ jsx(Tooltip, {
										contentStyle: {
											background: "var(--surface)",
											border: "1px solid var(--border)",
											borderRadius: "12px",
											fontSize: 11,
											boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
										},
										itemStyle: { color: "var(--foreground)" },
										labelStyle: { color: "var(--foreground)" }
									})] }) })
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-4 space-y-2",
									children: stats.statusData.map((s) => /* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white/5 transition-colors",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ jsx("span", {
												className: "w-2.5 h-2.5 rounded-full shadow-sm",
												style: { background: STATUS_COLORS[s.name] }
											}), /* @__PURE__ */ jsx("span", {
												className: "text-muted-foreground font-medium",
												children: s.name
											})]
										}), /* @__PURE__ */ jsx("span", {
											className: "tabular-nums notranslate text-foreground font-bold",
											children: s.value
										})]
									}, s.name))
								})
							]
						}),
						selectedDistrict && hotspots.length > 0 && /* @__PURE__ */ jsxs("div", {
							className: "bg-black/20 rounded-2xl p-4 border border-white/5",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-4 font-semibold flex items-center gap-1.5",
								children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3 text-red-400" }), "Active Hotspots"]
							}), /* @__PURE__ */ jsx("div", {
								className: "space-y-2",
								children: hotspots.map((h) => /* @__PURE__ */ jsxs("div", {
									className: "text-xs p-3 bg-surface/40 rounded-xl border border-border/40 hover:border-accent-amber/30 transition-colors",
									children: [/* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between mb-2",
										children: [/* @__PURE__ */ jsxs(Badge, {
											className: "bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-mono px-1.5 py-0",
											children: [h.caseCount, " cases"]
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-muted-foreground font-mono text-[10px]",
											children: [
												h.lat.toFixed(3),
												", ",
												h.lng.toFixed(3)
											]
										})]
									}), /* @__PURE__ */ jsxs("div", {
										className: "text-foreground/90 font-medium",
										children: ["Dominant: ", h.dominantCrime]
									})]
								}, h.id))
							})]
						})
					]
				})]
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(CrimeMapPage, {}) });
//#endregion
export { SplitComponent as component };
