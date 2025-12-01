import { style } from "@vanilla-extract/css";
import { vars } from "./tokens.css.ts";

export const appShell = {
  root: style({
    display: "flex",
    flexDirection: "column", // Changed to column to stack TitleBar
    width: "100%",
    height: "100vh",
    backgroundColor: vars.color.background.base,
    color: vars.color.text.primary,
    overflow: "hidden",
  }),
  workspaceRow: style({ // New wrapper for Sidebar + Main
      display: "flex",
      flex: 1,
      minHeight: 0,
      width: "100%",
  }),
  main: style({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  }),
  content: style({
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    backgroundColor: vars.color.background.panel,
    borderTop: `1px solid ${vars.color.border.subtle}`,
    borderBottom: `1px solid ${vars.color.border.subtle}`,
    display: "flex",
    flexDirection: "column",
  }),
  workspaceContainer: style({
    display: "flex",
    flex: 1,
    overflow: "hidden",
  }),
  centerPane: style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    position: "relative",
  }),
  rightPanel: style({
    display: "flex",
    flexDirection: "column",
    borderLeft: `1px solid ${vars.color.border.subtle}`,
    backgroundColor: vars.color.background.panel,
    height: "100%",
  }),
  resizer: style({
    width: "4px",
    cursor: "col-resize",
    backgroundColor: vars.color.background.panel,
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: vars.color.accent.primary,
    },
    zIndex: 10,
    flexShrink: 0,
  }),
};
