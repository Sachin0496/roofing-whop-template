import { WhopElements } from '@whop/elements-react'
import type { Appearance } from '@whop/elements-react'
import { loadWhop } from '@whop/elements'
import { Component, useEffect, useState, type ReactNode } from 'react'
import { site } from '#/config/site'
import type { PublicWhopConfig } from '#/server/whop-api'

/** Brand-matched appearance for every Whop element on the site. */
export const appearance: Appearance = {
  theme: 'light',
  variables: {
    colorPrimary: site.theme.brand,
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    borderRadius: '10px',
  },
} as Appearance

/**
 * Loads Whop Elements in the browser only (they render in isolated frames from
 * cdn.whop.com) and points them at sandbox or production to match the server.
 */
export function WhopProvider({ config, children }: { config: PublicWhopConfig; children: ReactNode }) {
  const [loader, setLoader] = useState<ReturnType<typeof loadWhop> | null>(null)
  useEffect(() => setLoader(loadWhop()), [])

  if (!loader) return <ElementSkeleton />
  return (
    <ElementsBoundary>
      <WhopElements elements={loader} environment={config.environment} appearance={appearance}>
        {children}
      </WhopElements>
    </ElementsBoundary>
  )
}

/** Keeps a checkout element failure from taking down the whole page. */
class ElementsBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    console.error('[whop elements]', error)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Secure checkout couldn’t load. Please refresh, or call {site.company.phone} to book by phone.
      </div>
    )
  }
}

export function ElementSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3" aria-label="Loading secure checkout">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 rounded-lg bg-stone-200/70" />
      ))}
    </div>
  )
}

export function SandboxBanner({ config }: { config: PublicWhopConfig }) {
  if (config.environment !== 'sandbox') return null
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900">
      <strong>Test mode (Whop sandbox).</strong> No real money moves. Use card <code className="font-semibold">4242 4242 4242 4242</code>,
      any future expiry, any CVC.
    </div>
  )
}

export function MissingPlan({ what }: { what: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      The {what} plan isn’t configured yet. Run <code>bun run seed</code> to create the Whop plans (see README).
    </div>
  )
}
