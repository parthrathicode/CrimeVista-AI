import { n as CATEGORY_COLORS, t as Badge } from "./badge-C0L_ZYno.js";
import { n as useSelectedDistrict } from "./selected-district-Bs_Yq7D_.js";
import { _ as getRiskLeaderboard, t as AppShell, v as getRiskScores } from "./AppShell-DuzYQILm.js";
import { t as Skeleton } from "./skeleton-3BxFvER_.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DfiB0xZo.js";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ChevronRight, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
//#region src/routes/risk.tsx?tsr-split=component
var BAND_STYLES = {
	Low: "bg-risk-low/15 text-risk-low border-risk-low/40",
	Medium: "bg-risk-med/15 text-risk-med border-risk-med/40",
	High: "bg-risk-high/15 text-risk-high border-risk-high/40"
};
function RiskPage() {
	const { districtId } = useSelectedDistrict();
	const [sortKey, setSortKey] = useState("score");
	const [sortDir, setSortDir] = useState("desc");
	const [selectedKey, setSelectedKey] = useState(null);
	const { data: leaderboard = [] } = useQuery({
		queryKey: ["risk-leaderboard"],
		queryFn: () => getRiskLeaderboard(5)
	});
	const { data: allScores = [], isLoading, isError, error } = useQuery({
		queryKey: ["risk-scores"],
		queryFn: getRiskScores
	});
	const rows = useMemo(() => {
		return [...districtId ? allScores.filter((r) => r.districtId === districtId) : allScores].sort((a, b) => {
			let cmp = 0;
			if (sortKey === "score") cmp = a.score - b.score;
			if (sortKey === "district") cmp = a.districtName.localeCompare(b.districtName);
			if (sortKey === "category") cmp = a.category.localeCompare(b.category);
			return sortDir === "asc" ? cmp : -cmp;
		});
	}, [
		allScores,
		districtId,
		sortKey,
		sortDir
	]);
	const selectedScore = selectedKey ? allScores.find((r) => riskRowKey(r) === selectedKey) ?? null : null;
	const toggleSort = (key) => {
		if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir("desc");
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "h-full flex flex-col overflow-hidden",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "shrink-0 p-4 border-b border-border",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 mb-3",
				children: [/* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-accent-amber" }), /* @__PURE__ */ jsx("h2", {
					className: "text-xs uppercase tracking-wider font-semibold",
					children: "Top 5 Highest Risk (State-wide)"
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "grid grid-cols-5 gap-4",
				children: leaderboard.map((r, i) => /* @__PURE__ */ jsxs("button", {
					onClick: () => setSelectedKey(riskRowKey(r)),
					className: "text-left rounded-2xl border border-white/5 bg-black/20 p-4 hover:bg-white/5 hover:border-accent-amber/40 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all shadow-inner group",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between mb-2",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "text-[10px] font-mono text-muted-foreground",
								children: ["#", i + 1]
							}), /* @__PURE__ */ jsx(Badge, {
								className: `${BAND_STYLES[r.band]} font-mono text-[10px]`,
								children: r.band
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "text-3xl font-bold tabular-nums notranslate text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] leading-none",
							children: r.score
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 text-xs text-foreground font-medium leading-tight",
							children: r.districtName
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1",
							children: [/* @__PURE__ */ jsx("span", {
								className: "w-1.5 h-1.5 rounded-full",
								style: { background: CATEGORY_COLORS[r.category] }
							}), r.category]
						})
					]
				}, `${r.districtId}-${r.category}`))
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex-1 flex min-h-0 overflow-hidden",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex-1 min-w-0 flex flex-col overflow-hidden",
				children: [/* @__PURE__ */ jsx("div", {
					className: "px-4 py-2 border-b border-border flex items-center justify-between",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-[10px] uppercase tracking-wider text-muted-foreground",
						children: [
							"Risk Matrix · ",
							rows.length,
							" district × crime combinations"
						]
					})
				}), /* @__PURE__ */ jsx("div", {
					className: "flex-1 overflow-auto",
					children: isError ? /* @__PURE__ */ jsx("div", {
						className: "p-4",
						children: /* @__PURE__ */ jsxs("div", {
							className: "rounded-2xl border border-white/5 bg-black/20 p-6 shadow-inner",
							children: [/* @__PURE__ */ jsx("div", {
								className: "text-sm font-semibold text-foreground/80 mb-2",
								children: "Risk matrix could not be loaded"
							}), /* @__PURE__ */ jsx("div", {
								className: "text-xs text-muted-foreground leading-relaxed",
								children: error instanceof Error ? error.message : "Please refresh and try again."
							})]
						})
					}) : isLoading ? /* @__PURE__ */ jsx("div", {
						className: "p-4 space-y-2",
						children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-full" }, i))
					}) : /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, {
						className: "sticky top-0 bg-surface/80 backdrop-blur-md z-10 border-b border-white/5",
						children: /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(SortHead, {
								label: "District",
								active: sortKey === "district",
								dir: sortDir,
								onClick: () => toggleSort("district")
							}),
							/* @__PURE__ */ jsx(SortHead, {
								label: "Crime Type",
								active: sortKey === "category",
								dir: sortDir,
								onClick: () => toggleSort("category")
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-[10px]",
								children: "Sub-Type"
							}),
							/* @__PURE__ */ jsx(SortHead, {
								label: "Risk Score",
								active: sortKey === "score",
								dir: sortDir,
								onClick: () => toggleSort("score"),
								className: "text-right"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-[10px] w-24",
								children: "Band"
							}),
							/* @__PURE__ */ jsx(TableHead, { className: "w-8" })
						] })
					}), /* @__PURE__ */ jsx(TableBody, { children: rows.map((r) => {
						const rowKey = riskRowKey(r);
						const active = selectedKey === rowKey;
						return /* @__PURE__ */ jsxs(TableRow, {
							onClick: () => setSelectedKey(rowKey),
							"data-state": active ? "selected" : void 0,
							className: `cursor-pointer transition-colors ${active ? "bg-accent-amber/10 shadow-[inset_4px_0_0_rgba(245,158,11,1)]" : "hover:bg-white/5"}`,
							children: [
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-xs py-2",
									children: r.districtName
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-xs py-2",
									children: /* @__PURE__ */ jsxs("span", {
										className: "inline-flex items-center gap-1.5",
										children: [/* @__PURE__ */ jsx("span", {
											className: "w-1.5 h-1.5 rounded-full",
											style: { background: CATEGORY_COLORS[r.category] }
										}), r.category]
									})
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-xs py-2 text-muted-foreground",
									children: r.subType
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right py-2",
									children: /* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-3 justify-end",
										children: [/* @__PURE__ */ jsx("div", {
											className: "w-24 h-1.5 rounded-full bg-black/40 overflow-hidden shadow-inner",
											children: /* @__PURE__ */ jsx("div", {
												className: "h-full rounded-full shadow-[0_0_8px_currentcolor]",
												style: {
													width: `${r.score}%`,
													backgroundColor: r.band === "High" ? "#EF4444" : r.band === "Medium" ? "#F59E0B" : "#10B981"
												}
											})
										}), /* @__PURE__ */ jsx("span", {
											className: "tabular-nums notranslate font-mono text-xs font-semibold w-8 text-right",
											children: r.score
										})]
									})
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "py-2",
									children: /* @__PURE__ */ jsx(Badge, {
										className: `${BAND_STYLES[r.band]} font-mono text-[10px]`,
										children: r.band
									})
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "py-2 text-muted-foreground",
									children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })
								})
							]
						}, rowKey);
					}) })] })
				})]
			}), /* @__PURE__ */ jsx("aside", {
				className: "w-[440px] shrink-0 border-l border-white/5 bg-surface/90 backdrop-blur-xl overflow-y-auto shadow-[-8px_0_24px_rgba(0,0,0,0.3)] z-10",
				children: !selectedScore ? /* @__PURE__ */ jsxs("div", {
					className: "h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "w-16 h-16 rounded-full bg-black/20 border border-white/5 flex items-center justify-center mb-5 shadow-inner",
							children: /* @__PURE__ */ jsx(TrendingUp, { className: "w-6 h-6 text-accent-amber/40" })
						}),
						/* @__PURE__ */ jsx("div", {
							className: "text-sm font-semibold text-foreground/80 mb-2",
							children: "No Selection"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "text-xs max-w-[220px] leading-relaxed",
							children: "Select a row from the risk matrix to inspect its detailed breakdown and historical trends."
						})
					]
				}) : /* @__PURE__ */ jsx(RiskDetail, { score: selectedScore })
			})]
		})]
	});
}
function riskRowKey(score) {
	return `${score.districtId}|${score.category}`;
}
function SortHead({ label, active, dir, onClick, className }) {
	return /* @__PURE__ */ jsx(TableHead, {
		className: `text-[10px] cursor-pointer select-none ${className ?? ""}`,
		onClick,
		children: /* @__PURE__ */ jsxs("span", {
			className: "inline-flex items-center gap-1",
			children: [
				label,
				/* @__PURE__ */ jsx(ArrowUpDown, { className: `w-3 h-3 ${active ? "text-accent-amber" : "text-muted-foreground/50"}` }),
				active && /* @__PURE__ */ jsx("span", {
					className: "text-accent-amber text-[9px] font-mono",
					children: dir === "asc" ? "↑" : "↓"
				})
			]
		})
	});
}
function RiskDetail({ score }) {
	const bandColor = score.band === "High" ? "#EF4444" : score.band === "Medium" ? "#F59E0B" : "#10B981";
	return /* @__PURE__ */ jsxs("div", {
		className: "p-4 space-y-5",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					className: "text-[10px] uppercase tracking-wider text-muted-foreground",
					children: "Risk Assessment"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "text-sm font-semibold mt-0.5",
					children: score.districtName
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "w-1.5 h-1.5 rounded-full",
							style: { background: CATEGORY_COLORS[score.category] }
						}),
						score.category,
						" · ",
						score.subType
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-4 flex items-end gap-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "text-6xl font-semibold tabular-nums notranslate leading-none",
						style: { color: bandColor },
						children: score.score
					}), /* @__PURE__ */ jsxs("div", {
						className: "pb-1",
						children: [/* @__PURE__ */ jsxs(Badge, {
							className: `${BAND_STYLES[score.band]} font-mono`,
							children: [score.band, " risk"]
						}), /* @__PURE__ */ jsx("div", {
							className: "text-[10px] text-muted-foreground mt-1 font-mono",
							children: "/ 100"
						})]
					})]
				})
			] }),
			/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-2",
					children: "Contribution Breakdown (SHAP)"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "text-[10px] text-muted-foreground/70 mb-3 font-mono",
					children: ["Points contributed by each factor · sums to ", score.score]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "h-52",
					children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(BarChart, {
						data: score.contributions,
						layout: "vertical",
						margin: {
							left: 0,
							right: 40,
							top: 0,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ jsx(XAxis, {
								type: "number",
								hide: true,
								domain: [(dataMin) => Math.min(0, dataMin - 1), (dataMax) => Math.max(0, dataMax + 1)]
							}),
							/* @__PURE__ */ jsx(YAxis, {
								type: "category",
								dataKey: "feature",
								width: 150,
								tick: {
									fill: "var(--muted-foreground)",
									fontSize: 11
								},
								axisLine: false,
								tickLine: false
							}),
							/* @__PURE__ */ jsx(Tooltip, {
								contentStyle: {
									background: "var(--surface)",
									border: "1px solid var(--border)",
									borderRadius: 4,
									fontSize: 11
								},
								itemStyle: { color: "var(--foreground)" },
								labelStyle: { color: "var(--foreground)" },
								formatter: (v) => [`${v > 0 ? "+" : ""}${v} pts`, "Contribution"]
							}),
							/* @__PURE__ */ jsx(Bar, {
								dataKey: "points",
								radius: [
									0,
									2,
									2,
									0
								],
								label: {
									position: "right",
									fill: "#F59E0B",
									fontSize: 11,
									fontFamily: "JetBrains Mono",
									formatter: (v) => `${v > 0 ? "+" : ""}${v}`
								},
								children: score.contributions.map((c) => /* @__PURE__ */ jsx(Cell, {
									fill: bandColor,
									fillOpacity: .75
								}, c.feature))
							})
						]
					}) })
				})
			] }),
			/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-2",
					children: "12-Month Trend"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "text-[10px] text-muted-foreground/70 mb-3 font-mono",
					children: "Historical case counts · last point is model prediction"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "h-40",
					children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(LineChart, {
						data: score.monthlyTrend,
						margin: {
							top: 8,
							right: 12,
							bottom: 0,
							left: -20
						},
						children: [
							/* @__PURE__ */ jsx(CartesianGrid, {
								strokeDasharray: "2 4",
								stroke: "var(--border)"
							}),
							/* @__PURE__ */ jsx(XAxis, {
								dataKey: "month",
								tick: {
									fill: "var(--muted-foreground)",
									fontSize: 10
								},
								axisLine: { stroke: "var(--border)" },
								tickLine: false
							}),
							/* @__PURE__ */ jsx(YAxis, {
								tick: {
									fill: "var(--muted-foreground)",
									fontSize: 10
								},
								axisLine: false,
								tickLine: false
							}),
							/* @__PURE__ */ jsx(Tooltip, {
								contentStyle: {
									background: "var(--surface)",
									border: "1px solid var(--border)",
									borderRadius: 4,
									fontSize: 11
								},
								itemStyle: { color: "var(--foreground)" },
								labelStyle: { color: "var(--foreground)" }
							}),
							/* @__PURE__ */ jsx(Line, {
								type: "monotone",
								dataKey: "cases",
								stroke: "#F59E0B",
								strokeWidth: 2,
								dot: (props) => {
									const { cx, cy, payload } = props;
									if (payload.isPredicted) return /* @__PURE__ */ jsx("circle", {
										cx,
										cy,
										r: 5,
										fill: bandColor,
										stroke: "#0b0f14",
										strokeWidth: 2
									}, props.index);
									return /* @__PURE__ */ jsx("circle", {
										cx,
										cy,
										r: 2.5,
										fill: "#F59E0B"
									}, props.index);
								}
							}),
							score.monthlyTrend.filter((m) => m.isPredicted).map((m) => /* @__PURE__ */ jsx(ReferenceDot, {
								x: m.month,
								y: m.cases,
								r: 0,
								label: {
									value: "Predicted",
									position: "top",
									fill: bandColor,
									fontSize: 10,
									fontFamily: "JetBrains Mono"
								}
							}, m.month))
						]
					}) })
				})
			] })
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(RiskPage, {}) });
//#endregion
export { SplitComponent as component };
