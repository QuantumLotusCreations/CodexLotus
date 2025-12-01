import React, { useState, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { join } from "@tauri-apps/api/path";
import yaml from "js-yaml";
import { vars } from "../../theme/tokens.css";
import { MarkdownPreview } from "../../components/markdown/MarkdownPreview";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { exportContentAtom } from "../../state/atoms/exportAtoms";
import { createDirectory, writeFile, listFilesInDir, readFile } from "../../../lib/api/files";
import { TableTemplate, DEFAULT_TEMPLATE } from "../../../lib/templates/types";
import { DynamicForm } from "../../components/forms/DynamicForm";
import { TemplateEditor } from "./TemplateEditor";

// Define StatBlock locally for legacy support (and if we want to keep it as a built-in type)
// Or we can just rely on templates entirely.
// For now, we'll switch between "Legacy (Hardcoded)" and "Custom Templates" modes.

export const StatBlockDesignerTab: React.FC = () => {
  const projectRoot = useAtomValue(projectRootAtom);
  
  // Mode State: "designer" (filling out forms) or "editor" (creating templates)
  const [mode, setMode] = useState<"designer" | "editor">("designer");
  
  // Template State
  const [templates, setTemplates] = useState<TableTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATE.id);
  const [currentTemplate, setCurrentTemplate] = useState<TableTemplate>(DEFAULT_TEMPLATE);
  
  // Form Data
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [markdown, setMarkdown] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Load templates on mount
  useEffect(() => {
    if (!projectRoot) return;
    
    const loadTemplates = async () => {
        try {
            const templatesDir = await join(projectRoot, ".codex", "templates");
            // Ensure dir exists? Maybe not, just try to list
            const files = await listFilesInDir(templatesDir);
            
            const loadedTemplates: TableTemplate[] = [];
            
            for (const file of files) {
                if (file.endsWith(".json")) {
                    try {
                        const content = await readFile(await join(templatesDir, file));
                        const parsed = JSON.parse(content);
                        if (parsed.id && parsed.fields) {
                            loadedTemplates.push(parsed);
                        }
                    } catch (e) {
                        console.error(`Failed to parse template ${file}`, e);
                    }
                }
            }
            
            setTemplates([DEFAULT_TEMPLATE, ...loadedTemplates]);
        } catch (e) {
            // Directory likely doesn't exist yet, just use default
            setTemplates([DEFAULT_TEMPLATE]);
        }
    };
    
    loadTemplates();
  }, [projectRoot, mode]); // Reload when switching back from editor mode

  // Update current template when selection changes
  useEffect(() => {
    const found = templates.find(t => t.id === selectedTemplateId) || DEFAULT_TEMPLATE;
    setCurrentTemplate(found);
    
    // Reset form data to defaults
    const initialData: Record<string, any> = {};
    found.fields.forEach(f => {
        initialData[f.key] = f.defaultValue ?? "";
    });
    setFormData(initialData);
  }, [selectedTemplateId, templates]);

  // Generate Markdown
  useEffect(() => {
    // Structure data to support grouping
    const finalData: any = {
        template: currentTemplate.id,
    };

    // Separate regular fields from groups
    const groups: Record<string, Record<string, any>> = {};
    
    currentTemplate.fields.forEach(field => {
        const value = formData[field.key];
        if (value !== undefined && value !== "") {
            if (field.group) {
                if (!groups[field.group]) groups[field.group] = {};
                groups[field.group][field.key] = value;
            } else {
                finalData[field.key] = value;
            }
        }
    });

    // Merge groups into final data
    Object.entries(groups).forEach(([groupName, groupData]) => {
        finalData[groupName.toLowerCase()] = groupData;
    });
    
    const yamlStr = yaml.dump(finalData, { lineWidth: -1 });
    const newMarkdown = `\`\`\`codex\n${yamlStr}\`\`\``;
    setMarkdown(newMarkdown);
  }, [formData, currentTemplate]);

  const setExportContent = useSetAtom(exportContentAtom);
  useEffect(() => {
    setExportContent(markdown);
  }, [markdown, setExportContent]);


  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!projectRoot) return;

    try {
      const statBlocksDir = await join(projectRoot, "StatBlocks");
      await createDirectory(statBlocksDir);

      // Try to find a good name field
      const nameVal = formData["name"] || "Untitled";
      const safeName = String(nameVal).replace(/[<>:"/\\|?*]/g, '-');
      const fileName = `${safeName}.md`;
      const filePath = await join(statBlocksDir, fileName);

      await writeFile(filePath, markdown);
      alert(`Saved ${nameVal} to StatBlocks folder!`);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save. Check console for details.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    alert("Copied to clipboard!");
  };

  if (mode === "editor") {
      return <TemplateEditor onClose={() => setMode("designer")} />;
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Form Panel */}
      <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: 24, 
          borderRight: `1px solid ${vars.color.border.subtle}`,
          color: vars.color.text.primary
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Designer</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
                onClick={() => setMode("editor")}
                style={{ 
                    background: "none", 
                    border: `1px solid ${vars.color.border.subtle}`, 
                    borderRadius: 4,
                    padding: "6px 12px",
                    color: vars.color.text.secondary, 
                    cursor: "pointer",
                    fontSize: 12
                }}
            >
                Manage Templates
            </button>
            
            <button 
              onClick={handleSave}
              disabled={!projectRoot}
              style={{
                padding: "8px 16px",
                borderRadius: 4,
                border: "none",
                backgroundColor: !projectRoot ? vars.color.background.panelRaised : vars.color.accent.primary,
                color: !projectRoot ? vars.color.text.muted : vars.color.text.inverse,
                fontWeight: 600,
                cursor: !projectRoot ? "not-allowed" : "pointer",
                opacity: !projectRoot ? 0.7 : 1
              }}
              title={!projectRoot ? "Open a project first" : "Save to file"}
            >
              Save
            </button>
          </div>
        </div>

        {/* Template Selector */}
        <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: vars.color.text.secondary }}>Template</label>
            <select 
                className="input" 
                value={selectedTemplateId} 
                onChange={e => setSelectedTemplateId(e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.base, color: vars.color.text.primary }}
            >
                {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
            <div style={{ fontSize: 11, color: vars.color.text.muted, marginTop: 4 }}>
                {currentTemplate.description}
            </div>
        </div>

        {/* Dynamic Form */}
        <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, borderBottom: `1px solid ${vars.color.border.subtle}`, paddingBottom: 8, marginBottom: 16 }}>Properties</h3>
            <DynamicForm 
                fields={currentTemplate.fields} 
                values={formData} 
                onChange={handleFieldChange} 
            />
        </div>

      </div>

      {/* Preview Panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24, backgroundColor: "#1a1a1a" }}>
          <h3 style={{ color: vars.color.text.secondary, marginTop: 0 }}>Preview</h3>
          
          <div style={{ marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={showPreview} 
                    onChange={e => setShowPreview(e.target.checked)}
                  />
                  <span style={{ color: vars.color.text.primary, fontWeight: 500 }}>Show Live Preview</span>
              </label>
          </div>

          {showPreview && (
            <div style={{ marginBottom: 24 }}>
                <MarkdownPreview content={markdown} />
            </div>
          )}

          <h3 style={{ color: vars.color.text.secondary }}>Markdown Code</h3>
          <pre style={{ 
              backgroundColor: vars.color.background.panelRaised, 
              padding: 12, 
              borderRadius: 4, 
              fontSize: 12, 
              overflowX: "auto",
              whiteSpace: "pre-wrap" 
          }}>
              {markdown}
          </pre>
          <button 
            onClick={copyToClipboard}
            style={{
                marginTop: 8,
                padding: "8px 16px",
                borderRadius: 4,
                border: "none",
                backgroundColor: vars.color.accent.primary,
                color: vars.color.text.inverse,
                fontWeight: 600,
                cursor: "pointer"
            }}
          >
            Copy Code to Clipboard
          </button>
      </div>
    </div>
  );
};
