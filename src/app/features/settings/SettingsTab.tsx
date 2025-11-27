import React, { useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { call } from "../../../lib/api/client";
import { initializeProjectIndex } from "../../../lib/api/rag";
import { vars } from "../../theme/tokens.css.ts";
import { projectRootAtom } from "../../state/atoms/projectAtoms";
import { settingsAtom } from "../../state/atoms/settingsAtoms";
import { MarkdownPreview } from "../../components/markdown/MarkdownPreview";

const PREVIEW_STATBLOCK = `\`\`\`statblock
name: Preview Monster
size: Medium
type: construct
alignment: unaligned
ac: 15
hp: 50
speed: 30 ft.
stats:
  str: 16
  dex: 12
  con: 14
  int: 8
  wis: 10
  cha: 6
\`\`\``;

export const SettingsTab: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [status, setStatus] = useState("");
  const [indexStatus, setIndexStatus] = useState("");
  const [isIndexing, setIsIndexing] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState("");
  
  // Use the global atom for settings so updates propagate live
  const [settings, setSettings] = useAtom(settingsAtom);
  
  const projectRoot = useAtomValue(projectRootAtom);

  useEffect(() => {
    checkKey();
    loadSettings();
  }, []);

  async function checkKey() {
    try {
      const exists = await call<boolean>("check_api_key");
      setHasKey(exists);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSettings() {
    try {
        const loaded = await call<any>("load_settings");
        if (loaded) {
            setSettings({
                provider: loaded.provider || "openai",
                chat_model: loaded.chat_model || "gpt-4o-mini",
                embedding_model: "text-embedding-3-small",
                theme_accent: loaded.theme_accent,
                statblock_bg_color: loaded.statblock_bg_color || "#fdf1dc",
                statblock_font_color: loaded.statblock_font_color || "#58180D"
            });
        }
    } catch(e) {
        console.error(e);
    }
  }

  async function handleSaveSettings() {
    try {
        await call("save_settings", {
            settings
        });
        setSettingsStatus("Settings saved.");
        setTimeout(() => setSettingsStatus(""), 3000);
    } catch (e) {
        setSettingsStatus("Error saving: " + String(e));
    }
  }

  async function handleSaveKey() {
    try {
      await call("save_api_key", { key: apiKey });
      setApiKey("");
      setStatus("API Key saved securely!");
      checkKey();
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("Error saving key: " + String(e));
    }
  }

  async function handleIndexProject() {
    if (!projectRoot) {
      setIndexStatus("No project root selected.");
      return;
    }
    if (!hasKey) {
      setIndexStatus("Cannot index: API Key missing.");
      return;
    }

    setIsIndexing(true);
    setIndexStatus("Indexing...");
    try {
      await initializeProjectIndex(projectRoot);
      setIndexStatus("Project indexed successfully!");
    } catch (e) {
      setIndexStatus("Error indexing: " + String(e));
    } finally {
      setIsIndexing(false);
    }
  }

  return (
    <div style={{ 
        padding: 32, 
        maxWidth: "100%", 
        color: vars.color.text.primary, 
        height: "100%", 
        overflowY: "auto" // Enable scrolling
    }}>
      <h2 style={{ marginBottom: 24, borderBottom: `1px solid ${vars.color.border.subtle}`, paddingBottom: 8 }}>
        Settings
      </h2>
      
      <section style={{ marginBottom: 32 }}>
        <h3 style={{ color: vars.color.text.accent, marginBottom: 16 }}>AI Configuration</h3>
        <div style={{ backgroundColor: vars.color.background.panelRaised, padding: 20, borderRadius: 8 }}>
          
          {/* Provider Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>AI Provider</label>
            <select 
                value={settings.provider}
                onChange={(e) => setSettings(prev => ({ ...prev, provider: e.target.value }))}
                style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 4,
                    border: `1px solid ${vars.color.border.subtle}`,
                    backgroundColor: vars.color.background.base,
                    color: vars.color.text.primary
                }}
            >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
            </select>
          </div>

          {/* Model Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Chat Model</label>
            <select 
                value={settings.chat_model}
                onChange={(e) => setSettings(prev => ({ ...prev, chat_model: e.target.value }))}
                style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 4,
                    border: `1px solid ${vars.color.border.subtle}`,
                    backgroundColor: vars.color.background.base,
                    color: vars.color.text.primary
                }}
            >
                {settings.provider === "openai" ? (
                    <>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </>
                ) : (
                    <>
                        <option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
                    </>
                )}
            </select>
          </div>

          <button
            onClick={handleSaveSettings}
            style={{
                padding: "8px 16px",
                borderRadius: 4,
                border: "none",
                backgroundColor: vars.color.accent.primary,
                color: vars.color.text.inverse,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 16
            }}
          >
            Save Configuration
          </button>
          {settingsStatus && <div style={{ marginBottom: 16, color: vars.color.state.info, fontSize: 14 }}>{settingsStatus}</div>}


          <div style={{ marginBottom: 16, borderTop: `1px solid ${vars.color.border.subtle}`, paddingTop: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              {settings.provider === "openai" ? "OpenAI API Key" : "Google AI API Key"}
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasKey ? "API Key is set (enter new one to update)" : "sk-..."}
                style={{ 
                  flex: 1, 
                  padding: "8px 12px", 
                  borderRadius: 4, 
                  border: `1px solid ${vars.color.border.subtle}`,
                  backgroundColor: vars.color.background.base,
                  color: vars.color.text.primary
                }}
              />
              <button
                onClick={handleSaveKey}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: vars.color.accent.primary,
                  color: vars.color.text.inverse,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Save Key
              </button>
            </div>
            {status && <div style={{ marginTop: 8, color: vars.color.state.success, fontSize: 14 }}>{status}</div>}
            <div style={{ marginTop: 8, fontSize: 12, color: vars.color.text.muted }}>
              Your key is stored securely in your operating system's keychain. It is never sent to our servers.
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ color: vars.color.text.accent, marginBottom: 16 }}>Stat Block Customization</h3>
        <div style={{ backgroundColor: vars.color.background.panelRaised, padding: 20, borderRadius: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Background Color</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input 
                                type="color" 
                                value={settings.statblock_bg_color || "#fdf1dc"}
                                onChange={(e) => setSettings(prev => ({ ...prev, statblock_bg_color: e.target.value }))}
                                style={{ height: 38, width: 60, padding: 0, border: "none", cursor: "pointer" }}
                            />
                            <input 
                                type="text"
                                value={settings.statblock_bg_color || "#fdf1dc"}
                                onChange={(e) => setSettings(prev => ({ ...prev, statblock_bg_color: e.target.value }))}
                                style={{ 
                                    flex: 1,
                                    padding: "8px", 
                                    borderRadius: 4, 
                                    border: `1px solid ${vars.color.border.subtle}`,
                                    backgroundColor: vars.color.background.base,
                                    color: vars.color.text.primary
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Font Color</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input 
                                type="color" 
                                value={settings.statblock_font_color || "#58180D"}
                                onChange={(e) => setSettings(prev => ({ ...prev, statblock_font_color: e.target.value }))}
                                style={{ height: 38, width: 60, padding: 0, border: "none", cursor: "pointer" }}
                            />
                            <input 
                                type="text"
                                value={settings.statblock_font_color || "#58180D"}
                                onChange={(e) => setSettings(prev => ({ ...prev, statblock_font_color: e.target.value }))}
                                style={{ 
                                    flex: 1,
                                    padding: "8px", 
                                    borderRadius: 4, 
                                    border: `1px solid ${vars.color.border.subtle}`,
                                    backgroundColor: vars.color.background.base,
                                    color: vars.color.text.primary
                                }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, statblock_bg_color: "#fdf1dc", statblock_font_color: "#58180D" }))}
                        style={{
                            padding: "6px 12px",
                            borderRadius: 4,
                            border: `1px solid ${vars.color.border.subtle}`,
                            backgroundColor: "transparent",
                            color: vars.color.text.secondary,
                            fontSize: 12,
                            cursor: "pointer"
                        }}
                    >
                        Reset to Defaults
                    </button>
                </div>
                <div style={{ border: `1px solid ${vars.color.border.subtle}`, borderRadius: 4, overflow: "hidden", backgroundColor: "#1a1a1a" }}>
                    <div style={{ padding: 8, borderBottom: `1px solid ${vars.color.border.subtle}`, fontSize: 12, color: vars.color.text.secondary, backgroundColor: vars.color.background.panel }}>
                        Preview
                    </div>
                    <div style={{ height: 300, overflowY: "auto" }}>
                        <MarkdownPreview content={PREVIEW_STATBLOCK} />
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ color: vars.color.text.accent, marginBottom: 16 }}>Project Indexing</h3>
        <div style={{ backgroundColor: vars.color.background.panelRaised, padding: 20, borderRadius: 8 }}>
            <p style={{ marginBottom: 12 }}>
                Current Project: <strong>{projectRoot || "None"}</strong>
            </p>
            <p style={{ marginBottom: 16, fontSize: 14, color: vars.color.text.secondary }}>
                Indexing creates a local database of "embeddings" (semantic vectors) for your files. 
                This allows the AI to search your entire rulebook to answer questions accurately. 
                <br/><br/>
                Costs:
                <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                    <li><strong>OpenAI:</strong> Costs a small amount of API credits per index.</li>
                    <li><strong>Google Gemini:</strong> Often free within rate limits (depending on your tier).</li>
                </ul>
            </p>
            <button
                onClick={handleIndexProject}
                disabled={isIndexing || !projectRoot || !hasKey}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: isIndexing ? vars.color.background.tabInactive : vars.color.accent.primary,
                  color: vars.color.text.inverse,
                  fontWeight: 600,
                  cursor: isIndexing || !projectRoot || !hasKey ? "not-allowed" : "pointer"
                }}
            >
                {isIndexing ? "Indexing..." : "Index Project Now"}
            </button>
            {indexStatus && <div style={{ marginTop: 8, color: indexStatus.includes("Error") ? vars.color.state.danger : vars.color.state.success, fontSize: 14 }}>{indexStatus}</div>}
        </div>
      </section>
    </div>
  );
};
