import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import appCss from '../styles.css?url'
import { site } from '#/config/site'
import { SiteHeader } from '#/components/SiteHeader'
import { SiteFooter } from '#/components/SiteFooter'
import { PixelInspector } from '#/components/PixelInspector'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: `${site.company.name} — Roof Repair, Replacement & Inspections` },
      { name: 'description', content: site.hero.subhead },
      { name: 'theme-color', content: site.theme.ink },
      { property: 'og:title', content: `${site.company.name} — ${site.company.tagline}` },
      { property: 'og:description', content: site.hero.subhead },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        href:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231C1917'/%3E%3Cpath d='M5 19 16 9l11 10' stroke='%23C2410C' stroke-width='3.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M10 23h12' stroke='white' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <main className="container-x py-32 text-center">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <a href="/" className="btn-primary mt-8">
        Back home
      </a>
    </main>
  ),
})

const themeVars = {
  '--brand': site.theme.brand,
  '--brand-dark': site.theme.brandDark,
  '--ink': site.theme.ink,
  '--paper': site.theme.paper,
} as CSSProperties

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={themeVars}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-paper text-ink">
        <SiteHeader />
        {children}
        <SiteFooter />
        <PixelInspector />
        <Scripts />
      </body>
    </html>
  )
}
