import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAtomValue } from "jotai";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { buildLoreGraph, GraphData } from "./graphBuilder";
import { workspaceAtoms } from "../../state/atoms/workspaceAtoms";
import { useSetAtom } from "jotai";
import { vars } from "../../theme/tokens.css";

// Need to dynamically style the graph container to fit the tab area
const containerStyle = {
  width: "100%",
  height: "100%",
  position: "relative" as const,
  overflow: "hidden",
  backgroundColor: "#1a1a1a", // Dark background for contrast
};

const overlayStyle = {
    position: "absolute" as const,
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "10px",
    borderRadius: "8px",
    color: "white",
    maxWidth: "300px"
};

export const LoreMapTab: React.FC = () => {
  const projectRoot = useAtomValue(projectRootAtom);
  const openFile = useSetAtom(workspaceAtoms.openFileTabAtom);
  
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods>();

  // Handle resizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener("resize", updateDimensions);
    // Initial size
    updateDimensions();
    
    // Small timeout to catch layout settlement
    setTimeout(updateDimensions, 100);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Fetch data
  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
        if (!projectRoot) return;
        setLoading(true);
        try {
            const data = await buildLoreGraph(projectRoot);
            if (mounted) {
                setGraphData(data);
            }
        } catch (err) {
            console.error("Failed to load lore graph:", err);
        } finally {
            if (mounted) setLoading(false);
        }
    };

    load();
    return () => { mounted = false; };
  }, [projectRoot]);

  const handleNodeClick = useCallback((node: any) => {
      // Don't try to open tag nodes
      if (node.id && !node.id.startsWith("tag:")) {
          openFile(node.id);
      }
  }, [openFile]);

  return (
    <div ref={containerRef} style={containerStyle}>
        {loading && (
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "white"
            }}>
                Building Network Graph...
            </div>
        )}
        
        <div style={overlayStyle}>
            <h3 style={{ margin: "0 0 5px 0", fontSize: "14px" }}>Lore Map</h3>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.8 }}>
                {graphData.nodes.length} Nodes • {graphData.links.length} Connections
            </p>
            <p style={{ margin: "5px 0 0 0", fontSize: "11px", opacity: 0.6 }}>
                Click a node to open the file.
                <br/>
                <span style={{ color: "#888" }}>Tags are shown as hubs.</span>
            </p>
        </div>

        {!loading && (
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeLabel="name"
                nodeColor={(node: any) => {
                    if (node.group === "_tags") return "#ff00ff"; // Bright color for tags
                    
                    // Simple color generation based on group
                    const group = node.group || "root";
                    let hash = 0;
                    for (let i = 0; i < group.length; i++) {
                        hash = group.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
                    return "#" + "00000".substring(0, 6 - c.length) + c;
                }}
                nodeRelSize={6}
                linkColor={(link: any) => link.type === "tag" ? "rgba(255, 0, 255, 0.1)" : "rgba(255,255,255,0.2)"}
                linkLineDash={(link: any) => link.type === "tag" ? [5, 5] : null}
                onNodeClick={handleNodeClick}
                cooldownTicks={100}
            />
        )}
    </div>
  );
};
