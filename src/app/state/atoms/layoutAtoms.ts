import { atom } from "jotai";

export type PanelId = 'explorer' | 'editor' | 'assistant';
export type SlotId = 'left' | 'center' | 'right';

export interface LayoutState {
  isRightPanelOpen: boolean;
  
  // Ratios for the three panels (must sum to roughly 1.0, or use flex-grow logic)
  // For simplicity, we track percentage ratios (e.g. 20, 60, 20)
  panelRatios: {
    left: number;
    center: number;
    right: number;
  };

  slots: {
    left: PanelId;
    center: PanelId;
    right: PanelId;
  };
}

const baseAtom = atom<LayoutState>({
  isRightPanelOpen: true,
  panelRatios: {
    left: 20,
    center: 60,
    right: 20,
  },
  slots: {
    left: 'explorer',
    center: 'editor',
    right: 'assistant',
  },
});

const viewModelAtom = atom((get) => get(baseAtom));

const toggleRightPanelAtom = atom(null, (get, set) => {
  const s = get(baseAtom);
  const isOpening = !s.isRightPanelOpen;
  
  let newRatios = { ...s.panelRatios };

  if (isOpening) {
    // Restore right panel, stealing space from center
    newRatios.right = 20; // Default or last known? simplified to 20 for now
    newRatios.center = Math.max(20, 100 - newRatios.left - newRatios.right);
  } else {
    // Close right panel, give space to center
    newRatios.center = newRatios.center + newRatios.right;
    newRatios.right = 0;
  }

  set(baseAtom, { 
    ...s, 
    isRightPanelOpen: isOpening,
    panelRatios: newRatios
  });
});

const setPanelRatiosAtom = atom(null, (get, set, ratios: { left: number; center: number; right: number }) => {
  const s = get(baseAtom);
  set(baseAtom, { ...s, panelRatios: ratios });
});


const swapSlotsAtom = atom(null, (get, set, { slotA, slotB }: { slotA: SlotId; slotB: SlotId }) => {
  const s = get(baseAtom);
  const contentA = s.slots[slotA];
  const contentB = s.slots[slotB];
  
  set(baseAtom, {
    ...s,
    slots: {
      ...s.slots,
      [slotA]: contentB,
      [slotB]: contentA,
    }
  });
});

export const layoutAtoms = {
  baseAtom,
  viewModelAtom,
  toggleRightPanelAtom,
  setPanelRatiosAtom,
  swapSlotsAtom,
};
