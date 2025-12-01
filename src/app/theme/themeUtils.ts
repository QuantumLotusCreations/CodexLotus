import { vars } from "./tokens.css.ts";
import type { ThemeOverrides } from "../state/atoms/themeAtoms";

function getVarName(token: string) {
  const match = token.match(/^var\((--[^,)]+)/);
  return match ? match[1] : null;
}

export function applyThemeOverrides(overrides: ThemeOverrides) {
  const root = document.documentElement;

  // --- Background Group (Main/Canvas Surfaces) ---
  // These are the "App Background" elements.
  const backgroundTokens = [
    vars.color.background.base,
    vars.color.background.panel,         // Main content area
    vars.color.background.editor,        // Editor area
    vars.color.background.sidebar,       // Sidebar (matches canvas usually)
    vars.color.background.toolbar,       // Toolbars (matches canvas usually)
    vars.color.background.tabInactive,   // Inactive tabs blend into the background
  ];

  // --- Foreground Group (Raised/Accent Surfaces) ---
  // These are the "Foreground Panel" elements.
  const foregroundTokens = [
    vars.color.background.panelRaised,   // Cards, floating panels
    vars.color.background.tabActive,     // Active tabs stand out
  ];

  // 1. Apply App Background Overrides
  if (overrides.background) {
    backgroundTokens.forEach(token => {
      const varName = getVarName(token);
      if (varName) root.style.setProperty(varName, overrides.background!);
    });
  } else {
    // Revert to default tokens if no override
    backgroundTokens.forEach(token => {
      const varName = getVarName(token);
      if (varName) root.style.removeProperty(varName);
    });
  }

  // 2. Apply Foreground Panel Overrides
  if (overrides.foregroundPanel) {
    foregroundTokens.forEach(token => {
      const varName = getVarName(token);
      if (varName) root.style.setProperty(varName, overrides.foregroundPanel!);
    });
  } else {
    // Revert to default tokens if no override
    foregroundTokens.forEach(token => {
      const varName = getVarName(token);
      if (varName) root.style.removeProperty(varName);
    });
  }


  // Accent & Highlight-based Coloring
  const accentVar = getVarName(vars.color.accent.primary);
  const accentBrightVar = getVarName(vars.color.accent.primaryBright);
  const accentHighlightVar = getVarName(vars.color.accent.highlight);
  
  // Border & Scrollbar colors derived from accent/highlight if requested
  const borderStrongVar = getVarName(vars.color.border.strong);
  const borderAccentVar = getVarName(vars.color.border.accent);

  if (accentVar) {
    if (overrides.accent) {
      root.style.setProperty(accentVar, overrides.accent);
      // For simple mode, we might want to map accent to other accent vars too
      // or let them fallback if they were derived (they are not in tokens.css.ts)
      if (accentBrightVar) root.style.setProperty(accentBrightVar, overrides.accent); 
      if (accentHighlightVar) root.style.setProperty(accentHighlightVar, overrides.accent);
      
      // 1. Borders, Scrollbars, etc. controlled by highlight colors as requested
      if (borderStrongVar) root.style.setProperty(borderStrongVar, overrides.accent); // Affects scrollbars
      if (borderAccentVar) root.style.setProperty(borderAccentVar, overrides.accent); 
      
      // We can also target scrollbar specific CSS variables if we had them, 
      // but our global.css uses vars.color.border.strong for scrollbar thumb.
    } else {
      root.style.removeProperty(accentVar);
      if (accentBrightVar) root.style.removeProperty(accentBrightVar);
      if (accentHighlightVar) root.style.removeProperty(accentHighlightVar);
      if (borderStrongVar) root.style.removeProperty(borderStrongVar);
      if (borderAccentVar) root.style.removeProperty(borderAccentVar);
    }
  }

  // Text
  const textVar = getVarName(vars.color.text.primary);
  if (textVar) {
    if (overrides.text) {
      root.style.setProperty(textVar, overrides.text);
    } else {
      root.style.removeProperty(textVar);
    }
  }

  // Inputs (Custom vars)
  if (overrides.inputBg) {
    root.style.setProperty("--codexlotus-input-bg", overrides.inputBg);
  } else {
    root.style.removeProperty("--codexlotus-input-bg");
  }

  if (overrides.inputText) {
    root.style.setProperty("--codexlotus-input-text", overrides.inputText);
  } else {
    root.style.removeProperty("--codexlotus-input-text");
  }
}
