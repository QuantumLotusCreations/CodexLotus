import { atom } from "jotai";
import type React from "react";

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
  activeTabComponent?: React.ComponentType | null;
}

const baseStateAtom = atom<WorkspaceViewModel>({
  tabs: [],
  activeTabId: undefined,
  activeTabComponent: null,
});

const viewModelAtom = atom((get) => get(baseStateAtom));

export const workspaceAtoms = {
  baseStateAtom,
  viewModelAtom,
};
