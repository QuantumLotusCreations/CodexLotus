import React, { useState, useEffect } from "react";
import { vars } from "../../theme/tokens.css.ts";
import { MarkdownPreview } from "../../components/markdown/MarkdownPreview";

interface StatBlock {
  name: string;
  size: string;
  type: string;
  alignment: string;
  ac: number;
  hp: number;
  speed: string;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  saves: string;
  skills: string;
  senses: string;
  languages: string;
  cr: string;
  traits: Array<{ name: string; desc: string }>;
  actions: Array<{ name: string; desc: string }>;
}

const DEFAULT_BLOCK: StatBlock = {
  name: "New Monster",
  size: "Medium",
  type: "humanoid",
  alignment: "unaligned",
  ac: 10,
  hp: 10,
  speed: "30 ft.",
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  saves: "",
  skills: "",
  senses: "passive Perception 10",
  languages: "Common",
  cr: "1/4",
  traits: [],
  actions: [{ name: "Melee Attack", desc: "+4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage." }]
};

export const StatBlockDesignerTab: React.FC = () => {
  const [block, setBlock] = useState<StatBlock>(DEFAULT_BLOCK);
  const [markdown, setMarkdown] = useState("");
  const [showPreview, setShowPreview] = useState(false); // Disabled by default to prevent crash

  useEffect(() => {
    // Generate YAML-like markdown block
    const yaml = [
      "```statblock",
      `name: ${block.name}`,
      `size: ${block.size}`,
      `type: ${block.type}`,
      `alignment: ${block.alignment}`,
      `ac: ${block.ac}`,
      `hp: ${block.hp}`,
      `speed: ${block.speed}`,
      "stats:",
      `  str: ${block.stats.str}`,
      `  dex: ${block.stats.dex}`,
      `  con: ${block.stats.con}`,
      `  int: ${block.stats.int}`,
      `  wis: ${block.stats.wis}`,
      `  cha: ${block.stats.cha}`,
      block.saves ? `saves: ${block.saves}` : null,
      block.skills ? `skills: ${block.skills}` : null,
      `senses: ${block.senses}`,
      `languages: ${block.languages}`,
      `cr: ${block.cr}`,
      block.traits && block.traits.length > 0 ? "traits:" : null,
      ...(block.traits || []).map(t => `  - name: ${t.name}\n    desc: ${t.desc}`),
      block.actions && block.actions.length > 0 ? "actions:" : null,
      ...(block.actions || []).map(a => `  - name: ${a.name}\n    desc: ${a.desc}`),
      "```"
    ].filter(Boolean).join("\n");
    setMarkdown(yaml);
  }, [block]);

  const handleChange = (field: keyof StatBlock, value: any) => {
    setBlock(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (stat: keyof StatBlock['stats'], value: number) => {
    setBlock(prev => ({ ...prev, stats: { ...prev.stats, [stat]: value } }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    alert("Copied to clipboard!");
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Form */}
      <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: 24, 
          borderRight: `1px solid ${vars.color.border.subtle}`,
          color: vars.color.text.primary
      }}>
        <h2 style={{ marginBottom: 24 }}>Stat Block Designer</h2>
        
        <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
            <div>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Name</label>
                <input className="input" value={block.name} onChange={e => handleChange("name", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Size</label>
                    <select className="input" value={block.size} onChange={e => handleChange("size", e.target.value)}>
                        {["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Type</label>
                    <input className="input" value={block.type} onChange={e => handleChange("type", e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Alignment</label>
                    <input className="input" value={block.alignment} onChange={e => handleChange("alignment", e.target.value)} />
                </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
                <div>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>AC</label>
                    <input className="input" type="number" style={{ width: 60 }} value={block.ac} onChange={e => handleChange("ac", Number(e.target.value))} />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>HP</label>
                    <input className="input" type="number" style={{ width: 60 }} value={block.hp} onChange={e => handleChange("hp", Number(e.target.value))} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Speed</label>
                    <input className="input" value={block.speed} onChange={e => handleChange("speed", e.target.value)} />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>CR</label>
                    <input className="input" style={{ width: 60 }} value={block.cr} onChange={e => handleChange("cr", e.target.value)} />
                </div>
            </div>

            <div>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Stats (STR / DEX / CON / INT / WIS / CHA)</label>
                <div style={{ display: "flex", gap: 8 }}>
                    {Object.entries(block.stats).map(([key, val]) => (
                        <div key={key} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 10, textTransform: "uppercase", marginBottom: 2 }}>{key}</div>
                            <input 
                                type="number" 
                                value={val} 
                                onChange={e => handleStatChange(key as any, Number(e.target.value))}
                                style={{ width: 40, textAlign: "center" }}
                                className="input"
                            />
                        </div>
                    ))}
                </div>
            </div>
            
             <div>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Senses</label>
                <input className="input" value={block.senses} onChange={e => handleChange("senses", e.target.value)} />
            </div>
            <div>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Languages</label>
                <input className="input" value={block.languages} onChange={e => handleChange("languages", e.target.value)} />
            </div>
             <div>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Skills</label>
                <input className="input" value={block.skills} onChange={e => handleChange("skills", e.target.value)} />
            </div>
        </div>

        <div style={{ marginBottom: 24 }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Traits</h3>
                <button 
                    onClick={() => setBlock(prev => ({ ...prev, traits: [...prev.traits, { name: "New Trait", desc: "Description" }] }))}
                    style={{ background: "none", border: "none", color: vars.color.accent.primary, cursor: "pointer", fontSize: 12 }}
                >+ Add Trait</button>
             </div>
             {block.traits.map((t, i) => (
                 <div key={i} style={{ marginBottom: 12, padding: 12, backgroundColor: vars.color.background.panelRaised, borderRadius: 4 }}>
                     <input 
                        className="input" 
                        style={{ marginBottom: 4, fontWeight: "bold" }} 
                        value={t.name} 
                        onChange={e => {
                            const newTraits = [...block.traits];
                            newTraits[i].name = e.target.value;
                            setBlock(prev => ({ ...prev, traits: newTraits }));
                        }}
                     />
                     <textarea 
                        className="input" 
                        rows={2} 
                        value={t.desc} 
                        onChange={e => {
                            const newTraits = [...block.traits];
                            newTraits[i].desc = e.target.value;
                            setBlock(prev => ({ ...prev, traits: newTraits }));
                        }}
                     />
                     <button 
                        onClick={() => setBlock(prev => ({ ...prev, traits: prev.traits.filter((_, idx) => idx !== i) }))}
                        style={{ color: vars.color.state.danger, background: "none", border: "none", fontSize: 10, cursor: "pointer", marginTop: 4 }}
                     >Remove</button>
                 </div>
             ))}
        </div>

         <div style={{ marginBottom: 24 }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Actions</h3>
                <button 
                    onClick={() => setBlock(prev => ({ ...prev, actions: [...prev.actions, { name: "New Action", desc: "Description" }] }))}
                    style={{ background: "none", border: "none", color: vars.color.accent.primary, cursor: "pointer", fontSize: 12 }}
                >+ Add Action</button>
             </div>
             {block.actions.map((a, i) => (
                 <div key={i} style={{ marginBottom: 12, padding: 12, backgroundColor: vars.color.background.panelRaised, borderRadius: 4 }}>
                     <input 
                        className="input" 
                        style={{ marginBottom: 4, fontWeight: "bold" }} 
                        value={a.name} 
                        onChange={e => {
                            const newActions = [...block.actions];
                            newActions[i].name = e.target.value;
                            setBlock(prev => ({ ...prev, actions: newActions }));
                        }}
                     />
                     <textarea 
                        className="input" 
                        rows={2} 
                        value={a.desc} 
                        onChange={e => {
                            const newActions = [...block.actions];
                            newActions[i].desc = e.target.value;
                            setBlock(prev => ({ ...prev, actions: newActions }));
                        }}
                     />
                      <button 
                        onClick={() => setBlock(prev => ({ ...prev, actions: prev.actions.filter((_, idx) => idx !== i) }))}
                        style={{ color: vars.color.state.danger, background: "none", border: "none", fontSize: 10, cursor: "pointer", marginTop: 4 }}
                     >Remove</button>
                 </div>
             ))}
        </div>

      </div>

      {/* Preview */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24, backgroundColor: "#1a1a1a" }}>
          <h3 style={{ color: vars.color.text.secondary, marginTop: 0 }}>Preview</h3>
          
          <div style={{ marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={showPreview} 
                    onChange={e => setShowPreview(e.target.checked)}
                  />
                  <span style={{ color: vars.color.text.primary, fontWeight: 500 }}>Show Live Preview</span>
              </label>
              {!showPreview && <p style={{ fontSize: 12, color: vars.color.text.muted, margin: "4px 0 0 24px" }}>Enable to see the rendered stat block. If app crashes, disable this.</p>}
          </div>

          {showPreview && (
            <div style={{ marginBottom: 24 }}>
                <MarkdownPreview content={markdown} />
            </div>
          )}

          <h3 style={{ color: vars.color.text.secondary }}>Markdown Code</h3>
          <pre style={{ 
              backgroundColor: vars.color.background.panelRaised, 
              padding: 12, 
              borderRadius: 4, 
              fontSize: 12, 
              overflowX: "auto",
              whiteSpace: "pre-wrap" 
          }}>
              {markdown}
          </pre>
          <button 
            onClick={copyToClipboard}
            style={{
                marginTop: 8,
                padding: "8px 16px",
                borderRadius: 4,
                border: "none",
                backgroundColor: vars.color.accent.primary,
                color: vars.color.text.inverse,
                fontWeight: 600,
                cursor: "pointer"
            }}
          >
            Copy Code to Clipboard
          </button>
      </div>

      {/* Styles for inputs */}
      <style>{`
        .input {
            width: 100%;
            padding: 8px;
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
