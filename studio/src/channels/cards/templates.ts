import { useStudio, type CardItem } from '@/store/useStudio'
import { useToast } from '@/store/useToast'
import { type Pack, confirmFor, packFor, cap } from '@/content/model'
import { heroPhoto, tphoto } from '@/lib/photo'

export interface CardsBuild { screenTitle: string; items: CardItem[] }
export interface CardsTemplate {
  name: string
  kind: 'Promotional' | 'Transactional' | 'Flow'
  icon: string
  desc: string
  flow?: boolean
  build: (p: Pack, ctxId: string) => CardsBuild
}

const banner = (p: Pack, seed: string) => heroPhoto(p, seed, 600, 300)
const prod = (name: string, _seed: string) => tphoto(name, 600, 300)
const mk = (o: Partial<CardItem>): CardItem => ({ image: '', title: '', body: '', tag: '', time: 'now', unread: false, ...o })

export const CARDS_TEMPLATES: CardsTemplate[] = [
  {
    name: 'Order updates', kind: 'Transactional', icon: '📦', desc: 'Order + delivery + offer',
    build: (p, ctx) => ({ screenTitle: 'Updates', items: [
      mk({ tag: 'Order', title: `Order #${p.orderId} confirmed`, body: confirmFor(ctx).line || `Thanks for shopping with ${p.brand}.`, time: '2m', unread: true }),
      mk({ tag: 'Delivery', title: 'Out for delivery', body: 'Arriving today by 6 PM — tap to track it live.', time: '1h' }),
      mk({ image: banner(p, '2'), tag: 'Offer', title: cap(p.offer), body: `A little something for your next order at ${p.brand}.`, time: '3h' }),
    ] }),
  },
  {
    name: 'New arrivals feed', kind: 'Promotional', icon: '🆕', desc: 'Product cards',
    build: (p) => ({ screenTitle: 'For you', items: [
      mk({ image: banner(p, '4'), tag: 'Just dropped', title: cap(p.offer), body: `The new collection is live at ${p.brand}.`, time: 'now', unread: true }),
      ...p.carousel.slice(0, 2).map((c, i) => mk({ image: prod(c[0], String(i)), tag: 'New', title: c[0], body: `Just landed · ${c[1]}`, time: `${i + 1}h` })),
    ] }),
  },
  {
    name: 'Offers & deals', kind: 'Promotional', icon: '🏷️', desc: 'Deals + coupon',
    build: (p) => ({ screenTitle: 'Offers', items: [
      mk({ image: banner(p, '5'), tag: 'Deal', title: cap(p.offer), body: "Ends soon — don't miss it.", time: 'now', unread: true }),
      mk({ tag: 'Coupon', title: `Your code: ${p.code || 'SAVE10'}`, body: 'Tap to copy and use it at checkout.', time: '1h' }),
      mk({ image: banner(p, '8'), tag: 'Flash', title: 'Flash sale is live', body: `Up to 50% off at ${p.brand} for the next few hours.`, time: '2h' }),
    ] }),
  },
  {
    name: 'Discover / content', kind: 'Promotional', icon: '✨', desc: 'Recommendations',
    build: (p) => ({ screenTitle: 'Discover', items: [
      mk({ image: banner(p, '3'), tag: 'For you', title: 'Picked for you', body: `New recommendations based on what you love at ${p.brand}.`, time: 'now', unread: true }),
      mk({ tag: 'Guide', title: 'Get the most out of it', body: 'A quick 2-minute read to help you get started.', time: '4h' }),
      mk({ image: prod(p.carousel[0] ? p.carousel[0][0] : 'Trending', '9'), tag: 'Trending', title: 'Trending this week', body: 'See what everyone is loving right now.', time: '1d' }),
    ] }),
  },
  {
    name: 'Account & activity', kind: 'Transactional', icon: '🔔', desc: 'Rewards + reminders',
    build: (p) => ({ screenTitle: 'Activity', items: [
      mk({ tag: 'Rewards', title: 'You earned 250 points', body: 'Redeem them on your next purchase.', time: 'now', unread: true }),
      mk({ tag: 'Payment', title: 'Payment received', body: 'Your recent payment went through successfully.', time: '2h' }),
      mk({ tag: 'Reminder', title: cap(p.reminder), body: 'Tap to take a look before it changes.', time: '1d' }),
    ] }),
  },
  {
    name: 'Mixed feed', kind: 'Flow', icon: '🗂️', desc: 'A blend — tap to open', flow: true,
    build: (p) => ({ screenTitle: 'Inbox', items: [
      mk({ image: banner(p, '2'), tag: 'Offer', title: cap(p.offer), body: 'Your welcome gift is inside — tap to open.', time: 'now', unread: true }),
      mk({ tag: 'Order', title: `Order #${p.orderId} shipped`, body: 'On its way — arriving soon.', time: '3h' }),
      mk({ image: prod(p.carousel[1] ? p.carousel[1][0] : 'New arrival', '7'), tag: 'New', title: p.carousel[1] ? p.carousel[1][0] : 'New arrival', body: 'Just added — take a look.', time: '1d' }),
    ] }),
  },
]

export function applyCardsTemplate(t: CardsTemplate, announce = true) {
  const s = useStudio.getState()
  const p = packFor(s.ctxId())
  if (!p) return
  const f = t.build(p, s.ctxId())
  s.setCards({ appName: p.brand, logo: null, screenTitle: f.screenTitle, items: f.items })
  if (announce) useToast.getState().show('Preset applied' + (t.flow ? ' · hit Simulate to tap a card' : ''))
}
