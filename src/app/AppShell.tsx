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
import { getIndexStats, initializeProjectIndex } from "../lib/api/rag";
import { call } from "../lib/api/client";

function getComponentForTab(tab: WorkspaceTab): React.ComponentType | null {
  switch (tab.type) {
    case "editor":
      return EditorWorkspace;
    case "settings":
      return SettingsTab;
    default:
      return null;
  }
}

export const AppShell: React.FC = () => {
  const { tabs, activeTabId } = useAtomValue(workspaceAtoms.viewModelAtom);
  const [{ isChatOpen, chatWidth }, setLayout] = useAtom(layoutAtoms.baseAtom);
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

  // Resizing Logic
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = chatWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [chatWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.max(200, Math.min(800, startWidthRef.current + delta));
      setLayout((prev) => ({ ...prev, chatWidth: newWidth }));
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
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
        <Sidebar />
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
                <div className={appShell.resizer} onMouseDown={handleMouseDown} />
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
