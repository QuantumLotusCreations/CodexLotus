import React, { useState, useMemo } from "react";
import { vars } from "../../theme/tokens.css";

export const AbilityCostCalculator: React.FC = () => {
  // Calculator Settings
  const [baseScore, setBaseScore] = useState(1);
  const [maxScore, setMaxScore] = useState(5);
  const [availablePoints, setAvailablePoints] = useState(10);
  
  // Cost Curve: How much does it cost to go from N to N+1?
  // Default: Linear (1 point per step)
  const [costMap, setCostMap] = useState<Record<number, number>>({
      1: 1, 2: 1, 3: 1, 4: 1, 5: 1
  });

  // Current Attribute Values
  const [attributes, setAttributes] = useState<{ name: string; score: number }[]>([
      { name: "Might", score: 1 },
      { name: "Agility", score: 1 },
      { name: "Intellect", score: 1 },
      { name: "Spirit", score: 1 }
  ]);

  const [newAttrName, setNewAttrName] = useState("");

  const totalCost = useMemo(() => {
      let total = 0;
      attributes.forEach(attr => {
          // Calculate cost from Base to Current Score
          for (let i = baseScore; i < attr.score; i++) {
              total += (costMap[i] || 1);
          }
      });
      return total;
  }, [attributes, baseScore, costMap]);

  const updateAttribute = (index: number, newScore: number) => {
      if (newScore < baseScore || newScore > maxScore) return;
      
      const newAttrs = [...attributes];
      newAttrs[index].score = newScore;
      setAttributes(newAttrs);
  };

  const addAttribute = () => {
      if (!newAttrName.trim()) return;
      setAttributes(prev => [...prev, { name: newAttrName, score: baseScore }]);
      setNewAttrName("");
  };

  const removeAttribute = (index: number) => {
      setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const updateCostMap = (score: number, cost: number) => {
      setCostMap(prev => ({ ...prev, [score]: cost }));
  };

  const remaining = availablePoints - totalCost;
  const isOverBudget = remaining < 0;

  return (
    <div style={{ padding: 24, color: vars.color.text.primary, display: "flex", gap: 24, height: "100%" }}>
        
        {/* Settings Panel */}
        <div style={{ width: 280, flexShrink: 0, overflowY: "auto", paddingRight: 16 }}>
            <h3 style={{ marginTop: 0 }}>System Rules</h3>
            
            <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Starting Budget</label>
                <input 
                    type="number" 
                    value={availablePoints} 
                    onChange={e => setAvailablePoints(Number(e.target.value))}
                    style={inputStyle}
                />
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Min Score</label>
                    <input 
                        type="number" 
                        value={baseScore} 
                        onChange={e => setBaseScore(Number(e.target.value))}
                        style={inputStyle}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Max Score</label>
                    <input 
                        type="number" 
                        value={maxScore} 
                        onChange={e => setMaxScore(Number(e.target.value))}
                        style={inputStyle}
                    />
                </div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Manage Attributes</label>
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    <input 
                        type="text" 
                        placeholder="New Attribute..." 
                        value={newAttrName}
                        onChange={e => setNewAttrName(e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                        onKeyDown={e => e.key === 'Enter' && addAttribute()}
                    />
                    <button onClick={addAttribute} style={buttonStyle}>Add</button>
                </div>
            </div>

            <h4>Cost Curve</h4>
            <p style={{ fontSize: 11, color: vars.color.text.secondary }}>Cost to upgrade FROM score TO next.</p>
            <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${vars.color.border.subtle}`, borderRadius: 4 }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: vars.color.background.panelRaised }}>
                            <th style={{ padding: 4, textAlign: "left" }}>From</th>
                            <th style={{ padding: 4, textAlign: "left" }}>To</th>
                            <th style={{ padding: 4, textAlign: "right" }}>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: maxScore - baseScore }).map((_, i) => {
                            const score = baseScore + i;
                            return (
                                <tr key={score} style={{ borderBottom: `1px solid ${vars.color.border.subtle}` }}>
                                    <td style={{ padding: "4px 8px" }}>{score}</td>
                                    <td style={{ padding: "4px 8px" }}>→ {score + 1}</td>
                                    <td style={{ padding: "4px 8px", textAlign: "right" }}>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={costMap[score] ?? 1} 
                                            onChange={(e) => updateCostMap(score, Number(e.target.value))}
                                            style={{ 
                                                width: 40, 
                                                background: "transparent", 
                                                border: "none", 
                                                textAlign: "right", 
                                                color: vars.color.text.primary 
                                            }}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Simulator */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            
            {/* Budget Header */}
            <div style={{ 
                padding: 24, 
                backgroundColor: vars.color.background.panelRaised, 
                borderRadius: 8, 
                marginBottom: 24,
                textAlign: "center",
                border: `1px solid ${isOverBudget ? vars.color.state.danger : vars.color.state.success}`
            }}>
                <div style={{ fontSize: 14, color: vars.color.text.secondary, marginBottom: 8 }}>REMAINING POINTS</div>
                <div style={{ 
                    fontSize: 48, 
                    fontWeight: "bold", 
                    color: isOverBudget ? vars.color.state.danger : vars.color.text.primary 
                }}>
                    {remaining}
                </div>
                <div style={{ fontSize: 14, opacity: 0.7 }}>
                    Used: {totalCost} / {availablePoints}
                </div>
            </div>

            {/* Attribute Sliders */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {attributes.map((attr, i) => {
                    // Calculate cost for NEXT point
                    const costNext = costMap[attr.score] ?? 1;
                    // Calculate refund for PREV point
                    const costPrev = costMap[attr.score - 1] ?? 1;

                    return (
                        <div key={attr.name + i} style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            padding: "12px 0", 
                            borderBottom: `1px solid ${vars.color.border.subtle}` 
                        }}>
                            <button 
                                onClick={() => removeAttribute(i)}
                                style={{ marginRight: 12, background: "none", border: "none", color: vars.color.text.muted, cursor: "pointer", fontSize: 16 }}
                                title="Remove Attribute"
                            >×</button>

                            <div style={{ width: 100, fontWeight: 600 }}>{attr.name}</div>
                            
                            <button 
                                onClick={() => updateAttribute(i, attr.score - 1)}
                                disabled={attr.score <= baseScore}
                                style={miniButtonStyle}
                                title={`Refund ${costPrev} points`}
                            >
                                -
                            </button>
                            
                            <div style={{ 
                                width: 60, 
                                textAlign: "center", 
                                fontSize: 18, 
                                fontWeight: "bold",
                                fontFamily: "monospace"
                            }}>
                                {attr.score}
                            </div>

                            <button 
                                onClick={() => updateAttribute(i, attr.score + 1)}
                                disabled={attr.score >= maxScore}
                                style={miniButtonStyle}
                                title={`Cost ${costNext} points`}
                            >
                                +
                            </button>

                            <div style={{ flex: 1, marginLeft: 24 }}>
                                {/* Visual Bar */}
                                <div style={{ 
                                    height: 8, 
                                    backgroundColor: vars.color.background.panelRaised, 
                                    borderRadius: 4,
                                    overflow: "hidden"
                                }}>
                                    <div style={{ 
                                        width: `${((attr.score - baseScore) / (maxScore - baseScore)) * 100}%`,
                                        height: "100%",
                                        backgroundColor: vars.color.accent.primary
                                    }} />
                                </div>
                            </div>
                            
                            <div style={{ width: 80, textAlign: "right", fontSize: 12, color: vars.color.text.secondary }}>
                                Cost: {costNext}
                            </div>
                        </div>
                    );
                })}
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
    padding: "6px 12px",
    backgroundColor: vars.color.background.panelRaised,
    color: vars.color.text.primary,
    border: `1px solid ${vars.color.border.subtle}`,
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12
};

const miniButtonStyle = {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: vars.color.background.panelRaised,
    border: `1px solid ${vars.color.border.subtle}`,
    color: vars.color.text.primary,
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: "bold"
};
