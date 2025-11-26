import { atom } from "jotai";
import { workspaceAtoms } from "./workspaceAtoms";

export interface ProjectFileEntry {
  path: string;
}

// Root directory of the current CodexLotus project (folder of markdown files).
export const projectRootAtom = atom<string | null>(null);

// Flat list of markdown files discovered under the project root.
export const projectFilesAtom = atom<ProjectFileEntry[]>([]);

// Currently active file in the editor workspace.
// Derived from workspace atoms to keep single source of truth.
export const activeFilePathAtom = atom((get) => {
  const { tabs, activeTabId } = get(workspaceAtoms.baseStateAtom);
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab && activeTab.type === "editor") {
    return activeTab.path || null;
  }
  return null;
});

// Logical "file tabs" within the editor workspace (by path).
// Derived from workspace atoms.
export const fileTabsAtom = atom((get) => {
    const { tabs } = get(workspaceAtoms.baseStateAtom);
    return tabs
        .filter(t => t.type === "editor" && t.path)
        .map(t => t.path as string);
});

export const activeFileTabAtom = atom(
  (get) => get(activeFilePathAtom),
  (get, set, nextPath: string | null) => {
    if (nextPath) {
      set(workspaceAtoms.openFileTabAtom, nextPath);
    }
  }
);

// Which files are currently selected as explicit AI context.
export const contextSelectionAtom = atom<string[]>([]);

export const resolvedContextFilesAtom = atom((get) => {
  const selected = new Set(get(contextSelectionAtom));
  const files = get(projectFilesAtom);
  return files.filter((f) => selected.has(f.path));
});
