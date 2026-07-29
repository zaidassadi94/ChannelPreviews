import { create } from 'zustand'

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
}

let _sid = 1
const sid = () => 'sc' + _sid++
const mkTile = (channel: string): ShowcaseTile => ({ id: sid(), channel, caption: '', badge: '', badgeColor: '#16a34a' })

/** Default row — three distinct channels, matching the "clean tryptich" reference. */
const DEFAULT_CHANNELS = ['whatsapp', 'gmail', 'push']

interface ShowcaseState {
  open: boolean
  tiles: ShowcaseTile[]
  layout: 'row'
  headline: string
  /** The tile currently being edited in the normal channel editor (null = viewing board). */
  activeTileId: string | null

  setOpen: (o: boolean) => void
  toggle: () => void
  addTile: (channel: string) => void
  removeTile: (id: string) => void
  toggleChannel: (channel: string) => void
  moveTile: (id: string, dir: -1 | 1) => void
  updateTile: (id: string, patch: Partial<ShowcaseTile>) => void
  setHeadline: (h: string) => void
  setActive: (id: string | null) => void
}

export const useShowcase = create<ShowcaseState>((set, get) => ({
  open: false,
  tiles: DEFAULT_CHANNELS.map(mkTile),
  layout: 'row',
  headline: '',
  activeTileId: null,

  setOpen: (o) => set({ open: o, activeTileId: o ? get().activeTileId : null }),
  toggle: () => set((s) => ({ open: !s.open, activeTileId: null })),
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
  setActive: (id) => set({ activeTileId: id }),
}))
