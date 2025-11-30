import React, { useState, useMemo } from "react";
import { vars } from "../../theme/tokens.css";

export const XPCalculator: React.FC = () => {
  const [maxLevel, setMaxLevel] = useState(20);
  const [formulaType, setFormulaType] = useState<"geometric" | "polynomial" | "linear">("polynomial");
  
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
             // This is tricky for level 1->2. Let's say BaseXP is needed for Level 2.
             // Level 1 = 0
             // Level 2 = Base
             // Level 3 = Base * Mult
             if (i === 2) xp = baseXP;
             else xp = Math.round(levels[i-2].xp * multiplier);
        } else if (formulaType === "polynomial") {
            // XP = Base * (Level-1)^Exp
            xp = Math.round(baseXP * Math.pow(i - 1, exponent));
        } else if (formulaType === "linear") {
            // XP = Previous + Increment
            // Or XP = Base + (Level-2) * Increment
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
          <h3 style={{ marginTop: 0 }}>XP Curve Generator</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Max Level</label>
            <input 
              type="number" 
              value={maxLevel} 
              onChange={(e) => setMaxLevel(Number(e.target.value))}
              style={{ width: "100%", padding: 8, background: vars.color.background.base, border: `1px solid ${vars.color.border.subtle}`, color: vars.color.text.primary }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Formula Type</label>
            <select 
              value={formulaType} 
              onChange={(e) => setFormulaType(e.target.value as any)}
              style={{ width: "100%", padding: 8, background: vars.color.background.base, border: `1px solid ${vars.color.border.subtle}`, color: vars.color.text.primary }}
            >
              <option value="polynomial">Polynomial (Power Curve)</option>
              <option value="geometric">Geometric (Exponential)</option>
              <option value="linear">Linear (Flat Growth)</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Base XP (Level 2 Req)</label>
            <input 
              type="number" 
              value={baseXP} 
              onChange={(e) => setBaseXP(Number(e.target.value))}
              style={{ width: "100%", padding: 8, background: vars.color.background.base, border: `1px solid ${vars.color.border.subtle}`, color: vars.color.text.primary }}
            />
            <p style={{ fontSize: 10, color: vars.color.text.secondary, margin: "4px 0 0" }}>XP required to reach level 2.</p>
          </div>

          {formulaType === "polynomial" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Exponent</label>
              <input 
                type="number" 
                step="0.1"
                value={exponent} 
                onChange={(e) => setExponent(Number(e.target.value))}
                style={{ width: "100%", padding: 8, background: vars.color.background.base, border: `1px solid ${vars.color.border.subtle}`, color: vars.color.text.primary }}
              />
              <p style={{ fontSize: 10, color: vars.color.text.secondary, margin: "4px 0 0" }}>Higher values make late levels much harder. 2 is standard quadratic.</p>
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
                style={{ width: "100%", padding: 8, background: vars.color.background.base, border: `1px solid ${vars.color.border.subtle}`, color: vars.color.text.primary }}
              />
              <p style={{ fontSize: 10, color: vars.color.text.secondary, margin: "4px 0 0" }}>Multiplies total XP each level.</p>
            </div>
          )}

          {formulaType === "linear" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Increment</label>
              <input 
                type="number" 
                value={increment} 
                onChange={(e) => setIncrement(Number(e.target.value))}
                style={{ width: "100%", padding: 8, background: vars.color.background.base, border: `1px solid ${vars.color.border.subtle}`, color: vars.color.text.primary }}
              />
              <p style={{ fontSize: 10, color: vars.color.text.secondary, margin: "4px 0 0" }}>Additional XP required per level.</p>
            </div>
          )}

        </div>

        {/* Results Table */}
        <div style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 150px)" }}>
           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
             <thead>
               <tr style={{ borderBottom: `2px solid ${vars.color.border.subtle}`, textAlign: "left" }}>
                 <th style={{ padding: 8 }}>Level</th>
                 <th style={{ padding: 8 }}>Total XP</th>
                 <th style={{ padding: 8 }}>Diff (XP to Next)</th>
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

