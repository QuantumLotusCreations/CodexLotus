import { atom } from "jotai";

export interface AppSettings {
  provider: string;
  chat_model: string;
  embedding_model: string;
  theme_accent: string | null;
  statblock_bg_color: string | null;
  statblock_font_color: string | null;
}

export const defaultSettings: AppSettings = {
  provider: "openai",
  chat_model: "gpt-4o-mini",
  embedding_model: "text-embedding-3-small",
  theme_accent: null,
  statblock_bg_color: "#fdf1dc",
  statblock_font_color: "#58180D",
};

export const settingsAtom = atom<AppSettings>(defaultSettings);

