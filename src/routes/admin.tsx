import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { formatUSD, offers, site } from '#/config/site'
import { adminCreateFinalInvoice, adminGetInvoice, adminListJobs } from '#/server/functions'
import { Icon } from '#/components/Icon'

/**
 * Office billing console (passcode-protected).
 * Shows customers who paid a deposit with a card on file, and bills the final
 * balance with the Whop Invoices API — either auto-charging the saved card or
 * emailing a Whop-hosted invoice for manual payment.
 */
export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: `Billing console | ${site.company.name}` }, { name: 'robots', content: 'noindex' }] }),
  component: AdminPage,
})

type Jobs = Extract<Awaited<ReturnType<typeof adminListJobs>>, { ok: true }>
type Job = Jobs['jobs'][number]
type Invoice = Jobs['invoices'][number]

function AdminPage() {
  const [passcode, setPasscode] = useState('')
  const [data, setData] = useState<Jobs | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('admin-passcode')
      if (saved) {
        setPasscode(saved)
        void load(saved)
      }
    } catch {}
  }, [])

  async function load(code = passcode) {
    setLoading(true)
    setError(null)
    const res = await adminListJobs({ data: { passcode: code } })
    setLoading(false)
    if (!res.ok) return setError(res.error)
    try {
      sessionStorage.setItem('admin-passcode', code)
    } catch {}
    setData(res)
  }

  if (!data) {
    return (
      <main className="container-x flex min-h-[60vh] items-center justify-center py-16">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void load()
          }}
          className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-7 shadow-sm"
        >
          <Icon name="lock" className="size-8 text-brand" />
          <h1 className="mt-3 text-2xl font-extrabold">Office billing console</h1>
          <p className="mt-1 text-sm text-stone-600">Staff only. Enter the admin passcode.</p>
          <input
            type="password"
            className="field mt-5"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoFocus
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button className="btn-dark mt-4 w-full" disabled={loading || !passcode}>
            {loading ? 'Checking…' : 'Open console'}
          </button>
        </form>
      </main>
    )
  }

  return <Console passcode={passcode} data={data} reload={() => load()} />
}

