/**
 * Server functions (run on Whop hosting, never in the browser).
 *
 *  getWhopConfig        → public env + plan IDs for Payment Elements
 *  submitEstimate       → "Request an Estimate" → Whop lead (member w/o access) + note + `lead` event
 *  startDepositSetup    → confirmation token from PaymentElement (setup mode) → Setup Intent (card on file)
 *  chargeDeposit        → charge the $500 deposit plan to the saved payment method
 *  admin*               → final-balance billing with the Invoices API
 */
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { offers, site } from '#/config/site'
import { accountId, planId, publicWhopConfig, whop, WhopApiError, whopEnv } from './whop-api'

// ─── helpers ────────────────────────────────────────────────────────────────

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function friendly(err: unknown): string {
  if (err instanceof WhopApiError) return err.body?.error?.message ?? `Whop API error (${err.status})`
  return err instanceof Error ? err.message : 'Unexpected error'
}

async function serverEvent(event_name: string, extra: Record<string, unknown> = {}) {
  // Server-side copy of a conversion, deduplicated by event_id with the browser pixel.
  // Best-effort: never fail the user's request because analytics failed.
  try {
    await whop('/events', {
      body: { account_id: accountId(), event_name, action_source: 'website', ...extra },
    })
  } catch (e) {
    console.warn('[events] skipped', friendly(e))
  }
}

const cardLabel = (pi: any): string =>
  pi?.display_name ?? (pi?.last4 ? `${pi.brand ?? 'Card'} •••• ${pi.last4}` : 'Card on file')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ─── public config ─────────────────────────────────────────────────────────

export const getWhopConfig = createServerFn({ method: 'GET' }).handler(async () => {
  // Absolute https origin of this site, used for Whop return URLs after off-site steps (3DS, financing).
  const host = getRequestHeader('x-forwarded-host') ?? getRequestHeader('host') ?? ''
  const siteOrigin = host && !host.startsWith('localhost') ? `https://${host}` : `http://${host || 'localhost:3000'}`
  return { ...publicWhopConfig(), siteOrigin }
})

// ─── estimate → lead ───────────────────────────────────────────────────────

export interface EstimateInput {
  name: string
  email: string
  phone: string
  address: string
  zip: string
  projectType: string
  roofType: string
  timeline: string
  message: string
  eventId: string
  pageUrl?: string
}

export const submitEstimate = createServerFn({ method: 'POST' })
  .validator((d: EstimateInput) => {
    const input = {
      name: str(d?.name, 120),
      email: str(d?.email, 200).toLowerCase(),
      phone: str(d?.phone, 40),
      address: str(d?.address, 200),
      zip: str(d?.zip, 10),
      projectType: str(d?.projectType, 80),
      roofType: str(d?.roofType, 80),
      timeline: str(d?.timeline, 80),
      message: str(d?.message, 2000),
      eventId: str(d?.eventId, 100),
      pageUrl: str(d?.pageUrl, 500),
    }
    if (!input.name) throw new Error('Please enter your name.')
    if (!isEmail(input.email)) throw new Error('Please enter a valid email address.')
    if (!input.phone) throw new Error('Please enter a phone number.')
    return input
  })
  .handler(async ({ data }) => {
    try {
      // 1. The lead: Whop's Leads API now lives at POST /members — a member with no access.
      const member = await whop<{ id: string }>('/members', {
        body: { account_id: accountId(), email: data.email, name: data.name },
      })

      // 2. Attach the quote request so the team sees it on the lead in the dashboard.
      const note = [
        `🏠 ESTIMATE REQUEST — ${data.projectType || 'Unspecified project'}`,
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        `Email: ${data.email}`,
        `Address: ${data.address || '—'} ${data.zip}`.trim(),
        `Roof type: ${data.roofType || '—'}`,
        `Timeline: ${data.timeline || '—'}`,
        data.message ? `Notes: ${data.message}` : '',
        `Source: ${data.pageUrl || 'website'} · ${new Date().toISOString()}`,
      ]
        .filter(Boolean)
        .join('\n')
      await whop(`/members/${member.id}/notes`, { body: { content: note } }).catch((e) =>
        console.warn('[estimate] note failed', friendly(e)),
      )

      // 3. Server-side `lead` conversion (the browser fires `estimate_requested` + `lead` with the same event_id).
      await serverEvent('lead', {
        event_id: data.eventId || undefined,
        url: data.pageUrl || undefined,
        user: { email: data.email, name: data.name, phone: data.phone },
      })

      return { ok: true as const, memberId: member.id, environment: whopEnv() }
    } catch (e) {
      return { ok: false as const, error: friendly(e) }
    }
  })

