import React, { useState, useEffect, useRef } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { useSetAtom, useAtomValue } from "jotai";
import { workspaceAtoms } from "../../state/atoms/workspaceAtoms";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { useProjectActions } from "../../hooks/useProjectActions";
import { 
    titleBarRoot, menuBar, menuItem, menuDropdown, menuDropdownItem,
    windowControls, windowButton, closeButton, noDrag 
} from "../../theme/titleBar.css";

export const TitleBar: React.FC = () => {
  const openSettings = useSetAtom(workspaceAtoms.openSettingsTabAtom);
  const projectRoot = useAtomValue(projectRootAtom);
  const { handleSelectProject, handleCreateProject, handleImportFiles } = useProjectActions();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setActiveMenu(null);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
      setActiveMenu(activeMenu === menu ? null : menu);
  };

  const closeMenu = () => setActiveMenu(null);

  return (
    <div className={titleBarRoot} data-tauri-drag-region>
      {/* Menu Bar */}
      <div className={`${menuBar} ${noDrag}`} ref={menuRef}>
        
        {/* File Menu */}
        <div style={{ position: "relative" }}>
            <div className={menuItem} onClick={() => toggleMenu("file")}>File</div>
            {activeMenu === "file" && (
                <div className={menuDropdown}>
                    <div className={menuDropdownItem} onClick={() => { closeMenu(); handleCreateProject(); }}>
                        New Project...
                    </div>
                    <div className={menuDropdownItem} onClick={() => { closeMenu(); handleSelectProject(); }}>
                        Open Project...
                    </div>
                    <div className={menuDropdownItem} onClick={() => { closeMenu(); handleImportFiles(); }} style={{ opacity: projectRoot ? 1 : 0.5, pointerEvents: projectRoot ? "auto" : "none" }}>
                        Import Files...
                    </div>
                    <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
                    <div className={menuDropdownItem} onClick={() => { closeMenu(); openSettings(); }}>
                        Settings
                    </div>
                    <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
                    <div className={menuDropdownItem} onClick={() => { appWindow.close(); }}>
                        Exit
                    </div>
                </div>
            )}
        </div>

        <div className={menuItem} onClick={() => alert("Edit menu not implemented yet.")}>Edit</div>
        <div className={menuItem} onClick={() => alert("View menu not implemented yet.")}>View</div>
        <div className={menuItem} onClick={() => alert("Help menu not implemented yet.")}>Help</div>
      </div>

      {/* Window Controls & Settings */}
      <div className={`${windowControls} ${noDrag}`}>
        <button className={windowButton} onClick={() => openSettings()} title="Settings">
            ⚙️
        </button>
        <button className={windowButton} onClick={() => appWindow.minimize()}>
          ─
        </button>
        <button className={windowButton} onClick={() => appWindow.toggleMaximize()}>
          □
        </button>
        <button className={`${windowButton} ${closeButton}`} onClick={() => appWindow.close()}>
          ✕
        </button>
      </div>
    </div>
  );
};
