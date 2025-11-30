import React, { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { workspaceAtoms } from "../../state/atoms/workspaceAtoms";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { ai_chat_completion } from "../../../lib/api/ai";
import { readFile, writeFile } from "../../../lib/api/files";
import { extractSectionByLine } from "../../../lib/markdownUtils";
import { join } from "@tauri-apps/api/path";
import { MarkdownPreview } from "../../components/markdown/MarkdownPreview";
import { ContextSelector } from "./components/ContextSelector";

// Styles
const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  padding: "20px",
  boxSizing: "border-box",
  color: "#e0e0e0",
  overflow: "hidden",
};

const contentRowStyle: React.CSSProperties = {
  display: "flex",
  flex: 1,
  gap: "20px",
  minHeight: 0, // Important for nested scrolling
};

const formColumnStyle: React.CSSProperties = {
  flex: "0 0 350px",
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  overflowY: "auto",
  paddingRight: "10px",
};

const previewColumnStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#1e1e1e",
  borderRadius: "8px",
  border: "1px solid #333",
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px",
  backgroundColor: "#2a2a2a",
  border: "1px solid #444",
  color: "white",
  borderRadius: "4px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "5px",
  fontSize: "0.9em",
  color: "#aaa",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 15px",
  backgroundColor: "#007acc",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};

