import React, { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { MarkdownEditor } from "./MarkdownEditor";
import { DiffViewer } from "../diff/DiffViewer";
import { MarkdownPreview } from "../../components/markdown/MarkdownPreview";
import { activeFilePathAtom, projectRootAtom } from "../../state/atoms/projectAtoms";
import { readFile, writeFile } from "../../../lib/api/files";
import { useFileEdit } from "../../../lib/api/ai";
import { vars } from "../../theme/tokens.css.ts";

function joinProjectPath(projectRoot: string, relativePath: string): string {
  if (!projectRoot) return relativePath;
  if (projectRoot.endsWith("/") || projectRoot.endsWith("\\")) {
    return projectRoot + relativePath;
  }
  return `${projectRoot}/${relativePath}`;
}

export const EditorWorkspace: React.FC = () => {
  const projectRoot = useAtomValue(projectRootAtom);
  const activePath = useAtomValue(activeFilePathAtom);
  const [value, setValue] = useState<string>("# Welcome to CodexLotus\n\nStart your rulebook here…");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI Edit State
  const [isAiEditMode, setIsAiEditMode] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [diffOriginal, setDiffOriginal] = useState<string | null>(null);
  const [diffModified, setDiffModified] = useState<string | null>(null);

  // Preview State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const { mutateAsync: requestEdit, isLoading: isAiThinking } = useFileEdit();

  useEffect(() => {
    if (!projectRoot || !activePath) {
      setValue("# Welcome to CodexLotus\n\nSelect a file from the sidebar to begin editing.");
      setError(null);
      setIsAiEditMode(false);
      setDiffModified(null);
      setIsPreviewMode(false);
      return;
    }

    const fullPath = joinProjectPath(projectRoot, activePath);
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    readFile(fullPath)
      .then((contents) => {
        if (!cancelled) {
          setValue(contents);
        }
      })
      .catch((err) => {
        console.error("Failed to read file", err);
        if (!cancelled) {
          setError("Failed to load file.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectRoot, activePath]);

  const handleSave = async () => {
    if (!projectRoot || !activePath) return;
    
    const fullPath = joinProjectPath(projectRoot, activePath);
    setIsSaving(true);
    setError(null);
    try {
      await writeFile(fullPath, value);
    } catch (err) {
      console.error("Failed to save file", err);
      setError("Failed to save file.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiEditSubmit = async () => {
    if (!activePath || !aiInstruction.trim()) return;
    
    try {
        const response = await requestEdit({
            path: activePath,
            contents: value,
            instruction: aiInstruction
        });
        setDiffOriginal(value);
        setDiffModified(response.updated_contents);
    } catch (e) {
        setError("AI Edit failed: " + String(e));
    }
  };

  const handleAcceptDiff = () => {
      if (diffModified) {
          setValue(diffModified);
          setDiffModified(null);
          setDiffOriginal(null);
          setIsAiEditMode(false);
          setAiInstruction("");
      }
  };

  const handleRejectDiff = () => {
      setDiffModified(null);
      setDiffOriginal(null);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div
        style={{
          padding: "8px 12px",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          backgroundColor: vars.color.background.panelRaised,
          borderBottom: `1px solid ${vars.color.border.subtle}`
        }}
      >
        <div style={{ fontWeight: 500 }}>{activePath ? activePath : "No file open"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {error && <span style={{ color: vars.color.state.danger }}>{error}</span>}
          {isLoading && <span style={{ color: vars.color.text.muted }}>Loading...</span>}
          {isSaving && <span style={{ color: vars.color.text.muted }}>Saving...</span>}
          
          <button 
            type="button" 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            disabled={!activePath || diffModified !== null}
            style={{
                background: "none",
                border: `1px solid ${vars.color.border.subtle}`,
                color: isPreviewMode ? vars.color.accent.primary : vars.color.text.secondary,
                borderRadius: 4,
                padding: "4px 8px",
                cursor: "pointer"
            }}
          >
            {isPreviewMode ? "Edit Source" : "👁 Preview"}
          </button>

          <button 
            type="button" 
            onClick={() => setIsAiEditMode(!isAiEditMode)}
            disabled={!activePath || isPreviewMode}
            style={{
                background: "none",
                border: `1px solid ${vars.color.border.subtle}`,
                color: isAiEditMode ? vars.color.accent.primary : vars.color.text.secondary,
                borderRadius: 4,
                padding: "4px 8px",
                cursor: "pointer"
            }}
          >
            ✨ AI Edit
          </button>

          <button 
            type="button" 
            onClick={handleSave} 
            disabled={!activePath || !projectRoot || isSaving || isPreviewMode}
            style={{
                background: vars.color.accent.primary,
                border: "none",
                color: vars.color.text.inverse,
                borderRadius: 4,
                padding: "4px 12px",
                cursor: "pointer",
                fontWeight: 600,
                opacity: isPreviewMode ? 0.5 : 1
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* AI Edit Prompt Bar */}
      {isAiEditMode && !diffModified && !isPreviewMode && (
          <div style={{ 
              padding: 12, 
              backgroundColor: vars.color.background.panel, 
              borderBottom: `1px solid ${vars.color.border.subtle}`,
              display: "flex",
              gap: 8
          }}>
              <input 
                autoFocus
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="How should the AI rewrite this file? (e.g. 'Fix grammar', 'Make the tone darker', 'Add a table for loot')"
                style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 4,
                    border: `1px solid ${vars.color.border.subtle}`,
                    backgroundColor: vars.color.background.base,
                    color: vars.color.text.primary
                }}
                onKeyDown={(e) => { if(e.key === "Enter") handleAiEditSubmit(); }}
              />
              <button
                onClick={handleAiEditSubmit}
                disabled={isAiThinking || !aiInstruction.trim()}
                style={{
                    padding: "8px 16px",
                    backgroundColor: vars.color.accent.primary,
                    color: vars.color.text.inverse,
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    opacity: isAiThinking ? 0.7 : 1
                }}
              >
                  {isAiThinking ? "Generating..." : "Generate Edit"}
              </button>
          </div>
      )}

      {/* Diff Action Bar */}
      {diffModified && (
          <div style={{ 
            padding: 8, 
            backgroundColor: vars.color.state.info, 
            color: "#fff",
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
              <span style={{ marginLeft: 8, fontWeight: 600 }}>Review AI Changes</span>
              <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleRejectDiff} style={{ padding: "4px 12px", cursor: "pointer" }}>Discard</button>
                  <button onClick={handleAcceptDiff} style={{ padding: "4px 12px", fontWeight: "bold", cursor: "pointer" }}>Accept Changes</button>
              </div>
          </div>
      )}

      {/* Editor / Diff / Preview View */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {diffModified && diffOriginal ? (
            <DiffViewer original={diffOriginal} modified={diffModified} />
        ) : isPreviewMode ? (
            <MarkdownPreview content={value} />
        ) : (
            <MarkdownEditor value={value} onChange={setValue} />
        )}
      </div>
    </div>
  );
};
