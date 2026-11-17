/**
 * Server-only Whop REST client.
 *
 * - `WHOP_ENV=sandbox` (default for the demo): requests go to the sandbox API with
 *   `WHOP_SANDBOX_API_KEY` (an app secret). No real money moves.
 * - `WHOP_ENV=production`: requests go to `WHOP_API_ORIGIN`; Whop's hosting proxy
 *   attaches the app's own API key, so no key ever lives in this code.
 */
import plans from '#/config/whop-plans.json'
import type { OfferKey } from '#/config/site'

export type WhopEnv = 'sandbox' | 'production'

const API_VERSION = '2026-11-16'

export function whopEnv(): WhopEnv {
  return process.env.WHOP_ENV === 'production' ? 'production' : 'sandbox'
}

export function accountId(): string {
  const env = whopEnv()
  if (env === 'sandbox') return process.env.WHOP_SANDBOX_ACCOUNT_ID || plans.sandbox.accountId
  return process.env.WHOP_ACCOUNT_ID || plans.production.accountId
}

export function planId(key: OfferKey): string {
  return plans[whopEnv()].plans[key]
}

export function publicWhopConfig() {
  const env = whopEnv()
  return {
    environment: env,
    accountId: accountId(),
    plans: plans[env].plans as Record<OfferKey, string>,
  }
}
export type PublicWhopConfig = ReturnType<typeof publicWhopConfig> & { siteOrigin: string }

export class WhopApiError extends Error {
  constructor(
    public status: number,
    public body: any,
    path: string,
  ) {
    super(`Whop API ${status} on ${path}: ${body?.error?.message ?? JSON.stringify(body).slice(0, 300)}`)
  }
}

export async function whop<T = any>(
  path: string,
  init: { method?: string; body?: unknown; idempotencyKey?: string; query?: Record<string, string | number | boolean | undefined | string[]> } = {},
): Promise<T> {
  const env = whopEnv()
  const origin = env === 'sandbox' ? 'https://sandbox-api.whop.com' : process.env.WHOP_API_ORIGIN || 'https://api.whop.com'
  const url = new URL(`/api/v1${path}`, origin)
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v === undefined) continue
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(`${k}[]`, x))
    else url.searchParams.set(k, String(v))
  }
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'Api-Version-Date': API_VERSION,
  }
  if (init.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey
  if (env === 'sandbox') {
    const key = process.env.WHOP_SANDBOX_API_KEY
    if (!key) throw new Error('WHOP_SANDBOX_API_KEY is not set (whop apps secrets set --secret WHOP_SANDBOX_API_KEY=...)')
    headers.authorization = `Bearer ${key}`
    // Never let the hosting proxy attach the production key to a sandbox call.
    headers['x-whop-inject-key'] = 'none'
  } else if (process.env.WHOP_API_KEY) {
    // Local `whop apps dev` injects a short-lived key; on hosting the proxy signs requests.
    headers.authorization = `Bearer ${process.env.WHOP_API_KEY}`
  }

  const res = await fetch(url, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  const text = await res.text()
  let json: any
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    console.error('[whop]', res.status, path, text.slice(0, 500))
    throw new WhopApiError(res.status, json, path)
  }
  return json as T
}
