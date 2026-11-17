import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { formatUSD, offers, services, site, type Offer } from '#/config/site'
import { EstimateForm } from '#/components/EstimateForm'
import { Icon } from '#/components/Icon'
import { HouseIllustration } from '#/components/HouseIllustration'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main>
      <Hero />
      <TrustStrip />
      <Services />
      <Pricing />
      <Process />
      <Financing />
      <Reviews />
      <ServiceArea />
      <EstimateAndContact />
    </main>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-gradient-to-b from-orange-50 to-transparent" />
      <div className="container-x relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-brand-dark">
            <Icon name="shield" className="size-3.5" /> {site.hero.eyebrow}
          </p>
          <h1 className="mt-5 text-4xl leading-[1.04] font-extrabold text-balance sm:text-6xl">{site.hero.headline}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-stone-600">{site.hero.subhead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#estimate" className="btn-primary px-6 py-3.5 text-base">
              Get a free estimate <Icon name="arrow" className="size-4" />
            </a>
            <Link to="/book/$offer" params={{ offer: 'inspection' }} className="btn-ghost px-6 py-3.5 text-base">
              Book a {formatUSD(offers.inspection.price)} inspection
            </Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-stone-200 pt-6">
            {site.hero.stats.map((s) => (
              <div key={s.label}>
                <dt className="font-display text-2xl font-extrabold sm:text-3xl">{s.value}</dt>
                <dd className="mt-1 text-xs text-stone-500 sm:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <HouseIllustration className="w-full" />
          <div className="absolute -bottom-4 left-4 right-4 rounded-xl border border-stone-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:left-auto sm:right-6 sm:w-72">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" className="size-4" />
              ))}
            </div>
            <p className="mt-2 text-sm leading-snug text-stone-700">“{site.reviews[0].text.slice(0, 92)}…”</p>
            <p className="mt-2 text-xs font-medium text-stone-500">
              {site.reviews[0].name} · {site.reviews[0].city}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustStrip() {
  return (
    <section aria-label="Certifications" className="border-y border-stone-200 bg-white">
      <div className="container-x flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-sm font-semibold text-stone-500">
        {site.trust.badges.map((b) => (
          <span key={b} className="flex items-center gap-2">
            <Icon name="check" className="size-4 text-brand" /> {b}
          </span>
        ))}
      </div>
    </section>
  )
}

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-extrabold text-balance sm:text-4xl">{title}</h2>
      {body && <p className="mt-3 text-lg text-stone-600">{body}</p>}
    </div>
  )
}

