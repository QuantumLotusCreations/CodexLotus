import React from "react";
import { useAtomValue } from "jotai";
import { sidebarRoot, sidebarHeader, sidebarTitle, sidebarLogo } from "../../theme/sidebar.css";
import logo from "../../../assets/icons/icon-32.png";
import { projectRootAtom, resolvedContextFilesAtom } from "../../state/atoms/projectAtoms";

export const Sidebar: React.FC = () => {
  const projectRoot = useAtomValue(projectRootAtom);
  const contextFiles = useAtomValue(resolvedContextFilesAtom);

  return (
    <aside className={sidebarRoot}>
      <div className={sidebarHeader}>
        <img src={logo} alt="CodexLotus logo" className={sidebarLogo} />
        <div className={sidebarTitle}>CodexLotus</div>
      </div>
      <div style={{ padding: 12, fontSize: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Project</strong>
          <div>{projectRoot ?? "No project selected"}</div>
        </div>
        <div>
          <strong>AI Context</strong>
          <div>{contextFiles.length} files selected</div>
        </div>
      </div>
    </aside>
  );
};
