import React from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { workspaceAtoms } from "../../state/atoms/workspaceAtoms";
import { tabBarRoot, tabItem, tabItemActive, tabCloseButton } from "../../theme/tabs.css";

export const TabBar: React.FC = () => {
  const { tabs, activeTabId } = useAtomValue(workspaceAtoms.viewModelAtom);
  const setActiveTab = useSetAtom(workspaceAtoms.setActiveTabAtom);
  const closeTab = useSetAtom(workspaceAtoms.closeTabAtom);

  if (tabs.length === 0) {
      return null;
  }

  return (
    <div className={tabBarRoot}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={tab.id === activeTabId ? tabItemActive : tabItem}
          onClick={() => setActiveTab(tab.id)}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {tab.title}
          </span>
          <button
            className={tabCloseButton}
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
