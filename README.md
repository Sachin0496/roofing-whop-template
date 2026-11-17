# Roofing Company Website Template — built on Whop Websites

A production-ready, re-brandable website for a US roofing contractor, hosted on **Whop Websites** and wired end-to-end to Whop for the high-ticket roofing flow:

**inspection fee → estimate (lead) → project deposit (card on file) → job → final invoice.**

Live demo: **https://srr-roofing-7k2q.whop.site** (demo company: *Summit Ridge Roofing*, checkout in Whop sandbox — use card `4242 4242 4242 4242`).

---

## What Whop features it uses

| Feature | Where |
| --- | --- |
| **Whop Websites hosting** (CLI scaffold + `whop apps deploy`, TanStack Start SSR, app secrets) | whole project |
| **Plans** — $149 inspection fee, $500 project deposit, $349 flat-rate tune-up (one product, three variants) | `scripts/seed.ts`, `src/config/whop-plans.json` |
| **CheckoutElement + ExpressCheckoutElement + BrandingElement** (hosted Whop checkout, Apple Pay / Google Pay, financing for approved merchants) | `src/components/whop/PlanCheckout.tsx` |
| **PaymentElement (setup mode) + BrandingElement + Setup Intents API** — card saved at deposit checkout, then the deposit plan is charged to the saved method | `src/components/whop/DepositCheckout.tsx`, `startDepositSetup` / `chargeDeposit` in `src/server/functions.ts` |
| **Leads** — "Request an Estimate" creates a lead on the account (`POST /members`, a member with no access — Whop's replacement for the retired `POST /leads`) with the quote details attached as a member note, plus a server-side `lead` event | `submitEstimate` |
| **Invoices API** — final balance billed by auto-charging the stored card (`create → issue → charge`) or emailed for manual payment (`create → send`) | `/admin`, `adminCreateFinalInvoice` |
| **Pixel / `whop.track`** — custom `service_viewed`, `estimate_requested`, `deposit_started` (+ `deposit_paid`) and standard `lead`, `view_content`, `initiate_checkout`. Page views & checkout events are automatic on whop.site. | `src/lib/track.ts` |

No Stripe, PayPal SDKs or custom card forms — every card number is typed into Whop's PCI frames.

---

## Re-brand it for a new roofer (no structural changes)

1. Edit **`src/config/site.ts`** — company name, phone, license, colours, services, service-area cities/ZIP prefixes, reviews, financing copy, and the three offer prices.
2. Create the matching Whop plans:
   ```bash
   WHOP_SANDBOX_API_KEY=... WHOP_SANDBOX_ACCOUNT_ID=biz_... bun run seed          # sandbox
   WHOP_API_KEY=...         WHOP_ACCOUNT_ID=biz_...         bun run seed --prod   # production
   ```
   This writes plan IDs into `src/config/whop-plans.json` (re-runnable; updates prices in place).
3. Deploy: `whop apps deploy`.

Nothing else references the company, prices, or plan IDs directly.

## Environments & secrets

| Secret | Purpose |
| --- | --- |
| `WHOP_ENV` | `sandbox` (default, test cards, no real money) or `production` |
| `WHOP_SANDBOX_API_KEY`, `WHOP_SANDBOX_ACCOUNT_ID` | Sandbox business the demo checkout, leads and invoices run against |
| `ADMIN_PASSCODE` | Protects `/admin` (final-balance billing console) |

In `production`, server calls go to `WHOP_API_ORIGIN` and Whop's hosting proxy signs them with the app's own key — no API key is stored in the code or secrets.

```bash
whop apps secrets set --secret WHOP_ENV=sandbox --secret ADMIN_PASSCODE=change-me
whop apps secrets set --secret WHOP_SANDBOX_API_KEY=... --secret WHOP_SANDBOX_ACCOUNT_ID=biz_...
```

## Pages

| Route | What it does |
| --- | --- |
| `/` | Hero, trust badges, services, pricing/booking, process, **financing**, **reviews**, **service area** (ZIP check), **estimate form + contact** |
| `/services/:slug` | Service detail — fires `service_viewed` |
| `/book/inspection`, `/book/flat-rate` | Whop checkout (Express + Checkout + Branding) |
| `/deposit` | Deposit checkout — fires `deposit_started`; saves card via setup intent, charges deposit |
| `/checkout/return` | Outcome page for off-site steps (3DS, financing) |
| `/admin` | Office console: customers with a card on file → bill final balance via Invoices API |

## Verifying pixel events

Add `?pixel=debug` to any URL to open the on-page **Pixel inspector**, which lists each `whop.track` call as it fires. The events also show in the browser console (`[pixel] → whop.track "…"`) and, about a minute later, in the Whop dashboard under **Websites / Pixel**. `?pixel=off` hides the inspector.

## Local development

```bash
bun install
whop apps dev        # runs vite with the hosted runtime's env (+ your app secrets)
bun run typecheck
whop apps deploy     # build, typecheck, upload, promote
```
