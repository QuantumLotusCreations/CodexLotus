import React from "react";
import splash512 from "../../../assets/splash-512.png";

export const SplashScreen: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <img
        src={splash512}
        alt="CodexLotus splash"
        style={{ width: 160, height: 160, marginBottom: 24 }}
      />
      <div style={{ marginBottom: 8, fontSize: 24 }}>CodexLotus</div>
      <div>Loading your TTRPG workspace…</div>
    </div>
  );
};
