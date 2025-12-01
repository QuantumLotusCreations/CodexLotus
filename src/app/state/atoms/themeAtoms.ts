import { atom } from "jotai";

export interface ThemeOverrides {
  background?: string;
  accent?: string;
  text?: string;
  inputBg?: string;
  inputText?: string;
  foregroundPanel?: string;
}

export const themeOverridesAtom = atom<ThemeOverrides>({});
