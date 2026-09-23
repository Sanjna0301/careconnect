export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="CareConnect logo"
        className="shrink-0 drop-shadow-[0_2px_4px_rgb(12_66_137/0.35)]"
      >
        <defs>
          {/* A single top-left light source gives the tile its thickness. */}
          <linearGradient id="cc-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f80ed" />
            <stop offset="1" stopColor="#0b51ad" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#cc-face)" />
        <rect x="2" y="2" width="44" height="44" rx="13" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.5" />
        {/* Medical cross with a pulse notch cut through it. */}
        <path
          d="M21 11h6v8h8v6h-8v8h-6v-8h-8v-6h8z"
          fill="#fff"
          fillOpacity="0.96"
        />
        <path
          d="M10 35h7l3-5 4 9 3.5-7 2.5 3h8"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </svg>
      <span className="text-[1.15rem] font-extrabold tracking-tight text-ink-900">
        Care<span className="text-med-600">Connect</span>
      </span>
    </span>
  )
}
