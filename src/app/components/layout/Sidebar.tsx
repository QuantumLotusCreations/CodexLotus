import React, { useState } from "react";
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
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

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

    // Build tree
    const tree: Record<string, any> = {};
    filesList.forEach(file => {
        const parts = file.path.split(/[/\\]/);
        let current = tree;
        parts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = index === parts.length - 1 
                    ? { __file: true, path: file.path, name: part }
                    : { __folder: true, name: part, children: {} };
            }
            if (index < parts.length - 1) {
                current = current[part].children;
            }
        });
    });

    const renderTree = (nodes: Record<string, any>, depth: number = 0, parentPath: string = "") => {
        // Sort: folders first, then files, alphabetically
        const entries = Object.values(nodes).sort((a, b) => {
            if (a.__folder && b.__file) return -1;
            if (a.__file && b.__folder) return 1;
            return a.name.localeCompare(b.name);
        });

        return (
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                {entries.map((node: any) => {
                    if (node.__file) {
                        const isActive = activePath === node.path;
                        return (
                            <li key={node.path} style={{ paddingLeft: depth * 12 }}>
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
                                        fontWeight: isActive ? 600 : 400,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}
                                    onClick={() => setActiveFileTab(node.path)}
                                    title={node.name}
                                >
                                    <span style={{ marginRight: 6 }}>📄</span>
                                    {node.name}
                                </button>
                            </li>
                        );
                    } else if (node.__folder) {
                        const folderPath = parentPath ? `${parentPath}/${node.name}` : node.name;
                        const isCollapsed = collapsedFolders.has(folderPath);
                        
                        return (
                            <li key={folderPath}>
                                <div 
                                    onClick={() => toggleFolder(folderPath)}
                                    style={{ 
                                        paddingLeft: depth * 12, 
                                        paddingTop: 4, 
                                        paddingBottom: 4,
                                        fontSize: 12, 
                                        fontWeight: 600, 
                                        color: vars.color.text.secondary,
                                        display: "flex",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        userSelect: "none"
                                    }}
                                >
                                    <span style={{ 
                                        marginRight: 6, 
                                        transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                        display: "inline-block",
                                        fontSize: 10
                                    }}>▼</span>
                                    <span style={{ marginRight: 6 }}>{isCollapsed ? "📁" : "📂"}</span>
                                    {node.name}
                                </div>
                                {!isCollapsed && renderTree(node.children, depth + 1, folderPath)}
                            </li>
                        );
                    }
                    return null;
                })}
            </ul>
        );
    };

    return renderTree(tree);
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
