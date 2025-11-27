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

interface PoolConfig {
    count: number;
    sides: number;
    targetNumber: number;
    condition: "gte" | "lte" | "eq";
}

function calculatePoolDistribution(config: PoolConfig) {
    const { count, sides, targetNumber, condition } = config;
    
    if (isNaN(count) || count < 1 || isNaN(sides) || sides < 1 || isNaN(targetNumber)) {
        return [];
    }

    // Calculate single die success probability (p)
    let p = 0;
    if (condition === "gte") { // >= Target
        if (targetNumber > sides) p = 0;
        else if (targetNumber <= 1) p = 1;
        else p = (sides - targetNumber + 1) / sides;
    } else if (condition === "lte") { // <= Target
        if (targetNumber >= sides) p = 1;
        else if (targetNumber < 1) p = 0;
        else p = targetNumber / sides;
    } else { // == Target
        if (targetNumber > sides || targetNumber < 1) p = 0;
        else p = 1 / sides;
    }

    // Binomial Distribution: P(k successes) = nCk * p^k * (1-p)^(n-k)
    const data = [];
    
    // Helper for Factorial
    const factorial = (n: number): number => {
        if (n === 0 || n === 1) return 1;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    };

    // Helper for nCk
    const combinations = (n: number, k: number): number => {
        if (k < 0 || k > n) return 0;
        return factorial(n) / (factorial(k) * factorial(n - k));
    };

    for (let k = 0; k <= count; k++) {
        const prob = combinations(count, k) * Math.pow(p, k) * Math.pow(1 - p, count - k);
        data.push({
            value: k, // Number of successes
            probability: prob,
            percentage: (prob * 100).toFixed(2)
        });
    }

    return data;
}

// --- Component ---

