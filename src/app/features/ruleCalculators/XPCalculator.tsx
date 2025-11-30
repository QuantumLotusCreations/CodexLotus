import React, { useState, useMemo } from "react";
import { vars } from "../../theme/tokens.css";

export const XPCalculator: React.FC = () => {
  const [maxLevel, setMaxLevel] = useState(20);
  const [formulaType, setFormulaType] = useState<"geometric" | "polynomial" | "linear">("polynomial");
  
  // System Settings
  const [levelName, setLevelName] = useState("Rank");
  const [xpName, setXpName] = useState("XP");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Parameters
  const [baseXP, setBaseXP] = useState(100);
  const [multiplier, setMultiplier] = useState(1.5); // For geometric
  const [exponent, setExponent] = useState(2); // For polynomial
  const [increment, setIncrement] = useState(1000); // For linear

  const data = useMemo(() => {
    const levels = [];
    let currentXP = 0;

    for (let i = 1; i <= maxLevel; i++) {
      let xp = 0;
      let diff = 0;

      if (i === 1) {
        xp = 0; // Usually start at 0
      } else {
        // Calculate XP required for level i
        if (formulaType === "geometric") {
             // Simple geometric progression of total XP
             if (i === 2) xp = baseXP;
             else xp = Math.round(levels[i-2].xp * multiplier);
        } else if (formulaType === "polynomial") {
            // XP = Base * (Level-1)^Exp
            xp = Math.round(baseXP * Math.pow(i - 1, exponent));
        } else if (formulaType === "linear") {
            // XP = Previous + Increment
            if (i === 2) xp = baseXP;
            else xp = levels[i-2].xp + increment;
        }
      }
      
      diff = i > 1 ? xp - levels[i-2].xp : 0;

      levels.push({
        level: i,
        xp: xp,
        diff: diff
      });
    }
    return levels;
  }, [maxLevel, formulaType, baseXP, multiplier, exponent, increment]);

  return (
    <div style={{ padding: 24, color: vars.color.text.primary }}>
      <div style={{ display: "flex", gap: 24 }}>
        
        {/* Controls */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <h3 style={{ marginTop: 0 }}>Progression Curve</h3>
          
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
                          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Progression Metric (e.g. Level, Rank)</label>
                          <input type="text" value={levelName} onChange={e => setLevelName(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Cost Metric (e.g. XP, Karma)</label>
                          <input type="text" value={xpName} onChange={e => setXpName(e.target.value)} style={inputStyle} />
                      </div>
                  </div>
              )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Max {levelName}</label>
            <input 
              type="number" 
              value={maxLevel} 
              onChange={(e) => setMaxLevel(Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Formula Type</label>
            <select 
              value={formulaType} 
              onChange={(e) => setFormulaType(e.target.value as any)}
              style={inputStyle}
            >
              <option value="polynomial">Power Curve (Steep)</option>
              <option value="geometric">Exponential (Very Steep)</option>
              <option value="linear">Linear (Flat)</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Base {xpName} ({levelName} 2 Req)</label>
            <input 
              type="number" 
              value={baseXP} 
              onChange={(e) => setBaseXP(Number(e.target.value))}
              style={inputStyle}
            />
            <p style={{ fontSize: 10, color: vars.color.text.secondary, margin: "4px 0 0" }}>{xpName} required to reach {levelName} 2.</p>
          </div>

          {formulaType === "polynomial" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Exponent</label>
              <input 
                type="number" 
                step="0.1"
                value={exponent} 
                onChange={(e) => setExponent(Number(e.target.value))}
                style={inputStyle}
              />
              <p style={{ fontSize: 10, color: vars.color.text.secondary, margin: "4px 0 0" }}>Controls how fast costs increase. 2.0 is standard.</p>
            </div>
          )}

          {formulaType === "geometric" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Multiplier</label>
              <input 
                type="number" 
                step="0.1"
                value={multiplier} 
                onChange={(e) => setMultiplier(Number(e.target.value))}
                style={inputStyle}
              />
              <p style={{ fontSize: 10, color: vars.color.text.secondary, margin: "4px 0 0" }}>Multiplies total {xpName} each {levelName}.</p>
            </div>
          )}

          {formulaType === "linear" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Increment</label>
              <input 
                type="number" 
                value={increment} 
                onChange={(e) => setIncrement(Number(e.target.value))}
                style={inputStyle}
              />
              <p style={{ fontSize: 10, color: vars.color.text.secondary, margin: "4px 0 0" }}>Additional {xpName} required per {levelName}.</p>
            </div>
          )}

        </div>

        {/* Results Table */}
        <div style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 150px)" }}>
           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
             <thead>
               <tr style={{ borderBottom: `2px solid ${vars.color.border.subtle}`, textAlign: "left" }}>
                 <th style={{ padding: 8 }}>{levelName}</th>
                 <th style={{ padding: 8 }}>Total {xpName}</th>
                 <th style={{ padding: 8 }}>Diff ({xpName} to Next)</th>
               </tr>
             </thead>
             <tbody>
               {data.map(row => (
                 <tr key={row.level} style={{ borderBottom: `1px solid ${vars.color.border.subtle}` }}>
                   <td style={{ padding: 8 }}>{row.level}</td>
                   <td style={{ padding: 8, fontFamily: "monospace" }}>{row.xp.toLocaleString()}</td>
                   <td style={{ padding: 8, fontFamily: "monospace", color: vars.color.text.secondary }}>{row.diff > 0 ? row.diff.toLocaleString() : "-"}</td>
                 </tr>
               ))}
             </tbody>
           </table>
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
