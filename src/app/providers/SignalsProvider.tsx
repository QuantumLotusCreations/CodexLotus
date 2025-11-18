import React from "react";

export const SignalsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Preact signals are module-scoped; this exists for symmetry and future customization.
  return <>{children}</>;
};
