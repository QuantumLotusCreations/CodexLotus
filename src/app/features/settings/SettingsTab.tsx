import React from "react";

export const SettingsTab: React.FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <h2>Settings</h2>
      <section>
        <h3>AI Providers</h3>
        <p>Configure your LLM provider and API keys (stored via Tauri encrypted storage).</p>
      </section>
      <section>
        <h3>Theme</h3>
        <p>Customize background, accent, and text colors for CodexLotus.</p>
      </section>
    </div>
  );
};
