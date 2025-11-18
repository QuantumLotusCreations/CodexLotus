import React from "react";
import { useAtomValue } from "jotai";
import { workspaceAtoms } from "../../state/atoms/workspaceAtoms";
import { tabBarRoot, tabItem, tabItemActive } from "../../theme/tabs.css";

export const TabBar: React.FC = () => {
  const { tabs, activeTabId } = useAtomValue(workspaceAtoms.viewModelAtom);

  return (
    <div className={tabBarRoot}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={tab.id === activeTabId ? tabItemActive : tabItem}
        >
          {tab.title}
        </div>
      ))}
    </div>
  );
};
