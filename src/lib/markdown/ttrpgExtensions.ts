import { visit } from "unist-util-visit";
import yaml from "js-yaml";
import type { Plugin } from "unified";

interface StatBlock {
  name: string;
  [key: string]: any;
}

export interface TtrpgOptions {
  bgColor?: string;
  fontColor?: string;
}

export const ttrpgExtensions: Plugin<[TtrpgOptions?]> = (options = {}) => {
  const bgColor = options.bgColor || "#fdf1dc";
  const fontColor = options.fontColor || "#58180D";
  
  return (tree) => {
    visit(tree, "code", (node: any, index, parent) => {
      if (node.lang === "statblock" || node.lang === "codex") {
        try {
          const data = yaml.load(node.value) as any;
          
          // Create HAST (HTML Abstract Syntax Tree) structure
          const hast = {
            type: "element",
            tagName: "div",
            properties: { 
              className: ["c-statblock", "c-codex-block"],
              style: `background-color: ${bgColor}; color: ${fontColor}; font-family: 'Noto Sans', sans-serif; padding: 16px; border: 1px solid #e0c99a; border-radius: 4px; box-shadow: 0 0 6px rgba(0,0,0,0.5); margin: 24px 0; max-width: 400px; overflow-wrap: break-word; white-space: pre-wrap;`
            },
            children: renderContent(data, fontColor)
          };

          node.data = node.data || {};
          node.data.hName = "div";
          node.data.hProperties = hast.properties;
          node.data.hChildren = hast.children;
        } catch (e) {
          console.error("Failed to parse statblock", e);
        }
      }
    });
  };
};

function renderContent(data: any, fontColor: string) {
    const children: any[] = [];
    
    // 1. Header (Name & Meta)
    if (data.name) {
        children.push({
            type: "element",
            tagName: "h3",
            properties: { 
                className: ["c-codex__name"],
                style: `font-family: serif; font-size: 24px; font-weight: bold; margin: 0 0 4px 0; color: ${fontColor}; text-transform: uppercase; letter-spacing: 1px;`
            },
            children: [{ type: "text", value: String(data.name) }]
        });
    }

    // Optional Meta/Description line (e.g. "Medium Humanoid" or "Rank 2 Vehicle")
    if (data.description || data.meta || data.type) {
        const metaText = data.description || data.meta || data.type;
        children.push({
            type: "element",
            tagName: "div",
            properties: { 
                className: ["c-codex__meta"],
                style: "font-style: italic; font-size: 12px; margin-bottom: 8px;"
            },
            children: [{ type: "text", value: String(metaText) }]
        });
    }
    
    children.push(createDivider(fontColor));

    // 2. Iterate all keys to render content dynamically
    const entries = Object.entries(data).filter(([k]) => 
        !["name", "description", "meta", "type", "template"].includes(k.toLowerCase())
    );
    
    entries.forEach(([key, value]) => {
        // Case A: Array of objects (Features/Actions list)
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
             // Section Header
             const label = formatLabel(key);
             children.push({
                  type: "element",
                  tagName: "h4",
                  properties: { className: ["c-statblock__section-header"], style: `border-bottom: 1px solid ${fontColor}; color: ${fontColor}; font-size: 18px; font-family: serif; margin-top: 12px; margin-bottom: 4px; padding-bottom: 2px;` },
                  children: [{ type: "text", value: label }]
              });
              
              // List items
              value.forEach((item: any) => {
                  if (item.name && item.desc) {
                      children.push(createFeature(item.name, item.desc, "c-statblock__trait"));
                  }
              });
        }
        // Case B: Nested Object (Render as Horizontal Grid)
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Optional Header for non-standard groups
            const isStandard = ["stats", "attributes"].includes(key.toLowerCase());
            if (!isStandard) {
                 children.push({
                    type: "element",
                    tagName: "h4",
                    properties: { className: ["c-statblock__group-header"], style: `color: ${fontColor}; font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 8px 0 4px 0; opacity: 0.8;` },
                    children: [{ type: "text", value: formatLabel(key) }]
                });
            }

            children.push(createHorizontalStats(value));
            children.push(createDivider(fontColor));
        }
        // Case C: Simple Key-Value (Armor Class: 15)
        else if (typeof value !== 'object' || value === null) {
             const label = formatLabel(key);
             children.push({
                type: "element",
                tagName: "div",
                properties: { className: ["c-statblock__attribute"], style: "margin-bottom: 2px; font-size: 14px; line-height: 1.4;" },
                children: [
                    { 
                        type: "element", 
                        tagName: "strong", 
                        properties: { style: "font-weight: bold;" }, 
                        children: [{ type: "text", value: `${label}: ` }] 
                    },
                    { type: "text", value: String(value) }
                ]
            });
        }
    });
    
    return children;
}

function formatLabel(key: string) {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
}

function createDivider(color: string) {
    return { 
        type: "element", 
        tagName: "hr", 
        properties: { 
            className: ["c-statblock__divider"], 
            style: `border: 0; height: 2px; background-image: linear-gradient(to right, transparent, ${color}, transparent); margin: 6px 0;` 
        }, 
        children: [] 
    };
}

function createHorizontalStats(stats: any) {
  // Dynamically create the horizontal bar from whatever keys are present
  const entries = Object.entries(stats);
  
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["c-statblock__abilities"], style: "display: flex; justify-content: space-around; text-align: center; margin: 8px 0; flex-wrap: wrap; gap: 8px;" },
    children: entries.map(([key, value]) => {
      // If key is short (<= 4 chars), assume abbreviation (STR, INT). 
      // If longer, Title Case it to look nice (Speed, Armor).
      let label = key.toUpperCase();
      if (key.length > 4) {
          label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
      }
      
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["c-statblock__ability"] },
        children: [
           { type: "element", tagName: "div", properties: { className: ["c-statblock__ability-name"], style: "font-weight: bold; font-size: 10px;" }, children: [{ type: "text", value: label }] },
           { type: "element", tagName: "div", properties: { className: ["c-statblock__ability-score"], style: "font-size: 14px;" }, children: [{ type: "text", value: String(value) }] }
        ]
      };
    })
  };
}

function createFeature(name: string, desc: string, className: string) {
  return {
    type: "element",
    tagName: "div",
    properties: { className: [className], style: "margin-bottom: 4px; font-size: 14px;" },
    children: [
      { type: "element", tagName: "strong", properties: { className: ["c-statblock__feature-name"], style: "font-style: italic; font-weight: bold;" }, children: [{ type: "text", value: `${name}. ` }] },
      { type: "text", value: desc }
    ]
  };
}

