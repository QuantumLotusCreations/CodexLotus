import React, { useState, useMemo } from "react";
import { vars } from "../../theme/tokens.css";

export const EconomyCalculator: React.FC = () => {
  // System Settings
  const [currencyName, setCurrencyName] = useState("Credits");
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Global Economy Settings
  const [dailyLaborWage, setDailyLaborWage] = useState(1); // 1 unit per day for unskilled labor
  const [skilledLaborMultiplier, setSkilledLaborMultiplier] = useState(2); // 2x for skilled
  
  // Crafting Settings
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [craftingSpeedMultiplier, setCraftingSpeedMultiplier] = useState(1); // 1x default speed

  // Item Config
  const [baseCost, setBaseCost] = useState(50);
  const [materialCostRatio, setMaterialCostRatio] = useState(0.5); // 50% of price is materials
  const [rarityMultiplier, setRarityMultiplier] = useState(1);

  // Custom Rarity Tiers
  const [tiers, setTiers] = useState([
      { name: "Tier 1", mult: 1, color: "#9e9e9e" },
      { name: "Tier 2", mult: 5, color: "#4caf50" },
      { name: "Tier 3", mult: 50, color: "#2196f3" },
      { name: "Tier 4", mult: 500, color: "#9c27b0" },
      { name: "Tier 5", mult: 5000, color: "#ff9800" },
  ]);
  
  const [newTierName, setNewTierName] = useState("");
  const [newTierMult, setNewTierMult] = useState(10);

  // Results
  const laborCost = useMemo(() => {
      return baseCost * (1 - materialCostRatio);
  }, [baseCost, materialCostRatio]);

  const materialCost = useMemo(() => {
      return baseCost * materialCostRatio;
  }, [baseCost, materialCostRatio]);

  const craftingTime = useMemo(() => {
      const dailyOutputValue = dailyLaborWage * skilledLaborMultiplier;
      const days = laborCost / (dailyOutputValue * craftingSpeedMultiplier);
      return Math.max(0.1, days); 
  }, [laborCost, dailyLaborWage, skilledLaborMultiplier, craftingSpeedMultiplier]);

  const selectTier = (mult: number) => {
      setRarityMultiplier(mult);
      setBaseCost(50 * mult); // Approximate scaling based on baseline 50
  };

  const addTier = () => {
      if (!newTierName) return;
      setTiers([...tiers, { name: newTierName, mult: newTierMult, color: "#ffffff" }]);
      setNewTierName("");
  };

  const removeTier = (index: number) => {
      setTiers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ padding: 24, color: vars.color.text.primary, display: "flex", gap: 24, height: "100%" }}>
        
        {/* Settings */}
        <div style={{ width: 300, flexShrink: 0, overflowY: "auto", paddingRight: 16 }}>
            
            {/* Config Toggle */}
            <div style={{ borderBottom: `1px solid ${vars.color.border.subtle}`, paddingBottom: 12, marginBottom: 16 }}>
                <button 
                    onClick={() => setIsConfigOpen(!isConfigOpen)}
                    style={{
                        width: "100%",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        color: vars.color.text.secondary,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 0
                    }}
                >
                    <span style={{ fontWeight: 600 }}>⚙️ System Settings</span>
                    <span>{isConfigOpen ? "▲" : "▼"}</span>
                </button>
                
                {isConfigOpen && (
                    <div style={{ marginTop: 12, padding: 12, background: vars.color.background.panelRaised, borderRadius: 4 }}>
                        <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Currency Name</label>
                            <input type="text" value={currencyName} onChange={e => setCurrencyName(e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                )}
            </div>


            <h3 style={{ marginTop: 0 }}>Economy Basics</h3>
            
            <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Unskilled Daily Wage ({currencyName})</label>
                <input 
                    type="number" 
                    step="0.1"
                    value={dailyLaborWage} 
                    onChange={e => setDailyLaborWage(Number(e.target.value))}
                    style={inputStyle}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Skilled Labor Multiplier</label>
                <input 
                    type="number" 
                    step="0.1"
                    value={skilledLaborMultiplier} 
                    onChange={e => setSkilledLaborMultiplier(Number(e.target.value))}
                    style={inputStyle}
                />
            </div>

            <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Material Cost Ratio</label>
                <input 
                    type="range" 
                    min="0.1" 
                    max="0.9" 
                    step="0.1"
                    value={materialCostRatio} 
                    onChange={e => setMaterialCostRatio(Number(e.target.value))}
                    style={{ width: "100%" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: vars.color.text.secondary }}>
                    <span>10%</span>
                    <span>Current: {(materialCostRatio * 100).toFixed(0)}%</span>
                    <span>90%</span>
                </div>
            </div>

            <h3>Item Quality / Rarity</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {tiers.map((t, i) => (
                    <div key={t.name} style={{ display: "flex", gap: 4 }}>
                        <button 
                            onClick={() => selectTier(t.mult)}
                            style={{
                                ...buttonStyle,
                                flex: 1,
                                backgroundColor: rarityMultiplier === t.mult ? vars.color.background.selected : vars.color.background.panelRaised,
                                borderLeft: `4px solid ${t.color}`,
                                textAlign: "left"
                            }}
                        >
                            <span style={{ fontWeight: "bold" }}>{t.name}</span>
                            <span style={{ float: "right", opacity: 0.6 }}>x{t.mult}</span>
                        </button>
                        {isConfigOpen && (
                             <button onClick={() => removeTier(i)} style={{...buttonStyle, width: 30, padding: 0}}>×</button>
                        )}
                    </div>
                ))}
            </div>

            {isConfigOpen && (
                <div style={{ padding: 8, background: vars.color.background.panelRaised, borderRadius: 4 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                        <input 
                            placeholder="New Tier..." 
                            value={newTierName} 
                            onChange={e => setNewTierName(e.target.value)} 
                            style={{ ...inputStyle, fontSize: 11 }} 
                        />
                        <input 
                            placeholder="xMult" 
                            type="number"
                            value={newTierMult} 
                            onChange={e => setNewTierMult(Number(e.target.value))} 
                            style={{ ...inputStyle, width: 50, fontSize: 11 }} 
                        />
                        <button onClick={addTier} style={{ ...buttonStyle, padding: "4px 8px" }}>+</button>
                    </div>
                </div>
            )}
        </div>

        {/* Results */}
        <div style={{ flex: 1 }}>
            
            <div style={{ 
                padding: 24, 
                backgroundColor: vars.color.background.panelRaised, 
                borderRadius: 8, 
                marginBottom: 24,
                border: `1px solid ${vars.color.border.subtle}`
            }}>
                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: vars.color.text.secondary }}>MARKET PRICE ({currencyName})</label>
                    <input 
                        type="number" 
                        value={baseCost} 
                        onChange={e => setBaseCost(Number(e.target.value))}
                        style={{ 
                            fontSize: 32, 
                            fontWeight: "bold", 
                            background: "transparent", 
                            border: "none", 
                            borderBottom: `2px solid ${vars.color.border.active}`,
                            color: vars.color.text.primary,
                            width: "100%",
                            outline: "none"
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: 32 }}>
                    <div>
                        <div style={{ fontSize: 12, color: vars.color.text.secondary }}>MATERIAL COST</div>
                        <div style={{ fontSize: 20, fontWeight: 600 }}>{materialCost.toFixed(1)} {currencyName}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: vars.color.text.secondary }}>LABOR COST</div>
                        <div style={{ fontSize: 20, fontWeight: 600 }}>{laborCost.toFixed(1)} {currencyName}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 24 }}>
                <div style={{ flex: 1, padding: 24, backgroundColor: vars.color.background.panelRaised, borderRadius: 8 }}>
                    <h4 style={{ marginTop: 0, color: vars.color.text.secondary }}>Crafting Time</h4>
                    
                    <div style={{ fontSize: 36, fontWeight: "bold", marginBottom: 8 }}>
                        {craftingTime < 1 
                            ? (craftingTime * hoursPerDay).toFixed(1) + " Hours"
                            : craftingTime.toFixed(1) + " Days"
                        }
                    </div>
                    
                    <div style={{ fontSize: 14, color: vars.color.text.secondary }}>
                        @ {hoursPerDay} hours/day work
                    </div>
                    <div style={{ fontSize: 14, color: vars.color.text.secondary }}>
                        Assuming 1 crafter
                    </div>
                </div>

                <div style={{ flex: 1, padding: 24, backgroundColor: vars.color.background.panelRaised, borderRadius: 8 }}>
                     <h4 style={{ marginTop: 0, color: vars.color.text.secondary }}>Real World Equivalent?</h4>
                     <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                         If 1 {currencyName} ≈ $100 (approx daily wage), then:
                     </p>
                     <ul style={{ fontSize: 13, paddingLeft: 20 }}>
                         <li><strong>Price:</strong> ${(baseCost * 100).toLocaleString()}</li>
                         <li><strong>Materials:</strong> ${(materialCost * 100).toLocaleString()}</li>
                         <li><strong>Wage:</strong> ${(dailyLaborWage * skilledLaborMultiplier * 100).toLocaleString()} / day</li>
                     </ul>
                </div>
            </div>
        </div>
    </div>
  );
};

const inputStyle = {
    width: "100%",
    padding: 8,
    background: vars.color.background.base,
    border: `1px solid ${vars.color.border.subtle}`,
    color: vars.color.text.primary,
    borderRadius: 4
};

const buttonStyle = {
    padding: "10px 16px",
    color: vars.color.text.primary,
    border: `1px solid ${vars.color.border.subtle}`,
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 13
};
