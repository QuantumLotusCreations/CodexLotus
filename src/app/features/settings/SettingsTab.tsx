import React, { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { call } from "../../../lib/api/client";
import { initializeProjectIndex } from "../../../lib/api/rag";
import { vars } from "../../theme/tokens.css.ts";
import { projectRootAtom } from "../../state/atoms/projectAtoms";

export const SettingsTab: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [status, setStatus] = useState("");
  const [indexStatus, setIndexStatus] = useState("");
  const [isIndexing, setIsIndexing] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [chatModel, setChatModel] = useState("gpt-4o-mini");
  const [settingsStatus, setSettingsStatus] = useState("");
  
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
        const settings = await call<any>("load_settings");
        if (settings) {
            setProvider(settings.provider || "openai");
            setChatModel(settings.chat_model || "gpt-4o-mini");
        }
    } catch(e) {
        console.error(e);
    }
  }

  async function handleSaveSettings() {
    try {
        await call("save_settings", {
            settings: {
                provider,
                chat_model: chatModel,
                embedding_model: "text-embedding-3-small", // default
                theme_accent: null
            }
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
        maxWidth: 600, 
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
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
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
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value)}
                style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 4,
                    border: `1px solid ${vars.color.border.subtle}`,
                    backgroundColor: vars.color.background.base,
                    color: vars.color.text.primary
                }}
            >
                {provider === "openai" ? (
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
              {provider === "openai" ? "OpenAI API Key" : "Google AI API Key"}
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
        <h3 style={{ color: vars.color.text.accent, marginBottom: 16 }}>Project Indexing</h3>
        <div style={{ backgroundColor: vars.color.background.panelRaised, padding: 20, borderRadius: 8 }}>
            <p style={{ marginBottom: 12 }}>
                Current Project: <strong>{projectRoot || "None"}</strong>
            </p>
            <p style={{ marginBottom: 16, fontSize: 14, color: vars.color.text.secondary }}>
                Indexing allows the AI to search your entire rulebook to answer questions. 
                It creates a local database of embeddings. This costs OpenAI API credits (currently only OpenAI embeddings supported).
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
