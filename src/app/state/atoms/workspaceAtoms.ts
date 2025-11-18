import { atom } from "jotai";

export type WorkspaceTabType = "editor" | "chat" | "diff" | "search" | "settings" | "tool";

export interface WorkspaceTab {
  id: string;
  type: WorkspaceTabType;
  title: string;
  icon?: string;
  payload?: Record<string, unknown>;
}

interface WorkspaceViewModel {
  tabs: WorkspaceTab[];
  activeTabId?: string;
}

const baseStateAtom = atom<WorkspaceViewModel>({
  tabs: [
    {
      id: "editor",
      type: "editor",
      title: "Editor",
    },
    {
      id: "chat",
      type: "chat",
      title: "Chat",
    },
    {
      id: "settings",
      type: "settings",
      title: "Settings",
    },
  ],
  activeTabId: "editor",
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

export const workspaceAtoms = {
  baseStateAtom,
  viewModelAtom,
  setActiveTabAtom,
};
