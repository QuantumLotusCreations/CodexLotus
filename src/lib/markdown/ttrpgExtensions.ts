import { visit } from "unist-util-visit";
import yaml from "js-yaml";
import type { Plugin } from "unified";

interface StatBlock {
  name: string;
  size?: string;
  type?: string;
  alignment?: string;
  ac?: number | string;
  hp?: number | string;
  speed?: string;
  stats?: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  saves?: string;
  skills?: string;
  senses?: string;
  languages?: string;
  cr?: string | number;
  traits?: Array<{ name: string; desc: string }>;
  actions?: Array<{ name: string; desc: string }>;
}

export const ttrpgExtensions: Plugin = () => {
  return (tree) => {
    visit(tree, "code", (node: any, index, parent) => {
      if (node.lang === "statblock") {
        try {
          const data = yaml.load(node.value) as StatBlock;
          
          // Create HAST (HTML Abstract Syntax Tree) structure
          const hast = {
            type: "element",
            tagName: "div",
            properties: { className: ["c-statblock"] },
            children: [
              // Header
              {
                type: "element",
                tagName: "div",
                properties: { className: ["c-statblock__header"] },
                children: [
                  {
                    type: "element",
                    tagName: "h3",
                    properties: { className: ["c-statblock__name"] },
                    children: [{ type: "text", value: data.name || "Unknown Monster" }]
                  },
                  {
                    type: "element",
                    tagName: "div",
                    properties: { className: ["c-statblock__meta"] },
                    children: [{ type: "text", value: `${data.size || "Medium"} ${data.type || "humanoid"}, ${data.alignment || "unaligned"}` }]
                  }
                ]
              },
              // Divider
              { type: "element", tagName: "hr", properties: { className: ["c-statblock__divider"] }, children: [] },
              // Core Stats
              {
                type: "element",
                tagName: "div",
                properties: { className: ["c-statblock__attributes"] },
                children: [
                  createAttribute("Armor Class", data.ac),
                  createAttribute("Hit Points", data.hp),
                  createAttribute("Speed", data.speed),
                ]
              },
              // Divider
              { type: "element", tagName: "hr", properties: { className: ["c-statblock__divider"] }, children: [] },
              // Ability Scores
              data.stats ? createAbilityScores(data.stats) : null,
              // Divider
              { type: "element", tagName: "hr", properties: { className: ["c-statblock__divider"] }, children: [] },
              // Secondary Stats
              {
                 type: "element",
                 tagName: "div",
                 properties: { className: ["c-statblock__attributes"] },
                 children: [
                    data.saves ? createAttribute("Saving Throws", data.saves) : null,
                    data.skills ? createAttribute("Skills", data.skills) : null,
                    data.senses ? createAttribute("Senses", data.senses) : null,
                    data.languages ? createAttribute("Languages", data.languages) : null,
                    data.cr ? createAttribute("Challenge", data.cr) : null,
                 ].filter(Boolean)
              },
              // Divider
              { type: "element", tagName: "hr", properties: { className: ["c-statblock__divider"] }, children: [] },
              // Traits
              ...(data.traits || []).map(t => createFeature(t.name, t.desc, "c-statblock__trait")),
              // Actions
              data.actions && data.actions.length > 0 ? {
                  type: "element",
                  tagName: "h4",
                  properties: { className: ["c-statblock__section-header"] },
                  children: [{ type: "text", value: "Actions" }]
              } : null,
              ...(data.actions || []).map(a => createFeature(a.name, a.desc, "c-statblock__action")),
            ].filter(Boolean)
          };

          // Replace the code block with our HTML structure
          // We must set data.hProperties and data.hName for remark-rehype to handle it if we were transforming generic nodes,
          // but since we are replacing the node entirely, we usually swap it out.
          // However, remark operates on MDAST (Markdown AST), and we want to inject HAST (HTML AST).
          // The standard way in remark-rehype is that if a node has `data.hName` and `data.hChildren`, it uses those.
          
          node.data = node.data || {};
          node.data.hName = "div";
          node.data.hProperties = hast.properties;
          node.data.hChildren = hast.children;
          
          // We don't need to change node.type or children here if we use data.h* properties,
          // remark-rehype will respect them.
        } catch (e) {
          console.error("Failed to parse statblock", e);
          // Leave as code block if parsing fails
        }
      }
    });
  };
};

function createAttribute(label: string, value: any) {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["c-statblock__attribute"] },
    children: [
      { type: "element", tagName: "strong", children: [{ type: "text", value: `${label} ` }] },
      { type: "text", value: String(value) }
    ]
  };
}

function createAbilityScores(stats: any) {
  const abilities = ["str", "dex", "con", "int", "wis", "cha"];
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["c-statblock__abilities"] },
    children: abilities.map(stat => {
      const score = stats[stat] || 10;
      const mod = Math.floor((score - 10) / 2);
      const sign = mod >= 0 ? "+" : "";
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["c-statblock__ability"] },
        children: [
           { type: "element", tagName: "div", properties: { className: ["c-statblock__ability-name"] }, children: [{ type: "text", value: stat.toUpperCase() }] },
           { type: "element", tagName: "div", properties: { className: ["c-statblock__ability-score"] }, children: [{ type: "text", value: `${score} (${sign}${mod})` }] }
        ]
      };
    })
  };
}

function createFeature(name: string, desc: string, className: string) {
  return {
    type: "element",
    tagName: "div",
    properties: { className: [className] },
    children: [
      { type: "element", tagName: "strong", properties: { className: ["c-statblock__feature-name"] }, children: [{ type: "text", value: `${name}. ` }] },
      { type: "text", value: desc }
    ]
  };
}
