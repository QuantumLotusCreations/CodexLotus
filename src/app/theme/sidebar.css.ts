import { style } from "@vanilla-extract/css";
import { vars } from "./tokens.css.ts";

export const sidebarRoot = style({
  width: "100%",
  backgroundColor: vars.color.background.sidebar,
  borderRight: `1px solid ${vars.color.border.subtle}`,
  display: "flex",
  flexDirection: "column",
});

export const sidebarHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.sm,
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
});

export const sidebarLogo = style({
  width: 24,
  height: 24,
  borderRadius: 6,
});

export const sidebarTitle = style({
  fontWeight: 600,
  letterSpacing: 0.5,
});
