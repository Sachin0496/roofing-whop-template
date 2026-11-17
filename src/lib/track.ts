/**
 * Thin wrapper over the Whop pixel (`window.whop.track`), which Whop injects on
 * every page served from a whop.site / whop.app domain.
 *
 * Custom events used by this template:
 *   - service_viewed     → a visitor opens a service detail page
 *   - estimate_requested → the estimate form created a lead
 *   - deposit_started    → the deposit checkout opened
 * plus standard events (lead, view_content, initiate_checkout) so Whop's
 * attribution reports pick them up too.
 *
 * Every call is also mirrored to `window.__whopEvents` and a DOM event so the
 * on-page Pixel Inspector (add `?pixel=debug` to any URL) can show them live.
 */

export type TrackProps = {
  value?: number
  currency?: string
  event_id?: string
  variant_id?: string
  product_id?: string
  [k: string]: unknown
}

declare global {
  interface Window {
    whop?: { track: (name: string, props?: TrackProps) => void }
    __whopEvents?: Array<{ name: string; props?: TrackProps; at: number; delivered: boolean }>
  }
}

export const PIXEL_EVENT = 'roofing:pixel'

export function track(name: string, props?: TrackProps) {
  if (typeof window === 'undefined') return
  const clean = props ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined && v !== '')) : undefined
  let delivered = false
  try {
    if (window.whop?.track) {
      window.whop.track(name, clean)
      delivered = true
    }
  } catch (e) {
    console.warn('[pixel] track failed', e)
  }
  const entry = { name, props: clean, at: Date.now(), delivered }
  ;(window.__whopEvents ??= []).push(entry)
  window.dispatchEvent(new CustomEvent(PIXEL_EVENT, { detail: entry }))
  console.info(`[pixel] ${delivered ? '→ whop.track' : '(no pixel on this host)'} "${name}"`, clean ?? '')
}

export const newEventId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
