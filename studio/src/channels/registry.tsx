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
import { CardsPreview } from './cards/CardsPreview'
import { cardsSections } from './cards/panels'
import { GmailPreview } from './gmail/GmailPreview'
import { gmailSections } from './gmail/panels'
import { OsmPreview } from './osm/OsmPreview'
import { osmSections } from './osm/panels'
import { WebPushPreview } from './webpush/WebPushPreview'
import { webpushSections } from './webpush/panels'
import { CH_ICON } from './channelIcons'
import { InstagramPreview } from './instagram/InstagramPreview'
import { igSections } from './instagram/panels'
import { FacebookPreview } from './facebook/FacebookPreview'
import { fbSections } from './facebook/panels'

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

/* One entry per channel. WhatsApp is fully migrated (sections + preview); the rest are
   registered so the channel dropdown + no-reload switching are real, and show a "coming
   soon" stub until ported. Adding a channel = drop in its sections + preview here. */
export const CHANNELS: ChannelDef[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: CH_ICON.whatsapp, group: 'Messaging', sections: whatsappSections, Preview: WhatsAppPreview },
  { id: 'rcs', label: 'RCS', icon: CH_ICON.rcs, group: 'Messaging', sections: rcsSections, Preview: RcsPreview },
  { id: 'sms', label: 'SMS', icon: CH_ICON.sms, group: 'Messaging', sections: smsSections, Preview: SmsPreview },
  { id: 'gmail', label: 'Gmail', icon: CH_ICON.gmail, group: 'Email', sections: gmailSections, Preview: GmailPreview },
  { id: 'push', label: 'Push', icon: CH_ICON.push, group: 'Notify', sections: pushSections, Preview: PushPreview },
  { id: 'inapp', label: 'In-App', icon: CH_ICON.inapp, group: 'Notify', sections: inappSections, Preview: InAppPreview },
  { id: 'game', label: 'Gamification', icon: CH_ICON.game, group: 'Notify', sections: gameSections, Preview: GamePreview },
  { id: 'cards', label: 'Cards / Inbox', icon: CH_ICON.cards, group: 'Notify', sections: cardsSections, Preview: CardsPreview },
  { id: 'osm', label: 'Onsite', icon: CH_ICON.osm, group: 'Web', sections: osmSections, Preview: OsmPreview },
  { id: 'webpush', label: 'Web Push', icon: CH_ICON.webpush, group: 'Web', sections: webpushSections, Preview: WebPushPreview },
  { id: 'instagram', label: 'Instagram Ads', icon: CH_ICON.instagram, group: 'Ads', sections: igSections, Preview: InstagramPreview },
  { id: 'facebook', label: 'Facebook Ads', icon: CH_ICON.facebook, group: 'Ads', sections: fbSections, Preview: FacebookPreview },
]

export const channelById = (id: string) => CHANNELS.find((c) => c.id === id)
