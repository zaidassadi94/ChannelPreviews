import type { ComponentType, ReactNode } from 'react'
import { WhatsAppPreview } from './whatsapp/WhatsAppPreview'
import { whatsappSections } from './whatsapp/panels'
import { RcsPreview } from './rcs/RcsPreview'
import { rcsSections } from './rcs/panels'
import { SmsPreview } from './sms/SmsPreview'
import { smsSections } from './sms/panels'
import { PushPreview } from './push/PushPreview'
import { pushSections } from './push/panels'
import { InAppPreview } from './inapp/InAppPreview'
import { inappSections } from './inapp/panels'
import { GamePreview } from './game/GamePreview'
import { gameSections } from './game/panels'
import { GmailPreview } from './gmail/GmailPreview'
import { gmailSections } from './gmail/panels'

export interface SectionDef {
  id: string
  label: string
  icon: ReactNode
  Panel: ComponentType
}

export interface ChannelDef {
  id: string
  label: string
  icon: ReactNode
  group: 'Messaging' | 'Notify' | 'Email' | 'Web' | 'Ads'
  sections?: SectionDef[]
  Preview?: ComponentType
}

const emoji = (e: string): ReactNode => <span style={{ fontSize: 18, lineHeight: 1 }}>{e}</span>

/* One entry per channel. WhatsApp is fully migrated (sections + preview); the rest are
   registered so the channel dropdown + no-reload switching are real, and show a "coming
   soon" stub until ported. Adding a channel = drop in its sections + preview here. */
export const CHANNELS: ChannelDef[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: emoji('💬'), group: 'Messaging', sections: whatsappSections, Preview: WhatsAppPreview },
  { id: 'rcs', label: 'RCS', icon: emoji('📲'), group: 'Messaging', sections: rcsSections, Preview: RcsPreview },
  { id: 'sms', label: 'SMS', icon: emoji('✉️'), group: 'Messaging', sections: smsSections, Preview: SmsPreview },
  { id: 'gmail', label: 'Gmail', icon: emoji('📧'), group: 'Email', sections: gmailSections, Preview: GmailPreview },
  { id: 'push', label: 'Push', icon: emoji('🔔'), group: 'Notify', sections: pushSections, Preview: PushPreview },
  { id: 'inapp', label: 'In-App', icon: emoji('📱'), group: 'Notify', sections: inappSections, Preview: InAppPreview },
  { id: 'game', label: 'Gamification', icon: emoji('🎁'), group: 'Notify', sections: gameSections, Preview: GamePreview },
  { id: 'osm', label: 'Onsite', icon: emoji('🌐'), group: 'Web' },
  { id: 'instagram', label: 'Instagram Ads', icon: emoji('📸'), group: 'Ads' },
  { id: 'facebook', label: 'Facebook Ads', icon: emoji('👍'), group: 'Ads' },
]

export const channelById = (id: string) => CHANNELS.find((c) => c.id === id)
