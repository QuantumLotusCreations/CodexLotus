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