// ─── deposit: card on file via Setup Intent, then charge deposit ────────────

export interface DepositInput {
  confirmationToken: string
  email: string
  name: string
  phone: string
  line1: string
  city: string
  state: string
  zip: string
  returnUrl: string
}

export const startDepositSetup = createServerFn({ method: 'POST' })
  .validator((d: DepositInput) => {
    const input = {
      confirmationToken: str(d?.confirmationToken, 200),
      email: str(d?.email, 200).toLowerCase(),
      name: str(d?.name, 120),
      phone: str(d?.phone, 40),
      line1: str(d?.line1, 120),
      city: str(d?.city, 80),
      state: str(d?.state, 2).toUpperCase(),
      zip: str(d?.zip, 10),
      returnUrl: str(d?.returnUrl, 1000),
    }
    if (!input.confirmationToken.startsWith('ctok_')) throw new Error('Missing payment details.')
    if (!isEmail(input.email)) throw new Error('Please enter a valid email address.')
    return input
  })
  .handler(async ({ data }) => {
    try {
      const sint = await whop<{
        id: string
        status: string
        client_secret: string | null
        payment_method_id: string | null
        member_id: string | null
      }>('/setup_intents', {
        body: {
          account_id: accountId(),
          confirmation_token: data.confirmationToken,
          email: data.email,
          currency: 'usd',
          return_url: data.returnUrl.startsWith('https://') ? data.returnUrl : undefined,
          metadata: {
            purpose: 'roofing_project_deposit',
            customer_name: data.name,
            customer_email: data.email,
            customer_phone: data.phone,
            job_address: [data.line1, data.city, data.state, data.zip].filter(Boolean).join(', '),
            job_line1: data.line1,
            job_city: data.city,
            job_state: data.state,
            job_zip: data.zip,
          },
        },
      })
      return { ok: true as const, setupIntentId: sint.id, status: sint.status, clientSecret: sint.client_secret }
    } catch (e) {
      return { ok: false as const, error: friendly(e) }
    }
  })

export const chargeDeposit = createServerFn({ method: 'POST' })
  .validator((d: { setupIntentId: string }) => {
    const id = str(d?.setupIntentId, 100)
    if (!id.startsWith('sint_')) throw new Error('Invalid setup intent.')
    return { setupIntentId: id }
  })
  .handler(async ({ data }) => {
    try {
      // Wait (briefly) for the setup intent to settle.
      let sint: any
      for (let i = 0; i < 12; i++) {
        sint = await whop(`/setup_intents/${data.setupIntentId}`)
        if (sint.status === 'succeeded' || sint.status === 'canceled' || sint.status === 'requires_action') break
        await sleep(1000)
      }
      if (sint.status !== 'succeeded' || !sint.payment_method_id) {
        return {
          ok: false as const,
          error:
            sint.last_setup_error?.message ??
            `Your card could not be saved (status: ${sint.status}). Please try another card.`,
        }
      }

      // Idempotent per setup intent: a refresh can never double-charge the deposit.
      const meta = sint.metadata ?? {}
      const payment = await whop<{ id: string; status: string; total?: number }>('/payments', {
        body: {
          account_id: accountId(),
          variant_id: planId('deposit'),
          member_id: sint.member_id,
          payment_method_id: sint.payment_method_id,
          metadata: { ...meta, setup_intent_id: sint.id, stage: 'deposit' },
        },
        idempotencyKey: `deposit-${sint.id}`,
      })

      // Collection runs in the background — give it a moment to settle for the receipt screen.
      let status = payment.status
      for (let i = 0; i < 6 && status !== 'paid' && status !== 'failed'; i++) {
        await sleep(1000)
        status = (await whop<{ status: string }>(`/payments/${payment.id}`)).status
      }
      return {
        ok: true as const,
        paymentId: payment.id,
        paymentStatus: status,
        memberId: sint.member_id as string,
        paymentMethodId: sint.payment_method_id as string,
        card: cardLabel(sint.payment_instrument),
        amount: offers.deposit.price,
      }
    } catch (e) {
      return { ok: false as const, error: friendly(e) }
    }
  })

