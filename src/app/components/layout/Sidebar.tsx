import React from "react";
import { sidebarRoot, sidebarHeader, sidebarTitle, sidebarLogo } from "../../theme/sidebar.css";
import logo from "../../../assets/icons/icon-32.png";

export const Sidebar: React.FC = () => {
  return (
    <aside className={sidebarRoot}>
      <div className={sidebarHeader}>
        <img src={logo} alt="CodexLotus logo" className={sidebarLogo} />
        <div className={sidebarTitle}>CodexLotus</div>
      </div>
      {/* TODO: ProjectTree and context selection */}
    </aside>
  );
};
