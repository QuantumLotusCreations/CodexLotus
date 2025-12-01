import React, { useState } from "react";
import { vars } from "../../theme/tokens.css";

interface LayoutToolbarProps {
  onInsert: (text: string) => void;
  onInsertStatBlock: () => void;
}

export const LayoutToolbar: React.FC<LayoutToolbarProps> = ({ onInsert, onInsertStatBlock }) => {
  return (
    <div style={{ 
        display: "flex", 
        gap: 4, 
        padding: "4px 8px", 
        borderBottom: `1px solid ${vars.color.border.subtle}`,
        backgroundColor: vars.color.background.panel,
        flexWrap: "wrap"
    }}>
        <button title="2 Columns" onClick={() => onInsert("\n:::col2\n\n:::\n")} style={btnStyle}>Columns (2)</button>
        <button title="3 Columns" onClick={() => onInsert("\n:::col3\n\n:::\n")} style={btnStyle}>Columns (3)</button>
        <div style={dividerStyle} />
        <button title="Aside Box" onClick={() => onInsert("\n:::aside\n**Note:** \n:::\n")} style={btnStyle}>Aside Box</button>
        <button title="Page Break" onClick={() => onInsert("\n:::pagebreak\n:::\n")} style={btnStyle}>Page Break</button>
        <button title="Avoid Break" onClick={() => onInsert("\n:::avoid\n\n:::\n")} style={btnStyle}>Avoid Break</button>
        <div style={dividerStyle} />
        <button 
            onClick={onInsertStatBlock}
            style={{ ...btnStyle, color: vars.color.accent.primary, fontWeight: 600 }}
        >
            + Insert Stat Block
        </button>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
    background: "none",
    border: `1px solid ${vars.color.border.subtle}`,
    borderRadius: 4,
    color: vars.color.text.secondary,
    fontSize: 11,
    padding: "2px 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    height: 24
};

const dividerStyle: React.CSSProperties = {
    width: 1,
    backgroundColor: vars.color.border.subtle,
    margin: "0 4px"
};

