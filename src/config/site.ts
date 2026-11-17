/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — the only file you edit to re-brand this template.
 *
 *  Swap the company name, phone, service area, services, reviews and prices
 *  here. Prices for the three Whop plans (inspection, deposit, flat-rate) live
 *  in `offers` below; run `bun run seed` afterwards to create matching plans on
 *  Whop (see README). No component or route needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type OfferKey = 'inspection' | 'deposit' | 'flatRate'

export interface Offer {
  key: OfferKey
  /** Plan title shown on Whop receipts and checkout. */
  title: string
  /** Short label used on buttons. */
  label: string
  /** Price in whole US dollars. Changing it requires re-running `bun run seed`. */
  price: number
  description: string
  includes: string[]
}

export interface Service {
  slug: string
  name: string
  /** One-line hook for cards. */
  summary: string
  /** Longer copy for the service detail page. */
  body: string
  startingAt: string
  bullets: string[]
  /** Which Whop offer the primary CTA on this service routes to. */
  cta: OfferKey | 'estimate'
  icon: 'repair' | 'replace' | 'inspect' | 'gutter'
}

export interface Review {
  name: string
  city: string
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  job: string
}

export const site = {
  company: {
    name: 'Summit Ridge Roofing',
    shortName: 'Summit Ridge',
    tagline: 'Roofs built for real weather.',
    phone: '(512) 555-0142',
    phoneHref: 'tel:+15125550142',
    email: 'office@summitridgeroofing.com',
    address: '2401 S Lamar Blvd, Austin, TX 78704',
    /** Two-letter state used to pre-fill checkout billing addresses. */
    state: 'TX',
    hours: 'Mon–Sat · 7am–7pm · 24/7 storm line',
    license: 'TX Roofing Contractor Lic. #RC-48213',
    founded: 2009,
    /** Public URL of the deployed site (used for post-checkout redirects). */
    siteUrl: 'https://srr-roofing-7k2q.whop.site',
  },

  /** Brand colours (CSS custom properties are generated from these). */
  theme: {
    brand: '#C2410C', // primary (burnt orange)
    brandDark: '#9A3412',
    ink: '#1C1917', // headings / dark sections
    paper: '#FAFAF9', // page background
  },

  hero: {
    eyebrow: 'Licensed · Insured · GAF Certified',
    headline: 'A roof you never have to think about again.',
    subhead:
      'Repairs, full replacements and certified inspections across Central Texas. Book a $149 inspection online, lock your project with a refundable deposit, and pay the balance only when the job passes final walk-through.',
    stats: [
      { value: '4,800+', label: 'roofs completed' },
      { value: '4.9★', label: '1,200+ reviews' },
      { value: '50-yr', label: 'manufacturer warranty' },
    ],
  },

  /** The three purchasable Whop plans. Keys map to plan IDs in whop-plans.json. */
  offers: {
    inspection: {
      key: 'inspection',
      title: 'Certified Roof Inspection',
      label: 'Book inspection',
      price: 149,
      description:
        'A 21-point inspection by a certified inspector with drone imagery and a written report in 48 hours. Credited back in full if you hire us for the work.',
      includes: [
        '21-point shingle, flashing, decking & ventilation check',
        'Drone photo report delivered in 48 hours',
        'Insurance-ready storm damage documentation',
        '$149 credited toward any repair or replacement',
      ],
    },
    deposit: {
      key: 'deposit',
      title: 'Project Deposit',
      label: 'Pay deposit',
      price: 500,
      description:
        'Reserves your crew and orders materials. Your card is saved securely by Whop so the final balance can be billed after the final walk-through — never before.',
      includes: [
        'Locks your install date and material pricing',
        'Fully deducted from your final invoice',
        'Refundable until materials are ordered',
        'Balance billed only after you sign off',
      ],
    },
    flatRate: {
      key: 'flatRate',
      title: 'Roof Tune-Up (Flat Rate)',
      label: 'Book tune-up',
      price: 349,
      description:
        'Flat-rate preventive maintenance for roofs up to 30 squares: reseal penetrations, replace up to 10 damaged shingles, clear valleys and gutters.',
      includes: [
        'Reseal pipe boots, vents & flashing',
        'Replace up to 10 missing or cracked shingles',
        'Clear valleys, gutters & downspouts',
        'Before / after photo report',
      ],
    },
  } satisfies Record<OfferKey, Offer>,

  services: [
    {
      slug: 'roof-repair',
      name: 'Roof Repair',
      summary: 'Leaks, missing shingles, flashing and storm damage — fixed right the first time.',
      body:
        'Most leaks trace back to a handful of failure points: flashing, pipe boots, valleys and nail pops. Our repair crews carry the materials to fix the common ones on the first visit, and every repair is backed by a 5-year workmanship warranty.',
      startingAt: 'Most repairs $350–$1,200',
      bullets: [
        'Same-week scheduling, emergency tarping 24/7',
        'Leak tracing with moisture meters & thermal imaging',
        'Matching shingles sourced for older roofs',
        '5-year workmanship warranty on every repair',
      ],
      cta: 'flatRate',
      icon: 'repair',
    },
    {
      slug: 'roof-replacement',
      name: 'Roof Replacement',
      summary: 'Full tear-off and re-roof in architectural shingle, metal or tile — usually in one day.',
      body:
        'A replacement is the biggest exterior investment most homeowners make, so we price it transparently: a written, line-item estimate after inspection, a $500 deposit to reserve your crew, and the balance invoiced only after you approve the final walk-through.',
      startingAt: 'Typical homes $9,500–$22,000',
      bullets: [
        'GAF, Owens Corning & standing-seam metal systems',
        'Up to 50-year manufacturer warranty',
        'Magnetic nail sweep & full cleanup',
        'Financing from $0 down for approved buyers',
      ],
      cta: 'deposit',
      icon: 'replace',
    },
    {
      slug: 'roof-inspection',
      name: 'Roof Inspection',
      summary: 'Certified 21-point inspection with drone photos — for buyers, sellers and insurance claims.',
      body:
        'Whether you are buying a home, filing a hail claim or just want to know how many years are left, our certified inspectors document every slope with drone imagery and deliver a plain-English report within 48 hours.',
      startingAt: 'Flat $149, credited toward work',
      bullets: [
        'Drone + on-roof inspection',
        'Insurance-ready storm documentation',
        'Remaining-life estimate for each slope',
        'Report in 48 hours',
      ],
      cta: 'inspection',
      icon: 'inspect',
    },
    {
      slug: 'roof-tune-up',
      name: 'Roof Tune-Up',
      summary: 'Flat-rate preventive maintenance that adds years to an aging roof.',
      body:
        'A tune-up catches the small failures before they become ceiling stains. One flat price covers resealing, minor shingle replacement and gutter clearing for roofs up to 30 squares.',
      startingAt: 'Flat $349',
      bullets: [
        'One flat price, no surprises',
        'Ideal every 2–3 years or after a big storm',
        'Photo report of everything we touched',
        'Book and pay online in two minutes',
      ],
      cta: 'flatRate',
      icon: 'gutter',
    },
  ] satisfies Service[],

  serviceArea: {
    headline: 'Serving Central Texas since 2009',
    blurb: 'Crews based in Austin and Round Rock. Same-week inspections anywhere inside the area below.',
    cities: [
      'Austin',
      'Round Rock',
      'Cedar Park',
      'Georgetown',
      'Pflugerville',
      'Leander',
      'Kyle',
      'Buda',
      'San Marcos',
      'Lakeway',
      'Dripping Springs',
      'Hutto',
    ],
    zipPrefixes: ['786', '787'],
  },

  financing: {
    headline: 'New roof now. Pay over time.',
    body:
      'Checkout runs on Whop, so eligible homeowners see pay-over-time options like Klarna, Afterpay and Splitit right at checkout — no separate application, no paperwork with us.',
    points: ['As low as $0 down', 'Instant decisions at checkout', 'Split the inspection, tune-up or deposit'],
  },

  trust: {
    badges: [
      'GAF Certified Contractor',
      'BBB A+ Rated',
      'Owens Corning Preferred',
      '$2M General Liability',
      'Workers’ Comp Insured',
    ],
  },

  reviews: [
    {
      name: 'Maria G.',
      city: 'Round Rock',
      rating: 5,
      text: 'Hail took out half our roof. They documented everything for the adjuster, had the new roof on in one day, and the yard was cleaner than before they arrived.',
      job: 'Full replacement · GAF Timberline HDZ',
    },
    {
      name: 'Derek P.',
      city: 'Austin',
      rating: 5,
      text: 'Paid the $149 inspection online, got a drone report two days later, and they credited it toward the repair. Zero pressure. That’s rare.',
      job: 'Inspection + flashing repair',
    },
    {
      name: 'Hannah & Luis T.',
      city: 'Cedar Park',
      rating: 5,
      text: 'Loved that the final bill only came after the walk-through. Card was on file from the deposit so it was literally one email and done.',
      job: 'Standing-seam metal re-roof',
    },
    {
      name: 'Bob K.',
      city: 'Georgetown',
      rating: 5,
      text: 'The tune-up found two cracked pipe boots that were about to leak into our attic. Flat price, quick, and they sent before/after photos.',
      job: 'Roof tune-up',
    },
  ] satisfies Review[],

  estimateForm: {
    headline: 'Get a free written estimate',
    blurb: 'Tell us about the roof. A project manager calls within one business day — usually the same day.',
    projectTypes: ['Roof repair / leak', 'Full replacement', 'Storm / insurance claim', 'Inspection only', 'Not sure yet'],
    roofTypes: ['Asphalt shingle', 'Metal', 'Tile', 'Flat / TPO', 'Not sure'],
    timelines: ['ASAP / active leak', 'Within 30 days', '1–3 months', 'Just researching'],
  },

  process: [
    { title: 'Inspect', body: 'Book a $149 certified inspection online. Credited back if you hire us.' },
    { title: 'Estimate', body: 'Get a written, line-item estimate — no pressure, no expiring “today only” price.' },
    { title: 'Deposit', body: 'Reserve your crew with a $500 deposit. Your card is saved securely on Whop.' },
    { title: 'Build', body: 'Most roofs are installed in a single day, with full cleanup.' },
    { title: 'Final invoice', body: 'After your walk-through sign-off, the balance is billed to your saved card or sent as an invoice.' },
  ],
} as const

export type SiteConfig = typeof site
export const services: readonly Service[] = site.services
export const offers: Record<OfferKey, Offer> = site.offers
export const formatUSD = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 === 0 ? 0 : 2 })
