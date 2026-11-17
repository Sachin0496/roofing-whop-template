import {
  BrandingElement,
  Checkout,
  ExpressCheckoutElement,
  PaymentElement,
  Payments,
  usePayments,
  useWhop,
} from '@whop/elements-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { formatUSD, offers, site } from '#/config/site'
import type { PublicWhopConfig } from '#/server/whop-api'
import { chargeDeposit, startDepositSetup } from '#/server/functions'
import { track } from '#/lib/track'
import { Icon } from '../Icon'
import { ElementSkeleton, MissingPlan, SandboxBanner, WhopProvider } from './WhopProvider'

type Result = {
  paymentId: string
  paymentStatus: string
  card: string
  memberId: string
  paymentMethodId: string
}

/**
 * Deposit checkout — card on file via a Whop Setup Intent:
 *
 *   1. PaymentElement in `setup` mode collects the card inside Whop's PCI frames.
 *   2. `createConfirmationToken()` → our server → POST /setup_intents (saves the card, `payt_…`).
 *   3. Server charges the $500 deposit plan to that saved method (POST /payments).
 *   4. Later, the final balance is billed to the same card with the Invoices API (see /admin).
 */
export function DepositCheckout({ config }: { config: PublicWhopConfig }) {
  const plan = config.plans.deposit
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    track('deposit_started', { value: offers.deposit.price, currency: 'USD', variant_id: plan || undefined })
    track('initiate_checkout', { value: offers.deposit.price, currency: 'USD', variant_id: plan || undefined })
  }, [plan])

  if (!plan) return <MissingPlan what="deposit" />

  return (
    <div className="space-y-5">
      <SandboxBanner config={config} />
      <WhopProvider config={config}>
        <Payments accountId={config.accountId} mode="setup" currency="usd" setupFutureUsage="off_session" fallback={<ElementSkeleton rows={6} />}>
          <DepositForm config={config} />
        </Payments>

        <div className="relative py-1 text-center text-xs font-medium uppercase tracking-wider text-stone-400">
          <span className="relative z-10 bg-white px-3">or pay the deposit with a wallet</span>
          <span className="absolute inset-x-0 top-1/2 h-px bg-stone-200" />
        </div>
        <Checkout
          plan={plan}
          metadata={{ offer: 'deposit', source: 'roofing_site' }}
          returnUrl={config.siteOrigin.startsWith('https://') ? `${config.siteOrigin}/checkout/return?offer=deposit` : undefined} fallback={<ElementSkeleton rows={1} />}>
          <ExpressCheckoutElement
            layout="horizontal"
            onError={(e) => console.info('[express]', e.code, e.message)}
          />
        </Checkout>
        <p className="text-center text-xs text-stone-500">
          Apple Pay &amp; Google Pay appear automatically on supported devices.
        </p>
      </WhopProvider>
    </div>
  )
}

