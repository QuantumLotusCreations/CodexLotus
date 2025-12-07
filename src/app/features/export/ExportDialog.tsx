import React, { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { isExportDialogOpenAtom, exportOptionsAtom, exportContentAtom } from "../../state/atoms/exportAtoms";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { handleExport } from "../../../lib/export/exportUtils";
import { listMarkdownFiles, readFile } from "../../../lib/api/files";
import { vars } from "../../theme/tokens.css";

export const ExportDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(isExportDialogOpenAtom);
  const [options, setOptions] = useAtom(exportOptionsAtom);
  const [content] = useAtom(exportContentAtom);
  const projectRoot = useAtomValue(projectRootAtom);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<"single" | "multi">("single");
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]); // This stores the ordered list of paths
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (isOpen && projectRoot && exportMode === "multi") {
      listMarkdownFiles(projectRoot).then((entries: any[]) => {
        // Entries are { path: string } objects
        setAvailableFiles(entries.map(e => e.path).sort());
      }).catch(err => console.error("Failed to list files", err));
    }
  }, [isOpen, projectRoot, exportMode]);

  const toggleFile = (path: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(path)) {
        return prev.filter(p => p !== path);
      } else {
        return [...prev, path];
      }
    });
  };

  const moveFile = (path: string, direction: -1 | 1) => {
    const index = selectedFiles.indexOf(path);
    if (index === -1) return;
    
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= selectedFiles.length) return;

    const newFiles = [...selectedFiles];
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setSelectedFiles(newFiles);
  };

  const selectAll = () => {
    // Add all available files that aren't already selected, preserving existing order
    const newFiles = [...selectedFiles];
    availableFiles.forEach(f => {
        if (!newFiles.includes(f)) newFiles.push(f);
    });
    setSelectedFiles(newFiles);
  };

  const deselectAll = () => {
    setSelectedFiles([]);
  };

  if (!isOpen) return null;

  const doExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setStatusMessage("Starting export...");
    
    try {
        let contentToExport = "";

        if (exportMode === "single") {
            contentToExport = content;
            setProgress(30);
            setStatusMessage("Processing content...");
            await new Promise(resolve => setTimeout(resolve, 300)); // Small UX delay
        } else {
            if (selectedFiles.length === 0) {
                alert("Please select at least one file to export.");
                setIsExporting(false);
                return;
            }
            
            setStatusMessage(`Preparing to load ${selectedFiles.length} files...`);
            
            // Sequential loading to update progress accurately (or parallel with wrapper)
            // Parallel is faster, let's wrap to track progress
            let loadedCount = 0;
            const total = selectedFiles.length;
            
            const contents = await Promise.all(selectedFiles.map(async (path) => {
                const fullPath = projectRoot ? `${projectRoot}/${path}` : path;
                const fileContent = await readFile(`${projectRoot}/${path}`);
                
                loadedCount++;
                const percentage = Math.round((loadedCount / total) * 80); // 0-80% for loading
                setProgress(percentage);
                setStatusMessage(`Loaded ${loadedCount}/${total}: ${path}`);
                
                // Add filename header if Markdown format
                if (options.format === "markdown") {
                    const filename = path.split(/[/\\]/).pop() || path;
                    return `# ${filename}\n\n${fileContent}`;
                }

                return fileContent;
            }));
            
            setStatusMessage("Combining files...");
            // Join with page breaks
            const separator = options.format === "markdown" ? "\n\n" : "\n\n<div class=\"l-pagebreak\"></div>\n\n";
            contentToExport = contents.join(separator);
        }

        setProgress(90);
        setStatusMessage("Generating document...");
        await handleExport(contentToExport, options);
        
        setProgress(100);
        setStatusMessage("Done! Print window should appear shortly.");
        await new Promise(resolve => setTimeout(resolve, 1500)); // Give user time to see success
        setIsOpen(false);
    } catch (e) {
        alert("Export failed: " + e);
        console.error(e);
    } finally {
        setIsExporting(false);
        setProgress(0);
        setStatusMessage("");
    }
  };

  return (
    <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999
    }}>
        <div style={{
            width: 800, // Increased width for multi-pane
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: vars.color.background.panel,
            border: `1px solid ${vars.color.border.subtle}`,
            borderRadius: 8,
            padding: 24,
            color: vars.color.text.primary,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
        }}>
            <h2 style={{ marginTop: 0 }}>Export Document</h2>
            
            <div style={{ display: "flex", gap: 24, flex: 1, minHeight: 0 }}>
                {/* Left Column: Settings */}
                <div style={{ flex: 1, minWidth: 300 }}>
                    {/* Export Mode */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>Source</label>
                        <div style={{ display: "flex", gap: 16 }}>
                            <label>
                                <input 
                                    type="radio" 
                                    checked={exportMode === "single"} 
                                    onChange={() => setExportMode("single")}
                                /> Current File
                            </label>
                            <label>
                                <input 
                                    type="radio" 
                                    checked={exportMode === "multi"} 
                                    onChange={() => setExportMode("multi")}
                                /> Multiple Files
                            </label>
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>Format</label>
                        <div style={{ display: "flex", gap: 16 }}>
                            <label>
                                <input 
                                    type="radio" 
                                    checked={options.format === "pdf"} 
                                    onChange={() => setOptions(prev => ({ ...prev, format: "pdf" }))}
                                /> PDF (via Print)
                            </label>
                            <label>
                                <input 
                                    type="radio" 
                                    checked={options.format === "html"} 
                                    onChange={() => setOptions(prev => ({ ...prev, format: "html" }))}
                                /> HTML File
                            </label>
                            <label>
                                <input 
                                    type="radio" 
                                    checked={options.format === "markdown"} 
                                    onChange={() => setOptions(prev => ({ ...prev, format: "markdown" }))}
                                /> Markdown
                            </label>
                        </div>
                    </div>

                    {/* Theme Selection */}
                    {options.format !== "markdown" && (
                    <>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>Theme</label>
                        <select 
                            value={options.theme}
                            onChange={(e) => setOptions(prev => ({ ...prev, theme: e.target.value as any }))}
                            style={{ width: "100%", padding: 8, borderRadius: 4, backgroundColor: vars.color.background.base, color: vars.color.text.primary, border: `1px solid ${vars.color.border.subtle}` }}
                        >
                            <option value="print">Printer Friendly (B&W)</option>
                            <option value="screen">Screen (Dark/App Theme)</option>
                            <option value="custom">Custom Colors</option>
                        </select>
                    </div>

                    {/* Custom Colors */}
                    {options.theme === "custom" && (
                        <div style={{ marginBottom: 16, padding: 12, backgroundColor: vars.color.background.panelRaised, borderRadius: 4 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12 }}>Background</label>
                                    <input 
                                        type="color" 
                                        value={options.customColors?.background}
                                        onChange={e => setOptions(prev => ({ ...prev, customColors: { ...prev.customColors!, background: e.target.value } }))}
                                        style={{ display: "block", width: "100%" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12 }}>Text</label>
                                    <input 
                                        type="color" 
                                        value={options.customColors?.text}
                                        onChange={e => setOptions(prev => ({ ...prev, customColors: { ...prev.customColors!, text: e.target.value } }))}
                                        style={{ display: "block", width: "100%" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12 }}>Accent</label>
                                    <input 
                                        type="color" 
                                        value={options.customColors?.accent}
                                        onChange={e => setOptions(prev => ({ ...prev, customColors: { ...prev.customColors!, accent: e.target.value } }))}
                                        style={{ display: "block", width: "100%" }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    </>
                    )}
                </div>

                {/* Right Column: File Selection (only if Multi) */}
                {exportMode === "multi" && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: `1px solid ${vars.color.border.subtle}`, paddingLeft: 24, minHeight: 0 }}>
                        
                        {/* Selected Files (Orderable) */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: 16, minHeight: 0 }}>
                            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>Export Order ({selectedFiles.length})</label>
                            <div style={{ 
                                flex: 1, 
                                overflowY: "auto", 
                                border: `1px solid ${vars.color.border.subtle}`, 
                                borderRadius: 4,
                                padding: 8,
                                backgroundColor: vars.color.background.base,
                                marginBottom: 4,
                                minHeight: 0
                            }}>
                                {selectedFiles.length === 0 ? (
                                    <div style={{ padding: 8, color: vars.color.text.secondary, fontStyle: "italic" }}>
                                        No files selected. Add files from the list below.
                                    </div>
                                ) : (
                                    selectedFiles.map((file, index) => (
                                        <div key={file} style={{ display: "flex", alignItems: "center", marginBottom: 4, padding: "2px 4px", backgroundColor: vars.color.background.panel, borderRadius: 4 }}>
                                            <span style={{ flex: 1, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file}>
                                                {index + 1}. {file}
                                            </span>
                                            
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <button 
                                                    disabled={index === 0}
                                                    onClick={(e) => { e.stopPropagation(); moveFile(file, -1); }}
                                                    style={{ fontSize: 10, padding: "2px 6px", cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? 0.3 : 1 }}
                                                    title="Move Up"
                                                >
                                                    ▲
                                                </button>
                                                <button 
                                                    disabled={index === selectedFiles.length - 1}
                                                    onClick={(e) => { e.stopPropagation(); moveFile(file, 1); }}
                                                    style={{ fontSize: 10, padding: "2px 6px", cursor: index === selectedFiles.length - 1 ? "default" : "pointer", opacity: index === selectedFiles.length - 1 ? 0.3 : 1 }}
                                                    title="Move Down"
                                                >
                                                    ▼
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleFile(file); }}
                                                    style={{ fontSize: 14, padding: "0 6px", cursor: "pointer", color: "red", border: "none", background: "transparent" }}
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Available Files (Selectable) */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <label style={{ fontWeight: "bold" }}>Add Files</label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={selectAll} style={{ fontSize: 12, cursor: "pointer" }}>Select All</button>
                                    <button onClick={deselectAll} style={{ fontSize: 12, cursor: "pointer" }}>Clear All</button>
                                </div>
                            </div>

                            <div style={{ 
                                flex: 1, 
                                overflowY: "auto", 
                                border: `1px solid ${vars.color.border.subtle}`, 
                                borderRadius: 4,
                                padding: 8,
                                backgroundColor: vars.color.background.base,
                                minHeight: 0
                            }}>
                                {availableFiles.filter(f => !selectedFiles.includes(f)).length === 0 ? (
                                    <div style={{ padding: 8, color: vars.color.text.secondary, fontStyle: "italic" }}>
                                        All files selected.
                                    </div>
                                ) : (
                                    availableFiles
                                        .filter(f => !selectedFiles.includes(f))
                                        .map(file => (
                                            <div 
                                                key={file} 
                                                onClick={() => toggleFile(file)}
                                                style={{ 
                                                    display: "flex", 
                                                    alignItems: "center", 
                                                    marginBottom: 4, 
                                                    padding: "4px", 
                                                    cursor: "pointer",
                                                    borderRadius: 4
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = vars.color.background.panelRaised}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                            >
                                                <span style={{ fontSize: 14 }}>+</span>
                                                <span style={{ flex: 1, fontSize: 14, marginLeft: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file}>
                                                    {file}
                                                </span>
                                            </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, alignItems: "center" }}>
                {isExporting && (
                    <div style={{ flex: 1, marginRight: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: vars.color.text.secondary }}>{statusMessage}</span>
                            <span style={{ fontSize: 12, fontWeight: "bold" }}>{progress}%</span>
                        </div>
                        <div style={{ width: "100%", height: 6, backgroundColor: vars.color.background.base, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${progress}%`, height: "100%", backgroundColor: vars.color.accent.primary, transition: "width 0.2s ease" }} />
                        </div>
                    </div>
                )}
                <button 
                    onClick={() => setIsOpen(false)}
                    disabled={isExporting}
                    style={{
                        padding: "8px 16px", borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`,
                        backgroundColor: "transparent", color: vars.color.text.secondary, cursor: isExporting ? "default" : "pointer",
                        opacity: isExporting ? 0.5 : 1
                    }}
                >
                    Cancel
                </button>
                <button 
                    onClick={doExport}
                    disabled={isExporting}
                    style={{
                        padding: "8px 16px", borderRadius: 4, border: "none",
                        backgroundColor: vars.color.accent.primary, color: vars.color.text.inverse, cursor: isExporting ? "default" : "pointer",
                        fontWeight: 600,
                        opacity: isExporting ? 0.7 : 1
                    }}
                >
                    {isExporting ? "Exporting..." : (
                        options.format === "pdf" ? "Print / Save PDF" : 
                        options.format === "markdown" ? "Save Markdown" :
                        "Save HTML"
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};

