import { style } from "@vanilla-extract/css";
import { vars } from "./tokens.css.ts";

export const statusBarRoot = style({
  height: 24,
  display: "flex",
  alignItems: "center",
  padding: `0 ${vars.spacing.md}`,
  backgroundColor: vars.color.background.toolbar,
  borderTop: `1px solid ${vars.color.border.subtle}`,
  color: vars.color.text.muted,
  fontSize: vars.typography.fontSize.xs,
});
