import React from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { sidebarRoot, sidebarHeader, sidebarTitle, sidebarLogo } from "../../theme/sidebar.css";
import logo from "../../../assets/icons/icon-32.png";
import {
  projectRootAtom,
  projectFilesAtom,
  resolvedContextFilesAtom,
  activeFileTabAtom,
} from "../../state/atoms/projectAtoms";
import { listMarkdownFiles } from "../../../lib/api/files";

export const Sidebar: React.FC = () => {
  const [projectRoot, setProjectRoot] = useAtom(projectRootAtom);
  const [projectFiles, setProjectFiles] = useAtom(projectFilesAtom);
  const contextFiles = useAtomValue(resolvedContextFilesAtom);
  const setActiveFileTab = useSetAtom(activeFileTabAtom);

  const { isLoading } = useQuery({
    queryKey: ["project-files", projectRoot],
    enabled: !!projectRoot,
    queryFn: async () => {
      if (!projectRoot) return [];
      const files = await listMarkdownFiles(projectRoot);
      setProjectFiles(files);
      return files;
    },
  });

  const handleSelectProject = async () => {
    // For now, a very small UX: rely on the user to paste or set the path via prompt.
    // This can be upgraded to a Tauri directory picker.
    const nextRoot = window.prompt("Set project root path", projectRoot ?? "")?.trim();
    if (nextRoot) {
      setProjectRoot(nextRoot);
    }
  };

  const renderFileList = () => {
    if (!projectRoot) return <div>No project selected.</div>;
    if (isLoading && projectFiles.length === 0) return <div>Loading files…</div>;
    if (projectFiles.length === 0) return <div>No markdown files found.</div>;

    return (
      <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
        {projectFiles.map((entry) => {
          const segments = entry.path.split(/[/\\\\]/);
          const depth = Math.max(0, segments.length - 1);
          const name = segments[segments.length - 1] || entry.path;

          return (
            <li key={entry.path} style={{ paddingLeft: depth * 12 }}>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "inherit",
                  fontSize: 12,
                  cursor: "pointer",
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
          <div style={{ marginTop: 4 }}>{projectRoot ?? "No project selected"}</div>
          <button
            type="button"
            style={{ marginTop: 6, fontSize: 11 }}
            onClick={handleSelectProject}
          >
            Change project…
          </button>
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
