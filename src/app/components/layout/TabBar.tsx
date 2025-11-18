import React from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { workspaceAtoms } from "../../state/atoms/workspaceAtoms";
import { tabBarRoot, tabItem, tabItemActive } from "../../theme/tabs.css";

export const TabBar: React.FC = () => {
  const { tabs, activeTabId } = useAtomValue(workspaceAtoms.viewModelAtom);
  const setActiveTab = useSetAtom(workspaceAtoms.setActiveTabAtom);

  return (
    <div className={tabBarRoot}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={tab.id === activeTabId ? tabItemActive : tabItem}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );
};
