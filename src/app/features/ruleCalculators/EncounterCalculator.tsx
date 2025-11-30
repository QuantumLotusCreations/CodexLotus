import React, { useState, useMemo } from "react";
import { vars } from "../../theme/tokens.css";

interface Threshold {
  name: string;
  multiplier: number; // e.g. Easy = 1x, Medium = 2x
  color: string;
}

// System Agnostic Defaults
// We start with empty or very basic values instead of D&D CR tables.
const DEFAULT_POWER_CURVE: Record<string, number> = {
  "1": 100, "2": 200, "3": 300, "4": 400, "5": 500
};

export const EncounterCalculator: React.FC = () => {
  // System Settings
  const [powerMetricName, setPowerMetricName] = useState("Power Level"); // Generic
  const [costMetricName, setCostMetricName] = useState("Points"); // Generic
  const [useGroupMultipliers, setUseGroupMultipliers] = useState(false); // Default off for generic
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Party Configuration
  const [partySize, setPartySize] = useState(4);
  const [partyLevel, setPartyLevel] = useState(1);
  
  // Entity Configuration
  const [monsters, setMonsters] = useState<{ power: number; count: number }[]>([]);
  const [newMonsterPower, setNewMonsterPower] = useState(1);
  const [newMonsterCount, setNewMonsterCount] = useState(1);

  // Custom Power Curve (Power Value -> Cost)
  const [powerCurve, setPowerCurve] = useState<Record<number, number>>(() => {
      const map: Record<number, number> = {};
      Object.entries(DEFAULT_POWER_CURVE).forEach(([k, v]) => map[Number(k)] = v);
      return map;
  });

  const [levelBudgetCurve, setLevelBudgetCurve] = useState<number[]>(() => {
      const arr = [];
      // Default: 100 * Level (Linear baseline)
      for(let i=0; i<=20; i++) arr.push(100 * i);
      return arr;
  });

  const [thresholds, setThresholds] = useState<Threshold[]>([
      { name: "Safe", multiplier: 0.5, color: "#4caf50" },
      { name: "Standard", multiplier: 1.0, color: "#ffeb3b" },
      { name: "Risky", multiplier: 1.5, color: "#ff9800" },
      { name: "Extreme", multiplier: 2.0, color: "#f44336" },
  ]);

  // Calculation Helpers
  const getCostForPower = (power: number): number => {
      if (powerCurve[power] !== undefined) return powerCurve[power];
      return power * 100; // Linear fallback
  };

  const partyBudget = useMemo(() => {
      const perChar = levelBudgetCurve[partyLevel] || 0;
      return Math.round(perChar * partySize);
  }, [partySize, partyLevel, levelBudgetCurve]);

  const encounterCost = useMemo(() => {
      return monsters.reduce((sum, m) => sum + (getCostForPower(m.power) * m.count), 0);
  }, [monsters, powerCurve]);

  const adjustedCost = useMemo(() => {
      if (!useGroupMultipliers) return encounterCost;
      // Generic multiplier logic (simple +50% per extra enemy step)
      const totalMonsters = monsters.reduce((sum, m) => sum + m.count, 0);
      if (totalMonsters <= 1) return encounterCost;
      const mult = 1 + (Math.min(totalMonsters, 10) * 0.1); // Example generic scaling
      return Math.round(encounterCost * mult);
  }, [encounterCost, monsters, useGroupMultipliers]);

  const difficulty = useMemo(() => {
      let diff = "Trivial";
      let color = vars.color.text.secondary;
      const sorted = [...thresholds].sort((a, b) => a.multiplier - b.multiplier);

      for (const t of sorted) {
          const limit = partyBudget * t.multiplier;
          if (adjustedCost >= limit) {
              diff = t.name;
              color = t.color;
          }
      }
      return { name: diff, color };
  }, [adjustedCost, partyBudget, thresholds]);

  const addMonster = () => {
      if (newMonsterCount <= 0) return;
      setMonsters(prev => [...prev, { power: newMonsterPower, count: newMonsterCount }]);
  };

  const removeMonster = (index: number) => {
      setMonsters(prev => prev.filter((_, i) => i !== index));
  };

  const updatePowerCurve = (power: number, cost: number) => {
      setPowerCurve(prev => ({ ...prev, [power]: cost }));
  };

  return (
    <div style={{ padding: 24, color: vars.color.text.primary, display: "flex", gap: 24, height: "100%" }}>
        
        {/* Left Panel */}
        <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* System Config Toggle */}
            <div style={{ borderBottom: `1px solid ${vars.color.border.subtle}`, paddingBottom: 12 }}>
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
                            <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Power Metric Name</label>
                            <input type="text" value={powerMetricName} onChange={e => setPowerMetricName(e.target.value)} style={inputStyle} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Cost Metric Name</label>
                            <input type="text" value={costMetricName} onChange={e => setCostMetricName(e.target.value)} style={inputStyle} />
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <input type="checkbox" checked={useGroupMultipliers} onChange={e => setUseGroupMultipliers(e.target.checked)} />
                            Enable Group Multipliers (Horde Tax)
                        </label>
                    </div>
                )}
            </div>

            {/* Party Settings */}
            <div>
                <h3 style={{ marginTop: 0, fontSize: 14 }}>Team Settings</h3>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Team Size</label>
                        <input 
                            type="number" min="1" value={partySize} 
                            onChange={e => setPartySize(Number(e.target.value))}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Avg Level/Rank</label>
                        <input 
                            type="number" min="1" max="20" value={partyLevel} 
                            onChange={e => setPartyLevel(Number(e.target.value))}
                            style={inputStyle}
                        />
                    </div>
                </div>
            </div>

            {/* Monsters */}
            <div>
                <h3 style={{ marginTop: 0, fontSize: 14 }}>Add Enemies</h3>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>{powerMetricName}</label>
                        <input 
                            type="number" step="1"
                            value={newMonsterPower} 
                            onChange={e => setNewMonsterPower(Number(e.target.value))}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ width: 60 }}>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Count</label>
                        <input 
                            type="number" min="1" value={newMonsterCount} 
                            onChange={e => setNewMonsterCount(Number(e.target.value))}
                            style={inputStyle}
                        />
                    </div>
                    <button onClick={addMonster} style={buttonStyle}>Add</button>
                </div>
                <p style={{ fontSize: 11, color: vars.color.text.secondary, marginTop: 4 }}>
                    Cost per: {getCostForPower(newMonsterPower)} {costMetricName}
                </p>
            </div>

            {/* Budget Table */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                 <h3 style={{ marginTop: 0, fontSize: 14 }}>Budget Reference</h3>
                 <div style={{ flex: 1, overflowY: "auto", border: `1px solid ${vars.color.border.subtle}`, borderRadius: 4 }}>
                    <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: vars.color.background.panelRaised }}>
                                <th style={{ padding: 4, textAlign: "left" }}>Level</th>
                                <th style={{ padding: 4, textAlign: "right" }}>Base {costMetricName}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {levelBudgetCurve.map((budget, i) => i > 0 && (
                                <tr key={i} style={{ borderBottom: `1px solid ${vars.color.border.subtle}` }}>
                                    <td style={{ padding: "4px 8px" }}>{i}</td>
                                    <td style={{ padding: "4px 8px", textAlign: "right" }}>
                                        <input 
                                            type="number" 
                                            value={budget} 
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                const newCurve = [...levelBudgetCurve];
                                                newCurve[i] = val;
                                                setLevelBudgetCurve(newCurve);
                                            }}
                                            style={{ width: 60, background: "transparent", border: "none", textAlign: "right", color: vars.color.text.primary }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Right Panel (Output) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            
            {/* Badge */}
            <div style={{ 
                padding: 24, 
                backgroundColor: vars.color.background.panelRaised, 
                borderRadius: 8, 
                marginBottom: 24,
                textAlign: "center",
                border: `1px solid ${difficulty.color}`
            }}>
                <div style={{ fontSize: 14, color: vars.color.text.secondary, marginBottom: 8 }}>ESTIMATED DIFFICULTY</div>
                <div style={{ fontSize: 32, fontWeight: "bold", color: difficulty.color }}>{difficulty.name.toUpperCase()}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, fontSize: 14 }}>
                    <div>
                        <span style={{ color: vars.color.text.secondary }}>Team Budget: </span>
                        <strong>{partyBudget.toLocaleString()} {costMetricName}</strong>
                    </div>
                    <div>
                        <span style={{ color: vars.color.text.secondary }}>Total Cost: </span>
                        <strong>{adjustedCost.toLocaleString()} {costMetricName}</strong>
                    </div>
                </div>
            </div>

            {/* Thresholds */}
            <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Difficulty Thresholds</h4>
                <div style={{ display: "flex", height: 24, borderRadius: 12, overflow: "hidden", backgroundColor: "#333" }}>
                    {thresholds.map((t, i) => {
                         const sorted = [...thresholds].sort((a, b) => a.multiplier - b.multiplier);
                         const current = sorted[i];
                         
                         return (
                            <div key={current.name} style={{ 
                                flex: 1, 
                                backgroundColor: current.color, 
                                opacity: difficulty.name === current.name ? 1 : 0.3,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, color: "#000", fontWeight: "bold",
                                borderRight: "1px solid rgba(0,0,0,0.2)"
                            }}>
                                {current.name}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Monster List */}
            <div style={{ flex: 1, overflowY: "auto", border: `1px solid ${vars.color.border.subtle}`, borderRadius: 8, marginBottom: 24 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${vars.color.border.subtle}`, background: vars.color.background.panelRaised }}>
                            <th style={{ padding: 12, textAlign: "left" }}>{powerMetricName}</th>
                            <th style={{ padding: 12, textAlign: "center" }}>Count</th>
                            <th style={{ padding: 12, textAlign: "right" }}>Total {costMetricName}</th>
                            <th style={{ padding: 12 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {monsters.map((m, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${vars.color.border.subtle}` }}>
                                <td style={{ padding: 12 }}>
                                    {m.power} <span style={{ opacity: 0.6 }}>({getCostForPower(m.power).toLocaleString()})</span>
                                </td>
                                <td style={{ padding: 12, textAlign: "center" }}>{m.count}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{(getCostForPower(m.power) * m.count).toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>
                                    <button 
                                        onClick={() => removeMonster(i)}
                                        style={{ background: "none", border: "none", color: vars.color.text.muted, cursor: "pointer" }}
                                    >✕</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Power Curve Editor (Config Only) */}
            {isConfigOpen && (
                <div style={{ padding: 16, background: vars.color.background.panelRaised, borderRadius: 8 }}>
                    <h4 style={{ marginTop: 0, fontSize: 12 }}>{powerMetricName} → {costMetricName} Mapping</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 100, overflowY: "auto" }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                            <div key={p} style={{ display: "flex", flexDirection: "column", width: 60 }}>
                                <label style={{ fontSize: 10 }}>{p}</label>
                                <input 
                                    type="number" 
                                    value={powerCurve[p] || 0} 
                                    onChange={e => updatePowerCurve(p, Number(e.target.value))}
                                    style={{ fontSize: 11, padding: 4, border: `1px solid ${vars.color.border.subtle}` }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

const inputStyle = {
    width: "100%", padding: 8, background: vars.color.background.base,
    border: `1px solid ${vars.color.border.subtle}`, color: vars.color.text.primary, borderRadius: 4
};

const buttonStyle = {
    padding: "8px 16px", backgroundColor: vars.color.accent.primary,
    color: vars.color.text.inverse, border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600
};
