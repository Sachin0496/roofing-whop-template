import { useEffect, useState } from 'react'
import { PIXEL_EVENT } from '#/lib/track'

type Entry = { name: string; props?: Record<string, unknown>; at: number; delivered: boolean }

/**
 * Developer overlay that lists every `whop.track` call made on the page.
 * Turn it on with `?pixel=debug` (persists in localStorage) and off with `?pixel=off`.
 * Hidden for normal visitors.
 */
export function PixelInspector() {
  const [enabled, setEnabled] = useState(false)
  const [open, setOpen] = useState(true)
  const [events, setEvents] = useState<Entry[]>([])

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('pixel')
    try {
      if (param === 'debug') localStorage.setItem('pixel-debug', '1')
      if (param === 'off') localStorage.removeItem('pixel-debug')
      setEnabled(localStorage.getItem('pixel-debug') === '1')
    } catch {
      setEnabled(param === 'debug')
    }
    setEvents([...(window.__whopEvents ?? [])])
    const onEvent = (e: Event) => setEvents((prev) => [...prev, (e as CustomEvent<Entry>).detail])
    window.addEventListener(PIXEL_EVENT, onEvent)
    return () => window.removeEventListener(PIXEL_EVENT, onEvent)
  }, [])

  if (!enabled) return null
  const pixelLive = typeof window !== 'undefined' && !!window.whop?.track

  return (
    <div className="fixed right-3 bottom-3 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-xl border border-stone-700 bg-stone-950/95 font-mono text-[11px] text-stone-200 shadow-2xl backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border-b border-stone-800 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2 font-semibold">
          <span className={`size-2 rounded-full ${pixelLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          Whop Pixel inspector · {events.length}
        </span>
        <span className="text-stone-500">{pixelLive ? 'window.whop live' : 'no pixel (local)'} {open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <ol className="max-h-64 space-y-1.5 overflow-y-auto p-3">
          {events.length === 0 && <li className="text-stone-500">No custom events yet. Page views are tracked automatically.</li>}
          {events
            .slice()
            .reverse()
            .map((e, i) => (
              <li key={`${e.at}-${i}`} className="rounded-md bg-stone-900 px-2 py-1.5">
                <div className="flex justify-between gap-2">
                  <span className={e.delivered ? 'text-emerald-300' : 'text-amber-300'}>whop.track("{e.name}")</span>
                  <span className="text-stone-500">{new Date(e.at).toLocaleTimeString()}</span>
                </div>
                {e.props && <div className="mt-0.5 break-all text-stone-400">{JSON.stringify(e.props)}</div>}
              </li>
            ))}
        </ol>
      )}
    </div>
  )
}
