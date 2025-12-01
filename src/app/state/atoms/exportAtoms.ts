import { atom } from "jotai";

export interface ExportOptions {
  format: "html" | "pdf";
  theme: "screen" | "print" | "custom";
  customColors?: {
    background: string;
    text: string;
    accent: string;
  };
  includeCover: boolean;
  includeTOC: boolean;
}

export const isExportDialogOpenAtom = atom(false);

export const exportContentAtom = atom<string>(""); // The content to export (Markdown or HTML)

export const exportOptionsAtom = atom<ExportOptions>({
  format: "pdf",
  theme: "print",
  includeCover: false,
  includeTOC: false,
  customColors: {
    background: "#ffffff",
    text: "#000000",
    accent: "#000000"
  }
});

