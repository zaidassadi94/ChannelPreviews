import { create } from 'zustand'
import { INDUSTRIES, industryById } from '@/content/model'

let _uid = 1
export const nid = () => 'm' + _uid++

export type WAType = 'text' | 'image' | 'template'
export interface WAMsg {
  id: string
  type: WAType
  from: 'business' | 'customer'
  text?: string
  img?: string
  caption?: string
  body?: string
  footer?: string
  buttons?: string
}

export const WA_DEFAULTS: Record<WAType, Omit<WAMsg, 'id'>> = {
  text: { type: 'text', from: 'business', text: 'Hello! 👋', buttons: '' },
  image: { type: 'image', from: 'business', img: '', caption: '', buttons: '' },
  template: { type: 'template', from: 'business', img: '', body: 'Your message *here*.', footer: '', buttons: 'Track | url | https://ex.com\nSupport | call | +100' },
}

export function makeMsg(type: WAType, over: Partial<WAMsg> = {}): WAMsg {
  return { ...JSON.parse(JSON.stringify(WA_DEFAULTS[type])), id: nid(), ...over }
}

export interface Brand { name: string; sub: string; logo: string | null; verified: boolean }

interface StudioState {
  // shared context
  channel: string
  device: 'ios' | 'android'
  industry: string
  sub: string | null
  brand: Brand
  sim: boolean
  dateChip: string

  // whatsapp slice
  wa: { messages: WAMsg[]; played: WAMsg[]; encNotice: boolean; typing: boolean }

  // shared actions
  setChannel: (c: string) => void
  setDevice: (d: 'ios' | 'android') => void
  setIndustry: (id: string) => void
  setSub: (s: string) => void
  setBrand: (patch: Partial<Brand>) => void
  setSim: (on: boolean) => void
  setDateChip: (v: string) => void

  // whatsapp actions
  waSetMessages: (msgs: WAMsg[]) => void
  waAdd: (type: WAType) => void
  waUpdate: (idx: number, patch: Partial<WAMsg>) => void
  waDelete: (idx: number) => void
  waMove: (idx: number, dir: -1 | 1) => void
  waToggle: (key: 'encNotice' | 'typing') => void
  waClear: () => void

  // simulate branching
  simTapReply: (reply: string, response?: string) => void
  simReset: () => void

  ctxId: () => string
}

export const useStudio = create<StudioState>((set, get) => ({
  channel: 'whatsapp',
  device: 'ios',
  industry: 'ecom',
  sub: 'fashion',
  brand: { name: 'Nova', sub: 'online', logo: null, verified: true },
  sim: false,
  dateChip: 'Today',
  wa: { messages: [makeMsg('text')], played: [], encNotice: true, typing: false },

  setChannel: (c) => set({ channel: c, sim: false, wa: { ...get().wa, played: [] } }),
  setDevice: (d) => set({ device: d }),
  setIndustry: (id) => {
    const ind = industryById(id)
    const sub = ind && ind.subs.length ? ind.subs[0][0] : null
    set({ industry: id, sub, brand: { ...get().brand, name: ind ? ind.biz : get().brand.name, sub: ind ? ind.status : get().brand.sub } })
  },
  setSub: (s) => set({ sub: s }),
  setBrand: (patch) => set({ brand: { ...get().brand, ...patch } }),
  setSim: (on) => set({ sim: on, wa: { ...get().wa, played: [] } }),
  setDateChip: (v) => set({ dateChip: v }),

  waSetMessages: (msgs) => set({ wa: { ...get().wa, messages: msgs, played: [] } }),
  waAdd: (type) => set({ wa: { ...get().wa, messages: [...get().wa.messages, makeMsg(type)] } }),
  waUpdate: (idx, patch) => {
    const messages = get().wa.messages.slice()
    messages[idx] = { ...messages[idx], ...patch }
    set({ wa: { ...get().wa, messages } })
  },
  waDelete: (idx) => set({ wa: { ...get().wa, messages: get().wa.messages.filter((_, i) => i !== idx) } }),
  waMove: (idx, dir) => {
    const messages = get().wa.messages.slice()
    const j = idx + dir
    if (j < 0 || j >= messages.length) return
    ;[messages[idx], messages[j]] = [messages[j], messages[idx]]
    set({ wa: { ...get().wa, messages } })
  },
  waToggle: (key) => set({ wa: { ...get().wa, [key]: !get().wa[key] } }),
  waClear: () => set({ wa: { ...get().wa, messages: [makeMsg('text')], played: [] } }),

  simTapReply: (reply, response) => {
    const played = get().wa.played.slice()
    played.push(makeMsg('text', { from: 'customer', text: reply || 'Selected' }))
    if (response) played.push(makeMsg('text', { from: 'business', text: response }))
    set({ wa: { ...get().wa, played } })
  },
  simReset: () => set({ wa: { ...get().wa, played: [] } }),

  ctxId: () => get().sub || get().industry,
}))

export { INDUSTRIES }