function Services() {
  return (
    <section id="services" className="scroll-mt-24 py-20">
      <div className="container-x">
        <SectionHead
          eyebrow="Services"
          title="Repair, replace, inspect — done by our own crews."
          body="No subcontracted labor. Every crew lead is a W-2 employee with 10+ years on roofs."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Link
              key={s.slug}
              to="/services/$slug"
              params={{ slug: s.slug }}
              className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-orange-50 text-brand">
                <Icon name={s.icon} className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold">{s.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{s.summary}</p>
              <p className="mt-4 text-sm font-semibold text-stone-800">{s.startingAt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand group-hover:gap-2">
                Learn more <Icon name="arrow" className="size-4 transition-all" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function OfferCard({ offer, to, featured }: { offer: Offer; to: string; featured?: boolean }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 ${
        featured ? 'border-ink bg-ink text-white shadow-xl' : 'border-stone-200 bg-white'
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">Most booked</span>
      )}
      <h3 className="text-lg font-bold">{offer.title}</h3>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-4xl font-extrabold">{formatUSD(offer.price)}</span>
        <span className={featured ? 'text-stone-400' : 'text-stone-500'}>{offer.key === 'deposit' ? 'applied to project' : 'flat'}</span>
      </p>
      <p className={`mt-3 text-sm leading-relaxed ${featured ? 'text-stone-300' : 'text-stone-600'}`}>{offer.description}</p>
      <ul className="mt-5 flex-1 space-y-2.5 text-sm">
        {offer.includes.map((i) => (
          <li key={i} className="flex gap-2.5">
            <Icon name="check" className="mt-0.5 size-4 shrink-0 text-brand" /> {i}
          </li>
        ))}
      </ul>
      <a href={to} className={`${featured ? 'btn-primary' : 'btn-dark'} mt-7 w-full`}>
        {offer.label} <Icon name="arrow" className="size-4" />
      </a>
    </div>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 bg-stone-100 py-20">
      <div className="container-x">
        <SectionHead
          eyebrow="Book & pay online"
          title="Transparent pricing. Secure checkout."
          body="Pay with card, Apple Pay, Google Pay — or split it with pay-over-time options at checkout."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <OfferCard offer={offers.inspection} to="/book/inspection" featured />
          <OfferCard offer={offers.flatRate} to="/book/flat-rate" />
          <OfferCard offer={offers.deposit} to="/deposit" />
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-stone-500">
          <Icon name="lock" className="size-4" /> Payments are processed by Whop. We never see or store your card number.
        </p>
      </div>
    </section>
  )
}

function Process() {
  return (
    <section className="py-20">
      <div className="container-x">
        <SectionHead eyebrow="How it works" title="From first call to final invoice — no surprises." />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {site.process.map((p, i) => (
            <li key={p.title} className="relative rounded-2xl border border-stone-200 bg-white p-5">
              <span className="font-display text-sm font-extrabold text-brand">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-bold">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Financing() {
  return (
    <section id="financing" className="scroll-mt-24 bg-ink py-20 text-white shingles">
      <div className="container-x grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-400">Financing</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-5xl">{site.financing.headline}</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-stone-300">{site.financing.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/deposit" className="btn-primary px-6">
              Reserve with a {formatUSD(offers.deposit.price)} deposit
            </a>
            <a href="#estimate" className="btn border border-white/25 text-white hover:bg-white/10">
              Talk to a project manager
            </a>
          </div>
        </div>
        <ul className="grid gap-3">
          {site.financing.points.map((p) => (
            <li key={p} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-lg font-semibold">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand">
                <Icon name="check" className="size-4" />
              </span>
              {p}
            </li>
          ))}
          <li className="px-1 text-xs text-stone-400">
            Pay-over-time options are offered by Whop’s financing partners to eligible buyers, subject to approval.
          </li>
        </ul>
      </div>
    </section>
  )
}

function Reviews() {
  return (
    <section id="reviews" className="scroll-mt-24 py-20">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow="Reviews" title="Homeowners who’d hire us again." />
          <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-5 py-3">
            <span className="font-display text-3xl font-extrabold">4.9</span>
            <div>
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" className="size-4" />
                ))}
              </div>
              <p className="text-xs text-stone-500">1,200+ Google &amp; BBB reviews</p>
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {site.reviews.map((r) => (
            <figure key={r.name} className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex text-amber-500">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Icon key={i} name="star" className="size-4" />
                ))}
              </div>
              <blockquote className="mt-3 text-[15px] leading-relaxed text-stone-700">“{r.text}”</blockquote>
              <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">
                  {r.name} <span className="font-normal text-stone-500">· {r.city}</span>
                </span>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">{r.job}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceArea() {
  const [zip, setZip] = useState('')
  const valid = /^\d{5}$/.test(zip)
  const inArea = valid && site.serviceArea.zipPrefixes.some((p) => zip.startsWith(p))
  return (
    <section id="area" className="scroll-mt-24 border-y border-stone-200 bg-white py-20">
      <div className="container-x grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHead eyebrow="Service area" title={site.serviceArea.headline} body={site.serviceArea.blurb} />
          <div className="mt-8 max-w-sm">
            <label htmlFor="zip-check" className="label">Check your ZIP</label>
            <div className="flex gap-2">
              <input
                id="zip-check"
                className="field"
                inputMode="numeric"
                maxLength={5}
                placeholder="78704"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            {valid && (
              <p className={`mt-2 text-sm font-medium ${inArea ? 'text-emerald-700' : 'text-stone-600'}`} role="status">
                {inArea ? '✓ You’re in our service area — same-week inspections available.' : 'Just outside our usual area — call us, we often still help.'}
              </p>
            )}
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-2 self-center sm:grid-cols-3">
          {site.serviceArea.cities.map((c) => (
            <li key={c} className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2.5 text-sm font-medium">
              <Icon name="pin" className="size-4 text-brand" /> {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function EstimateAndContact() {
  return (
    <section id="estimate" className="scroll-mt-24 py-20">
      <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div id="contact" className="scroll-mt-24">
          <SectionHead eyebrow="Free estimate" title={site.estimateForm.headline} body={site.estimateForm.blurb} />
          <ul className="mt-8 space-y-4">
            <ContactRow icon="phone" label="Call or text" value={site.company.phone} href={site.company.phoneHref} />
            <ContactRow icon="mail" label="Email" value={site.company.email} href={`mailto:${site.company.email}`} />
            <ContactRow icon="pin" label="Office" value={site.company.address} />
            <ContactRow icon="clock" label="Hours" value={site.company.hours} />
          </ul>
        </div>
        <EstimateForm />
      </div>
    </section>
  )
}

function ContactRow({ icon, label, value, href }: { icon: 'phone' | 'mail' | 'pin' | 'clock'; label: string; value: string; href?: string }) {
  const inner = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand">
        <Icon name={icon} />
      </span>
      <span>
        <span className="block text-xs font-medium uppercase tracking-wide text-stone-500">{label}</span>
        <span className="block font-semibold break-words">{value}</span>
      </span>
    </>
  )
  return (
    <li>
      {href ? (
        <a href={href} className="flex items-center gap-4 hover:text-brand">
          {inner}
        </a>
      ) : (
        <div className="flex items-center gap-4">{inner}</div>
      )}
    </li>
  )
}
