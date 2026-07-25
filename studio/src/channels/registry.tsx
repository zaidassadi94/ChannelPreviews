import type { ComponentType, ReactNode } from 'react'
import { WhatsAppSidebar } from './whatsapp/WhatsAppSidebar'
import { WhatsAppPreview } from './whatsapp/WhatsAppPreview'

export interface ChannelDef {
  id: string
  label: string
  icon: ReactNode
  group: 'Messaging' | 'Notify' | 'Email' | 'Web' | 'Ads'
  Sidebar?: ComponentType
  Preview?: ComponentType
}

const emoji = (e: string): ReactNode => <span style={{ fontSize: 20, lineHeight: 1 }}>{e}</span>

/* One entry per channel. WhatsApp is fully migrated; the rest are registered
   (so the nav + no-reload switching are real) and render a "coming soon" stub
   until each module is ported. Adding a channel = drop in Sidebar+Preview here. */
export const CHANNELS: ChannelDef[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: emoji('💬'), group: 'Messaging', Sidebar: WhatsAppSidebar, Preview: WhatsAppPreview },
  { id: 'rcs', label: 'RCS', icon: emoji('📲'), group: 'Messaging' },
  { id: 'sms', label: 'SMS', icon: emoji('✉️'), group: 'Messaging' },
  { id: 'gmail', label: 'Gmail', icon: emoji('📧'), group: 'Email' },
  { id: 'push', label: 'Push', icon: emoji('🔔'), group: 'Notify' },
  { id: 'inapp', label: 'In-App', icon: emoji('📱'), group: 'Notify' },
  { id: 'game', label: 'Game', icon: emoji('🎁'), group: 'Notify' },
  { id: 'osm', label: 'Onsite', icon: emoji('🌐'), group: 'Web' },
  { id: 'instagram', label: 'Instagram', icon: emoji('📸'), group: 'Ads' },
  { id: 'facebook', label: 'Facebook', icon: emoji('👍'), group: 'Ads' },
]

export const channelById = (id: string) => CHANNELS.find((c) => c.id === id)
