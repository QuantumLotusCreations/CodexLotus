import React, { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { scanForTags, applyTags, TagSuggestion } from "./tagScanner";
import { vars } from "../../theme/tokens.css";

const containerStyle = {
    padding: "20px",
    height: "100%",
    overflowY: "auto" as const,
    color: vars.color.text.primary,
    backgroundColor: vars.color.background.base
};

const cardStyle = {
    backgroundColor: vars.color.background.panel,
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: `1px solid ${vars.color.border.subtle}`,
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px"
};

const tagStyle = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    marginRight: "5px",
    marginBottom: "5px"
};

const currentTagStyle = {
    ...tagStyle,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)"
};

const suggestedTagStyle = {
    ...tagStyle,
    backgroundColor: "rgba(0, 255, 0, 0.1)",
    border: "1px solid rgba(0, 255, 0, 0.3)",
    cursor: "pointer"
};

export const AutoTaggerTab: React.FC = () => {
    const projectRoot = useAtomValue(projectRootAtom);
    const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");

    const runScan = async () => {
        if (!projectRoot) return;
        setLoading(true);
        setStatus("Scanning files for keywords...");
        try {
            const results = await scanForTags(projectRoot);
            setSuggestions(results);
            setStatus(results.length === 0 ? "No new tags suggested." : `Found suggestions for ${results.length} files.`);
        } catch (e) {
            console.error(e);
            setStatus("Error scanning files.");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (file: string, tags: string[]) => {
        try {
            await applyTags(file, tags);
            // Remove from list
            setSuggestions(prev => prev.filter(s => s.file !== file));
        } catch (e) {
            console.error("Failed to apply tags", e);
            alert("Failed to apply tags to " + file);
        }
    };

    const handleApplyAll = async () => {
        if (!confirm(`Apply all tags to ${suggestions.length} files?`)) return;
        
        setLoading(true);
        setStatus("Applying tags...");
        
        for (const s of suggestions) {
            await applyTags(s.file, s.suggestedTags);
        }
        
        setSuggestions([]);
        setStatus("All tags applied!");
        setLoading(false);
    };

    return (
        <div style={containerStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h2 style={{ margin: 0 }}>Auto-Tagger</h2>
                    <p style={{ margin: "5px 0 0 0", opacity: 0.7, fontSize: "14px" }}>
                        Scans your files and suggests tags based on file names found in content.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                        onClick={runScan} 
                        disabled={loading}
                        style={{ padding: "8px 16px", cursor: "pointer" }}
                    >
                        {loading ? "Scanning..." : "Rescan Project"}
                    </button>
                    {suggestions.length > 0 && (
                        <button 
                            onClick={handleApplyAll}
                            disabled={loading}
                            style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "4px" }}
                        >
                            Apply All ({suggestions.length})
                        </button>
                    )}
                </div>
            </div>

            {status && <div style={{ marginBottom: "20px", fontStyle: "italic", opacity: 0.8 }}>{status}</div>}

            <div>
                {suggestions.map((s) => (
                    <div key={s.file} style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong>{s.file}</strong>
                            <button 
                                onClick={() => handleApply(s.file, s.suggestedTags)}
                                style={{ fontSize: "12px", padding: "4px 8px", cursor: "pointer" }}
                            >
                                Apply Tags
                            </button>
                        </div>
                        
                        <div>
                            <span style={{ fontSize: "12px", opacity: 0.6, display: "block", marginBottom: "4px" }}>Existing:</span>
                            {s.currentTags.length === 0 ? <span style={{ fontSize: "12px", fontStyle: "italic", opacity: 0.4 }}>None</span> : 
                                s.currentTags.map(t => <span key={t} style={currentTagStyle}>{t}</span>)
                            }
                        </div>

                        <div>
                            <span style={{ fontSize: "12px", opacity: 0.6, display: "block", marginBottom: "4px" }}>Suggested:</span>
                            {s.suggestedTags.map(t => (
                                <span key={t} style={suggestedTagStyle} title="Click to toggle (not impl)">{t}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

