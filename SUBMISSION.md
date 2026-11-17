# Submission — Roofing Website Template on Whop Websites

**Live URL:** https://srr-roofing-7k2q.whop.site
**Demo company:** Summit Ridge Roofing (Austin, TX) · checkout runs in the Whop **sandbox** — use card `4242 4242 4242 4242`, any future expiry, any CVC.

## Whop features implemented

This template is a TanStack Start site scaffolded and deployed with the Whop CLI (`whop apps init --app_type website` → `whop apps deploy`) and hosted on Whop Websites. Secrets are app secrets, and the server calls Whop's REST API. A seed script creates one Whop product with three real plans from the site config: a $149 inspection fee, a tax-inclusive $500 project deposit, and a $349 flat-rate roof tune-up. Fixed-price plans check out through Whop Payment Elements: `ExpressCheckoutElement` (Apple Pay / Google Pay), `CheckoutElement` (card, ACH, and pay-over-time such as Klarna, Afterpay and Splitit for approved merchants) and the required `BrandingElement`, with no custom card forms. The deposit uses `PaymentElement` in setup mode plus `BrandingElement`. It creates a confirmation token, then the Setup Intents API saves the card on file, and the deposit plan is charged to that saved method. The "Request an Estimate" form creates a lead on the Whop account through `POST /members`, Whop's replacement for the retired `POST /leads`. The member gets no access, the quote details are attached as a member note, and a server-side `lead` event is sent. A passcode-protected billing console bills the final balance with the Invoices API: either create → issue → charge the stored card, or create → send, which emails a Whop invoice for manual payment. The Whop pixel's automatic page and checkout tracking is complemented by custom `whop.track` events `service_viewed`, `estimate_requested` and `deposit_started` (plus `deposit_paid`, `lead`, `view_content` and `initiate_checkout`). An on-page inspector (`?pixel=debug`) shows each event as it fires. All branding, services, service area, reviews and prices live in `src/config/site.ts`, so re-branding needs no structural changes.

## Verified end-to-end (sandbox, 17 Nov 2026)

| Step | Result |
| --- | --- |
| Estimate form → lead | `mber_fLrC5dAAxM6VA` created (access: `no_access`) with the estimate note attached |
| $149 inspection checkout (CheckoutElement) | `pay_tEmo306wurRFeZ` **paid** — $161.29 incl. 8.25% TX tax |
| $349 flat-rate checkout | paid, buyer returned to `/checkout/return` |
| $500 deposit (PaymentElement setup mode) | setup intent `sint_fKgZVCZVUC5Vu` succeeded → card `payt_5aNdXCyDlDxRl` → deposit `pay_fn29RDl20ru21g` **paid** (same member as the lead) |
| Final invoice, auto-charge | Invoice #00000003 `pay_fnDbRZUTyrAQle` **paid** with `payt_5aNdXCyDlDxRl` |
| Final invoice, email for manual payment | Invoice #00000004 `pay_58TrdUUf4t924r` **open**, sent to the customer |
| Pixel | `service_viewed`, `estimate_requested`, `lead`, `deposit_started`, `initiate_checkout` delivered via `window.whop.track` (POSTs to `t.whop.tw/conversions`) |

## 3–5 minute recording script

1. **Site tour (45s)** — `/?pixel=debug`. Scroll through the hero, services, pricing, process, financing, reviews, the service-area ZIP check, and the estimate form with contact details. Resize to mobile.
2. **Pixel (20s)** — open a service card → the inspector shows `service_viewed`.
3. **Lead (40s)** — submit the estimate form → `estimate_requested` + `lead` fire. In the sandbox dashboard → Customers, open the new member and show the note.
4. **Test checkout (50s)** — `/book/inspection`. Point out Express Checkout, Whop checkout and branding. Pay with 4242… → thank-you page. Show the payment in the dashboard.
5. **Deposit + card on file (45s)** — `/deposit` → `deposit_started` fires. Save the card and pay $500 → the receipt shows the saved method `payt_…`.
6. **Final invoice (45s)** — `/admin`. Pick the customer, enter the contract total → "Create invoice & charge" → status **PAID**. Switch to "Email invoice to pay" to show the manual option. Show both in Dashboard → Invoices.
7. **Template swap (15s)** — open `src/config/site.ts` and show that the name, prices and cities live there.

The admin passcode is stored as the `ADMIN_PASSCODE` app secret (`whop apps secrets list`).
