/**
 * Creates (or updates) the Whop product + three plans this template sells, from
 * the prices in src/config/site.ts, and writes their IDs to src/config/whop-plans.json.
 *
 *   WHOP_SANDBOX_API_KEY=... WHOP_SANDBOX_ACCOUNT_ID=biz_... bun run seed            # sandbox
 *   WHOP_API_KEY=...         WHOP_ACCOUNT_ID=biz_...         bun run seed --prod     # production
 *
 * Safe to re-run: existing plans are updated in place (title / price / description).
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { offers, site, type OfferKey } from '../src/config/site'

const prod = process.argv.includes('--prod')
const env = prod ? 'production' : 'sandbox'
const base = prod ? 'https://api.whop.com/api/v1' : 'https://sandbox-api.whop.com/api/v1'
const key = prod ? process.env.WHOP_API_KEY : process.env.WHOP_SANDBOX_API_KEY
const siteUrl = (process.env.SITE_URL ?? site.company.siteUrl).replace(/\/$/, '')
const accountId = prod ? process.env.WHOP_ACCOUNT_ID : process.env.WHOP_SANDBOX_ACCOUNT_ID
if (!key || !accountId) {
  console.error(`Missing ${prod ? 'WHOP_API_KEY / WHOP_ACCOUNT_ID' : 'WHOP_SANDBOX_API_KEY / WHOP_SANDBOX_ACCOUNT_ID'}`)
  process.exit(1)
}

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(base + path, {
    method,
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'Api-Version-Date': '2026-11-16' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json: any = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`)
  return json
}

const file = fileURLToPath(new URL('../src/config/whop-plans.json', import.meta.url))
const config = JSON.parse(await readFile(file, 'utf8'))
const current = config[env]

// 1. Product
let productId: string = current.productId
const productBody = {
  title: `${site.company.name} Services`.slice(0, 80),
  headline: site.company.tagline.slice(0, 80),
  description: `${site.hero.subhead}`.slice(0, 1500),
  visibility: 'visible',
  send_welcome_message: false,
  redirect_purchase_url: `${siteUrl}/checkout/return`,
}
if (productId) {
  await api(`/products/${productId}`, 'PATCH', productBody)
  console.log('✓ product updated', productId)
} else {
  const p = await api('/products', 'POST', { account_id: accountId, ...productBody })
  productId = p.id
  console.log('✓ product created', productId)
}

// 2. Plans (Whop "variants", IDs prefixed plan_)
const plans: Record<OfferKey, string> = { ...current.plans }
for (const offer of Object.values(offers)) {
  const body = {
    title: offer.title.slice(0, 30),
    description: offer.description,
    initial_price: offer.price,
    currency: 'usd',
    adaptive_pricing_enabled: false, // US contractor: always charge USD
    billing_type: 'one_time',
    visibility: 'visible',
    unlimited_stock: true,
    allow_multiple_quantity: false,
    // A deposit is a prepayment toward the job: keep the charged amount exactly the advertised price.
    ...(offer.key === 'deposit' ? { override_tax_type: 'inclusive' } : {}),
    metadata: { offer: offer.key, template: 'roofing' },
    redirect_url: `${siteUrl}/checkout/return?offer=${offer.key}`,
  }
  if (plans[offer.key]) {
    await api(`/variants/${plans[offer.key]}`, 'PATCH', body)
    console.log(`✓ ${offer.key} updated`, plans[offer.key], `$${offer.price}`)
  } else {
    const v = await api('/variants', 'POST', { account_id: accountId, product_id: productId, ...body })
    plans[offer.key] = v.id
    console.log(`✓ ${offer.key} created`, v.id, `$${offer.price}`)
  }
}

config[env] = { accountId, productId, plans }
await writeFile(file, JSON.stringify(config, null, 2) + '\n')
console.log(`\nWrote ${env} IDs to src/config/whop-plans.json — redeploy with \`whop apps deploy\`.`)
