import { style } from "@vanilla-extract/css";
import { vars } from "./tokens.css";

export const titleBarRoot = style({
  height: "32px",
  backgroundColor: vars.color.background.panel,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 8px",
  borderBottom: `1px solid ${vars.color.border.subtle}`,
  userSelect: "none",
  WebkitAppRegion: "drag", // Standard
} as any);

// Helper for regions that shouldn't drag (like buttons)
export const noDrag = style({
  WebkitAppRegion: "no-drag",
} as any);

export const menuBar = style({
  display: "flex",
  gap: "4px",
  alignItems: "center",
  position: "relative", // Context for dropdown
});

export const menuItem = style({
  padding: "4px 8px",
  fontSize: vars.typography.fontSize.xs,
  color: vars.color.text.secondary,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  ":hover": {
    backgroundColor: vars.color.background.panelRaised,
    color: vars.color.text.primary,
  },
});

export const menuDropdown = style({
    position: "absolute",
    top: "100%",
    left: 0,
    backgroundColor: vars.color.background.panel,
    border: `1px solid ${vars.color.border.subtle}`,
    borderRadius: vars.radius.sm,
    boxShadow: vars.shadow.md,
    minWidth: "160px",
    padding: "4px 0",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
});

export const menuDropdownItem = style({
    padding: "6px 12px",
    fontSize: vars.typography.fontSize.xs,
    color: vars.color.text.primary,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    ":hover": {
        backgroundColor: vars.color.background.panelRaised,
    }
});

export const windowControls = style({
  display: "flex",
  gap: "0px",
});

export const windowButton = style({
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: vars.color.text.secondary,
  cursor: "pointer",
  border: "none",
  background: "transparent",
  fontSize: "14px",
  ":hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});

export const closeButton = style({
  selectors: {
    "&:hover": {
      backgroundColor: "#E81123",
      color: "#FFFFFF",
    },
  },
});
