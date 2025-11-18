import React from "react";
import { DiffEditor } from "@monaco-editor/react";

export interface DiffViewerProps {
  original: string;
  modified: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ original, modified }) => {
  return (
    <DiffEditor
      original={original}
      modified={modified}
      language="markdown"
      theme="vs-dark"
      options={{
        readOnly: true,
        renderSideBySide: true,
      }}
      loading={<div>Loading diff…</div>}
    />
  );
};
