import { atom } from "jotai";

export interface ProjectFileEntry {
  path: string;
}

// Root directory of the current CodexLotus project (folder of markdown files).
export const projectRootAtom = atom<string | null>(null);

// Flat list of markdown files discovered under the project root.
export const projectFilesAtom = atom<ProjectFileEntry[]>([]);

// Currently active file in the editor workspace.
export const activeFilePathAtom = atom<string | null>(null);

// Logical "file tabs" within the editor workspace (by path).
export const fileTabsAtom = atom<string[]>([]);

export const activeFileTabAtom = atom(
  (get) => get(activeFilePathAtom),
  (get, set, nextPath: string | null) => {
    const currentTabs = get(fileTabsAtom);
    if (nextPath && !currentTabs.includes(nextPath)) {
      set(fileTabsAtom, [...currentTabs, nextPath]);
    }
    set(activeFilePathAtom, nextPath);
  }
);

// Which files are currently selected as explicit AI context.
export const contextSelectionAtom = atom<string[]>([]);

export const resolvedContextFilesAtom = atom((get) => {
  const selected = new Set(get(contextSelectionAtom));
  const files = get(projectFilesAtom);
  return files.filter((f) => selected.has(f.path));
});