export const ProceduralGeneratorTab: React.FC = () => {
  const { tabs, activeTabId } = useAtomValue(workspaceAtoms.viewModelAtom);
  const projectRoot = useAtomValue(projectRootAtom);
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  const toolId = activeTab?.payload?.toolId as string;

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState(""); // Creature Type, Location Type, Item Type
  const [theme, setTheme] = useState(""); // Horror, Sci-Fi, High Fantasy
  const [details, setDetails] = useState(""); // Extra instructions
  
  // Context State
  // Stores "path" or "path::lineNumber"
  const [selectedContextItems, setSelectedContextItems] = useState<string[]>([]);
  
  // Output State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [saveFileName, setSaveFileName] = useState("");

  // Reset form when tool changes
  useEffect(() => {
    setName("");
    setType("");
    setTheme("");
    setDetails("");
    setGeneratedContent("");
    setSaveFileName("");
    setSelectedContextItems([]);
  }, [toolId]);

  const getToolConfig = () => {
    switch (toolId) {
      case "bestiary-generator":
        return {
          title: "Bestiary Generator",
          typeLabel: "Creature Type (e.g. Undead, Beast)",
          themeLabel: "Vibe/Biome (e.g. Swamp, Eldritch)",
          promptPrefix: "Generate a TTRPG stat block and lore description for a creature.",
          defaultFolder: "Bestiary"
        };
      case "location-generator":
        return {
          title: "Location Generator",
          typeLabel: "Scale/Type (e.g. Village, Planet, Dungeon Room)",
          themeLabel: "Theme/Atmosphere",
          promptPrefix: "Generate a detailed setting description, including sensory details, points of interest, and hooks.",
          defaultFolder: "Locations"
        };
      case "item-generator":
        return {
          title: "Item & Culture Generator",
          typeLabel: "Category (e.g. Weapon, Artifact, Faction)",
          themeLabel: "Tech Level / Cultural Style",
          promptPrefix: "Generate a detailed description and mechanics for an item, technology, or cultural faction.",
          defaultFolder: "Items"
        };
      default:
        return {
          title: "Generator",
          typeLabel: "Type",
          themeLabel: "Theme",
          promptPrefix: "Generate content.",
          defaultFolder: "Generated"
        };
    }
  };

  const config = getToolConfig();

  const handleGenerate = async () => {
    if (!name) return;
    setIsGenerating(true);

    try {
      // 1. Load Context
      let contextContent = "";
      
      // Process each selected item
      for (const item of selectedContextItems) {
        try {
            // Check if it's a specific header (path::lineNumber) or whole file (path)
            // Split only on the last instance of :: in case path has :: (rare but possible on some OS?)
            // Standard split is safe if we assume path doesn't contain ::
            const parts = item.split("::");
            const path = parts[0];
            const lineStr = parts.length > 1 ? parts[1] : null;
            
            const content = await readFile(path);
            const filename = path.split(/[/\\]/).pop();
            
            let finalContent = content;
            let contextLabel = `Context from file '${filename}'`;
            
            if (lineStr) {
                const lineNum = parseInt(lineStr, 10);
                if (!isNaN(lineNum)) {
                   finalContent = extractSectionByLine(content, lineNum);
                   contextLabel = `Context from '${filename}' section (line ${lineNum})`;
                }
            }
            
            contextContent += `\n---\n${contextLabel}:\n${finalContent}\n---\n`;
            
        } catch (e) {
            console.error(`Failed to read context item ${item}`, e);
        }
      }

      // 2. Build Prompt
      const prompt = `
        ${config.promptPrefix}
        
        **Specifications:**
        - Name: ${name}
        - Type: ${type}
        - Theme/Vibe: ${theme}
        - Additional Instructions: ${details}
        
        **Context to respect (Consistency required):**
        ${contextContent ? contextContent : "No specific context provided."}
        
        **Output Format:**
        Markdown. Use headers. Include a Stat Block section if applicable.
      `;

      // 3. Call AI
      const response = await ai_chat_completion({
        prompt,
        project_root: projectRoot || undefined,
        provider: "openai"
      });

      setGeneratedContent(response.content);
      setSaveFileName(`${name.replace(/\s+/g, "_")}.md`);

    } catch (error) {
      console.error("Generation failed:", error);
      setGeneratedContent("Error generating content. Please check the console and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!projectRoot || !saveFileName || !generatedContent) return;
    try {
        const fullPath = await join(projectRoot, saveFileName);
        await writeFile(fullPath, generatedContent);
        alert(`Saved to ${saveFileName}`);
    } catch (e) {
        console.error("Save failed:", e);
        alert("Failed to save file.");
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ marginTop: 0 }}>{config.title}</h2>
      
      <div style={contentRowStyle}>
        {/* Left Column: Inputs */}
        <div style={formColumnStyle}>
          <div>
            <label style={labelStyle}>Name / Title</label>
            <input 
                style={inputStyle} 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. 'The Gloom Stalker'"
            />
          </div>

          <div>
            <label style={labelStyle}>{config.typeLabel}</label>
            <input 
                style={inputStyle} 
                value={type} 
                onChange={(e) => setType(e.target.value)} 
                placeholder="Type..."
            />
          </div>

          <div>
            <label style={labelStyle}>{config.themeLabel}</label>
            <input 
                style={inputStyle} 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)} 
                placeholder="Theme..."
            />
          </div>

          <div>
            <label style={labelStyle}>Additional Details</label>
            <textarea 
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} 
                value={details} 
                onChange={(e) => setDetails(e.target.value)} 
                placeholder="Specific mechanics, behavior, or lore notes..."
            />
          </div>

          <ContextSelector onSelectionChange={setSelectedContextItems} />

          <button 
            style={{ ...buttonStyle, opacity: isGenerating ? 0.7 : 1 }} 
            onClick={handleGenerate}
            disabled={isGenerating || !name}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Right Column: Preview */}
        <div style={previewColumnStyle}>
            <div style={{ 
                padding: "10px", 
                borderBottom: "1px solid #333", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                backgroundColor: "#252526"
            }}>
                <span style={{ fontWeight: "bold", fontSize: "0.9em" }}>Preview</span>
                <div style={{ display: "flex", gap: "10px" }}>
                    {generatedContent && (
                        <>
                            <input 
                                style={{ ...inputStyle, width: "200px", padding: "4px" }} 
                                value={saveFileName} 
                                onChange={(e) => setSaveFileName(e.target.value)}
                                placeholder="Filename.md"
                            />
                            <button 
                                style={{ ...buttonStyle, padding: "5px 10px", fontSize: "0.8em" }}
                                onClick={handleSave}
                            >
                                Save File
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
                {generatedContent ? (
                    <MarkdownPreview content={generatedContent} />
                ) : (
                    <div style={{ color: "#666", textAlign: "center", marginTop: "50px" }}>
                        Configure settings and click Generate to see results.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
