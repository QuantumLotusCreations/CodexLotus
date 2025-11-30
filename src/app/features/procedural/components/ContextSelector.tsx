import React, { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { projectRootAtom } from "../../../state/atoms/projectAtoms";
import { listMarkdownFiles, readFile } from "../../../../lib/api/files";
import { parseMarkdownHeaders, MarkdownHeader } from "../../../../lib/markdownUtils";

interface ContextSelectorProps {
  // Returns path or path::lineNumber
  onSelectionChange: (selectedItems: string[]) => void;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({ onSelectionChange }) => {
  const projectRoot = useAtomValue(projectRootAtom);
  const [files, setFiles] = useState<string[]>([]);
  
  // Set of "path" or "path::lineNumber"
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Cache of headers: path -> headers[]
  const [fileHeaders, setFileHeaders] = useState<Record<string, MarkdownHeader[]>>({});
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!projectRoot) return;

    const fetchFiles = async () => {
        try {
             const entries = await listMarkdownFiles(projectRoot);
             const mdFiles = entries.map(e => e.path);
             setFiles(mdFiles);
        } catch (e) {
            console.error("Failed to load files", e);
        }
    };
    fetchFiles();
  }, [projectRoot]);

  const toggleFile = (path: string) => {
    const newSet = new Set(selectedItems);
    
    if (newSet.has(path)) {
        // Unselect file
        newSet.delete(path);
    } else {
        // Select file
        newSet.add(path);
        // If file is selected, unselect any individual headers from this file to avoid redundancy
        const headers = fileHeaders[path];
        if (headers) {
            headers.forEach(h => newSet.delete(`${path}::${h.line}`));
        }
    }
    
    setSelectedItems(newSet);
    onSelectionChange(Array.from(newSet));
  };

  const toggleHeader = (path: string, line: number) => {
      const id = `${path}::${line}`;
      const newSet = new Set(selectedItems);
      
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
          if (newSet.has(path)) {
              newSet.delete(path); 
          }
      }
      setSelectedItems(newSet);
      onSelectionChange(Array.from(newSet));
  };

  const toggleExpand = async (path: string) => {
      const newExpanded = new Set(expandedFiles);
      if (newExpanded.has(path)) {
          newExpanded.delete(path);
      } else {
          newExpanded.add(path);
          // Fetch headers if not present
          if (!fileHeaders[path]) {
              try {
                  const content = await readFile(path);
                  const headers = parseMarkdownHeaders(content);
                  setFileHeaders(prev => ({ ...prev, [path]: headers }));
              } catch (e) {
                  console.error("Failed to read file headers", e);
              }
          }
      }
      setExpandedFiles(newExpanded);
  };

  const filteredFiles = files.filter(f => f.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ border: "1px solid #333", padding: "10px", borderRadius: "4px", marginTop: "10px" }}>
        <div style={{ fontSize: "0.9em", fontWeight: "bold", marginBottom: "5px" }}>Context References (Existing Lore)</div>
        <div style={{ fontSize: "0.8em", color: "#888", marginBottom: "10px" }}>
            Select whole files or expand [▶] to pick specific sections (saves tokens).
        </div>
        
        <input 
            type="text" 
            placeholder="Search files..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", marginBottom: "10px", padding: "4px", background: "#222", border: "1px solid #444", color: "white" }}
        />
        <div style={{ maxHeight: "200px", overflowY: "auto", overflowX: "hidden" }}>
            {filteredFiles.length === 0 && <div style={{ color: "#666", fontSize: "0.8em" }}>No markdown files found.</div>}
            {filteredFiles.map(f => {
                const isExpanded = expandedFiles.has(f);
                const isFileSelected = selectedItems.has(f);
                const headers = fileHeaders[f] || [];
                const filename = f.split(/[/\\]/).pop();
                
                return (
                    <div key={f} style={{ marginBottom: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <button 
                                onClick={() => toggleExpand(f)}
                                style={{ 
                                    background: "none", 
                                    border: "none", 
                                    color: "#888", 
                                    cursor: "pointer", 
                                    width: "20px", 
                                    padding: 0,
                                    fontSize: "0.8em"
                                }}
                            >
                                {isExpanded ? "▼" : "▶"}
                            </button>
                            
                            <input 
                                type="checkbox" 
                                checked={isFileSelected} 
                                onChange={() => toggleFile(f)}
                                style={{ marginRight: "8px" }}
                            />
                            <span style={{ fontSize: "0.85em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f}>
                                {filename}
                            </span>
                        </div>
                        
                        {/* Headers List */}
                        {isExpanded && (
                            <div style={{ marginLeft: "28px", borderLeft: "1px solid #444", paddingLeft: "5px" }}>
                                {headers.length === 0 && <div style={{ fontSize: "0.75em", color: "#666" }}>No headers found</div>}
                                {headers.map((h, idx) => {
                                    // Use path::line as ID
                                    const headerId = `${f}::${h.line}`;
                                    const isHeaderSelected = selectedItems.has(headerId);
                                    
                                    return (
                                        <div key={idx} style={{ display: "flex", alignItems: "center", marginTop: "2px" }}>
                                            <input 
                                                type="checkbox" 
                                                checked={isHeaderSelected || isFileSelected} 
                                                disabled={isFileSelected}
                                                onChange={() => toggleHeader(f, h.line)}
                                                style={{ marginRight: "6px" }}
                                            />
                                            <span style={{ fontSize: "0.8em", color: "#aaa" }}>
                                                {h.text} <span style={{ color: "#555" }}>(H{h.level})</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};
