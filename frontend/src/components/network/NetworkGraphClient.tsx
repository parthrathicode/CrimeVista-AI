import { useEffect, useRef, useState } from "react";
import type { NetworkGraph } from "@/services/api";
import { CATEGORY_COLORS } from "@/data/crimes";

interface Props {
  graph: NetworkGraph;
  onNodeClick: (nodeId: string) => void;
}

const TYPE_COLOR = {
  accused: "#EF4444",
  victim: "#3B82F6",
  station: "#94A3B8",
} as const;

export default function NetworkGraphClient({ graph, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [Comp, setComp] = useState<any>(null);

  useEffect(() => {
    import("react-force-graph-2d").then((m) => setComp(() => m.default));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // clone data because ForceGraph mutates
  const data = {
    nodes: graph.nodes.map((n) => ({ ...n })),
    links: graph.edges.map((e) => ({ ...e })),
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {data.nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground/60">
          No matching network nodes found. Please try a different search or adjust your filters.
        </div>
      ) : (
        Comp && (
          <Comp
            graphData={data}
            width={size.w}
            height={size.h}
            backgroundColor="#0b0f14"
            nodeRelSize={4}
            nodeVal={(n: any) => Math.max(2, n.linkedCaseCount)}
            nodeLabel={(n: any) => `${n.label}\n${n.type} · ${n.linkedCaseCount} links`}
            linkColor={(l: any) =>
              `${CATEGORY_COLORS[l.crimeCategory as keyof typeof CATEGORY_COLORS] ?? "#64748B"}66`
            }
            linkWidth={0.8}
            nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
              const size = Math.max(4, Math.sqrt(node.linkedCaseCount || 1) * 3.5);
              const color = TYPE_COLOR[node.type as keyof typeof TYPE_COLOR];
              ctx.fillStyle = color;
              ctx.strokeStyle = "#0b0f14";
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
            }}
            nodePointerAreaPaint={(node: any, color: string, ctx: any) => {
              const size = Math.max(6, Math.sqrt(node.linkedCaseCount || 1) * 4);
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
              ctx.fill();
            }}
            onNodeClick={(n: any) => onNodeClick(n.id)}
            cooldownTicks={80}
          />
        )
      )}
    </div>
  );
}
