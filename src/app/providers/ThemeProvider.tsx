import React, { createContext, useContext, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { themeOverridesAtom } from "../state/atoms/themeAtoms";
import { settingsAtom } from "../state/atoms/settingsAtoms";
import { applyThemeOverrides } from "../theme/themeUtils";

export interface ThemeConfig {
  name: string;
}

const ThemeContext = createContext<ThemeConfig>({ name: "codexlotus-dark" });

export const useThemeConfig = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [overrides, setOverrides] = useAtom(themeOverridesAtom);
  const settings = useAtomValue(settingsAtom);

  // Sync settings to overrides
  useEffect(() => {
    setOverrides({
      background: settings.app_bg_color || undefined,
      text: settings.app_font_color || undefined,
      accent: settings.theme_accent || undefined,
      inputBg: settings.input_bg_color || undefined,
      inputText: settings.input_font_color || undefined,
      foregroundPanel: settings.foreground_panel_color || undefined,
    });
  }, [
    settings.app_bg_color, 
    settings.app_font_color, 
    settings.theme_accent, 
    settings.input_bg_color,
    settings.input_font_color,
    settings.foreground_panel_color,
    setOverrides
  ]);

  useEffect(() => {
    applyThemeOverrides(overrides);
  }, [overrides]);

  return <ThemeContext.Provider value={{ name: "codexlotus-dark" }}>{children}</ThemeContext.Provider>;
};
