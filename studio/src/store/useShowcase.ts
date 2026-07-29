import { create } from 'zustand'

/** Feature flag for Showcase mode. Hidden for now (owner will debug, then re-enable) — the
    whole feature stays built; flip this to `true` to surface the TopBar button again. */
export const SHOWCASE_ENABLED = false

/** One device on the Showcase board — a channel plus its slide-only decoration (an optional
    caption line and a colored segment badge, like the green tags in the reference decks).
    The message content itself lives in that channel's normal store slice (approach A: live,
    distinct-channel tiles), so every existing editor keeps working on it unchanged. */
export interface ShowcaseTile {
  id: string
  channel: string
  caption: string
  badge: string
  badgeColor: string
  /** Per-tile brief, used in Directed mode (Auto mode plans the angle instead). */
  brief: string
  /** Transient generation status for the tile's progress cue. */
  status?: 'idle' | 'busy' | 'done' | 'error'
}

let _sid = 1
const sid = () => 'sc' + _sid++
const mkTile = (channel: string): ShowcaseTile => ({ id: sid(), channel, caption: '', badge: '', badgeColor: '#16a34a', brief: '', status: 'idle' })

/** Default row — three distinct channels, matching the "clean tryptich" reference. */
const DEFAULT_CHANNELS = ['whatsapp', 'gmail', 'push']

interface ShowcaseState {
  open: boolean
  tiles: ShowcaseTile[]
  layout: 'row'
  headline: string
  /** Prompt state for AI generate-all. */
  brand: string
  brief: string
  mode: 'auto' | 'directed'
  generating: boolean
  /** Slide background for export — transparent (drops onto any deck) or a solid. */
  background: 'transparent' | 'white' | 'slate'
  /** The tile currently being edited in the normal channel editor (null = viewing board). */
  activeTileId: string | null
  /** True while you're in a channel's editor via a tile's ✎ Edit — shows a Back-to-board pill. */
  editReturn: boolean

  setOpen: (o: boolean) => void
  setEditReturn: (b: boolean) => void
  toggle: () => void
  addTile: (channel: string) => void
  removeTile: (id: string) => void
  toggleChannel: (channel: string) => void
  moveTile: (id: string, dir: -1 | 1) => void
  updateTile: (id: string, patch: Partial<ShowcaseTile>) => void
  setHeadline: (h: string) => void
  setBackground: (b: 'transparent' | 'white' | 'slate') => void
  setBrand: (b: string) => void
  setBrief: (b: string) => void
  setMode: (m: 'auto' | 'directed') => void
  setGenerating: (g: boolean) => void
  setTileStatus: (id: string, status: ShowcaseTile['status']) => void
  setActive: (id: string | null) => void
}

export const useShowcase = create<ShowcaseState>((set, get) => ({
  open: false,
  tiles: DEFAULT_CHANNELS.map(mkTile),
  layout: 'row',
  headline: '',
  brand: '',
  brief: '',
  mode: 'auto',
  generating: false,
  background: 'transparent',
  activeTileId: null,
  editReturn: false,

  setOpen: (o) => set({ open: o, activeTileId: o ? get().activeTileId : null, editReturn: o ? false : get().editReturn }),
  setEditReturn: (b) => set({ editReturn: b }),
  toggle: () => set((s) => ({ open: !s.open, activeTileId: null, editReturn: false })),
  addTile: (channel) => set((s) => ({ tiles: [...s.tiles, mkTile(channel)] })),
  removeTile: (id) => set((s) => ({ tiles: s.tiles.filter((t) => t.id !== id), activeTileId: s.activeTileId === id ? null : s.activeTileId })),
  toggleChannel: (channel) => set((s) => {
    const has = s.tiles.find((t) => t.channel === channel)
    return has ? { tiles: s.tiles.filter((t) => t.channel !== channel) } : { tiles: [...s.tiles, mkTile(channel)] }
  }),
  moveTile: (id, dir) => set((s) => {
    const i = s.tiles.findIndex((t) => t.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= s.tiles.length) return {}
    const tiles = s.tiles.slice()
    ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
    return { tiles }
  }),
  updateTile: (id, patch) => set((s) => ({ tiles: s.tiles.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  setHeadline: (h) => set({ headline: h }),
  setBackground: (b) => set({ background: b }),
  setBrand: (b) => set({ brand: b }),
  setBrief: (b) => set({ brief: b }),
  setMode: (m) => set({ mode: m }),
  setGenerating: (g) => set({ generating: g }),
  setTileStatus: (id, status) => set((s) => ({ tiles: s.tiles.map((t) => (t.id === id ? { ...t, status } : t)) })),
  setActive: (id) => set({ activeTileId: id }),
}))
