import { useState, type FormEvent } from 'react'
import { site } from '#/config/site'
import { submitEstimate } from '#/server/functions'
import { newEventId, track } from '#/lib/track'
import { Icon } from './Icon'

const empty = {
  name: '',
  email: '',
  phone: '',
  address: '',
  zip: '',
  projectType: site.estimateForm.projectTypes[0] as string,
  roofType: site.estimateForm.roofTypes[0] as string,
  timeline: site.estimateForm.timelines[1] as string,
  message: '',
}

/** "Request an Estimate" → creates a lead on the Whop account (see submitEstimate). */
export function EstimateForm({ defaultProject }: { defaultProject?: string }) {
  const [form, setForm] = useState({ ...empty, projectType: defaultProject ?? empty.projectType })
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [leadId, setLeadId] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setState('sending')
    const eventId = newEventId('est')
    try {
      const res = await submitEstimate({ data: { ...form, eventId, pageUrl: window.location.href } })
      if (!res.ok) throw new Error(res.error)
      setLeadId(res.memberId)
      setState('done')
      // Custom event + the standard `lead` event (deduped with the server-side copy by event_id).
      track('estimate_requested', { event_id: eventId, project_type: form.projectType, timeline: form.timeline, zip: form.zip })
      track('lead', { event_id: eventId })
    } catch (err: any) {
      setError(err?.message?.replace(/^Error:\s*/, '') ?? 'Could not send your request. Please call us instead.')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8" role="status">
        <span className="flex size-11 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Icon name="check" />
        </span>
        <h3 className="mt-4 text-2xl font-bold text-emerald-950">Thanks, {form.name.split(' ')[0]} — request received.</h3>
        <p className="mt-2 text-emerald-900">
          A project manager will call <strong>{form.phone}</strong> within one business day. Want to skip the wait? Book a certified
          inspection now and it’s credited toward your project.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/book/inspection" className="btn-primary">
            Book $149 inspection <Icon name="arrow" className="size-4" />
          </a>
          <button type="button" className="btn-ghost" onClick={() => { setForm(empty); setState('idle') }}>
            Send another request
          </button>
        </div>
        {leadId && <p className="mt-4 font-mono text-[11px] text-emerald-700">Lead ref: {leadId}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7" noValidate>
      <fieldset disabled={state === 'sending'} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="e-name">Name *</label>
          <input id="e-name" className="field" required autoComplete="name" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label" htmlFor="e-phone">Phone *</label>
          <input id="e-phone" type="tel" className="field" required autoComplete="tel" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="e-email">Email *</label>
          <input id="e-email" type="email" className="field" required autoComplete="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="sm:col-span-2 grid grid-cols-[1fr_7rem] gap-3">
          <div>
            <label className="label" htmlFor="e-address">Property address</label>
            <input id="e-address" className="field" autoComplete="street-address" value={form.address} onChange={set('address')} />
          </div>
          <div>
            <label className="label" htmlFor="e-zip">ZIP</label>
            <input id="e-zip" className="field" inputMode="numeric" autoComplete="postal-code" value={form.zip} onChange={set('zip')} />
          </div>
        </div>
        <Select id="e-project" label="Project" value={form.projectType} onChange={set('projectType')} options={site.estimateForm.projectTypes} />
        <Select id="e-roof" label="Roof type" value={form.roofType} onChange={set('roofType')} options={site.estimateForm.roofTypes} />
        <Select id="e-timeline" label="Timeline" value={form.timeline} onChange={set('timeline')} options={site.estimateForm.timelines} className="sm:col-span-2" />
        <div className="sm:col-span-2">
          <label className="label" htmlFor="e-msg">Anything we should know?</label>
          <textarea id="e-msg" rows={3} className="field resize-y" value={form.message} onChange={set('message')} placeholder="Leak over the garage after last week’s storm…" />
        </div>
      </fieldset>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <button type="submit" className="btn-primary mt-5 w-full py-3.5 text-base" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Request my free estimate'}
      </button>
      <p className="mt-3 text-center text-xs text-stone-500">No spam, no pressure. We’ll only use your info to schedule your estimate.</p>
    </form>
  )
}

function Select({
  id,
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  id: string
  label: string
  value: string
  onChange: (e: { target: { value: string } }) => void
  options: readonly string[]
  className?: string
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>{label}</label>
      <select id={id} className="field appearance-auto" value={value} onChange={onChange}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
