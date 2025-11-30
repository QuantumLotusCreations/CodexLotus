import React, { useState } from "react";
import { useAtomValue } from "jotai";
import { join } from "@tauri-apps/api/path";
import { vars } from "../../theme/tokens.css";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { createDirectory, writeFile } from "../../../lib/api/files";
import { TableTemplate, TemplateField, FieldType } from "../../../lib/templates/types";

export const TemplateEditor: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const projectRoot = useAtomValue(projectRootAtom);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"entity" | "collection">("entity");
  const [fields, setFields] = useState<TemplateField[]>([]);

  const addField = () => {
    setFields([
      ...fields,
      {
        key: `field_${Date.now()}`,
        label: "New Field",
        type: "text",
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    // Auto-update key based on label if it hasn't been manually set (simple heuristic)
    if (updates.label && !updates.key) {
        newFields[index].key = updates.label.toLowerCase().replace(/[^a-z0-9]/g, "_");
    }
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!projectRoot || !name) return;

    try {
      const templateId = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const template: TableTemplate = {
        id: templateId,
        name,
        type,
        description,
        fields,
      };

      const templatesDir = await join(projectRoot, ".codex", "templates");
      await createDirectory(templatesDir);
      
      const filePath = await join(templatesDir, `${templateId}.json`);
      await writeFile(filePath, JSON.stringify(template, null, 2));
      
      alert("Template saved successfully!");
      onClose();
    } catch (err) {
      console.error("Failed to save template:", err);
      alert("Failed to save template.");
    }
  };

  return (
    <div style={{ padding: 24, color: vars.color.text.primary, height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Create New Template</h2>
        <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{ background: "none", border: "none", color: vars.color.text.secondary, cursor: "pointer" }}>Cancel</button>
            <button 
                onClick={handleSave}
                disabled={!name}
                style={{ 
                    padding: "8px 16px", 
                    backgroundColor: vars.color.accent.primary, 
                    border: "none", 
                    borderRadius: 4, 
                    color: vars.color.text.inverse,
                    fontWeight: 600,
                    cursor: name ? "pointer" : "not-allowed",
                    opacity: name ? 1 : 0.5
                }}
            >
                Save Template
            </button>
        </div>
      </div>

      <div style={{ marginBottom: 24, display: "grid", gap: 16 }}>
        <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Template Name</label>
            <input 
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Space Ship, Magic Spell, NPC"
                style={{ width: "100%", padding: 8, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.base, color: vars.color.text.primary }}
            />
        </div>
        <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Type</label>
            <select
                value={type}
                onChange={e => setType(e.target.value as "entity" | "collection")}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.base, color: vars.color.text.primary }}
            >
                <option value="entity">Single Entity (e.g. Monster, Item)</option>
                <option value="collection">Collection (e.g. Roll Table, Loot List)</option>
            </select>
        </div>
        <div>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Description</label>
            <textarea 
                className="input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this template used for?"
                style={{ width: "100%", padding: 8, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.base, color: vars.color.text.primary, minHeight: 60 }}
            />
        </div>
      </div>

      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Fields</h3>
        <button 
            onClick={addField}
            style={{ color: vars.color.accent.primary, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
        >
            + Add Field
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map((field, index) => (
            <div key={index} style={{ padding: 12, backgroundColor: vars.color.background.panelRaised, borderRadius: 6, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, color: vars.color.text.muted }}>Label</label>
                        <input 
                            value={field.label}
                            onChange={e => updateField(index, { label: e.target.value })}
                            style={{ width: "100%", padding: 6, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.base, color: vars.color.text.primary }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, color: vars.color.text.muted }}>Key (internal ID)</label>
                        <input 
                            value={field.key}
                            onChange={e => updateField(index, { key: e.target.value })}
                            style={{ width: "100%", padding: 6, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.base, color: vars.color.text.primary, fontFamily: "monospace" }}
                        />
                    </div>
                    <div style={{ width: 100 }}>
                        <label style={{ fontSize: 10, color: vars.color.text.muted }}>Type</label>
                        <select 
                            value={field.type}
                            onChange={e => updateField(index, { type: e.target.value as FieldType })}
                            style={{ width: "100%", padding: 6, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.base, color: vars.color.text.primary }}
                        >
                            <option value="text">Text</option>
                            <option value="textarea">Long Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Checkbox</option>
                            <option value="list">List</option>
                            <option value="select">Dropdown</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, color: vars.color.text.muted }}>Group (Optional)</label>
                        <input 
                            value={field.group || ""}
                            onChange={e => updateField(index, { group: e.target.value || undefined })}
                            placeholder="e.g. Stats, Saves"
                            style={{ width: "100%", padding: 6, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.base, color: vars.color.text.primary }}
                        />
                    </div>
                     <button 
                        onClick={() => removeField(index)}
                        style={{ marginTop: 16, color: vars.color.state.danger, background: "none", border: "none", cursor: "pointer" }}
                        title="Remove Field"
                    >
                        ✕
                    </button>
                </div>
                
                {/* Extra options based on type */}
                {field.type === "select" && (
                    <div>
                        <label style={{ fontSize: 10, color: vars.color.text.muted }}>Options (comma separated)</label>
                        <input 
                            value={field.options?.join(", ") || ""}
                            onChange={e => updateField(index, { options: e.target.value.split(",").map(s => s.trim()) })}
                            placeholder="Option 1, Option 2..."
                            style={{ width: "100%", padding: 6, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.base, color: vars.color.text.primary }}
                        />
                    </div>
                )}
            </div>
        ))}
        {fields.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: vars.color.text.muted, border: `1px dashed ${vars.color.border.subtle}`, borderRadius: 6 }}>
                No fields added yet. Click "+ Add Field" to start.
            </div>
        )}
      </div>
    </div>
  );
};

