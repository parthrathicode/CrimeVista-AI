import { i as STATUS_COLORS, n as CATEGORY_COLORS, r as CRIME_CATEGORIES, t as Badge } from "./badge-C0L_ZYno.js";
import { n as useSelectedDistrict } from "./selected-district-Bs_Yq7D_.js";
import { a as SelectTrigger, g as getOffenderDetail, h as getNetworkGraph, i as SelectItem, n as Select, o as SelectValue, p as getDistricts, r as SelectContent, s as cn, t as AppShell } from "./AppShell-DuzYQILm.js";
import { t as Skeleton } from "./skeleton-3BxFvER_.js";
import { t as ClientOnly } from "./ClientOnly-DrAnJiVa.js";
import { t as Input } from "./input-CF1QApzy.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DfiB0xZo.js";
import * as React from "react";
import { Suspense, lazy, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Network, Search, X } from "lucide-react";
import { cva } from "class-variance-authority";
import * as SheetPrimitive from "@radix-ui/react-dialog";
//#region src/components/ui/sheet.tsx
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Overlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [/* @__PURE__ */ jsx(SheetOverlay, {}), /* @__PURE__ */ jsxs(SheetPrimitive.Content, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ jsxs(SheetPrimitive.Close, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ jsx(X, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
//#endregion
//#region src/routes/network.tsx?tsr-split=component
var NetworkGraphClient = lazy(() => import("./NetworkGraphClient-kvPcxCYT.js"));
function NetworkPage() {
	const { districtId } = useSelectedDistrict();
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState("all");
	const [minLinks, setMinLinks] = useState("2");
	const [selectedNode, setSelectedNode] = useState(null);
	const [showAutocomplete, setShowAutocomplete] = useState(false);
	const { data: districts = [] } = useQuery({
		queryKey: ["districts"],
		queryFn: getDistricts
	});
	const { data: graph, isLoading, isError, error } = useQuery({
		queryKey: [
			"network",
			query,
			districtId,
			category,
			minLinks
		],
		queryFn: () => getNetworkGraph({
			query,
			districtId: districtId ?? void 0,
			category: category === "all" ? void 0 : category,
			minLinks: Number(minLinks)
		})
	});
	const offenderId = selectedNode?.startsWith("off-") ? selectedNode.slice(4) : null;
	const { data: detail } = useQuery({
		queryKey: ["offender", offenderId],
		queryFn: () => offenderId ? getOffenderDetail(offenderId) : Promise.resolve(null),
		enabled: !!offenderId
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "h-full flex flex-col",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "shrink-0 flex items-center gap-4 px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-md shadow-sm relative z-50",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "relative w-64",
						children: [
							/* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-amber/70" }),
							/* @__PURE__ */ jsx(Input, {
								value: query,
								onChange: (e) => {
									setQuery(e.target.value);
									setShowAutocomplete(true);
								},
								onFocus: () => setShowAutocomplete(true),
								onBlur: () => setTimeout(() => setShowAutocomplete(false), 200),
								placeholder: "Search offender by name…",
								className: "h-9 pl-9 text-xs rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 focus-visible:ring-accent-amber/30 transition-colors shadow-sm"
							}),
							showAutocomplete && graph && /* @__PURE__ */ jsx("div", {
								className: "absolute top-full left-0 mt-1 w-full bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 max-h-64 overflow-y-auto",
								children: graph.nodes.filter((n) => n.type === "accused").length === 0 ? /* @__PURE__ */ jsx("div", {
									className: "p-3 text-xs text-muted-foreground text-center",
									children: "No offenders found"
								}) : /* @__PURE__ */ jsx("ul", {
									className: "py-1",
									children: graph.nodes.filter((n) => n.type === "accused").map((n) => /* @__PURE__ */ jsxs("li", {
										className: "px-3 py-2 text-xs hover:bg-white/5 cursor-pointer text-foreground flex justify-between items-center",
										onClick: () => {
											setQuery(n.label);
											setShowAutocomplete(false);
										},
										children: [/* @__PURE__ */ jsx("span", {
											className: "font-medium",
											children: n.label
										}), /* @__PURE__ */ jsxs("span", {
											className: "text-[10px] text-muted-foreground bg-black/40 px-1.5 py-0.5 rounded",
											children: [n.linkedCaseCount, " cases"]
										})]
									}, n.id))
								})
							})
						]
					}),
					/* @__PURE__ */ jsxs(Select, {
						value: category,
						onValueChange: setCategory,
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							className: "h-9 w-52 text-xs rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 hover:bg-white/[0.02] transition-colors shadow-sm",
							children: /* @__PURE__ */ jsx(SelectValue, {})
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
							value: "all",
							children: "All crime types"
						}), CRIME_CATEGORIES.map((c) => /* @__PURE__ */ jsx(SelectItem, {
							value: c,
							children: c
						}, c))] })]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3 bg-surface/30 px-3 py-1 rounded-xl border border-border/50",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5",
							children: [/* @__PURE__ */ jsx(Network, { className: "w-3 h-3 text-accent-amber/70" }), "Min links"]
						}), /* @__PURE__ */ jsxs(Select, {
							value: minLinks,
							onValueChange: setMinLinks,
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "h-7 w-16 text-xs rounded-lg bg-black/20 border-white/5 hover:border-accent-amber/50 transition-colors",
								children: /* @__PURE__ */ jsx(SelectValue, {})
							}), /* @__PURE__ */ jsx(SelectContent, { children: [
								2,
								3,
								4
							].map((n) => /* @__PURE__ */ jsxs(SelectItem, {
								value: String(n),
								children: [n, "+"]
							}, n)) })]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "ml-auto flex items-center gap-2 text-xs text-muted-foreground bg-black/20 px-4 py-1.5 rounded-xl border border-white/5 shadow-inner",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 font-bold tabular-nums text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]",
								children: graph?.stats.offenderCount ?? 0
							}),
							/* @__PURE__ */ jsx("span", {
								className: "font-medium",
								children: "repeat offenders across"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 font-bold tabular-nums text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]",
								children: graph?.stats.linkedCaseCount ?? 0
							}),
							/* @__PURE__ */ jsx("span", {
								className: "font-medium",
								children: "linked cases"
							}),
							districtId && /* @__PURE__ */ jsx(Badge, {
								variant: "outline",
								className: "text-[10px] border-accent-amber/40 text-accent-amber ml-2 bg-accent-amber/10",
								children: districts.find((d) => d.id === districtId)?.name
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex-1 relative min-h-0 bg-slate-50 dark:bg-[#0b0f14]",
				children: [isError ? /* @__PURE__ */ jsx("div", {
					className: "absolute inset-0 flex items-center justify-center p-8 text-center",
					children: /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-sm font-semibold text-foreground/80 mb-2",
						children: "Network data could not be loaded"
					}), /* @__PURE__ */ jsx("div", {
						className: "text-xs text-muted-foreground max-w-sm leading-relaxed",
						children: error instanceof Error ? error.message : "Please refresh and try again."
					})] })
				}) : /* @__PURE__ */ jsx(ClientOnly, {
					fallback: /* @__PURE__ */ jsx(Skeleton, { className: "w-full h-full" }),
					children: /* @__PURE__ */ jsx(Suspense, {
						fallback: /* @__PURE__ */ jsx(Skeleton, { className: "w-full h-full" }),
						children: graph && !isLoading ? /* @__PURE__ */ jsx(NetworkGraphClient, {
							graph,
							onNodeClick: setSelectedNode
						}) : /* @__PURE__ */ jsx(Skeleton, { className: "w-full h-full" })
					})
				}), /* @__PURE__ */ jsxs("div", {
					className: "absolute top-3 right-3 bg-surface/90 backdrop-blur border border-border rounded-xl p-3 text-[11px] space-y-1.5 z-10",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-1",
							children: "Legend"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#EF4444]" }), " Accused"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-[#3B82F6]" }), " Victim"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 bg-[#94A3B8]" }), " Police Station"]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx(Sheet, {
				open: !!selectedNode,
				onOpenChange: (o) => !o && setSelectedNode(null),
				children: /* @__PURE__ */ jsxs(SheetContent, {
					className: "w-[480px] sm:max-w-[480px] bg-surface/90 backdrop-blur-2xl border-l border-border shadow-2xl overflow-y-auto",
					children: [/* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, {
						className: "text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70",
						children: detail ? detail.name : selectedNode?.startsWith("stn_") ? "Police Station" : selectedNode?.startsWith("vic_") ? "Victim Details" : "Node Details"
					}) }), offenderId && detail ? /* @__PURE__ */ jsxs("div", {
						className: "mt-4 space-y-4 px-1",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-3 gap-2 text-xs",
								children: [
									/* @__PURE__ */ jsx(Stat, {
										label: "Age",
										value: detail.age
									}),
									/* @__PURE__ */ jsx(Stat, {
										label: "Gender",
										value: detail.gender
									}),
									/* @__PURE__ */ jsx(Stat, {
										label: "Stations",
										value: detail.stationsInvolved
									}),
									/* @__PURE__ */ jsx(Stat, {
										label: "Linked Cases",
										value: detail.linkedCases.length,
										highlight: true
									}),
									/* @__PURE__ */ jsx(Stat, {
										label: detail.districtIds && detail.districtIds.length > 1 ? "Districts" : "District",
										value: detail.districtIds && detail.districtIds.length > 0 ? detail.districtIds.map((id) => districts.find((d) => d.id === id)?.name).filter(Boolean).join(", ") : districts.find((d) => d.id === detail.districtId)?.name ?? "—",
										span: 2
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "p-4 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "text-[10px] uppercase tracking-wider text-accent-amber/90 font-semibold mb-1.5 flex items-center gap-1.5",
									children: [/* @__PURE__ */ jsx(Network, { className: "w-3 h-3" }), "MO Signature"]
								}), /* @__PURE__ */ jsx("div", {
									className: "text-sm font-mono text-accent-amber drop-shadow-[0_0_4px_rgba(245,158,11,0.5)] leading-relaxed",
									children: detail.moSignature
								})]
							}),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
								className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3 pl-1",
								children: "Linked Cases"
							}), /* @__PURE__ */ jsx("div", {
								className: "rounded-2xl border border-white/5 bg-black/20 p-2 overflow-hidden shadow-inner",
								children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-8 text-[10px]",
										children: "Case"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-8 text-[10px]",
										children: "Type"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-8 text-[10px]",
										children: "Date"
									}),
									/* @__PURE__ */ jsx(TableHead, {
										className: "h-8 text-[10px]",
										children: "Status"
									})
								] }) }), /* @__PURE__ */ jsx(TableBody, { children: detail.linkedCases.map((c) => /* @__PURE__ */ jsxs(TableRow, {
									className: "border-white/5 hover:bg-white/5 transition-colors",
									children: [
										/* @__PURE__ */ jsx(TableCell, {
											className: "font-mono text-[11px] py-2",
											children: c.id
										}),
										/* @__PURE__ */ jsx(TableCell, {
											className: "text-[11px] py-2",
											children: /* @__PURE__ */ jsxs("span", {
												className: "inline-flex items-center gap-1.5",
												children: [/* @__PURE__ */ jsx("span", {
													className: "w-1.5 h-1.5 rounded-full shadow-sm",
													style: { background: CATEGORY_COLORS[c.category] }
												}), /* @__PURE__ */ jsx("span", {
													className: "font-medium text-white/80",
													children: c.subType
												})]
											})
										}),
										/* @__PURE__ */ jsx(TableCell, {
											className: "text-[11px] py-2 font-mono text-muted-foreground",
											children: new Date(c.date).toISOString().slice(0, 10)
										}),
										/* @__PURE__ */ jsx(TableCell, {
											className: "text-[11px] py-2",
											children: /* @__PURE__ */ jsx("span", {
												className: "font-mono font-semibold",
												style: { color: STATUS_COLORS[c.status] },
												children: c.status
											})
										})
									]
								}, c.id)) })] })
							})] })
						]
					}) : /* @__PURE__ */ jsx("div", {
						className: "mt-4 p-4 rounded-xl border border-border bg-surface/50 text-sm text-muted-foreground px-4 shadow-inner text-center",
						children: selectedNode?.startsWith("vic_") ? /* @__PURE__ */ jsxs("p", { children: [
							"This is a ",
							/* @__PURE__ */ jsx("strong", { children: "Victim" }),
							" node.",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("br", {}),
							"Click on an accused (red) node to view their full criminal profile and MO signature."
						] }) : selectedNode?.startsWith("stn_") ? /* @__PURE__ */ jsxs("p", { children: [
							"This is a ",
							/* @__PURE__ */ jsx("strong", { children: "Police Station" }),
							" node.",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("br", {}),
							"Click on an accused (red) node to view their full criminal profile and MO signature."
						] }) : /* @__PURE__ */ jsx("p", { children: "Click on an accused (red) node to view their full criminal profile and MO signature." })
					})]
				})
			})
		]
	});
}
function Stat({ label, value, highlight, span }) {
	return /* @__PURE__ */ jsxs("div", {
		className: `rounded-2xl border border-white/5 bg-black/20 p-3 shadow-inner ${span === 2 ? "col-span-2" : ""}`,
		children: [/* @__PURE__ */ jsx("div", {
			className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold",
			children: label
		}), /* @__PURE__ */ jsx("div", {
			className: `mt-1 tabular-nums tracking-tight ${highlight ? "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "text-lg font-medium text-foreground"}`,
			children: value
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(NetworkPage, {}) });
//#endregion
export { SplitComponent as component };