// ─── admin: final balance via Invoices API ──────────────────────────────────

function assertAdmin(passcode: string) {
  const expected = process.env.ADMIN_PASSCODE
  if (!expected) throw new Error('ADMIN_PASSCODE is not configured.')
  if (passcode !== expected) throw new Error('Wrong passcode.')
}

export const adminListJobs = createServerFn({ method: 'POST' })
  .validator((d: { passcode: string }) => ({ passcode: str(d?.passcode, 100) }))
  .handler(async ({ data }) => {
    try {
      assertAdmin(data.passcode)
      const [intents, invoices] = await Promise.all([
        whop<{ data: any[] }>('/setup_intents', {
          query: { account_id: accountId(), status: 'succeeded', first: 25, direction: 'desc' },
        }),
        whop<{ data: any[] }>('/invoices', { query: { account_id: accountId(), first: 25, direction: 'desc' } }),
      ])
      const jobs = (intents.data ?? [])
        .filter((s) => s.metadata?.purpose === 'roofing_project_deposit' || s.payment_method_id)
        .map((s) => ({
          setupIntentId: s.id,
          createdAt: s.created_at,
          memberId: s.member_id,
          paymentMethodId: s.payment_method_id,
          email: s.metadata?.customer_email ?? s.user?.email ?? null,
          name: s.metadata?.customer_name || s.user?.name || s.user?.username || 'Customer',
          jobAddress: s.metadata?.job_address || '',
          address: jobAddress(s.metadata),
          card: cardLabel(s.payment_instrument),
        }))
      const recentInvoices = (invoices.data ?? []).map(slimInvoice)
      return { ok: true as const, environment: whopEnv(), jobs, invoices: recentInvoices }
    } catch (e) {
      return { ok: false as const, error: friendly(e) }
    }
  })

/** Whop returns money as `{ amount: "14350.00", currency }` — normalise to a number. */
function money(v: any): number | null {
  if (v == null) return null
  const n = typeof v === 'object' ? Number(v.amount) : Number(v)
  return Number.isFinite(n) ? n : null
}

export interface Address {
  line1: string
  city: string
  state: string
  postal_code: string
}

function jobAddress(m: Record<string, string> | null | undefined): Address | null {
  if (!m) return null
  if (m.job_line1) return { line1: m.job_line1, city: m.job_city ?? '', state: m.job_state ?? '', postal_code: m.job_zip ?? '' }
  // Older deposits stored one string: "line1, city, ST, zip"
  const parts = (m.job_address ?? '').split(',').map((x) => x.trim())
  if (parts.length < 4) return null
  return { line1: parts[0], city: parts[1], state: parts[2], postal_code: parts[3] }
}

function slimInvoice(i: any) {
  return {
    id: i.id as string,
    number: (i.number ?? i.invoice_number ?? null) as string | null,
    status: i.status as string,
    total: money(i.total ?? i.amount_due ?? i.subtotal),
    currency: (i.currency ?? 'usd') as string,
    email: (i.email_address ?? i.member?.email ?? i.recipient_emails?.[0] ?? null) as string | null,
    // Whop emails the customer their own pay link; staff open the invoice in the dashboard.
    dashboardUrl: `${whopEnv() === 'sandbox' ? 'https://sandbox.whop.com' : 'https://whop.com'}/dashboard/${accountId()}/invoices/${i.id}/`,
    recipients: (i.recipient_emails ?? []) as string[],
    createdAt: i.created_at as string,
  }
}