function Console({ passcode, data, reload }: { passcode: string; data: Jobs; reload: () => void }) {
  const [selected, setSelected] = useState<Job | null>(data.jobs[0] ?? null)
  const [mode, setMode] = useState<'charge' | 'send'>('charge')
  const [email, setEmail] = useState('')
  const [addr, setAddr] = useState({ line1: '', city: '', state: site.company.state as string, postal_code: '' })
  const [customerName, setCustomerName] = useState('')
  const [contract, setContract] = useState('14850')
  const [description, setDescription] = useState('Roof replacement — GAF Timberline HDZ, 28 squares, incl. tear-off, underlayment & ridge vent')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Invoice | null>(null)

  const balance = Math.max(0, Number(contract || 0) - offers.deposit.price)
  const useSaved = mode === 'charge' || !!selected

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await adminCreateFinalInvoice({
      data: {
        passcode,
        mode,
        memberId: useSaved ? selected?.memberId ?? undefined : undefined,
        paymentMethodId: mode === 'charge' ? selected?.paymentMethodId ?? undefined : undefined,
        email: useSaved ? undefined : email,
        customerName: useSaved ? selected?.name : customerName,
        amount: balance,
        billingAddress: useSaved && selected?.address ? selected.address : addr,
        description: `${description}\nContract ${formatUSD(Number(contract))} − deposit ${formatUSD(offers.deposit.price)} = balance due.`,
      },
    })
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setCreated(res.invoice)
    reload()
  }

  async function refresh(id: string) {
    const res = await adminGetInvoice({ data: { passcode, id } })
    if (res.ok) setCreated(res.invoice)
  }

  return (
    <main className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Final balance billing</h1>
          <p className="mt-1 text-stone-600">Deposit → job → final invoice, powered by the Whop Invoices API.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${data.environment === 'sandbox' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {data.environment}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Customers with a card on file</h2>
            <button type="button" className="text-sm font-medium text-brand" onClick={reload}>Refresh</button>
          </div>
          <p className="mt-1 text-xs text-stone-500">From succeeded Whop setup intents (deposit checkout).</p>
          <ul className="mt-4 space-y-2">
            {data.jobs.length === 0 && <li className="rounded-lg bg-stone-50 p-4 text-sm text-stone-500">No deposits yet. Pay one at <a className="underline" href="/deposit">/deposit</a>.</li>}
            {data.jobs.map((j) => (
              <li key={j.setupIntentId}>
                <button
                  type="button"
                  onClick={() => setSelected(j)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selected?.setupIntentId === j.setupIntentId ? 'border-brand bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{j.name}</span>
                    <span className="text-xs text-stone-500">{new Date(j.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-stone-600">{j.email ?? j.memberId}</div>
                  {j.jobAddress && <div className="text-xs text-stone-500">{j.jobAddress}</div>}
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-stone-700">
                    <Icon name="card" className="size-3.5" /> {j.card}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-bold">Bill the final balance</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1 text-sm font-semibold">
              {(['charge', 'send'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-3 py-2 ${mode === m ? 'bg-white shadow-sm' : 'text-stone-500'}`}
                >
                  {m === 'charge' ? 'Auto-charge saved card' : 'Email invoice to pay'}
                </button>
              ))}
            </div>

            {useSaved ? (
              <div className="rounded-lg border border-stone-200 p-3 text-sm">
                <span className="text-stone-500">Customer: </span>
                <strong>{selected ? `${selected.name} · ${selected.card}` : 'Select a customer on the left'}</strong>
                {mode === 'send' && selected && (
                  <button type="button" className="ml-2 text-xs text-brand underline" onClick={() => setSelected(null)}>
                    bill someone else
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="a-name">Customer name</label>
                  <input id="a-name" className="field" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="a-email">Customer email</label>
                  <input id="a-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="a-line1">Job address</label>
                  <input id="a-line1" className="field" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="a-city">City</label>
                  <input id="a-city" className="field" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="a-state">State</label>
                    <input id="a-state" className="field" maxLength={2} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" htmlFor="a-zip">ZIP</label>
                    <input id="a-zip" className="field" value={addr.postal_code} onChange={(e) => setAddr({ ...addr, postal_code: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="a-contract">Contract total (USD)</label>
                <input id="a-contract" className="field" inputMode="decimal" value={contract} onChange={(e) => setContract(e.target.value.replace(/[^\d.]/g, ''))} />
              </div>
              <div>
                <span className="label">Balance due</span>
                <div className="field bg-stone-50 font-semibold">
                  {formatUSD(balance)} <span className="font-normal text-stone-500">(after {formatUSD(offers.deposit.price)} deposit)</span>
                </div>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="a-desc">Line item description</label>
              <textarea id="a-desc" rows={2} className="field" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button className="btn-primary w-full" disabled={busy || balance < 1 || (useSaved && !selected)}>
              <Icon name="invoice" className="size-4" />
              {busy ? 'Creating invoice…' : mode === 'charge' ? `Create invoice & charge ${formatUSD(balance)}` : `Create & email ${formatUSD(balance)} invoice`}
            </button>
          </form>

          {created && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-emerald-900">Invoice {created.number ?? created.id}</strong>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold uppercase text-emerald-800">{created.status}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-emerald-800">{created.id}</p>
              <p className="mt-2 text-emerald-900">
                {created.status === 'paid'
                  ? `Charged to the card on file — ${formatUSD(created.total ?? 0)} incl. tax.`
                  : mode === 'send'
                    ? `Emailed to ${created.recipients.join(', ') || 'the customer'} with a secure Whop pay link (card, wallets or pay-over-time).`
                    : 'Charge in progress — refresh in a few seconds.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="btn-ghost px-3 py-1.5 text-xs" href={created.dashboardUrl} target="_blank" rel="noreferrer">
                  View in Whop dashboard ↗
                </a>
                <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => refresh(created.id)}>
                  Refresh status
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold">Recent invoices</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-stone-500">
              <tr>
                <th className="py-2">Invoice</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-stone-500">No invoices yet.</td>
                </tr>
              )}
              {data.invoices.map((i) => (
                <tr key={i.id} className="border-t border-stone-100">
                  <td className="py-2 font-mono text-xs">{i.number ?? i.id}</td>
                  <td>{i.email ?? '—'}</td>
                  <td>{i.total != null ? formatUSD(i.total) : '—'}</td>
                  <td>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold">{i.status}</span>
                  </td>
                  <td className="text-stone-500">{i.createdAt ? new Date(i.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
