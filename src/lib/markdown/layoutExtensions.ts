import { visit } from "unist-util-visit";
import type { Plugin } from "unified";

export const layoutExtensions: Plugin = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const data = node.data || (node.data = {});
        const attributes = node.attributes || {};
        const name = node.name;

        // 1. Map Directive Name to CSS Class
        // We prefix with 'l-' for layout to avoid collisions
        // Usage: :::col2 ... :::
        
        const validDirectives = ["col2", "col3", "pagebreak", "aside", "avoid", "center"];
        
        if (validDirectives.includes(name)) {
             const hast = data.hProperties || (data.hProperties = {});
             
             // Add class
             hast.className = [...(hast.className || []), `l-${name}`];
             
             // Add any other attributes passed in (id, class, etc)
             if (attributes.class) {
                 hast.className.push(attributes.class);
             }
             if (attributes.id) {
                 hast.id = attributes.id;
             }

             // Set HTML tag
             // containerDirective -> div
             // leafDirective -> div (or hr for pagebreak)
             // textDirective -> span
             
             if (node.type === 'textDirective') {
                 data.hName = 'span';
             } else {
                 data.hName = 'div';
             }
        }
      }
    });
  };
};

