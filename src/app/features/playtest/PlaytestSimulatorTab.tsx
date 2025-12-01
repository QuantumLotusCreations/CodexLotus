import React, { useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { vars } from "../../theme/tokens.css";
import { ScenarioEngine, ScenarioConfig, SimulationAction, SimulationResource } from "./scenarioEngine";
import { ContextSelector } from "../procedural/components/ContextSelector"; // Reusing existing selector

// Generic ID generator
const uid = () => Math.random().toString(36).substr(2, 9);

export const PlaytestSimulatorTab: React.FC = () => {
  // --- State ---
  
  const [resources, setResources] = useState<SimulationResource[]>([
    { id: "res_1", name: "Influence", initialValue: 0, min: 0, max: 10 },
    { id: "res_2", name: "Patience", initialValue: 5, min: 0, max: 5 }
  ]);

  const [actions, setActions] = useState<SimulationAction[]>([
    {
        id: "act_1",
        name: "Persuade",
        rollFormula: "1d20+5",
        target: 15,
        onSuccess: [{ resourceId: "res_1", op: "add", valueFormula: "1" }],
        onFailure: [{ resourceId: "res_2", op: "sub", valueFormula: "1" }]
    }
  ]);

  const [winCondition, setWinCondition] = useState<{ resourceId: string, value: number, op: ">" | "<" | ">=" | "<=" }>({
      resourceId: "res_1",
      value: 10,
      op: ">="
  });

  const [loseCondition, setLoseCondition] = useState<{ resourceId: string, value: number, op: ">" | "<" | ">=" | "<=" }>({
      resourceId: "res_2",
      value: 0,
      op: "<="
  });

  const [simResult, setSimResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  // --- Handlers ---

  const runSimulation = () => {
      setIsRunning(true);
      
      // Build Config
      const config: ScenarioConfig = {
          resources,
          actions,
          maxRounds: 50,
          terminationConditions: [
              { ...winCondition, result: "win" },
              { ...loseCondition, result: "loss" }
          ] as any
      };

      // Run async to not block UI
      setTimeout(() => {
          const engine = new ScenarioEngine(config);
          const result = engine.run(1000); // 1000 iterations
          setSimResult(result);
          setIsRunning(false);
      }, 100);
  };

  const addResource = () => {
      setResources([...resources, { id: uid(), name: "New Metric", initialValue: 10 }]);
  };

  const updateResource = (index: number, patch: Partial<SimulationResource>) => {
      const next = [...resources];
      next[index] = { ...next[index], ...patch };
      setResources(next);
  };
  
  const removeResource = (index: number) => {
      const next = [...resources];
      next.splice(index, 1);
      setResources(next);
  };

  const addAction = () => {
      setActions([...actions, { 
          id: uid(), 
          name: "New Action", 
          rollFormula: "1d20", 
          target: 10, 
          onSuccess: [], 
          onFailure: [] 
      }]);
  };

  const updateAction = (index: number, patch: Partial<SimulationAction>) => {
      const next = [...actions];
      next[index] = { ...next[index], ...patch };
      setActions(next);
  };

  const removeAction = (index: number) => {
    const next = [...actions];
    next.splice(index, 1);
    setActions(next);
  };

  // --- Render ---

  return (
    <div style={{ display: "flex", height: "100%", color: vars.color.text.primary, overflow: "hidden" }}>
      
      {/* Left: Configuration */}
      <div style={{ width: 400, borderRight: `1px solid ${vars.color.border.subtle}`, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: 16, borderBottom: `1px solid ${vars.color.border.subtle}` }}>
              <h3 style={{ marginTop: 0 }}>Scenario Setup</h3>
              <p style={{ fontSize: 12, color: vars.color.text.secondary }}>
                  Define resources (HP, Influence, Time) and actions that modify them.
              </p>
              
              {/* Context Selector Integration */}
              <div style={{ marginBottom: 16 }}>
                   <label style={{ fontSize: 11, fontWeight: "bold", display: "block", marginBottom: 4 }}>Reference Mechanics</label>
                   <ContextSelector 
                        onSelectionChange={(ids) => console.log("Selected context for sim:", ids)} 
                        multiselect={true}
                   />
              </div>
          </div>

          {/* Resources Section */}
          <div style={{ padding: 16, borderBottom: `1px solid ${vars.color.border.subtle}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 14 }}>1. Resources (Metrics)</h4>
                  <button onClick={addResource} style={linkBtn}>+ Add</button>
              </div>
              {resources.map((r, i) => (
                  <div key={r.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <input 
                        value={r.name} 
                        onChange={e => updateResource(i, { name: e.target.value })}
                        placeholder="Name"
                        style={{ ...inputStyle, flex: 2 }}
                      />
                      <input 
                        type="number"
                        value={r.initialValue} 
                        onChange={e => updateResource(i, { initialValue: Number(e.target.value) })}
                        placeholder="Start"
                        title="Initial Value"
                        style={{ ...inputStyle, width: 60 }}
                      />
                       <button onClick={() => removeResource(i)} style={delBtn}>✕</button>
                  </div>
              ))}
          </div>

          {/* Actions Section */}
          <div style={{ padding: 16, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 14 }}>2. Actions (Loop)</h4>
                  <button onClick={addAction} style={linkBtn}>+ Add</button>
              </div>
              {actions.map((a, i) => (
                  <div key={a.id} style={{ background: vars.color.background.panelRaised, padding: 12, borderRadius: 4, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <input 
                             value={a.name} 
                             onChange={e => updateAction(i, { name: e.target.value })}
                             style={{ ...inputStyle, fontWeight: "bold", border: "none", padding: 0, background: "transparent" }}
                          />
                          <button onClick={() => removeAction(i)} style={delBtn}>✕</button>
                      </div>
                      
                      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                          <label style={{ fontSize: 11 }}>Roll:</label>
                          <input 
                            value={a.rollFormula || ""}
                            onChange={e => updateAction(i, { rollFormula: e.target.value })}
                            placeholder="e.g. 1d20+5"
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <label style={{ fontSize: 11 }}>vs DC:</label>
                          <input 
                            type="number"
                            value={a.target || 10}
                            onChange={e => updateAction(i, { target: Number(e.target.value) })}
                            style={{ ...inputStyle, width: 50 }}
                          />
                      </div>

                      {/* Simple Effect Editor (Just doing success for MVP) */}
                      <div style={{ fontSize: 11, marginBottom: 4 }}>On Success:</div>
                      {a.onSuccess.map((eff, effIdx) => (
                           <div key={effIdx} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                               <select 
                                    value={eff.resourceId}
                                    onChange={e => {
                                        const next = [...a.onSuccess];
                                        next[effIdx].resourceId = e.target.value;
                                        updateAction(i, { onSuccess: next });
                                    }}
                                    style={inputStyle}
                               >
                                   {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                               </select>
                               <select 
                                    value={eff.op}
                                    onChange={e => {
                                        const next = [...a.onSuccess];
                                        next[effIdx].op = e.target.value as any;
                                        updateAction(i, { onSuccess: next });
                                    }}
                                    style={{ ...inputStyle, width: 60 }}
                               >
                                   <option value="add">Add</option>
                                   <option value="sub">Sub</option>
                                   <option value="set">Set</option>
                               </select>
                               <input 
                                    value={eff.valueFormula}
                                    onChange={e => {
                                        const next = [...a.onSuccess];
                                        next[effIdx].valueFormula = e.target.value;
                                        updateAction(i, { onSuccess: next });
                                    }}
                                    style={{ ...inputStyle, width: 50 }}
                               />
                               <button 
                                onClick={() => {
                                    const next = [...a.onSuccess];
                                    next.splice(effIdx, 1);
                                    updateAction(i, { onSuccess: next });
                                }}
                                style={delBtn}
                               >✕</button>
                           </div>
                      ))}
                      <button 
                        onClick={() => {
                            const next = [...a.onSuccess, { resourceId: resources[0]?.id, op: "add", valueFormula: "1" }];
                            updateAction(i, { onSuccess: next });
                        }}
                        style={{ ...linkBtn, fontSize: 10 }}
                      >
                          + Effect
                      </button>

                  </div>
              ))}
          </div>
      </div>

      {/* Right: Simulation & Results */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto", backgroundColor: "#1a1a1a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>Results</h2>
              <button 
                onClick={runSimulation}
                disabled={isRunning}
                style={{ 
                    padding: "10px 24px", 
                    backgroundColor: vars.color.accent.primary, 
                    color: vars.color.text.inverse, 
                    border: "none", 
                    borderRadius: 4, 
                    fontWeight: "bold", 
                    cursor: isRunning ? "wait" : "pointer",
                    opacity: isRunning ? 0.7 : 1
                }}
              >
                  {isRunning ? "Simulating..." : "Run 1,000 Scenarios"}
              </button>
          </div>

          {simResult && (
              <div style={{ display: "grid", gap: 24 }}>
                  
                  {/* KPI Cards */}
                  <div style={{ display: "flex", gap: 16 }}>
                      <div style={cardStyle}>
                          <div style={labelStyle}>Success Rate</div>
                          <div style={{ fontSize: 32, fontWeight: "bold", color: simResult.winRate > 0.5 ? vars.color.state.success : vars.color.state.danger }}>
                              {(simResult.winRate * 100).toFixed(1)}%
                          </div>
                      </div>
                      <div style={cardStyle}>
                          <div style={labelStyle}>Avg Duration</div>
                          <div style={{ fontSize: 32, fontWeight: "bold" }}>
                              {simResult.avgRounds} <span style={{ fontSize: 16, color: vars.color.text.secondary }}>Rounds</span>
                          </div>
                      </div>
                  </div>

                  {/* Resource Stats */}
                  <div style={cardStyle}>
                      <h4 style={{ marginTop: 0 }}>Resource Outcomes (Average Final Values)</h4>
                      <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={Object.entries(simResult.resourceStats).map(([id, stat]: any) => ({
                              name: resources.find(r => r.id === id)?.name || id,
                              min: stat.min,
                              avg: stat.avg,
                              max: stat.max
                          }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                              <XAxis dataKey="name" stroke={vars.color.text.secondary} />
                              <YAxis stroke={vars.color.text.secondary} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: vars.color.background.panelRaised, border: `1px solid ${vars.color.border.subtle}` }}
                              />
                              <Legend />
                              <Bar dataKey="avg" fill={vars.color.accent.primary} name="Average End Value" />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>

              </div>
          )}

          {!simResult && !isRunning && (
              <div style={{ textAlign: "center", color: vars.color.text.muted, marginTop: 40 }}>
                  Configure your scenario on the left and press Run to see outcomes.
              </div>
          )}

      </div>

    </div>
  );
};

const inputStyle = {
    padding: 6,
    background: vars.color.background.base,
    border: `1px solid ${vars.color.border.subtle}`,
    borderRadius: 4,
    color: vars.color.text.primary,
    fontSize: 12
};

const linkBtn = {
    background: "none",
    border: "none",
    color: vars.color.accent.primary,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600
};

const delBtn = {
    background: "none",
    border: "none",
    color: vars.color.text.muted,
    cursor: "pointer",
    fontSize: 12
};

const cardStyle = {
    backgroundColor: vars.color.background.panelRaised,
    padding: 20,
    borderRadius: 8,
    border: `1px solid ${vars.color.border.subtle}`,
    flex: 1
};

const labelStyle = {
    fontSize: 12,
    color: vars.color.text.secondary,
    textTransform: "uppercase" as const,
    marginBottom: 8
};

