import React, { useState } from "react";
import { vars } from "../../theme/tokens.css";
import { XPCalculator } from "./XPCalculator";

type CalculatorType = "xp-curve" | "encounter" | "ability-cost" | "economy";

export const RuleCalculatorsTab: React.FC = () => {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>("xp-curve");

  const renderActiveCalculator = () => {
    switch (activeCalculator) {
      case "xp-curve":
        return <XPCalculator />;
      case "encounter":
        return <Placeholder title="Encounter Budget" description="Calculate encounter difficulty thresholds based on party size and level." />;
      case "ability-cost":
        return <Placeholder title="Ability Score Costs" description="Balance point-buy costs or attribute scaling." />;
      case "economy":
        return <Placeholder title="Economy & Crafting" description="Estimate item prices and crafting times based on rarity and power." />;
      default:
        return <div style={{ padding: 24 }}>Select a calculator</div>;
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", backgroundColor: vars.color.background.base }}>
      
      {/* Sidebar */}
      <div style={{ 
        width: 200, 
        borderRight: `1px solid ${vars.color.border.subtle}`, 
        display: "flex", 
        flexDirection: "column",
        backgroundColor: vars.color.background.panel
      }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${vars.color.border.subtle}` }}>
            <h3 style={{ margin: 0, fontSize: 14, color: vars.color.text.primary }}>Rule Calculators</h3>
        </div>
        
        <div style={{ padding: 8 }}>
            <NavButton 
                label="XP & Leveling" 
                active={activeCalculator === "xp-curve"} 
                onClick={() => setActiveCalculator("xp-curve")} 
            />
            <NavButton 
                label="Encounter Budget" 
                active={activeCalculator === "encounter"} 
                onClick={() => setActiveCalculator("encounter")} 
            />
            <NavButton 
                label="Ability Costs" 
                active={activeCalculator === "ability-cost"} 
                onClick={() => setActiveCalculator("ability-cost")} 
            />
            <NavButton 
                label="Economy / Crafting" 
                active={activeCalculator === "economy"} 
                onClick={() => setActiveCalculator("economy")} 
            />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {renderActiveCalculator()}
      </div>

    </div>
  );
};

const NavButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
        width: "100%",
        textAlign: "left",
        padding: "8px 12px",
        marginBottom: 4,
        border: "none",
        borderRadius: 4,
        backgroundColor: active ? vars.color.background.selected : "transparent",
        color: active ? vars.color.text.primary : vars.color.text.secondary,
        cursor: "pointer",
        fontSize: 13
    }}
  >
    {label}
  </button>
);

const Placeholder: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div style={{ padding: 48, textAlign: "center", color: vars.color.text.secondary }}>
        <h2 style={{ color: vars.color.text.primary }}>{title}</h2>
        <p>{description}</p>
        <p style={{ fontStyle: "italic", opacity: 0.6, marginTop: 24 }}>Coming soon...</p>
    </div>
);

