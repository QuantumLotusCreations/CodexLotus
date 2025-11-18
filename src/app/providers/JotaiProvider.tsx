import React from "react";
import { Provider as JotaiRootProvider } from "jotai";

export const JotaiProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <JotaiRootProvider>{children}</JotaiRootProvider>;
};
