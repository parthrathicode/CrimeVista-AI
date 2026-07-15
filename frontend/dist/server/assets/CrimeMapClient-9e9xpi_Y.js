import { n as CATEGORY_COLORS } from "./badge-C0L_ZYno.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsx } from "react/jsx-runtime";
//#region src/components/map/CrimeMapClient.tsx
function CrimeMapClient({ districts, cases, hotspots, focusDistrictId, onDistrictClick }) {
	const containerRef = useRef(null);
	const mapRef = useRef(null);
	const layersRef = useRef(null);
	const LRef = useRef(null);
	const tilesRef = useRef(null);
	const [mapReady, setMapReady] = useState(false);
	const districtCaseCounts = useMemo(() => {
		const counts = /* @__PURE__ */ new Map();
		cases.forEach((c) => counts.set(c.districtId, (counts.get(c.districtId) ?? 0) + 1));
		return counts;
	}, [cases]);
	useEffect(() => {
		let cancelled = false;
		let resizeObserver = null;
		(async () => {
			const L = (await import("leaflet")).default;
			if (cancelled || !containerRef.current || mapRef.current) return;
			LRef.current = L;
			const KARNATAKA_BOUNDS = L.latLngBounds([11.5, 74], [18.5, 78.5]);
			const map = L.map(containerRef.current, {
				center: [15.3, 75.7],
				zoom: 7,
				zoomSnap: .25,
				minZoom: 6,
				maxZoom: 14,
				zoomControl: true,
				attributionControl: true,
				maxBounds: KARNATAKA_BOUNDS,
				maxBoundsViscosity: .9
			});
			map.setView([15.3, 75.7], 7, { animate: false });
			const tileUrl = document.documentElement.classList.contains("light") ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
			const tiles = L.tileLayer(tileUrl, {
				attribution: "© OpenStreetMap © CARTO",
				subdomains: "abcd",
				maxZoom: 19
			}).addTo(map);
			tilesRef.current = tiles;
			mapRef.current = map;
			layersRef.current = L.layerGroup().addTo(map);
			resizeObserver = new ResizeObserver(() => map.invalidateSize());
			resizeObserver.observe(containerRef.current);
			requestAnimationFrame(() => {
				map.invalidateSize();
				map.setView([15.3, 75.7], 7, { animate: false });
			});
			window.setTimeout(() => {
				map.invalidateSize();
				map.setView([15.3, 75.7], 7, { animate: false });
			}, 200);
			setMapReady(true);
		})();
		return () => {
			cancelled = true;
			setMapReady(false);
			resizeObserver?.disconnect();
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
		};
	}, []);
	useEffect(() => {
		const handleThemeChange = (e) => {
			const nextTheme = e.detail;
			if (tilesRef.current) {
				const nextUrl = nextTheme === "light" ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
				tilesRef.current.setUrl(nextUrl);
			}
		};
		window.addEventListener("theme-change", handleThemeChange);
		return () => {
			window.removeEventListener("theme-change", handleThemeChange);
		};
	}, []);
	useEffect(() => {
		const L = LRef.current;
		const map = mapRef.current;
		const layers = layersRef.current;
		if (!mapReady || !L || !map || !layers) return;
		layers.clearLayers();
		map.invalidateSize();
		if (!focusDistrictId) {
			const maxCases = Math.max(...districts.map((d) => districtCaseCounts.get(d.id) ?? d.totalCases), 1);
			districts.forEach((d) => {
				const count = districtCaseCounts.get(d.id) ?? d.totalCases;
				const intensity = count / maxCases;
				const radius = 12 + intensity * 22;
				const color = `rgba(245, 158, 11, ${.35 + intensity * .55})`;
				L.circleMarker([d.lat, d.lng], {
					radius,
					fillColor: color,
					color: "#F59E0B",
					weight: 1.5,
					fillOpacity: .6
				}).bindTooltip(`<div style="font-family:Inter;font-size:11px">
              <div style="font-weight:600;color:#F59E0B">${d.name}</div>
              <div style="color:#cbd5e1">${count} cases</div>
              <div style="color:#94a3b8;font-size:10px;margin-top:2px">Click to drill down</div>
             </div>`, { direction: "top" }).on("click", () => onDistrictClick(d.id)).addTo(layers);
			});
			map.flyTo([15.3, 75.7], 7, { duration: .8 });
		} else {
			const d = districts.find((x) => x.id === focusDistrictId);
			if (!d) return;
			cases.forEach((c) => {
				const color = CATEGORY_COLORS[c.category];
				L.circleMarker([c.lat, c.lng], {
					radius: 4 + (c.gravity === "Heinous" ? 3 : 0),
					fillColor: color,
					color,
					weight: .5,
					fillOpacity: .55
				}).bindTooltip(`<div style="font-family:Inter;font-size:11px">
              <div style="font-weight:600;color:${color}">${c.subType}</div>
              <div style="color:#cbd5e1">${c.category}</div>
              <div style="color:#94a3b8;font-size:10px">Hour: ${String(c.hour).padStart(2, "0")}:00 · ${c.status}</div>
             </div>`).addTo(layers);
			});
			hotspots.forEach((h) => {
				const icon = L.divIcon({
					className: "",
					html: `<div class="hotspot-pulse"></div>`,
					iconSize: [14, 14],
					iconAnchor: [7, 7]
				});
				L.marker([h.lat, h.lng], { icon }).bindPopup(`<div style="font-family:Inter;font-size:11px;min-width:160px">
              <div style="font-weight:600;color:#F59E0B;margin-bottom:2px">Hotspot Cluster</div>
              <div style="color:#e2e8f0">${h.caseCount} cases</div>
              <div style="color:#94a3b8;margin-top:2px">Dominant: ${h.dominantCrime}</div>
             </div>`).addTo(layers);
			});
			map.flyTo([d.lat, d.lng], 11, { duration: .8 });
		}
	}, [
		districts,
		cases,
		hotspots,
		districtCaseCounts,
		focusDistrictId,
		onDistrictClick,
		mapReady
	]);
	return /* @__PURE__ */ jsx("div", {
		ref: containerRef,
		className: "w-full h-full"
	});
}
//#endregion
export { CrimeMapClient as default };
