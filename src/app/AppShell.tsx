import React, { useCallback, useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Sidebar } from "./components/layout/Sidebar";
import { TabBar } from "./components/layout/TabBar";
import { StatusBar } from "./components/layout/StatusBar";
import { TitleBar } from "./components/layout/TitleBar";
import { workspaceAtoms, WorkspaceTab } from "./state/atoms/workspaceAtoms";
import { layoutAtoms, PanelId } from "./state/atoms/layoutAtoms";
import { projectRootAtom } from "./state/atoms/projectAtoms";
import { appShell } from "./theme/appShell.css";
import { ChatPanel } from "./features/chat/ChatPanel";
import { SettingsTab } from "./features/settings/SettingsTab";
import { EditorWorkspace } from "./features/editor/EditorWorkspace";
import { DiceProbabilityTab } from "./features/diceTools/DiceProbabilityTab";
import { StatBlockDesignerTab } from "./features/statBlocks/StatBlockDesignerTab";
import { LoreMapTab } from "./features/loreMap/LoreMapTab";
import { AutoTaggerTab } from "./features/autoTagger/AutoTaggerTab";
import { ProceduralGeneratorTab } from "./features/procedural/ProceduralGeneratorTab";
import { RuleCalculatorsTab } from "./features/ruleCalculators/RuleCalculatorsTab";
import { PlaytestSimulatorTab } from "./features/playtest/PlaytestSimulatorTab";
import { getIndexStats, initializeProjectIndex } from "../lib/api/rag";
import { call } from "../lib/api/client";
import { ExportDialog } from "./features/export/ExportDialog";
import { HelpTab } from "./features/help/HelpTab";

function getComponentForTab(tab: WorkspaceTab): React.ComponentType | null {
  switch (tab.type) {
    case "editor":
      return EditorWorkspace;
    case "settings":
      return SettingsTab;
    case "tool":
      if (tab.payload?.toolId === "help") return HelpTab;
      if (tab.payload?.toolId === "dice-calculator") return DiceProbabilityTab;
      if (tab.payload?.toolId === "stat-block-designer") return StatBlockDesignerTab;
      if (tab.payload?.toolId === "lore-map") return LoreMapTab;
      if (tab.payload?.toolId === "auto-tagger") return AutoTaggerTab;
      if (tab.payload?.toolId === "rule-calculators") return RuleCalculatorsTab;
      if (tab.payload?.toolId === "playtest-simulator") return PlaytestSimulatorTab;
      if (["bestiary-generator", "location-generator", "item-generator"].includes(tab.payload?.toolId as string)) {
          return ProceduralGeneratorTab;
      }
      return null;
    default:
      return null;
  }
}

export const AppShell: React.FC = () => {
  const { tabs, activeTabId } = useAtomValue(workspaceAtoms.viewModelAtom);
  const [layout, setLayout] = useAtom(layoutAtoms.baseAtom);
  const projectRoot = useAtomValue(projectRootAtom);
  
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const ActiveTabComponent = activeTab ? getComponentForTab(activeTab) : null;

  // Auto-indexing Logic
  useEffect(() => {
    if (!projectRoot) return;

    const checkAndIndex = async () => {
        try {
            // 1. Check if indexed
            const stats = await getIndexStats(projectRoot);
            if (stats.is_indexed) return; // Already indexed

            // 2. Check if we have a key
            const hasKey = await call<boolean>("check_api_key");
            if (!hasKey) return; // Can't index

            // 3. Auto-index
            console.log("Auto-indexing project...");
            await initializeProjectIndex(projectRoot);
            console.log("Auto-indexing complete.");
        } catch (e) {
            console.error("Auto-indexing failed:", e);
        }
    };

    checkAndIndex();
  }, [projectRoot]);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef<"left" | "right" | null>(null);
  const startXRef = useRef(0);
  const startRatiosRef = useRef(layout.panelRatios);

  const handleResizeStart = useCallback((direction: "left" | "right", e: React.MouseEvent) => {
    isResizingRef.current = direction;
    startXRef.current = e.clientX;
    startRatiosRef.current = layout.panelRatios;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [layout.panelRatios]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !workspaceRef.current) return;

      const workspaceWidth = workspaceRef.current.getBoundingClientRect().width;
      const deltaPixels = e.clientX - startXRef.current;
      const deltaPercent = (deltaPixels / workspaceWidth) * 100;

      const startRatios = startRatiosRef.current;
      let newRatios = { ...startRatios };

      if (isResizingRef.current === "left") {
        // Resizing between Left and Center
        // Left grows/shrinks, Center shrinks/grows
        const newLeft = Math.max(10, Math.min(80, startRatios.left + deltaPercent));
        const diff = newLeft - startRatios.left;
        const newCenter = Math.max(10, startRatios.center - diff);
        
        // Recalculate actual shift to respect constraints
        const actualDiff = startRatios.center - newCenter;
        newRatios.left = startRatios.left + actualDiff;
        newRatios.center = newCenter;
      } else {
        // Resizing between Center and Right
        // Center grows/shrinks, Right shrinks/grows
        // Moving mouse right (positive delta) -> Center grows, Right shrinks
        const newCenter = Math.max(10, Math.min(80, startRatios.center + deltaPercent));
        const diff = newCenter - startRatios.center;
        const newRight = Math.max(10, startRatios.right - diff);

        // Recalculate actual shift
        const actualDiff = startRatios.right - newRight;
        newRatios.center = startRatios.center + actualDiff;
        newRatios.right = newRight;
      }

      setLayout((prev) => ({ ...prev, panelRatios: newRatios }));
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setLayout]);

  const renderPanel = (panelId: PanelId) => {
    switch (panelId) {
      case "explorer":
        return <Sidebar />;
      case "assistant":
        return <ChatPanel />;
      case "editor":
        return (
            <div className={appShell.centerPane} style={{ width: '100%', height: '100%' }}>
                <TabBar />
                <div className={appShell.content}>
                {ActiveTabComponent ? <ActiveTabComponent /> : (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%', 
                        color: '#666' 
                    }}>
                        No file open
                    </div>
                )}
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={appShell.root}>
      <ExportDialog />
      <TitleBar />
      <div className={appShell.workspaceRow} ref={workspaceRef}>
        {/* Left Slot */}
        <div style={{ 
            flex: `${layout.panelRatios.left} 1 0%`, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0 
        }}>
             {renderPanel(layout.slots.left)}
        </div>
        
        <div className={appShell.resizer} onMouseDown={(e) => handleResizeStart("left", e)} />
        
        {/* Center Slot */}
        <div style={{ 
            flex: `${layout.panelRatios.center} 1 0%`, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0
        }}>
             <div className={appShell.workspaceContainer}>
                {renderPanel(layout.slots.center)}
            </div>
            <StatusBar />
        </div>

        {/* Right Slot */}
        {layout.isRightPanelOpen && (
            <>
            <div className={appShell.resizer} onMouseDown={(e) => handleResizeStart("right", e)} />
            <div style={{ 
                flex: `${layout.panelRatios.right} 1 0%`, 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0,
                borderLeft: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--background-panel)'
            }}>
                {renderPanel(layout.slots.right)}
            </div>
            </>
        )}
      </div>
    </div>
  );
};