function DepositForm({ config }: { config: PublicWhopConfig }) {
  const payments = usePayments()
  const whop = useWhop()
  const [form, setForm] = useState({ name: '', email: '', phone: '', line1: '', city: '', state: site.company.state as string, zip: '' })
  const [agree, setAgree] = useState(false)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState<null | string>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Returning from an off-site 3-D Secure step: finish the deposit charge.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const sint = p.get('setup')
    if (sint?.startsWith('sint_') && p.get('status') === 'succeeded') {
      setBusy('Charging your deposit…')
      chargeDeposit({ data: { setupIntentId: sint } })
        .then((r) => (r.ok ? onPaid(r) : setError(r.error)))
        .finally(() => setBusy(null))
    }
  }, [])

  function onPaid(r: Result & { ok: true }) {
    setResult(r)
    track('deposit_paid', { value: offers.deposit.price, currency: 'USD', event_id: r.paymentId })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!payments) return setError('Secure payment form is still loading.')
    if (!agree) return setError('Please authorize the deposit and future final-balance charge.')
    try {
      setBusy('Securing your card…')
      const token = await payments.createConfirmationToken({
        billingDetails: {
          email: form.email,
          name: form.name,
          phone: form.phone || undefined,
          address: { line1: form.line1, city: form.city, state: form.state, postal_code: form.zip, country: 'US' },
        },
      })

      const setup = await startDepositSetup({
        data: {
          confirmationToken: token.confirmationToken,
          email: form.email,
          name: form.name,
          phone: form.phone,
          line1: form.line1,
          city: form.city,
          state: form.state,
          zip: form.zip,
          returnUrl: `${config.siteOrigin}/deposit`,
        },
      })
      if (!setup.ok) throw new Error(setup.error)

      if (setup.status === 'requires_action' && setup.clientSecret) {
        setBusy('Verifying with your bank…')
        await whop?.payments.handleNextAction({ clientSecret: setup.clientSecret, returnUrl: `${config.siteOrigin}/deposit` })
      }

      setBusy(`Charging ${formatUSD(offers.deposit.price)} deposit…`)
      const charged = await chargeDeposit({ data: { setupIntentId: setup.setupIntentId } })
      if (!charged.ok) throw new Error(charged.error)
      onPaid(charged)
    } catch (err: any) {
      if (err?.code === 'payment_request_cancelled') setError(null)
      else setError(err?.message ?? 'Something went wrong. Your card was not charged.')
    } finally {
      setBusy(null)
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Icon name="check" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-emerald-950">Deposit received — you’re on the schedule.</h3>
            <p className="text-sm text-emerald-800">A receipt from Whop is on its way to {form.email || 'your inbox'}.</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Deposit" value={`${formatUSD(offers.deposit.price)} · ${result.paymentStatus}`} />
          <Detail label="Card on file" value={result.card} />
          <Detail label="Payment" value={result.paymentId} mono />
          <Detail label="Saved method" value={result.paymentMethodId} mono />
        </dl>
        <p className="mt-5 text-sm text-emerald-900">
          <strong>What happens next:</strong> your project manager confirms the install date. After the final walk-through and your
          sign-off, {site.company.shortName} bills the remaining balance to this card (or emails you a Whop invoice if you prefer).
        </p>
        {config.environment === 'sandbox' && (
          <p className="mt-3 text-xs text-emerald-700">
            Demo tip: open <a className="underline" href="/admin">/admin</a> to bill the final balance with the Invoices API.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <fieldset className="grid gap-4 sm:grid-cols-2" disabled={!!busy}>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="d-name">Full name</label>
          <input id="d-name" className="field" required autoComplete="name" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label" htmlFor="d-email">Email</label>
          <input id="d-email" type="email" className="field" required autoComplete="email" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label" htmlFor="d-phone">Phone</label>
          <input id="d-phone" type="tel" className="field" autoComplete="tel" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="d-line1">Project address</label>
          <input id="d-line1" className="field" required autoComplete="street-address" value={form.line1} onChange={set('line1')} placeholder="1234 Oak Hollow Dr" />
        </div>
        <div>
          <label className="label" htmlFor="d-city">City</label>
          <input id="d-city" className="field" required autoComplete="address-level2" value={form.city} onChange={set('city')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="d-state">State</label>
            <input id="d-state" className="field" required maxLength={2} autoComplete="address-level1" value={form.state} onChange={set('state')} />
          </div>
          <div>
            <label className="label" htmlFor="d-zip">ZIP</label>
            <input id="d-zip" className="field" required inputMode="numeric" autoComplete="postal-code" value={form.zip} onChange={set('zip')} />
          </div>
        </div>
      </fieldset>

      <div>
        <span className="label">Payment method</span>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          {/* Billing name/address come from the form above and are passed to createConfirmationToken. */}
          <PaymentElement fields={{ billingDetails: 'never', phone: 'never' }} onChange={(e) => setReady(!!e.complete)} />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg bg-stone-50 p-3 text-sm leading-snug text-stone-700">
        <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-brand)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          I authorize {site.company.name} to charge my card <strong>{formatUSD(offers.deposit.price)}</strong> now as a project deposit, and to
          save it securely with Whop so the remaining balance can be charged <strong>after</strong> I approve the completed work.
        </span>
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

      <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={!!busy || !ready}>
        <Icon name="lock" className="size-4" />
        {busy ?? `Save card & pay ${formatUSD(offers.deposit.price)} deposit`}
      </button>

      <div className="flex justify-center">
        <BrandingElement />
      </div>
    </form>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-white/70 px-3 py-2">
      <dt className="text-xs text-emerald-700">{label}</dt>
      <dd className={`truncate font-medium text-emerald-950 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}

