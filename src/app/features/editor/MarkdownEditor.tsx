import React from "react";
import Editor from "@monaco-editor/react";
import { vars } from "../../theme/tokens.css.ts";

export interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  return (
    <Editor
      height="100%"
      defaultLanguage="markdown"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      options={{
        minimap: { enabled: false },
        fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: 14,
        lineHeight: 20,
        renderWhitespace: "selection",
        scrollBeyondLastLine: false,
        wordWrap: "on", // Enable word wrap
      }}
      loading={<div>Loading editor…</div>}
    />
  );
};
