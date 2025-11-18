import React, { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { MarkdownEditor } from "./MarkdownEditor";
import { activeFilePathAtom, projectRootAtom } from "../../state/atoms/projectAtoms";
import { readFile, writeFile } from "../../../lib/api/files";

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

  useEffect(() => {
    if (!projectRoot || !activePath) {
      setValue("# Welcome to CodexLotus\n\nSelect a file from the sidebar to begin editing.");
      setError(null);
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

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: 8,
          fontSize: 12,
          opacity: 0.8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div>{activePath ? activePath : "No file open"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {error && <span style={{ color: "#f88" }}>{error}</span>}
          {isLoading && <span>Loading…</span>}
          {isSaving && <span>Saving…</span>}
          <button type="button" onClick={handleSave} disabled={!activePath || !projectRoot || isSaving}>
            Save
          </button>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <MarkdownEditor value={value} onChange={setValue} />
      </div>
    </div>
  );
};
