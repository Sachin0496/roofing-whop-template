import { BrandingElement, Checkout, CheckoutElement, ExpressCheckoutElement, Payments } from '@whop/elements-react'
import { useNavigate } from '@tanstack/react-router'
import { site, type Offer } from '#/config/site'
import type { PublicWhopConfig } from '#/server/whop-api'
import { track } from '#/lib/track'
import { ElementSkeleton, MissingPlan, SandboxBanner, WhopProvider } from './WhopProvider'

/**
 * Full Whop checkout for a fixed-price plan (inspection fee, flat-rate service).
 *
 *  ExpressCheckoutElement → Apple Pay / Google Pay one-press purchase
 *  CheckoutElement        → Whop's hosted checkout: card, wallets, and pay-over-time
 *                           (Klarna / Afterpay / Splitit …) for approved merchants
 *  BrandingElement        → required merchant-of-record line
 *
 * No card fields are rendered by this site; everything runs inside Whop frames.
 */
export function PlanCheckout({ offer, config }: { offer: Offer; config: PublicWhopConfig }) {
  const plan = config.plans[offer.key]
  const navigate = useNavigate()
  const returnUrl = `${config.siteOrigin}/checkout/return?offer=${offer.key}`

  if (!plan) return <MissingPlan what={offer.title} />

  const shared = {
    plan,
    returnUrl: returnUrl?.startsWith('https://') ? returnUrl : undefined,
    metadata: { offer: offer.key, source: 'roofing_site' },
    onComplete: (c: { result: string; paymentId?: string }) => {
      if (c.result === 'payment') {
        // The purchase itself is tracked automatically by the Whop pixel; this only routes the buyer.
        navigate({ to: '/checkout/return', search: { offer: offer.key, payment: c.paymentId, status: 'succeeded' } })
      }
    },
  }

  return (
    <div className="space-y-4">
      <SandboxBanner config={config} />
      <WhopProvider config={config}>
        {/* Each <Checkout> handle owns one entry element, so express and full checkout get their own session. */}
        <Checkout {...shared} fallback={<ElementSkeleton rows={1} />}>
          <ExpressCheckoutElement layout="auto" onError={(e) => console.info('[express]', e.code, e.message)} />
        </Checkout>
        <div className="mt-4">
          <Checkout {...shared} fallback={<ElementSkeleton rows={6} />}>
            <CheckoutElement
              defaultValues={{ billingDetails: { address: { country: 'US', state: site.company.state } } }}
              onReady={() => track('initiate_checkout', { value: offer.price, currency: 'USD', variant_id: plan })} />
          </Checkout>
        </div>
        <Payments accountId={config.accountId} plan={plan}>
          <div className="mt-4 flex justify-center">
            <BrandingElement />
          </div>
        </Payments>
      </WhopProvider>
    </div>
  )
}