export const DiceProbabilityTab: React.FC = () => {
  const [mode, setMode] = useState<"sum" | "pool">("sum");
  
  // Sum Mode State
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [modifier, setModifier] = useState(0);
  const [targetSum, setTargetSum] = useState<number | undefined>(undefined);

  // Pool Mode State
  const [poolCount, setPoolCount] = useState(6);
  const [poolSides, setPoolSides] = useState(6);
  const [poolTarget, setPoolTarget] = useState(5);
  const [poolCondition, setPoolCondition] = useState<"gte" | "lte" | "eq">("eq"); // Default to "Equal to 5" as per user request
  const [requiredSuccesses, setRequiredSuccesses] = useState<number | undefined>(3);

  // --- Calculations ---

  const sumData = useMemo(() => {
    if (mode !== "sum") return [];
    return calculateDistribution({ count, sides, modifier });
  }, [count, sides, modifier, mode]);

  const poolData = useMemo(() => {
    if (mode !== "pool") return [];
    return calculatePoolDistribution({ 
        count: poolCount, 
        sides: poolSides, 
        targetNumber: poolTarget, 
        condition: poolCondition 
    });
  }, [poolCount, poolSides, poolTarget, poolCondition, mode]);

  const stats = useMemo(() => {
    if (mode === "sum") {
        let expectedValue = 0;
        let successChance = 0;
        const tn = targetSum === undefined ? null : targetSum;

        if (sumData.length === 0) {
            return { expectedValue: 0, successChance: null, min: 0, max: 0 };
        }

        sumData.forEach((d) => {
            expectedValue += d.value * d.probability;
            if (tn !== null && d.value >= tn) {
                successChance += d.probability;
            }
        });

        return {
            expectedValue,
            successChance: tn !== null ? (successChance * 100).toFixed(1) : null,
            min: sumData[0]?.value || 0,
            max: sumData[sumData.length - 1]?.value || 0,
        };
    } else {
        // Pool Stats
        if (poolData.length === 0) return { expectedValue: 0, successChance: null };
        
        let expectedSuccesses = 0;
        let probAtLeast = 0;
        let probExact = 0;
        const req = requiredSuccesses === undefined ? null : requiredSuccesses;

        poolData.forEach((d) => {
            expectedSuccesses += d.value * d.probability;
            if (req !== null) {
                if (d.value >= req) probAtLeast += d.probability;
                if (d.value === req) probExact = d.probability; // Captured but usually we want >= or exact depending on context
            }
        });

        return {
            expectedValue: expectedSuccesses,
            probAtLeast: req !== null ? (probAtLeast * 100).toFixed(1) : null,
            probExact: req !== null ? (probExact * 100).toFixed(1) : null,
        };
    }
  }, [sumData, poolData, targetSum, requiredSuccesses, mode]);

  // Safe input handler
  const handleNumberChange = (val: string, setter: (n: number) => void) => {
      if (val === "") {
          setter(0); 
          return;
      }
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
          setter(num);
      }
  };

  return (
    <div style={{ padding: 24, color: vars.color.text.primary, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: `1px solid ${vars.color.border.subtle}`, paddingBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Dice Probability Calculator</h2>
          <div style={{ display: "flex", gap: 8, backgroundColor: vars.color.background.panelRaised, padding: 4, borderRadius: 4 }}>
              <button
                onClick={() => setMode("sum")}
                style={{
                    border: "none",
                    background: mode === "sum" ? vars.color.accent.primary : "transparent",
                    color: mode === "sum" ? vars.color.text.inverse : vars.color.text.primary,
                    padding: "4px 12px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: 12
                }}
              >
                Sum Total
              </button>
              <button
                onClick={() => setMode("pool")}
                style={{
                    border: "none",
                    background: mode === "pool" ? vars.color.accent.primary : "transparent",
                    color: mode === "pool" ? vars.color.text.inverse : vars.color.text.primary,
                    padding: "4px 12px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: 12
                }}
              >
                Dice Pool
              </button>
          </div>
      </div>

      {/* Controls */}
      <div style={{ 
          marginBottom: 24,
          backgroundColor: vars.color.background.panelRaised,
          padding: 16,
          borderRadius: 8
      }}>
        {mode === "sum" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 16 }}>
                <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.secondary }}>Count</label>
                    <input type="number" min="1" max="50" value={count} onChange={(e) => handleNumberChange(e.target.value, setCount)} className="input" style={{ width: "100%" }} />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.secondary }}>Sides</label>
                    <select value={sides} onChange={(e) => setSides(Number(e.target.value))} className="input" style={{ width: "100%" }}>
                        {[4, 6, 8, 10, 12, 20, 100].map(s => <option key={s} value={s}>d{s}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.secondary }}>Modifier</label>
                    <input type="number" value={modifier} onChange={(e) => handleNumberChange(e.target.value, setModifier)} className="input" style={{ width: "100%" }} />
                </div>
                <div style={{ borderLeft: `1px solid ${vars.color.border.subtle}`, paddingLeft: 16 }}>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.accent }}>Target DC</label>
                    <input 
                        type="number" 
                        value={targetSum === undefined ? "" : targetSum} 
                        onChange={(e) => e.target.value === "" ? setTargetSum(undefined) : setTargetSum(Number(e.target.value))}
                        placeholder="Optional"
                        className="input" 
                        style={{ width: "100%", borderColor: vars.color.border.accent }}
                    />
                </div>
            </div>
        ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
                <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.secondary }}>Pool Size (Dice)</label>
                    <input type="number" min="1" max="50" value={poolCount} onChange={(e) => handleNumberChange(e.target.value, setPoolCount)} className="input" style={{ width: "100%" }} />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.secondary }}>Die Type</label>
                    <select value={poolSides} onChange={(e) => setPoolSides(Number(e.target.value))} className="input" style={{ width: "100%" }}>
                        {[4, 6, 8, 10, 12, 20, 100].map(s => <option key={s} value={s}>d{s}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.secondary }}>Success Criteria</label>
                    <div style={{ display: "flex", gap: 4 }}>
                        <select value={poolCondition} onChange={(e) => setPoolCondition(e.target.value as any)} className="input" style={{ width: 60 }}>
                            <option value="eq">=</option>
                            <option value="gte">≥</option>
                            <option value="lte">≤</option>
                        </select>
                        <input type="number" value={poolTarget} onChange={(e) => handleNumberChange(e.target.value, setPoolTarget)} className="input" style={{ flex: 1 }} />
                    </div>
                </div>
                <div style={{ borderLeft: `1px solid ${vars.color.border.subtle}`, paddingLeft: 16 }}>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: vars.color.text.accent }}>Required Successes</label>
                    <input 
                        type="number" 
                        value={requiredSuccesses === undefined ? "" : requiredSuccesses} 
                        onChange={(e) => e.target.value === "" ? setRequiredSuccesses(undefined) : setRequiredSuccesses(Number(e.target.value))}
                        placeholder="Optional"
                        className="input" 
                        style={{ width: "100%", borderColor: vars.color.border.accent }}
                    />
                </div>
            </div>
        )}
      </div>

      {/* Summary Stats */}
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
          {mode === "sum" ? (
             <>
                <div>
                    <div style={{ fontSize: 12, color: vars.color.text.secondary }}>Average Sum</div>
                    <div style={{ fontSize: 18, fontWeight: "bold" }}>{stats.expectedValue.toFixed(2)}</div>
                </div>
                {stats.successChance !== null && (
                    <div>
                        <div style={{ fontSize: 12, color: vars.color.text.accent }}>Chance ≥ {targetSum}</div>
                        <div style={{ fontSize: 18, fontWeight: "bold", color: vars.color.text.accent }}>{stats.successChance}%</div>
                    </div>
                )}
             </>
          ) : (
             <>
                <div>
                    <div style={{ fontSize: 12, color: vars.color.text.secondary }}>Avg. Successes</div>
                    <div style={{ fontSize: 18, fontWeight: "bold" }}>{stats.expectedValue.toFixed(2)}</div>
                </div>
                {stats.probAtLeast !== null && (
                    <div style={{ display: "flex", gap: 24 }}>
                        <div>
                            <div style={{ fontSize: 12, color: vars.color.text.accent }}>Chance = {requiredSuccesses}</div>
                            <div style={{ fontSize: 18, fontWeight: "bold", color: vars.color.text.primary }}>{stats.probExact}%</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: vars.color.text.accent }}>Chance ≥ {requiredSuccesses}</div>
                            <div style={{ fontSize: 18, fontWeight: "bold", color: vars.color.text.accent }}>{stats.probAtLeast}%</div>
                        </div>
                    </div>
                )}
             </>
          )}
      </div>

      {/* Chart */}
      <div style={{ height: 300, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mode === "sum" ? sumData : poolData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={vars.color.border.subtle} vertical={false} />
            <XAxis 
                dataKey="value" 
                tick={{ fill: vars.color.text.secondary, fontSize: 12 }} 
                stroke={vars.color.border.subtle}
                label={{ value: mode === "sum" ? "Sum Total" : "Success Count", position: "insideBottom", offset: -5, fill: vars.color.text.muted, fontSize: 12 }}
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
            {/* Reference Lines */}
            {mode === "sum" && targetSum !== undefined && !isNaN(targetSum) && (
                <ReferenceLine x={Number(targetSum)} stroke={vars.color.state.success} strokeDasharray="3 3" label={{ value: "DC", fill: vars.color.state.success, position: "top" }} />
            )}
            {mode === "pool" && requiredSuccesses !== undefined && !isNaN(requiredSuccesses) && (
                <ReferenceLine x={Number(requiredSuccesses)} stroke={vars.color.state.success} strokeDasharray="3 3" label={{ value: "Req", fill: vars.color.state.success, position: "top" }} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        .input {
            padding: 6px;
            border-radius: 4px;
            border: 1px solid ${vars.color.border.subtle};
            background-color: ${vars.color.background.base};
            color: ${vars.color.text.primary};
        }
        .input:focus {
            outline: none;
            border-color: ${vars.color.accent.primary};
        }
      `}</style>
    </div>
  );
};