export interface FinalInvoiceInput {
  passcode: string
  mode: 'charge' | 'send'
  memberId?: string
  paymentMethodId?: string
  email?: string
  customerName?: string
  amount: number
  description: string
  memo?: string
  dueInDays?: number
  billingAddress?: Partial<Address>
}

export const adminCreateFinalInvoice = createServerFn({ method: 'POST' })
  .validator((d: FinalInvoiceInput) => {
    const amount = Math.round(Number(d?.amount) * 100) / 100
    const input = {
      passcode: str(d?.passcode, 100),
      mode: d?.mode === 'send' ? ('send' as const) : ('charge' as const),
      memberId: str(d?.memberId, 60) || undefined,
      paymentMethodId: str(d?.paymentMethodId, 60) || undefined,
      email: str(d?.email, 200).toLowerCase() || undefined,
      customerName: str(d?.customerName, 120) || undefined,
      amount,
      description: str(d?.description, 900) || 'Final balance — roofing project',
      memo: str(d?.memo, 900) || undefined,
      dueInDays: Math.min(Math.max(Number(d?.dueInDays) || 7, 0), 60),
      billingAddress: {
        line1: str(d?.billingAddress?.line1, 120),
        city: str(d?.billingAddress?.city, 80),
        state: str(d?.billingAddress?.state, 2).toUpperCase(),
        postal_code: str(d?.billingAddress?.postal_code, 10),
      },
    }
    const a = input.billingAddress
    if (!a.line1 || !a.city || !a.postal_code) throw new Error('A job/billing address is required to calculate sales tax.')
    if (!(amount >= 1)) throw new Error('Enter the final balance amount.')
    if (!input.memberId && !input.email) throw new Error('Pick a customer or enter an email.')
    if (input.mode === 'charge' && !input.paymentMethodId) throw new Error('Auto-charge needs a saved card.')
    return input
  })
  .handler(async ({ data }) => {
    try {
      assertAdmin(data.passcode)
      const due = new Date(Date.now() + data.dueInDays * 86400_000).toISOString()
      const draft = await whop<any>('/invoices', {
        body: {
          account_id: accountId(),
          ...(data.memberId ? { member_id: data.memberId } : { email_address: data.email, customer_name: data.customerName }),
          ...(data.mode === 'charge' ? { payment_method_id: data.paymentMethodId } : {}),
          due_at: due,
          // Whop resolves sales tax from this address (the job site).
          billing_address: { ...data.billingAddress, country: 'US', name: data.customerName },
          memo:
            data.memo ??
            `Thank you for choosing ${site.company.name}. Your ${formatMoney(offers.deposit.price)} deposit has already been applied.`,
          time_zone: 'America/Chicago',
          items: [
            {
              variant: {
                currency: 'usd',
                billing_type: 'one_time',
                initial_price: data.amount,
                title: 'Final balance',
                visibility: 'hidden',
              },
              description: data.description,
            },
          ],
          metadata: { stage: 'final_balance', source: 'roofing_site_admin' },
        },
      })

      let invoice = draft
      if (data.mode === 'charge') {
        // Open the invoice, then charge the card saved at deposit time — right now.
        invoice = await whop(`/invoices/${draft.id}/issue`, { body: {} })
        invoice = await whop(`/invoices/${draft.id}/charge`, { body: { payment_method_id: data.paymentMethodId } })
      } else {
        // Email the customer a Whop-hosted invoice with a pay link (financing eligible).
        invoice = await whop(`/invoices/${draft.id}/send`, { body: {} })
      }
      return { ok: true as const, invoice: slimInvoice({ ...draft, ...invoice }) }
    } catch (e) {
      return { ok: false as const, error: friendly(e) }
    }
  })

export const adminGetInvoice = createServerFn({ method: 'POST' })
  .validator((d: { passcode: string; id: string }) => ({ passcode: str(d?.passcode, 100), id: str(d?.id, 60) }))
  .handler(async ({ data }) => {
    try {
      assertAdmin(data.passcode)
      const inv = await whop(`/invoices/${data.id}`)
      return { ok: true as const, invoice: slimInvoice(inv) }
    } catch (e) {
      return { ok: false as const, error: friendly(e) }
    }
  })

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
