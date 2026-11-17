import { createFileRoute } from '@tanstack/react-router'
import { offers, site, type OfferKey } from '#/config/site'
import { Icon } from '#/components/Icon'

type Search = { offer?: OfferKey; payment?: string; status?: string }

/**
 * Landing page after checkout (and after any off-site step such as 3-D Secure or
 * a financing application). Whop appends `payment` and `status`. This page only
 * *displays* the outcome — fulfillment belongs in a `payment.succeeded` webhook.
 */
export const Route = createFileRoute('/checkout/return')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    offer: typeof s.offer === 'string' && s.offer in offers ? (s.offer as OfferKey) : undefined,
    // Element returns use `payment` + `status`; plan redirects use `payment_id` / `receipt_id` + `status=success`.
    payment: [s.payment, s.payment_id, s.receipt_id].find((v): v is string => typeof v === 'string'),
    status: normalizeStatus(s.status ?? s.checkout_status),
  }),
  head: () => ({ meta: [{ title: `Thank you | ${site.company.name}` }] }),
  component: ReturnPage,
})

function normalizeStatus(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  return v === 'success' ? 'succeeded' : v
}

function ReturnPage() {
  const { offer, payment, status } = Route.useSearch()
  const o = offer ? offers[offer] : null
  const ok = status === 'succeeded'
  const failed = status === 'failed' || status === 'canceled'

  return (
    <main className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <span
          className={`mx-auto flex size-14 items-center justify-center rounded-full text-white ${ok ? 'bg-emerald-600' : failed ? 'bg-red-500' : 'bg-amber-500'}`}
        >
          <Icon name={ok ? 'check' : failed ? 'close' : 'clock'} className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold">
          {ok ? 'You’re booked!' : failed ? 'Payment didn’t go through' : 'Confirming your payment…'}
        </h1>
        <p className="mt-3 text-stone-600">
          {ok
            ? `Thanks for booking ${o ? `your ${o.title.toLowerCase()}` : 'with us'}. A receipt from Whop is on its way, and we’ll text you within 2 business hours to schedule.`
            : failed
              ? 'No money was taken. You can try again with another payment method or financing option.'
              : 'Your payment is still processing. We’ll email you as soon as it’s confirmed.'}
        </p>
        {payment && <p className="mt-4 font-mono text-xs text-stone-400">Ref: {payment}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {failed && o ? (
            <a href={offer === 'deposit' ? '/deposit' : `/book/${offer === 'flatRate' ? 'flat-rate' : 'inspection'}`} className="btn-primary">
              Try again
            </a>
          ) : (
            <a href="/" className="btn-primary">Back to home</a>
          )}
          <a href={site.company.phoneHref} className="btn-ghost">
            <Icon name="phone" className="size-4" /> {site.company.phone}
          </a>
        </div>
      </div>
    </main>
  )
}
