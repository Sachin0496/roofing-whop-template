import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'
import { formatUSD, offers, services, site } from '#/config/site'
import { Icon } from '#/components/Icon'
import { EstimateForm } from '#/components/EstimateForm'
import { track } from '#/lib/track'

export const Route = createFileRoute('/services/$slug')({
  loader: ({ params }) => {
    const service = services.find((s) => s.slug === params.slug)
    if (!service) throw notFound()
    return { service }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.service.name} in Central Texas | ${site.company.name}` },
          { name: 'description', content: loaderData.service.summary },
        ]
      : [],
  }),
  component: ServicePage,
})

function ServicePage() {
  const { service } = Route.useLoaderData()

  // Custom pixel event: which services people actually look at.
  useEffect(() => {
    track('service_viewed', { service: service.slug, service_name: service.name })
    track('view_content', { content_name: service.name })
  }, [service.slug])

  const offer = service.cta === 'estimate' ? null : offers[service.cta]
  const ctaHref = service.cta === 'deposit' ? '/deposit' : service.cta === 'flatRate' ? '/book/flat-rate' : '/book/inspection'

  return (
    <main>
      <section className="border-b border-stone-200 bg-gradient-to-b from-orange-50 to-paper">
        <div className="container-x py-12 sm:py-16">
          <nav className="text-sm text-stone-500">
            <Link to="/" className="hover:text-ink">Home</Link> <span className="mx-1">/</span>
            <a href="/#services" className="hover:text-ink">Services</a> <span className="mx-1">/</span>
            <span className="text-stone-800">{service.name}</span>
          </nav>
          <div className="mt-6 flex items-start gap-4">
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-sm sm:flex">
              <Icon name={service.icon} className="size-7" />
            </span>
            <div>
              <h1 className="text-4xl font-extrabold sm:text-5xl">{service.name}</h1>
              <p className="mt-3 max-w-2xl text-lg text-stone-600">{service.summary}</p>
              <p className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold shadow-sm">{service.startingAt}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-lg leading-relaxed text-stone-700">{service.body}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {service.bullets.map((b) => (
              <li key={b} className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4 text-sm font-medium">
                <Icon name="check" className="size-5 shrink-0 text-brand" /> {b}
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <h2 className="text-2xl font-bold">Request a free {service.name.toLowerCase()} estimate</h2>
            <div className="mt-5">
              <EstimateForm defaultProject={service.cta === 'deposit' ? 'Full replacement' : service.cta === 'inspection' ? 'Inspection only' : 'Roof repair / leak'} />
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          {offer && (
            <div className="rounded-2xl border border-ink bg-ink p-6 text-white shadow-xl">
              <p className="text-sm font-semibold text-orange-300">Book online</p>
              <h3 className="mt-1 text-xl font-bold">{offer.title}</h3>
              <p className="mt-3 font-display text-4xl font-extrabold">{formatUSD(offer.price)}</p>
              <p className="mt-3 text-sm text-stone-300">{offer.description}</p>
              <a href={ctaHref} className="btn-primary mt-6 w-full">
                {offer.label} <Icon name="arrow" className="size-4" />
              </a>
              <p className="mt-3 text-center text-xs text-stone-400">Card · Apple Pay · Google Pay · Pay over time</p>
            </div>
          )}
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-sm font-semibold">Prefer to talk?</p>
            <a href={site.company.phoneHref} className="btn-ghost mt-3 w-full">
              <Icon name="phone" className="size-4" /> {site.company.phone}
            </a>
          </div>
        </aside>
      </section>
    </main>
  )
}
