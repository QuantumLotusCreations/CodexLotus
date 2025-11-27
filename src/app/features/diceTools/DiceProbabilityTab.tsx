import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { vars } from "../../theme/tokens.css.ts";

// --- Dice Logic ---

interface DiceConfig {
  count: number;
  sides: number;
  modifier: number;
}

function calculateDistribution(config: DiceConfig) {
  const { count, sides, modifier } = config;

  // Safety check: if inputs are invalid/incomplete, return empty data to avoid crashes
  if (isNaN(count) || count < 1 || isNaN(sides) || sides < 1 || isNaN(modifier)) {
      return [];
  }

  // Start with one outcome: 0 with probability 1 (before rolling)
  let outcomes: { [sum: number]: number } = { 0: 1 };

  // Convolve distributions for each die
  for (let i = 0; i < count; i++) {
    const nextOutcomes: { [sum: number]: number } = {};
    for (const [currentSumStr, prob] of Object.entries(outcomes)) {
      const currentSum = parseInt(currentSumStr, 10);
      for (let roll = 1; roll <= sides; roll++) {
        const newSum = currentSum + roll;
        nextOutcomes[newSum] = (nextOutcomes[newSum] || 0) + prob * (1 / sides);
      }
    }
    outcomes = nextOutcomes;
  }

  // Apply modifier and format for chart
  const data = Object.entries(outcomes).map(([sumStr, prob]) => {
    const sum = parseInt(sumStr, 10) + modifier;
    return {
      value: sum,
      probability: prob,
      percentage: (prob * 100).toFixed(2),
    };
  });

  return data.sort((a, b) => a.value - b.value);
}

// --- Component ---

export const DiceProbabilityTab: React.FC = () => {
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [modifier, setModifier] = useState(0);
  const [targetNumber, setTargetNumber] = useState<number | undefined>(undefined);

  const data = useMemo(() => {
    return calculateDistribution({ count, sides, modifier });
  }, [count, sides, modifier]);

  const stats = useMemo(() => {
    let expectedValue = 0;
    let successChance = 0;
    const tn = targetNumber === undefined ? null : targetNumber;

    if (data.length === 0) {
        return { expectedValue: 0, successChance: null, min: 0, max: 0 };
    }

    data.forEach((d) => {
      expectedValue += d.value * d.probability;
      if (tn !== null && d.value >= tn) {
        successChance += d.probability;
      }
    });

    return {
      expectedValue,
      successChance: tn !== null ? (successChance * 100).toFixed(1) : null,
      min: data[0]?.value || 0,
      max: data[data.length - 1]?.value || 0,
    };
  }, [data, targetNumber]);

  // Safe input handler
  const handleNumberChange = (val: string, setter: (n: number) => void) => {
      if (val === "") {
          setter(0); // Default for counts/modifiers if cleared
          return;
      }
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
          setter(num);
      }
  };

  return (
    <div style={{ padding: 24, color: vars.color.text.primary, maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 16, borderBottom: `1px solid ${vars.color.border.subtle}`, paddingBottom: 8 }}>
        Dice Probability Calculator
      </h2>

      {/* Controls */}
      <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
          gap: 16,
          marginBottom: 24,
          backgroundColor: vars.color.background.panelRaised,
          padding: 16,
          borderRadius: 8
      }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.secondary }}>Count</label>
          <input
            type="number"
            min="1"
            max="20"
            value={count}
            onChange={(e) => handleNumberChange(e.target.value, setCount)}
            style={{ width: "100%", padding: 6, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, backgroundColor: vars.color.background.base, color: vars.color.text.primary }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6, fontSize: 14, fontWeight: "bold" }}>
            d
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.secondary }}>Sides</label>
          <select
            value={sides}
            onChange={(e) => setSides(Number(e.target.value))}
            style={{ width: "100%", padding: 6, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, backgroundColor: vars.color.background.base, color: vars.color.text.primary }}
          >
            {[4, 6, 8, 10, 12, 20, 100].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6, fontSize: 14, fontWeight: "bold" }}>
            +
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.secondary }}>Modifier</label>
          <input
            type="number"
            value={modifier}
            onChange={(e) => {
                // Allow negative typing
                const val = e.target.value;
                if (val === "") setModifier(0);
                else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setModifier(num);
                }
            }}
            style={{ width: "100%", padding: 6, borderRadius: 4, border: `1px solid ${vars.color.border.subtle}`, backgroundColor: vars.color.background.base, color: vars.color.text.primary }}
          />
        </div>
        <div style={{ borderLeft: `1px solid ${vars.color.border.subtle}`, paddingLeft: 16 }}>
             <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.accent }}>Target Number (DC)</label>
             <input
                type="number"
                value={targetNumber === undefined ? "" : targetNumber}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                        setTargetNumber(undefined);
                    } else {
                        const num = parseInt(val, 10);
                        if (!isNaN(num)) {
                            setTargetNumber(num);
                        }
                    }
                }}
                placeholder="Optional"
                style={{ width: "100%", padding: 6, borderRadius: 4, border: `1px solid ${vars.color.border.accent}`, backgroundColor: vars.color.background.base, color: vars.color.text.primary }}
             />
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
          <div>
              <div style={{ fontSize: 12, color: vars.color.text.secondary }}>Expression</div>
              <div style={{ fontSize: 18, fontWeight: "bold" }}>{count}d{sides}{modifier >= 0 ? "+" : ""}{modifier}</div>
          </div>
          {data.length > 0 && (
            <>
                <div>
                    <div style={{ fontSize: 12, color: vars.color.text.secondary }}>Average (Mean)</div>
                    <div style={{ fontSize: 18, fontWeight: "bold" }}>{stats.expectedValue.toFixed(2)}</div>
                </div>
                <div>
                    <div style={{ fontSize: 12, color: vars.color.text.secondary }}>Range</div>
                    <div style={{ fontSize: 18, fontWeight: "bold" }}>{stats.min} - {stats.max}</div>
                </div>
                {stats.successChance !== null && (
                    <div>
                        <div style={{ fontSize: 12, color: vars.color.text.accent }}>Success Chance (≥{targetNumber})</div>
                        <div style={{ fontSize: 18, fontWeight: "bold", color: vars.color.text.accent }}>{stats.successChance}%</div>
                    </div>
                )}
            </>
          )}
      </div>

      {/* Chart */}
      <div style={{ height: 300, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={vars.color.border.subtle} vertical={false} />
            <XAxis 
                dataKey="value" 
                tick={{ fill: vars.color.text.secondary, fontSize: 12 }} 
                stroke={vars.color.border.subtle}
            />
            <YAxis 
                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} 
                tick={{ fill: vars.color.text.secondary, fontSize: 12 }}
                stroke={vars.color.border.subtle}
            />
            <Tooltip 
                cursor={{ fill: vars.color.background.panelRaised }}
                contentStyle={{ backgroundColor: vars.color.background.panel, borderColor: vars.color.border.subtle, color: vars.color.text.primary }}
                formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, "Probability"]}
            />
            <Bar dataKey="probability" fill={vars.color.accent.primary} radius={[4, 4, 0, 0]} />
            {targetNumber !== undefined && !isNaN(targetNumber) && data.length > 0 && (
                <ReferenceLine x={Number(targetNumber)} stroke={vars.color.state.success} strokeDasharray="3 3" label={{ value: "DC", fill: vars.color.state.success, position: "top" }} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
