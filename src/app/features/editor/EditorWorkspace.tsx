import React, { useState } from "react";
import { useAtomValue } from "jotai";
import { MarkdownEditor } from "./MarkdownEditor";
import { activeFilePathAtom } from "../../state/atoms/projectAtoms";

export const EditorWorkspace: React.FC = () => {
  const activePath = useAtomValue(activeFilePathAtom);
  const [value, setValue] = useState<string>("# Welcome to CodexLotus\n\nStart your rulebook here…");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 8, fontSize: 12, opacity: 0.8 }}>
        {activePath ? activePath : "No file open"}
      </div>
      <div style={{ flex: 1 }}>
        <MarkdownEditor value={value} onChange={setValue} />
      </div>
    </div>
  );
};
