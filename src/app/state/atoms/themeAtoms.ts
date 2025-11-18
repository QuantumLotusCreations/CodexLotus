import { atom } from "jotai";

export interface ThemeOverrides {
  background?: string;
  accent?: string;
  text?: string;
}

export const themeOverridesAtom = atom<ThemeOverrides>({});
