import { Link } from '@tanstack/react-router'
import { offers, services, site } from '#/config/site'
import { LogoMark } from './Icon'

export function SiteFooter() {
  return (
    <footer className="bg-ink text-stone-400">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 text-white">
            <LogoMark />
            <span className="font-display text-lg font-extrabold">{site.company.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">{site.company.tagline} Family-owned and serving Central Texas since {site.company.founded}.</p>
          <p className="mt-3 text-xs">{site.company.license}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Services</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link to="/services/$slug" params={{ slug: s.slug }} className="hover:text-white">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Book online</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/book/$offer" params={{ offer: 'inspection' }} className="hover:text-white">
                {offers.inspection.title} — ${offers.inspection.price}
              </Link>
            </li>
            <li>
              <Link to="/book/$offer" params={{ offer: 'flat-rate' }} className="hover:text-white">
                {offers.flatRate.title} — ${offers.flatRate.price}
              </Link>
            </li>
            <li>
              <Link to="/deposit" className="hover:text-white">
                {offers.deposit.title} — ${offers.deposit.price}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={site.company.phoneHref} className="hover:text-white">
                {site.company.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.company.email}`} className="break-all hover:text-white">
                {site.company.email}
              </a>
            </li>
            <li>{site.company.address}</li>
            <li>{site.company.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {site.company.name}. All rights reserved.
          </span>
          <span>Payments, financing &amp; invoicing powered by Whop.</span>
        </div>
      </div>
    </footer>
  )
}
