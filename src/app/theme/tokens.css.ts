import { createGlobalTheme } from "@vanilla-extract/css";

// Token values derived from CodexLotus Master Token JSON in the DevGuide.

export const vars = createGlobalTheme(":root", {
  color: {
    background: {
      base: "#0B1C17",
      panel: "#102821",
      panelRaised: "#1E4638",
      toolbar: "#102821",
      editor: "#0B1C17",
      sidebar: "#102821",
      tabActive: "#1E4638",
      tabInactive: "#102821",
      overlay: "rgba(0,0,0,0.5)",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#E6E6E6",
      muted: "#999999",
      disabled: "#666666",
      accent: "#F5C96A",
      inverse: "#000000",
    },
    accent: {
      primary: "#D6AA3D",
      primaryBright: "#F5C96A",
      highlight: "#F0D68A",
    },
    border: {
      subtle: "rgba(255,255,255,0.06)",
      strong: "rgba(255,255,255,0.15)",
      accent: "#D6AA3D",
    },
    state: {
      success: "#4CC38A",
      warning: "#F5C96A",
      danger: "#FF6B6B",
      info: "#4C9BC3",
    },
  },
  typography: {
    fontFamily: {
      body: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "20px",
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
  shadow: {
    sm: "0px 1px 2px rgba(0,0,0,0.4)",
    md: "0px 3px 6px rgba(0,0,0,0.45)",
  },
});
