import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { site } from '#/config/site'
import { Icon, LogoMark } from './Icon'

const nav = [
  { href: '/#services', label: 'Services' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#financing', label: 'Financing' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/#area', label: 'Service area' },
  { href: '/#contact', label: 'Contact' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <div className="hidden bg-ink text-stone-300 sm:block">
        <div className="container-x flex h-9 items-center justify-between text-xs">
          <span className="flex items-center gap-2">
            <Icon name="shield" className="size-3.5 text-brand" /> {site.company.license}
          </span>
          <span className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Icon name="clock" className="size-3.5" /> {site.company.hours}
            </span>
            <a href={site.company.phoneHref} className="font-semibold text-white hover:text-brand">
              {site.company.phone}
            </a>
          </span>
        </div>
      </div>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <LogoMark className="size-8 shrink-0 sm:size-9" />
          <span className="font-display text-base font-extrabold leading-none tracking-tight whitespace-nowrap sm:text-lg">
            {site.company.shortName}
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Roofing</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 lg:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={site.company.phoneHref} className="btn-ghost hidden px-3.5 py-2.5 text-sm md:inline-flex">
            <Icon name="phone" className="size-4" /> Call
          </a>
          <a href="/#estimate" className="btn-primary whitespace-nowrap px-3 py-2.5 text-sm sm:px-4">
            <span className="sm:hidden">Estimate</span>
            <span className="hidden sm:inline">Free estimate</span>
          </a>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-stone-300 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-stone-200 bg-paper lg:hidden">
          <div className="container-x grid gap-1 py-3">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium hover:bg-stone-100"
              >
                {n.label}
              </a>
            ))}
            <a href={site.company.phoneHref} className="btn-dark mt-2">
              <Icon name="phone" className="size-4" /> {site.company.phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}
