/** Lightweight inline illustration (no image assets to swap when re-branding; colours follow the theme). */
export function HouseIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 420" className={className} role="img" aria-label="Illustration of a house with a new roof">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fed7aa" />
          <stop offset="1" stopColor="#fff7ed" />
        </linearGradient>
        <pattern id="shingle" width="26" height="16" patternUnits="userSpaceOnUse">
          <rect width="26" height="16" fill="var(--color-ink)" />
          <path d="M0 15.5h26M13 0v8M0 8h26M0 8v8M26 8v8" stroke="#44403c" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="560" height="420" rx="28" fill="url(#sky)" />
      <circle cx="455" cy="92" r="44" fill="#fdba74" opacity=".75" />
      {/* hills */}
      <path d="M0 330c90-40 170-46 260-20s190 20 300-14v124H0Z" fill="#d6d3d1" opacity=".55" />
      {/* house body */}
      <rect x="120" y="210" width="320" height="160" fill="#f5f5f4" stroke="#d6d3d1" />
      <rect x="250" y="270" width="60" height="100" rx="4" fill="var(--color-brand)" />
      <circle cx="298" cy="322" r="3.5" fill="#fff" />
      <rect x="152" y="250" width="66" height="56" rx="4" fill="#bae6fd" stroke="#a8a29e" />
      <path d="M185 250v56M152 278h66" stroke="#a8a29e" />
      <rect x="342" y="250" width="66" height="56" rx="4" fill="#bae6fd" stroke="#a8a29e" />
      <path d="M375 250v56M342 278h66" stroke="#a8a29e" />
      {/* chimney */}
      <rect x="350" y="96" width="34" height="80" fill="#a8a29e" />
      <rect x="345" y="90" width="44" height="12" fill="#78716c" />
      {/* roof */}
      <path d="M90 222 280 82l190 140Z" fill="url(#shingle)" />
      <path d="M78 228 280 76l202 152" fill="none" stroke="var(--color-brand)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      {/* gutter */}
      <path d="M104 232h352" stroke="#78716c" strokeWidth="6" strokeLinecap="round" />
      {/* ground */}
      <rect x="0" y="368" width="560" height="52" rx="0" fill="#a3a38a" opacity=".35" />
      <path d="M250 370h60l20 50h-100Z" fill="#e7e5e4" />
      {/* drone */}
      <g transform="translate(140 96)">
        <rect x="-18" y="-4" width="36" height="9" rx="4" fill="var(--color-ink)" />
        <path d="M-28 -8h18M10 -8h18" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="9" r="4" fill="var(--color-brand)" />
        <path d="M0 14 -26 92M0 14 26 92" stroke="var(--color-brand)" strokeWidth="1.5" strokeDasharray="4 5" opacity=".6" />
      </g>
    </svg>
  )
}
