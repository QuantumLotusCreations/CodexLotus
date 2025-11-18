import { vars } from "./tokens.css.ts";
import type { ThemeOverrides } from "../state/atoms/themeAtoms";

export function applyThemeOverrides(overrides: ThemeOverrides) {
  const root = document.documentElement;

  if (overrides.background) {
    root.style.setProperty("--codexlotus-background", overrides.background);
  }
  if (overrides.accent) {
    root.style.setProperty("--codexlotus-accent", overrides.accent);
  }
  if (overrides.text) {
    root.style.setProperty("--codexlotus-text", overrides.text);
  }

  // Map custom vars into Vanilla Extract-driven tokens as needed.
  // For now, we primarily rely on static tokens; overrides are hooks for future expansion.
}
