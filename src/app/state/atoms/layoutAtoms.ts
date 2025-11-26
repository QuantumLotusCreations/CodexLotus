import { atom } from "jotai";

export interface LayoutState {
  isChatOpen: boolean;
  chatWidth: number;
}

const baseAtom = atom<LayoutState>({
  isChatOpen: true,
  chatWidth: 320,
});

const viewModelAtom = atom((get) => get(baseAtom));

const toggleChatAtom = atom(null, (get, set) => {
  const s = get(baseAtom);
  set(baseAtom, { ...s, isChatOpen: !s.isChatOpen });
});

const setChatWidthAtom = atom(null, (get, set, width: number) => {
  const s = get(baseAtom);
  set(baseAtom, { ...s, chatWidth: width });
});

export const layoutAtoms = {
  baseAtom,
  viewModelAtom,
  toggleChatAtom,
  setChatWidthAtom,
};

