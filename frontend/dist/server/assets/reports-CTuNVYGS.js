import { n as useSelectedDistrict } from "./selected-district-Bs_Yq7D_.js";
import { a as SelectTrigger, c as API_BASE, h as getNetworkGraph, i as SelectItem, n as Select, o as SelectValue, r as SelectContent, t as AppShell } from "./AppShell-DuzYQILm.js";
import { t as Button } from "./button-jxJOI0wY.js";
import { t as Input } from "./input-CF1QApzy.js";
import { useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2 } from "lucide-react";
//#region src/routes/reports.tsx?tsr-split=component
var REPORT_TYPES = [
	{
		id: "Monthly Crime Summary",
		desc: "A comprehensive overview of crime trends, volume, and clearance statistics for the selected period."
	},
	{
		id: "Hotspot Analysis",
		desc: "Geographic concentration of incidents, highlighting priority zones and exact micro-hotspots requiring immediate deployment."
	},
	{
		id: "Network Intelligence",
		desc: "Detailed breakdown of criminal syndicates, repeat offenders, and inter-district links to aid in dismantling organized networks."
	},
	{
		id: "Predictive Risk Forecast",
		desc: "AI-driven forecast of potential incident spikes, vulnerable times of day, and high-risk sub-types for preemptive action."
	},
	{
		id: "Suspect/Offender Profile",
		desc: "An official subject profile dossier including Age, Gender, MO signature, active districts, and all linked FIRs."
	}
];
function ReportsPage() {
	const { districtId } = useSelectedDistrict();
	const [selectedType, setSelectedType] = useState(REPORT_TYPES[0].id);
	const [isDownloading, setIsDownloading] = useState(false);
	const [offenderQuery, setOffenderQuery] = useState("");
	const [showAutocomplete, setShowAutocomplete] = useState(false);
	const { data: graph } = useQuery({
		queryKey: [
			"network",
			offenderQuery,
			districtId,
			"all",
			"2"
		],
		queryFn: () => getNetworkGraph({
			query: offenderQuery,
			districtId: districtId ?? void 0,
			category: void 0,
			minLinks: 2
		}),
		enabled: selectedType === "Suspect/Offender Profile"
	});
	const handleDownload = async () => {
		if (selectedType === "Suspect/Offender Profile" && !offenderQuery) {
			alert("Please enter a suspect name.");
			return;
		}
		setIsDownloading(true);
		try {
			let url = "";
			if (selectedType === "Suspect/Offender Profile") url = `${API_BASE}/reports/offender/${encodeURIComponent(offenderQuery)}`;
			else {
				const params = new URLSearchParams({ report_type: selectedType });
				if (districtId) params.append("district_id", districtId);
				url = `${API_BASE}/reports/generate?${params.toString()}`;
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
	return /* @__PURE__ */ jsx("div", {
		className: "h-full overflow-y-auto",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-3xl mx-auto p-8",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex items-center justify-between mb-8 pb-6 border-b border-border",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "w-10 h-10 rounded-xl bg-accent-amber/10 border border-accent-amber/40 flex items-center justify-center",
						children: /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-accent-amber" })
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground",
						children: "Karnataka State Police · Document Generator"
					}), /* @__PURE__ */ jsx("h1", {
						className: "text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70",
						children: "PDF Reports Generator"
					})] })]
				})
			}), /* @__PURE__ */ jsxs("article", {
				className: "space-y-8 rounded-2xl border border-white/5 bg-black/20 p-8 shadow-inner",
				children: [/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("div", {
					className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-5",
					children: "Report Configuration"
				}), /* @__PURE__ */ jsx("div", {
					className: "space-y-4",
					children: /* @__PURE__ */ jsxs("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ jsx("label", {
								className: "text-sm font-semibold text-foreground/90",
								children: "Select Report Type"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-6 items-start",
								children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Select, {
									value: selectedType,
									onValueChange: setSelectedType,
									children: [/* @__PURE__ */ jsx(SelectTrigger, {
										className: "h-11 bg-black/40 border-white/10 text-foreground rounded-xl shadow-sm hover:border-accent-amber/50 transition-colors",
										children: /* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-accent-amber" }), /* @__PURE__ */ jsx(SelectValue, {})]
										})
									}), /* @__PURE__ */ jsx(SelectContent, { children: REPORT_TYPES.map((type) => /* @__PURE__ */ jsx(SelectItem, {
										value: type.id,
										children: type.id
									}, type.id)) })]
								}) }), /* @__PURE__ */ jsxs("div", {
									className: "p-4 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-muted-foreground leading-relaxed shadow-inner",
									children: [/* @__PURE__ */ jsx("span", {
										className: "font-semibold text-accent-amber block mb-1",
										children: "Overview"
									}), REPORT_TYPES.find((t) => t.id === selectedType)?.desc]
								})]
							}),
							selectedType === "Suspect/Offender Profile" && /* @__PURE__ */ jsxs("div", {
								className: "pt-4 border-t border-white/5 mt-4",
								children: [
									/* @__PURE__ */ jsx("label", {
										className: "text-sm font-semibold text-foreground/90 block mb-2",
										children: "Target Suspect Name"
									}),
									/* @__PURE__ */ jsxs("div", {
										className: "relative",
										children: [/* @__PURE__ */ jsx(Input, {
											placeholder: "e.g. Janaki Srinivas",
											value: offenderQuery,
											onChange: (e) => {
												setOffenderQuery(e.target.value);
												setShowAutocomplete(true);
											},
											onFocus: () => setShowAutocomplete(true),
											onBlur: () => setTimeout(() => setShowAutocomplete(false), 200),
											className: "bg-black/40 border-white/10 text-foreground"
										}), showAutocomplete && graph && /* @__PURE__ */ jsx("div", {
											className: "absolute top-full left-0 mt-1 w-full bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 max-h-64 overflow-y-auto",
											children: graph.nodes.filter((n) => n.type === "accused").length === 0 ? /* @__PURE__ */ jsx("div", {
												className: "p-3 text-xs text-muted-foreground text-center",
												children: "No offenders found"
											}) : /* @__PURE__ */ jsx("ul", {
												className: "py-1",
												children: graph.nodes.filter((n) => n.type === "accused").map((n) => /* @__PURE__ */ jsxs("li", {
													className: "px-3 py-2 text-xs hover:bg-white/5 cursor-pointer text-foreground flex justify-between items-center",
													onClick: () => {
														setOffenderQuery(n.label);
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
										})]
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-muted-foreground mt-2",
										children: "Enter the name of the repeat offender to generate a complete intelligence dossier."
									})
								]
							})
						]
					})
				})] }), /* @__PURE__ */ jsx("section", {
					className: "p-6 rounded-2xl border border-white/5 bg-black/40 shadow-inner",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h3", {
							className: "text-sm font-medium text-foreground mb-1",
							children: ["Generate ", selectedType]
						}), /* @__PURE__ */ jsx("p", {
							className: "text-xs text-muted-foreground max-w-sm leading-relaxed",
							children: selectedType === "Suspect/Offender Profile" ? "The report will be generated as an official subject profile dossier including MO signature and linked cases." : /* @__PURE__ */ jsxs("span", { children: [
								"The report will be generated for",
								" ",
								/* @__PURE__ */ jsx("strong", {
									className: "text-foreground",
									children: districtId ? "the selected district" : "All Karnataka"
								}),
								". It includes key metrics, summaries, and executive recommendations."
							] })
						})] }), /* @__PURE__ */ jsx(Button, {
							className: "shrink-0 bg-gradient-to-r from-accent-amber to-amber-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-300 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] px-6",
							onClick: handleDownload,
							disabled: isDownloading,
							children: isDownloading ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Generating..."] }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-2" }), "Download PDF"] })
						})]
					})
				})]
			})]
		})
	});
}
var SplitComponent = () => /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(ReportsPage, {}) });
//#endregion
export { SplitComponent as component };
