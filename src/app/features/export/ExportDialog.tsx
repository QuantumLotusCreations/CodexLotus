import React from "react";
import { useAtom } from "jotai";
import { isExportDialogOpenAtom, exportOptionsAtom, exportContentAtom } from "../../state/atoms/exportAtoms";
import { handleExport } from "../../../lib/export/exportUtils";
import { vars } from "../../theme/tokens.css";

export const ExportDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(isExportDialogOpenAtom);
  const [options, setOptions] = useAtom(exportOptionsAtom);
  const [content] = useAtom(exportContentAtom);
  const [isExporting, setIsExporting] = React.useState(false);

  if (!isOpen) return null;

  const doExport = async () => {
    setIsExporting(true);
    try {
        await handleExport(content, options);
        setIsOpen(false);
    } catch (e) {
        alert("Export failed: " + e);
    } finally {
        setIsExporting(false);
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
            width: 500,
            backgroundColor: vars.color.background.panel,
            border: `1px solid ${vars.color.border.subtle}`,
            borderRadius: 8,
            padding: 24,
            color: vars.color.text.primary,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
        }}>
            <h2 style={{ marginTop: 0 }}>Export Document</h2>
            
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
                </div>
            </div>

            {/* Theme Selection */}
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <button 
                    onClick={() => setIsOpen(false)}
                    style={{
                        padding: "8px 16px", borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`,
                        backgroundColor: "transparent", color: vars.color.text.secondary, cursor: "pointer"
                    }}
                >
                    Cancel
                </button>
                <button 
                    onClick={doExport}
                    disabled={isExporting}
                    style={{
                        padding: "8px 16px", borderRadius: 4, border: "none",
                        backgroundColor: vars.color.accent.primary, color: vars.color.text.inverse, cursor: "pointer",
                        fontWeight: 600
                    }}
                >
                    {isExporting ? "Exporting..." : (options.format === "pdf" ? "Print / Save PDF" : "Save HTML")}
                </button>
            </div>
        </div>
    </div>
  );
};

