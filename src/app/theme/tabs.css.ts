import { style } from "@vanilla-extract/css";
import { vars } from "./tokens.css.ts";

export const tabBarRoot = style({
  display: "flex",
  alignItems: "center",
  backgroundColor: vars.color.background.toolbar,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
});

export const tabItem = style({
  padding: `${vars.spacing.xs} ${vars.spacing.md}`,
  cursor: "pointer",
  backgroundColor: vars.color.background.tabInactive,
  color: vars.color.text.muted,
});

export const tabItemActive = style([
  tabItem,
  {
    backgroundColor: vars.color.background.tabActive,
    color: vars.color.text.primary,
  },
]);
