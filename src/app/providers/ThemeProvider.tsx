import React, { createContext, useContext, useEffect } from "react";
import { useAtom } from "jotai";
import { themeOverridesAtom } from "../state/atoms/themeAtoms";
import { applyThemeOverrides } from "../theme/themeUtils";

export interface ThemeConfig {
  name: string;
}

const ThemeContext = createContext<ThemeConfig>({ name: "codexlotus-dark" });

export const useThemeConfig = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [overrides, setOverrides] = useAtom(themeOverridesAtom);

  useEffect(() => {
    applyThemeOverrides(overrides);
  }, [overrides]);

  return <ThemeContext.Provider value={{ name: "codexlotus-dark" }}>{children}</ThemeContext.Provider>;
};
