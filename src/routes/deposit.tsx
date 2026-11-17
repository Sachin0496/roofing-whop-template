import { createFileRoute } from '@tanstack/react-router'
import { formatUSD, offers, site } from '#/config/site'
import { getWhopConfig } from '#/server/functions'
import { DepositCheckout } from '#/components/whop/DepositCheckout'
import { Icon } from '#/components/Icon'

export const Route = createFileRoute('/deposit')({
  loader: async () => ({ config: await getWhopConfig() }),
  head: () => ({ meta: [{ title: `Reserve your project | ${site.company.name}` }] }),
  component: DepositPage,
})

const steps = [
  { icon: 'card', title: 'Today', body: `${formatUSD(offers.deposit.price)} deposit charged, card saved securely on Whop.` },
  { icon: 'replace', title: 'Install day', body: 'Crew arrives, most roofs completed in one day.' },
  { icon: 'check', title: 'Walk-through', body: 'You inspect the work with your project manager and sign off.' },
  { icon: 'invoice', title: 'Final invoice', body: 'Balance (minus deposit) billed to your saved card, or emailed as an invoice.' },
] as const

function DepositPage() {
  const { config } = Route.useLoaderData()
  return (
    <main className="container-x grid gap-8 py-10 sm:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
      <section>
        <a href="/#pricing" className="text-sm font-medium text-stone-500 hover:text-ink">← All pricing</a>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Reserve your roofing project</h1>
        <p className="mt-3 font-display text-5xl font-extrabold text-brand">{formatUSD(offers.deposit.price)}</p>
        <p className="mt-4 text-stone-600">{offers.deposit.description}</p>
        <ol className="mt-8 space-y-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${i === 0 ? 'bg-brand text-white' : 'bg-stone-200 text-stone-600'}`}>
                <Icon name={s.icon} className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-stone-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 rounded-xl bg-stone-100 p-4 text-sm text-stone-600">
          <strong className="text-stone-800">Your card is safe.</strong> Card details are collected inside Whop’s PCI-compliant payment
          form and saved with a Whop setup intent. {site.company.shortName} never sees your full card number.
        </p>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Icon name="lock" className="size-5 text-brand" /> Deposit checkout
        </h2>
        <DepositCheckout config={config} />
      </section>
    </main>
  )
}
