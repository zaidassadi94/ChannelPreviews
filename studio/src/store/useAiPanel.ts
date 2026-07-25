import { create } from 'zustand'

interface AiPanelState {
  open: boolean
  setOpen: (o: boolean) => void
  toggle: () => void
}

export const useAiPanel = create<AiPanelState>((set, get) => ({
  open: false,
  setOpen: (o) => set({ open: o }),
  toggle: () => set({ open: !get().open }),
}))
