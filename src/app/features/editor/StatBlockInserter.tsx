import React, { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { join } from "@tauri-apps/api/path";
import { listFilesInDir, readFile } from "../../../lib/api/files";
import { vars } from "../../theme/tokens.css";

interface StatBlockInserterProps {
  onInsert: (markdown: string) => void;
  onClose: () => void;
}

export const StatBlockInserter: React.FC<StatBlockInserterProps> = ({ onInsert, onClose }) => {
  const projectRoot = useAtomValue(projectRootAtom);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (!projectRoot) return;
    
    const loadFiles = async () => {
        try {
            const statBlocksDir = await join(projectRoot, "StatBlocks");
            const list = await listFilesInDir(statBlocksDir);
            setFiles(list.filter(f => f.endsWith(".md")));
        } catch (e) {
            console.warn("No StatBlocks folder found or empty.");
        }
    };
    loadFiles();
  }, [projectRoot]);

  useEffect(() => {
      if (!projectRoot || !selectedFile) {
          setPreview("");
          return;
      }
      const loadPreview = async () => {
          try {
              const path = await join(projectRoot, "StatBlocks", selectedFile);
              const content = await readFile(path);
              setPreview(content);
          } catch (e) {
              console.error(e);
          }
      };
      loadPreview();
  }, [selectedFile, projectRoot]);

  return (
    <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999
    }}>
        <div style={{
            width: 600,
            height: 500,
            backgroundColor: vars.color.background.panel,
            border: `1px solid ${vars.color.border.subtle}`,
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
        }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${vars.color.border.subtle}`, display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>Insert Stat Block</h3>
                <button onClick={onClose} style={{ background: "none", border: "none", color: vars.color.text.secondary, cursor: "pointer" }}>✕</button>
            </div>
            
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* List */}
                <div style={{ width: 200, borderRight: `1px solid ${vars.color.border.subtle}`, overflowY: "auto", padding: 8 }}>
                    {files.map(f => (
                        <div 
                            key={f}
                            onClick={() => setSelectedFile(f)}
                            style={{
                                padding: "4px 8px",
                                cursor: "pointer",
                                backgroundColor: selectedFile === f ? vars.color.background.panelRaised : "transparent",
                                color: selectedFile === f ? vars.color.text.primary : vars.color.text.secondary,
                                borderRadius: 4,
                                marginBottom: 2,
                                fontSize: 13
                            }}
                        >
                            {f.replace(".md", "")}
                        </div>
                    ))}
                    {files.length === 0 && <div style={{ padding: 8, color: vars.color.text.muted, fontSize: 12 }}>No stat blocks found in /StatBlocks folder.</div>}
                </div>
                
                {/* Preview */}
                <div style={{ flex: 1, padding: 16, overflowY: "auto", backgroundColor: "#fdf1dc", color: "#58180D", fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
                    {preview || "Select a file to preview..."}
                </div>
            </div>

            <div style={{ padding: 16, borderTop: `1px solid ${vars.color.border.subtle}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={onClose} style={{ padding: "6px 12px", background: "none", border: `1px solid ${vars.color.border.subtle}`, borderRadius: 4, color: vars.color.text.secondary, cursor: "pointer" }}>Cancel</button>
                <button 
                    disabled={!selectedFile || !preview}
                    onClick={() => { onInsert(preview); onClose(); }}
                    style={{ 
                        padding: "6px 12px", 
                        backgroundColor: vars.color.accent.primary, 
                        color: vars.color.text.inverse, 
                        border: "none", 
                        borderRadius: 4, 
                        cursor: "pointer",
                        opacity: (!selectedFile || !preview) ? 0.5 : 1
                    }}
                >
                    Insert
                </button>
            </div>
        </div>
    </div>
  );
};

