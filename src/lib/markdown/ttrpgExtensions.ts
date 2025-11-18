import type { Plugin } from "unified";

export const ttrpgExtensions: Plugin = () => {
  return (tree) => {
    // TODO: Implement custom syntax transforms for stat blocks, tables, tags, etc.
    return tree;
  };
};
