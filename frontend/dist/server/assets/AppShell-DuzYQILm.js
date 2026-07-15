import { n as useSelectedDistrict } from "./selected-district-Bs_Yq7D_.js";
import * as React from "react";
import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Activity, BookOpen, Check, ChevronDown, ChevronUp, FileText, Globe, IdCard, Map, MapPin, Moon, Network, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
//#region src/services/api.ts
var API_BASE = "https://crimevistaapi-50043992661.development.catalystappsail.in/api";
async function getDistricts() {
	const res = await fetch(`${API_BASE}/districts`);
	if (!res.ok) throw new Error("Failed to fetch districts");
	return res.json();
}
async function getCases(districtId, filters = {}) {
	const params = new URLSearchParams();
	if (filters.hourRange) {
		params.append("hour_from", String(filters.hourRange[0]));
		params.append("hour_to", String(filters.hourRange[1]));
	}
	if (filters.dateWindowDays != null) params.append("dateWindowDays", String(filters.dateWindowDays));
	const res = await fetch(`${API_BASE}/districts/${districtId ?? "all"}/cases?${params.toString()}`);
	if (!res.ok) throw new Error("Failed to fetch cases");
	return res.json();
}
async function getHotspots(districtId) {
	const res = await fetch(`${API_BASE}/districts/${districtId ?? "all"}/hotspots`);
	if (!res.ok) throw new Error("Failed to fetch hotspots");
	return res.json();
}
async function getAlerts() {
	const res = await fetch(`${API_BASE}/alerts`);
	if (!res.ok) throw new Error("Failed to fetch alerts");
	return res.json();
}
async function getNetworkGraph(filters = {}) {
	const params = new URLSearchParams();
	if (filters.districtId) params.append("district_id", filters.districtId);
	if (filters.minLinks) params.append("min_cases", String(filters.minLinks));
	const res = await fetch(`${API_BASE}/network/graph?${params.toString()}`);
	if (!res.ok) throw new Error("Failed to fetch network graph");
	const data = await res.json();
	let filteredNodes = data.nodes;
	let filteredEdges = data.edges;
	if (filters.query || filters.category) {
		const q = filters.query ? filters.query.toLowerCase().trim() : null;
		const cat = filters.category;
		if (cat) filteredEdges = filteredEdges.filter((e) => e.crimeCategory === cat);
		const matchingAccused = /* @__PURE__ */ new Set();
		if (q) {
			data.nodes.forEach((n) => {
				if (n.type === "accused" && n.label.toLowerCase().includes(q)) matchingAccused.add(n.id);
			});
			filteredEdges = filteredEdges.filter((e) => matchingAccused.has(e.source) || matchingAccused.has(e.target));
		}
		const activeNodeIds = /* @__PURE__ */ new Set();
		filteredEdges.forEach((e) => {
			activeNodeIds.add(e.source);
			activeNodeIds.add(e.target);
		});
		if (q) matchingAccused.forEach((id) => activeNodeIds.add(id));
		filteredNodes = data.nodes.filter((n) => {
			if (activeNodeIds.has(n.id)) return true;
			if (!q && cat && n.type === "station") return true;
			return false;
		});
	}
	return {
		nodes: filteredNodes,
		edges: filteredEdges,
		stats: {
			offenderCount: filteredNodes.filter((n) => n.type === "accused").length,
			linkedCaseCount: filteredNodes.filter((n) => n.type === "victim").length
		}
	};
}
async function getRiskLeaderboard(topN = 5) {
	const res = await fetch(`${API_BASE}/risk/leaderboard`);
	if (!res.ok) throw new Error("Failed to fetch risk leaderboard");
	return (await res.json()).slice(0, topN);
}
async function getRiskScores() {
	const res = await fetch(`${API_BASE}/risk/scores`);
	if (!res.ok) throw new Error("Failed to fetch risk scores");
	return res.json();
}
async function getOffenderDetail(offenderId) {
	const res = await fetch(`${API_BASE}/network/offender/${offenderId}`);
	if (!res.ok) throw new Error("Failed to fetch offender detail");
	return res.json();
}
async function getDistrictInsights() {
	const res = await fetch(`${API_BASE}/districts/insights`);
	if (!res.ok) throw new Error("Failed to fetch district insights");
	return res.json();
}
async function getBriefing(districtId) {
	const params = new URLSearchParams();
	if (districtId) params.append("district_id", districtId);
	const res = await fetch(`${API_BASE}/briefing?${params.toString()}`);
	if (!res.ok) throw new Error("Failed to fetch briefing");
	return res.json();
}
//#endregion
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/ui/select.tsx
var Select = SelectPrimitive.Root;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SelectPrimitive.Trigger, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ jsx(SelectPrimitive.Icon, {
		asChild: true,
		children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.ScrollUpButton, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.ScrollDownButton, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(SelectPrimitive.Content, {
	ref,
	className: cn("relative z-[9999] max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl text-foreground shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin) p-1", position === "popper" && "data-[side=bottom]:translate-y-2 data-[side=left]:-translate-x-2 data-[side=right]:translate-x-2 data-[side=top]:-translate-y-2", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ jsx(SelectScrollUpButton, {}),
		/* @__PURE__ */ jsx(SelectPrimitive.Viewport, {
			className: cn(position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ jsx(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Label, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SelectPrimitive.Item, {
	ref,
	className: cn("relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-9 text-sm outline-none transition-colors focus:bg-accent-amber/10 focus:text-accent-amber data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ jsx("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })]
}));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Separator, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
//#endregion
//#region src/components/layout/AppShell.tsx
var LANGUAGES = [
	{
		code: "kn",
		name: "Kannada (ಕನ್ನಡ)"
	},
	{
		code: "en",
		name: "English (English)"
	},
	{
		code: "hi",
		name: "Hindi (हिन्दी)"
	},
	{
		code: "mwr",
		name: "Marwari (मारवाड़ी)"
	},
	{
		code: "te",
		name: "Telugu (తెలుగు)"
	},
	{
		code: "ta",
		name: "Tamil (தமிழ்)"
	},
	{
		code: "mr",
		name: "Marathi (मराठी)"
	},
	{
		code: "ur",
		name: "Urdu (اردو)"
	}
];
var NAV = [
	{
		to: "/",
		label: "Crime Map",
		icon: Map
	},
	{
		to: "/network",
		label: "Network Analysis",
		icon: Network
	},
	{
		to: "/risk",
		label: "Predictive Risk",
		icon: Activity
	},
	{
		to: "/districts",
		label: "District Cards",
		icon: IdCard
	},
	{
		to: "/briefing",
		label: "Intelligence Briefing",
		icon: BookOpen
	},
	{
		to: "/reports",
		label: "PDF Reports",
		icon: FileText
	}
];
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { districtId, setDistrictId } = useSelectedDistrict();
	const { data: districts = [] } = useQuery({
		queryKey: ["districts"],
		queryFn: getDistricts
	});
	const [lang, setLang] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("preferred_lang");
			if (saved) return saved;
			const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
			if (match) return match[1];
		}
		return "en";
	});
	const [isCollapsed, setIsCollapsed] = useState(() => {
		if (typeof window !== "undefined") return localStorage.getItem("sidebar_collapsed") === "true";
		return false;
	});
	const [theme, setTheme] = useState(() => {
		if (typeof window !== "undefined") return localStorage.getItem("theme") || "dark";
		return "dark";
	});
	const toggleTheme = () => {
		const nextTheme = theme === "dark" ? "light" : "dark";
		setTheme(nextTheme);
		window.dispatchEvent(new CustomEvent("theme-change", { detail: nextTheme }));
	};
	useEffect(() => {
		const root = window.document.documentElement;
		root.lang = lang === "en" ? "en" : lang;
		if (theme === "light") {
			root.classList.remove("dark");
			root.classList.add("light");
		} else {
			root.classList.remove("light");
			root.classList.add("dark");
		}
		localStorage.setItem("theme", theme);
	}, [theme]);
	useEffect(() => {
		localStorage.setItem("sidebar_collapsed", String(isCollapsed));
	}, [isCollapsed]);
	const applyTranslateCookie = (newLang) => {
		const expire = "Thu, 01 Jan 1970 00:00:00 UTC";
		const host = window.location.hostname;
		if (newLang === "en") {
			document.cookie = `googtrans=; expires=${expire}; path=/;`;
			document.cookie = `googtrans=; expires=${expire}; domain=${host}; path=/;`;
			return;
		}
		document.cookie = `googtrans=/en/${newLang}; path=/;`;
		document.cookie = `googtrans=/en/${newLang}; domain=${host}; path=/;`;
	};
	const removeGoogleTranslateArtifacts = () => {
		document.body.classList.remove("translated-ltr", "translated-rtl");
		document.documentElement.classList.remove("translated-ltr", "translated-rtl");
		document.querySelectorAll(".goog-te-banner-frame, iframe.skiptranslate").forEach((node) => {
			node.remove();
		});
		document.querySelectorAll("font[style*=\"vertical-align: inherit\"]").forEach((node) => {
			const parent = node.parentNode;
			if (!parent) return;
			while (node.firstChild) parent.insertBefore(node.firstChild, node);
			parent.removeChild(node);
		});
	};
	useEffect(() => {
		const saved = localStorage.getItem("preferred_lang");
		if (saved) {
			setLang(saved);
			applyTranslateCookie(saved);
			if (saved === "en") removeGoogleTranslateArtifacts();
		}
	}, []);
	const handleLanguageChange = (newLang) => {
		setLang(newLang);
		localStorage.setItem("preferred_lang", newLang);
		applyTranslateCookie(newLang);
		if (newLang === "en") removeGoogleTranslateArtifacts();
		window.location.reload();
	};
	useEffect(() => {
		if (lang === "en") {
			removeGoogleTranslateArtifacts();
			return;
		}
		if (document.getElementById("google-translate-script")) return;
		window.googleTranslateElementInit = () => {
			new window.google.translate.TranslateElement({
				pageLanguage: "en",
				layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
			}, "google_translate_element");
		};
		const script = document.createElement("script");
		script.id = "google-translate-script";
		script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
		script.async = true;
		document.body.appendChild(script);
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-screen w-full bg-background text-foreground overflow-hidden",
		children: [/* @__PURE__ */ jsxs("aside", {
			className: cn("shrink-0 border-r border-border bg-surface flex flex-col transition-all duration-300 relative", isCollapsed ? "w-[68px]" : "w-56"),
			children: [
				/* @__PURE__ */ jsx("button", {
					onClick: () => setIsCollapsed(!isCollapsed),
					className: "absolute -right-3 top-4 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent-amber z-50 transition-colors",
					children: isCollapsed ? /* @__PURE__ */ jsx(PanelLeftOpen, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(PanelLeftClose, { className: "w-3 h-3" })
				}),
				/* @__PURE__ */ jsx("div", {
					className: "h-16 flex items-center px-4 border-b border-border overflow-hidden select-none",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3 cursor-pointer group",
						children: [/* @__PURE__ */ jsx("div", {
							className: "w-8 h-8 shrink-0 rounded-lg bg-white border border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all p-1",
							children: /* @__PURE__ */ jsx("img", {
								src: "/ksp_logo.png",
								alt: "KSP Logo",
								className: "w-full h-full object-contain"
							})
						}), !isCollapsed && /* @__PURE__ */ jsx("div", {
							className: "leading-none shrink-0 whitespace-nowrap",
							children: /* @__PURE__ */ jsxs("div", {
								className: "text-[15px] font-bold tracking-tight text-foreground",
								children: [
									"CrimeVista",
									" ",
									/* @__PURE__ */ jsx("span", {
										className: "text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-amber-200",
										children: "AI"
									})
								]
							})
						})]
					})
				}),
				/* @__PURE__ */ jsx("nav", {
					className: "p-2 space-y-0.5 mt-2",
					children: NAV.map((item) => {
						const active = pathname === item.to;
						const Icon = item.icon;
						return /* @__PURE__ */ jsxs(Link, {
							to: item.to,
							title: isCollapsed ? item.label : void 0,
							className: cn("flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors overflow-hidden whitespace-nowrap", active ? "bg-accent-amber/10 text-accent-amber border-l-2 border-accent-amber pl-2" : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-l-2 border-transparent pl-2", isCollapsed ? "justify-center border-l-0 pl-2.5" : ""),
							children: [/* @__PURE__ */ jsx(Icon, { className: cn("w-4 h-4 shrink-0", isCollapsed && active ? "text-accent-amber" : "") }), !isCollapsed && /* @__PURE__ */ jsx("span", {
								className: "truncate",
								children: item.label
							})]
						}, item.to);
					})
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex-1 flex flex-col min-w-0",
			children: [/* @__PURE__ */ jsxs("header", {
				className: "h-14 shrink-0 border-b border-border bg-surface flex items-center justify-between px-4 gap-4",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex items-center gap-3",
					children: /* @__PURE__ */ jsxs("h1", {
						className: "text-sm font-semibold tracking-tight uppercase",
						children: ["CrimeVista ", /* @__PURE__ */ jsx("span", {
							className: "text-accent-amber",
							children: "AI"
						})]
					})
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ jsx("div", {
							id: "google_translate_element",
							className: "hidden"
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: toggleTheme,
							className: "p-2 shrink-0 rounded-xl bg-surface/50 border border-border hover:border-accent-amber/50 hover:bg-white/[0.02] text-muted-foreground hover:text-foreground transition-colors shadow-sm cursor-pointer",
							title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
							children: theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "w-4 h-4 text-accent-amber" }) : /* @__PURE__ */ jsx(Moon, { className: "w-4 h-4 text-accent-amber" })
						}),
						/* @__PURE__ */ jsxs(Select, {
							value: lang,
							onValueChange: handleLanguageChange,
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "w-[200px] shrink-0 h-9 rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 hover:bg-white/[0.02] transition-colors notranslate shadow-sm",
								children: /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx(Globe, { className: "w-3.5 h-3.5 text-muted-foreground" }), /* @__PURE__ */ jsx(SelectValue, { placeholder: "Language" })]
								})
							}), /* @__PURE__ */ jsx(SelectContent, {
								className: "notranslate",
								children: LANGUAGES.map((l) => /* @__PURE__ */ jsx(SelectItem, {
									value: l.code,
									children: l.name
								}, l.code))
							})]
						}),
						/* @__PURE__ */ jsx("span", {
							className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-2",
							children: "District"
						}),
						/* @__PURE__ */ jsxs(Select, {
							value: districtId ?? "all",
							onValueChange: (v) => setDistrictId(v === "all" ? null : v),
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "w-[220px] h-9 rounded-xl bg-surface/50 border-border hover:border-accent-amber/50 hover:bg-white/[0.02] transition-colors shadow-sm",
								children: /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx(MapPin, { className: "w-3.5 h-3.5 text-accent-amber/70" }), /* @__PURE__ */ jsxs(SelectValue, {
										placeholder: "All Karnataka",
										children: [/* @__PURE__ */ jsx("span", {
											className: !districtId || districtId === "all" ? "" : "hidden",
											children: "All Karnataka"
										}), districts.map((d) => /* @__PURE__ */ jsx("span", {
											className: districtId === d.id ? "" : "hidden",
											children: d.name
										}, d.id))]
									})]
								})
							}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
								value: "all",
								children: "All Karnataka"
							}), districts.map((d) => /* @__PURE__ */ jsx(SelectItem, {
								value: d.id,
								children: d.name
							}, d.id))] })]
						})
					]
				})]
			}), /* @__PURE__ */ jsx("main", {
				className: "flex-1 min-h-0 overflow-hidden",
				children
			})]
		})]
	});
}
//#endregion
export { getRiskLeaderboard as _, SelectTrigger as a, API_BASE as c, getCases as d, getDistrictInsights as f, getOffenderDetail as g, getNetworkGraph as h, SelectItem as i, getAlerts as l, getHotspots as m, Select as n, SelectValue as o, getDistricts as p, SelectContent as r, cn as s, AppShell as t, getBriefing as u, getRiskScores as v };
