import { style } from "@vanilla-extract/css";
import { vars } from "./tokens.css.ts";

export const appShell = {
  root: style({
    display: "flex",
    width: "100%",
    height: "100vh",
    backgroundColor: vars.color.background.base,
    color: vars.color.text.primary,
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
  }),
};
