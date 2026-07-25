import { create } from 'zustand'

interface ToastState {
  msg: string
  visible: boolean
  show: (m: string) => void
}

let timer: ReturnType<typeof setTimeout> | undefined

export const useToast = create<ToastState>((set) => ({
  msg: '',
  visible: false,
  show: (m) => {
    set({ msg: m, visible: true })
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => set({ visible: false }), 2600)
  },
}))
