import { useEffect, useMemo, useRef, useState } from "react";
import type { CaseRecord, District, HotspotCluster } from "@/types";
import { CATEGORY_COLORS } from "@/data/crimes";

interface Props {
  districts: District[];
  cases: CaseRecord[];
  hotspots: HotspotCluster[];
  focusDistrictId: string | null;
  onDistrictClick: (id: string) => void;
}

export default function CrimeMapClient({
  districts,
  cases,
  hotspots,
  focusDistrictId,
  onDistrictClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const districtCaseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    cases.forEach((c) => counts.set(c.districtId, (counts.get(c.districtId) ?? 0) + 1));
    return counts;
  }, [cases]);

  // init map once
  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const KARNATAKA_BOUNDS = L.latLngBounds([11.5, 74.0], [18.5, 78.5]);
      const map = L.map(containerRef.current, {
        center: [15.3, 75.7],
        zoom: 7,
        zoomSnap: 0.25,
        minZoom: 6,
        maxZoom: 14,
        zoomControl: true,
        attributionControl: true,
        maxBounds: KARNATAKA_BOUNDS,
        maxBoundsViscosity: 0.9,
      });
      map.setView([15.3, 75.7], 7, { animate: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);
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

  // update layers when data / focus changes
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!mapReady || !L || !map || !layers) return;

    layers.clearLayers();
    map.invalidateSize();

    if (!focusDistrictId) {
      // district-level view: bubbles sized by total cases
      const maxCases = Math.max(
        ...districts.map((d) => districtCaseCounts.get(d.id) ?? d.totalCases),
        1,
      );
      districts.forEach((d) => {
        const count = districtCaseCounts.get(d.id) ?? d.totalCases;
        const intensity = count / maxCases;
        const radius = 12 + intensity * 22;
        const color = `rgba(245, 158, 11, ${0.35 + intensity * 0.55})`;
        const marker = L.circleMarker([d.lat, d.lng], {
          radius,
          fillColor: color,
          color: "#F59E0B",
          weight: 1.5,
          fillOpacity: 0.6,
        })
          .bindTooltip(
            `<div style="font-family:Inter;font-size:11px">
              <div style="font-weight:600;color:#F59E0B">${d.name}</div>
              <div style="color:#cbd5e1">${count} cases</div>
              <div style="color:#94a3b8;font-size:10px;margin-top:2px">Click to drill down</div>
             </div>`,
            { direction: "top" },
          )
          .on("click", () => onDistrictClick(d.id));
        marker.addTo(layers);
      });
      map.flyTo([15.3, 75.7], 7, { duration: 0.8 });
    } else {
      const d = districts.find((x) => x.id === focusDistrictId);
      if (!d) return;

      // weighted circle markers as heatmap substitute
      cases.forEach((c) => {
        const color = CATEGORY_COLORS[c.category];
        L.circleMarker([c.lat, c.lng], {
          radius: 4 + (c.gravity === "Heinous" ? 3 : 0),
          fillColor: color,
          color: color,
          weight: 0.5,
          fillOpacity: 0.55,
        })
          .bindTooltip(
            `<div style="font-family:Inter;font-size:11px">
              <div style="font-weight:600;color:${color}">${c.subType}</div>
              <div style="color:#cbd5e1">${c.category}</div>
              <div style="color:#94a3b8;font-size:10px">Hour: ${String(c.hour).padStart(2, "0")}:00 · ${c.status}</div>
             </div>`,
          )
          .addTo(layers);
      });

      // pulsing hotspot markers
      hotspots.forEach((h) => {
        const icon = L.divIcon({
          className: "",
          html: `<div class="hotspot-pulse"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([h.lat, h.lng], { icon })
          .bindPopup(
            `<div style="font-family:Inter;font-size:11px;min-width:160px">
              <div style="font-weight:600;color:#F59E0B;margin-bottom:2px">Hotspot Cluster</div>
              <div style="color:#e2e8f0">${h.caseCount} cases</div>
              <div style="color:#94a3b8;margin-top:2px">Dominant: ${h.dominantCrime}</div>
             </div>`,
          )
          .addTo(layers);
      });

      map.flyTo([d.lat, d.lng], 11, { duration: 0.8 });
    }
  }, [districts, cases, hotspots, districtCaseCounts, focusDistrictId, onDistrictClick, mapReady]);

  return <div ref={containerRef} className="w-full h-full" />;
}
