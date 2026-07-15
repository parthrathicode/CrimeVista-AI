import { n as CATEGORY_COLORS } from "./badge-C0L_ZYno.js";
import { useEffect, useRef, useState } from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/network/NetworkGraphClient.tsx
var TYPE_COLOR = {
	accused: "#EF4444",
	victim: "#3B82F6",
	station: "#94A3B8"
};
function NetworkGraphClient({ graph, onNodeClick }) {
	const containerRef = useRef(null);
	const [size, setSize] = useState({
		w: 800,
		h: 600
	});
	const [Comp, setComp] = useState(null);
	useEffect(() => {
		import("react-force-graph-2d").then((m) => setComp(() => m.default));
	}, []);
	useEffect(() => {
		if (!containerRef.current) return;
		const el = containerRef.current;
		const ro = new ResizeObserver(() => {
			setSize({
				w: el.clientWidth,
				h: el.clientHeight
			});
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	const data = {
		nodes: graph.nodes.map((n) => ({ ...n })),
		links: graph.edges.map((e) => ({ ...e }))
	};
	return /* @__PURE__ */ jsx("div", {
		ref: containerRef,
		className: "w-full h-full relative",
		children: data.nodes.length === 0 ? /* @__PURE__ */ jsx("div", {
			className: "absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground/60",
			children: "No matching network nodes found. Please try a different search or adjust your filters."
		}) : Comp && /* @__PURE__ */ jsx(Comp, {
			graphData: data,
			width: size.w,
			height: size.h,
			backgroundColor: "transparent",
			nodeRelSize: 4,
			nodeVal: (n) => Math.max(2, n.linkedCaseCount),
			nodeLabel: (n) => `${n.label}\n${n.type} · ${n.linkedCaseCount} links`,
			linkColor: (l) => `${CATEGORY_COLORS[l.crimeCategory] ?? "#64748B"}66`,
			linkWidth: .8,
			nodeCanvasObject: (node, ctx, globalScale) => {
				const size = Math.max(4, Math.sqrt(node.linkedCaseCount || 1) * 3.5);
				ctx.fillStyle = TYPE_COLOR[node.type];
				ctx.strokeStyle = typeof window !== "undefined" && document.documentElement.classList.contains("dark") ? "#0b0f14" : "#f8fafc";
				ctx.lineWidth = 1.5;
				if (node.type === "station") {
					ctx.fillRect(node.x - size, node.y - size, size * 2, size * 2);
					ctx.strokeRect(node.x - size, node.y - size, size * 2, size * 2);
				} else {
					ctx.beginPath();
					ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
					ctx.fill();
					ctx.stroke();
				}
				if (node.type === "accused" && node.linkedCaseCount >= 3 && globalScale > 1.2) {
					ctx.font = `500 ${10 / globalScale}px Inter`;
					ctx.fillStyle = "#e2e8f0";
					ctx.textAlign = "center";
					ctx.textBaseline = "top";
					ctx.fillText(node.label, node.x, node.y + size + 2);
				}
			},
			nodePointerAreaPaint: (node, color, ctx) => {
				const size = Math.max(6, Math.sqrt(node.linkedCaseCount || 1) * 4);
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
				ctx.fill();
			},
			onNodeClick: (n) => onNodeClick(n.id),
			cooldownTicks: 80
		})
	});
}
//#endregion
export { NetworkGraphClient as default };
