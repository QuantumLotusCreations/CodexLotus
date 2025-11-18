import React from "react";
import { useAtomValue } from "jotai";
import { Sidebar } from "./components/layout/Sidebar";
import { TabBar } from "./components/layout/TabBar";
import { StatusBar } from "./components/layout/StatusBar";
import { workspaceAtoms } from "./state/atoms/workspaceAtoms";
import { appShell } from "./theme/appShell.css";

export const AppShell: React.FC = () => {
  const { activeTabComponent: ActiveTab } = useAtomValue(workspaceAtoms.viewModelAtom);

  return (
    <div className={appShell.root}>
      <Sidebar />
      <div className={appShell.main}>
        <TabBar />
        <div className={appShell.content}>{ActiveTab ? <ActiveTab /> : null}</div>
        <StatusBar />
      </div>
    </div>
  );
};
