import { createFileRoute, notFound } from '@tanstack/react-router'
import { formatUSD, offers, site, type OfferKey } from '#/config/site'
import { getWhopConfig } from '#/server/functions'
import { PlanCheckout } from '#/components/whop/PlanCheckout'
import { Icon } from '#/components/Icon'

/** URL slug → offer key. `/book/inspection`, `/book/flat-rate`. (The deposit has its own page.) */
const slugToOffer: Record<string, OfferKey> = { inspection: 'inspection', 'flat-rate': 'flatRate' }

export const Route = createFileRoute('/book/$offer')({
  loader: async ({ params }) => {
    const key = slugToOffer[params.offer]
    if (!key) throw notFound()
    return { key, config: await getWhopConfig() }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `Book: ${offers[loaderData.key].title} | ${site.company.name}` }] : [],
  }),
  component: BookPage,
})

function BookPage() {
  const { key, config } = Route.useLoaderData()
  const offer = offers[key]
  return (
    <main className="container-x grid gap-8 py-10 sm:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
      <section>
        <a href="/#pricing" className="text-sm font-medium text-stone-500 hover:text-ink">← All pricing</a>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{offer.title}</h1>
        <p className="mt-3 font-display text-5xl font-extrabold text-brand">{formatUSD(offer.price)}</p>
        <p className="mt-4 text-stone-600">{offer.description}</p>
        <ul className="mt-6 space-y-3">
          {offer.includes.map((i) => (
            <li key={i} className="flex gap-3 text-[15px]">
              <Icon name="check" className="mt-0.5 size-5 shrink-0 text-brand" /> {i}
            </li>
          ))}
        </ul>
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
          <p className="flex items-center gap-2 font-semibold text-stone-800">
            <Icon name="clock" className="size-4 text-brand" /> What happens after you pay
          </p>
          <p className="mt-1.5">
            We’ll text you within 2 business hours to pick an appointment window. Need to reschedule? Free up to 24 hours before.
          </p>
        </div>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Icon name="lock" className="size-5 text-brand" /> Secure checkout
        </h2>
        <PlanCheckout offer={offer} config={config} />
      </section>
    </main>
  )
}
