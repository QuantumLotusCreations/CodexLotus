import React, { useCallback, useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Sidebar } from "./components/layout/Sidebar";
import { TabBar } from "./components/layout/TabBar";
import { StatusBar } from "./components/layout/StatusBar";
import { TitleBar } from "./components/layout/TitleBar";
import { workspaceAtoms, WorkspaceTab } from "./state/atoms/workspaceAtoms";
import { layoutAtoms } from "./state/atoms/layoutAtoms";
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
import { getIndexStats, initializeProjectIndex } from "../lib/api/rag";
import { call } from "../lib/api/client";

function getComponentForTab(tab: WorkspaceTab): React.ComponentType | null {
  switch (tab.type) {
    case "editor":
      return EditorWorkspace;
    case "settings":
      return SettingsTab;
    case "tool":
      if (tab.payload?.toolId === "dice-calculator") return DiceProbabilityTab;
      if (tab.payload?.toolId === "stat-block-designer") return StatBlockDesignerTab;
      if (tab.payload?.toolId === "lore-map") return LoreMapTab;
      if (tab.payload?.toolId === "auto-tagger") return AutoTaggerTab;
      if (tab.payload?.toolId === "rule-calculators") return RuleCalculatorsTab;
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
  const [{ isChatOpen, chatWidth, sidebarWidth }, setLayout] = useAtom(layoutAtoms.baseAtom);
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

  // Resizing Logic for Chat
  const isChatResizingRef = useRef(false);
  const startChatXRef = useRef(0);
  const startChatWidthRef = useRef(0);

  // Resizing Logic for Sidebar
  const isSidebarResizingRef = useRef(false);
  const startSidebarXRef = useRef(0);
  const startSidebarWidthRef = useRef(0);

  const handleChatMouseDown = useCallback((e: React.MouseEvent) => {
    isChatResizingRef.current = true;
    startChatXRef.current = e.clientX;
    startChatWidthRef.current = chatWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [chatWidth]);

  const handleSidebarMouseDown = useCallback((e: React.MouseEvent) => {
    isSidebarResizingRef.current = true;
    startSidebarXRef.current = e.clientX;
    startSidebarWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isChatResizingRef.current) {
        const delta = startChatXRef.current - e.clientX;
        const newWidth = Math.max(200, Math.min(800, startChatWidthRef.current + delta));
        setLayout((prev) => ({ ...prev, chatWidth: newWidth }));
      }
      if (isSidebarResizingRef.current) {
        const delta = e.clientX - startSidebarXRef.current;
        const newWidth = Math.max(150, Math.min(600, startSidebarWidthRef.current + delta));
        setLayout((prev) => ({ ...prev, sidebarWidth: newWidth }));
      }
    };

    const handleMouseUp = () => {
      if (isChatResizingRef.current || isSidebarResizingRef.current) {
        isChatResizingRef.current = false;
        isSidebarResizingRef.current = false;
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

  return (
    <div className={appShell.root}>
      <TitleBar />
      <div className={appShell.workspaceRow}>
        <div style={{ width: sidebarWidth, display: 'flex', flexShrink: 0 }}>
             <Sidebar />
        </div>
        <div className={appShell.resizer} onMouseDown={handleSidebarMouseDown} />
        
        <div className={appShell.main}>
            <div className={appShell.workspaceContainer}>
            {/* Center Pane: TabBar + Content */}
            <div className={appShell.centerPane}>
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

            {/* Resizable Right Panel */}
            {isChatOpen && (
                <>
                <div className={appShell.resizer} onMouseDown={handleChatMouseDown} />
                <div 
                    className={appShell.rightPanel} 
                    style={{ width: chatWidth }}
                >
                    <ChatPanel />
                </div>
                </>
            )}
            </div>
            <StatusBar />
        </div>
      </div>
    </div>
  );
};
