import React from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { sidebarRoot, sidebarHeader, sidebarTitle, sidebarLogo } from "../../theme/sidebar.css";
import { vars } from "../../theme/tokens.css";
import logo from "../../../assets/icons/icon-32.png";
import {
  projectRootAtom,
  projectFilesAtom,
  resolvedContextFilesAtom,
  activeFileTabAtom,
  activeFilePathAtom,
} from "../../state/atoms/projectAtoms";
import { listMarkdownFiles } from "../../../lib/api/files";

export const Sidebar: React.FC = () => {
  const [projectRoot, setProjectFiles] = useAtom(projectRootAtom); // Corrected to match hook return
  const [filesList, setFilesList] = useAtom(projectFilesAtom);
  const contextFiles = useAtomValue(resolvedContextFilesAtom);
  const setActiveFileTab = useSetAtom(activeFileTabAtom);
  const activePath = useAtomValue(activeFilePathAtom);

  // We still need useQuery for fetching, but actions are gone
  const { isLoading } = useQuery({
    queryKey: ["project-files", projectRoot],
    enabled: !!projectRoot,
    queryFn: async () => {
      if (!projectRoot) return [];
      const files = await listMarkdownFiles(projectRoot);
      setFilesList(files);
      return files;
    },
  });

  const renderFileList = () => {
    if (!projectRoot) return <div>No project selected.</div>;
    if (isLoading && filesList.length === 0) return <div>Loading files…</div>;
    if (filesList.length === 0) return <div>No markdown files found.</div>;

    return (
      <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
        {filesList.map((entry) => {
          const segments = entry.path.split(/[/\\\\]/);
          const depth = Math.max(0, segments.length - 1);
          const name = segments[segments.length - 1] || entry.path;
          const isActive = activePath === entry.path;

          return (
            <li key={entry.path} style={{ paddingLeft: depth * 12 }}>
              <button
                type="button"
                style={{
                  background: isActive ? vars.color.background.panelRaised : "none",
                  border: "none",
                  padding: "2px 6px",
                  width: "100%",
                  textAlign: "left",
                  color: isActive ? vars.color.text.primary : "inherit",
                  fontSize: 12,
                  cursor: "pointer",
                  borderRadius: 4,
                  fontWeight: isActive ? 600 : 400
                }}
                onClick={() => setActiveFileTab(entry.path)}
              >
                {name}
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside className={sidebarRoot}>
      <div className={sidebarHeader}>
        <img src={logo} alt="CodexLotus logo" className={sidebarLogo} />
        <div className={sidebarTitle}>CodexLotus</div>
      </div>
      <div style={{ padding: 12, fontSize: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <strong>Project</strong>
          <div style={{ marginTop: 4, wordBreak: "break-all" }}>{projectRoot ?? "No project selected"}</div>
          {/* Removed buttons here */}
        </div>
        <div>
          <strong>Files</strong>
          <div style={{ marginTop: 4, maxHeight: 260, overflowY: "auto" }}>{renderFileList()}</div>
        </div>
        <div>
          <strong>AI Context</strong>
          <div>{contextFiles.length} files selected</div>
        </div>
      </div>
    </aside>
  );
};
