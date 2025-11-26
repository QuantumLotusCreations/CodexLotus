import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./tokens.css.ts";

globalStyle("*", {
  boxSizing: "border-box",
});

globalStyle("html, body, #root", {
  margin: 0,
  padding: 0,
  width: "100%",
  height: "100%",
});

globalStyle("body", {
  backgroundColor: vars.color.background.base,
  color: vars.color.text.primary,
  fontFamily: vars.typography.fontFamily.body,
  fontSize: vars.typography.fontSize.md,
});

globalStyle("#root", {
  display: "flex",
  minHeight: "100vh",
});

// --- Custom Scrollbar Styles ---
globalStyle("::-webkit-scrollbar", {
  width: "8px",
  height: "8px",
});

globalStyle("::-webkit-scrollbar-track", {
  backgroundColor: "transparent",
});

globalStyle("::-webkit-scrollbar-thumb", {
  backgroundColor: vars.color.border.strong,
  borderRadius: vars.radius.sm,
});

globalStyle("::-webkit-scrollbar-thumb:hover", {
  backgroundColor: vars.color.text.muted,
});

globalStyle("::-webkit-scrollbar-corner", {
  backgroundColor: "transparent",
});

// --- Markdown Content (General) ---
globalStyle(".markdown-body", {
  lineHeight: 1.6,
  fontSize: vars.typography.fontSize.md,
});

globalStyle(".markdown-body h1, .markdown-body h2, .markdown-body h3", {
  color: vars.color.text.accent,
  marginTop: vars.spacing.lg,
  marginBottom: vars.spacing.md,
});

globalStyle(".markdown-body p", {
  marginBottom: vars.spacing.md,
});

globalStyle(".markdown-body pre", {
  backgroundColor: vars.color.background.panel,
  padding: vars.spacing.md,
  borderRadius: vars.radius.md,
  overflowX: "auto",
});

// --- TTRPG Stat Block Styles ---
globalStyle(".c-statblock", {
  backgroundColor: "#fdf1dc", // Parchment-like
  color: "#58180D", // Reddish-brown ink
  fontFamily: "Noto Sans, sans-serif",
  padding: vars.spacing.md,
  borderRadius: vars.radius.sm,
  boxShadow: "0 0 6px rgba(0,0,0,0.5)",
  margin: `${vars.spacing.lg} 0`,
  border: "1px solid #e0c99a",
  maxWidth: "400px",
});

globalStyle(".c-statblock__header", {
  marginBottom: vars.spacing.sm,
});

globalStyle(".c-statblock__name", {
  fontFamily: "serif", // Or a fancy header font
  fontSize: "24px",
  fontWeight: "bold",
  margin: 0,
  color: "#58180D",
  textTransform: "uppercase",
  letterSpacing: "1px",
});

globalStyle(".c-statblock__meta", {
  fontStyle: "italic",
  fontSize: "12px",
});

globalStyle(".c-statblock__divider", {
  border: "0",
  height: "2px",
  backgroundImage: "linear-gradient(to right, transparent, #58180D, transparent)",
  margin: "6px 0",
});

globalStyle(".c-statblock__attributes", {
  color: "#58180D",
  fontSize: "14px",
  lineHeight: "1.4",
});

globalStyle(".c-statblock__attribute strong", {
  fontWeight: "bold",
});

globalStyle(".c-statblock__abilities", {
  display: "flex",
  justifyContent: "space-around",
  textAlign: "center",
  margin: "8px 0",
});

globalStyle(".c-statblock__ability-name", {
  fontWeight: "bold",
  fontSize: "10px",
});

globalStyle(".c-statblock__ability-score", {
  fontSize: "14px",
});

globalStyle(".c-statblock__section-header", {
  borderBottom: "1px solid #58180D",
  color: "#58180D",
  fontSize: "18px",
  fontFamily: "serif",
  marginTop: vars.spacing.md,
  marginBottom: vars.spacing.xs,
  paddingBottom: "2px",
});

globalStyle(".c-statblock__trait, .c-statblock__action", {
  marginBottom: vars.spacing.xs,
  fontSize: "14px",
});

globalStyle(".c-statblock__feature-name", {
  fontStyle: "italic",
  fontWeight: "bold",
});
