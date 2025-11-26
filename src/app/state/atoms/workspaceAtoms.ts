import { atom } from "jotai";

export type WorkspaceTabType = "editor" | "chat" | "diff" | "search" | "settings" | "tool";

export interface WorkspaceTab {
  id: string;
  type: WorkspaceTabType;
  title: string;
  path?: string; // For editor tabs
  icon?: string;
  payload?: Record<string, unknown>;
}

interface WorkspaceViewModel {
  tabs: WorkspaceTab[];
  activeTabId?: string;
}

const baseStateAtom = atom<WorkspaceViewModel>({
  tabs: [],
  activeTabId: undefined,
});

const viewModelAtom = atom((get) => get(baseStateAtom));

const setActiveTabAtom = atom(null, (get, set, id: string) => {
  const state = get(baseStateAtom);
  if (state.activeTabId === id) return;
  if (!state.tabs.some((t) => t.id === id)) return;

  set(baseStateAtom, {
    ...state,
    activeTabId: id,
  });
});

const closeTabAtom = atom(null, (get, set, id: string) => {
    const state = get(baseStateAtom);
    const newTabs = state.tabs.filter((t) => t.id !== id);
    
    let newActiveId = state.activeTabId;
    
    // If closing the active tab, select the one before it, or the first one
    if (state.activeTabId === id) {
        const index = state.tabs.findIndex((t) => t.id === id);
        if (newTabs.length > 0) {
            // Try to go left, otherwise right
            const newIndex = Math.max(0, index - 1);
            newActiveId = newTabs[newIndex].id;
        } else {
            newActiveId = undefined;
        }
    }

    set(baseStateAtom, {
        tabs: newTabs,
        activeTabId: newActiveId,
    });
});

const openFileTabAtom = atom(null, (get, set, path: string) => {
    const state = get(baseStateAtom);
    const existingTab = state.tabs.find((t) => t.path === path && t.type === "editor");

    if (existingTab) {
        set(setActiveTabAtom, existingTab.id);
    } else {
        // Create new tab
        const segments = path.split(/[/\\]/);
        const fileName = segments[segments.length - 1] || path;
        const newTab: WorkspaceTab = {
            id: `file-${path}`,
            type: "editor",
            title: fileName,
            path: path
        };
        
        set(baseStateAtom, {
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id
        });
    }
});

const openSettingsTabAtom = atom(null, (get, set) => {
    const state = get(baseStateAtom);
    const existingTab = state.tabs.find((t) => t.type === "settings");

    if (existingTab) {
        set(setActiveTabAtom, existingTab.id);
    } else {
        const newTab: WorkspaceTab = {
            id: "settings",
            type: "settings",
            title: "Settings"
        };
         set(baseStateAtom, {
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id
        });
    }
});

export const workspaceAtoms = {
  baseStateAtom,
  viewModelAtom,
  setActiveTabAtom,
  closeTabAtom,
  openFileTabAtom,
  openSettingsTabAtom
};
