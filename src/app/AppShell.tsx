import React from "react";
import { useAtomValue } from "jotai";
import { Sidebar } from "./components/layout/Sidebar";
import { TabBar } from "./components/layout/TabBar";
import { StatusBar } from "./components/layout/StatusBar";
import { workspaceAtoms, WorkspaceTab } from "./state/atoms/workspaceAtoms";
import { appShell } from "./theme/appShell.css";
import { ChatPanel } from "./features/chat/ChatPanel";
import { SettingsTab } from "./features/settings/SettingsTab";
import { EditorWorkspace } from "./features/editor/EditorWorkspace";

function getComponentForTab(tab: WorkspaceTab): React.ComponentType | null {
  switch (tab.type) {
    case "editor":
      return EditorWorkspace;
    case "chat":
      return ChatPanel;
    case "settings":
      return SettingsTab;
    default:
      return null;
  }
}

export const AppShell: React.FC = () => {
  const { tabs, activeTabId } = useAtomValue(workspaceAtoms.viewModelAtom);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const ActiveTabComponent = activeTab ? getComponentForTab(activeTab) : null;

  return (
    <div className={appShell.root}>
      <Sidebar />
      <div className={appShell.main}>
        <TabBar />
        <div className={appShell.content}>
          {ActiveTabComponent ? <ActiveTabComponent /> : null}
        </div>
        <StatusBar />
      </div>
    </div>
  );
};
