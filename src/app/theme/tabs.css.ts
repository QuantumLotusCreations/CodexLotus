import { style } from "@vanilla-extract/css";
import { vars } from "./tokens.css.ts";

export const tabBarRoot = style({
  display: "flex",
  alignItems: "center",
  backgroundColor: vars.color.background.toolbar,
  borderBottom: `1px solid ${vars.color.border.subtle}`,
  overflowX: "auto", // Allow scrolling if many tabs
});

export const tabItem = style({
  display: "flex",
  alignItems: "center",
  gap: vars.spacing.xs,
  padding: `${vars.spacing.xs} ${vars.spacing.md}`,
  cursor: "pointer",
  backgroundColor: vars.color.background.tabInactive,
  color: vars.color.text.muted,
  borderRight: `1px solid ${vars.color.border.subtle}`,
  minWidth: "100px",
  maxWidth: "200px",
  fontSize: vars.typography.fontSize.sm,
  userSelect: "none",
  ":hover": {
    color: vars.color.text.secondary,
  }
});

export const tabItemActive = style([
  tabItem,
  {
    backgroundColor: vars.color.background.tabActive,
    color: vars.color.text.primary,
    borderTop: `2px solid ${vars.color.accent.primary}`,
  },
]);

export const tabCloseButton = style({
  width: "16px",
  height: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontSize: "10px",
  opacity: 0, // Hidden by default
  selectors: {
    [`${tabItem}:hover &`]: {
      opacity: 1,
    },
    "&:hover": {
        backgroundColor: "rgba(255,255,255,0.2)",
    }
  },
});
