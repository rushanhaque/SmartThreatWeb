/* ============================================================================
   BRAND
   ----------------------------------------------------------------------------
   The mark is an aperture: six blades around an open centre. It is the thing a
   camera has, and the thing this product is built to find — so the logo states
   the problem and the promise in one shape. It survives to 16 px because the
   blade gaps are cut at 2 px on a 28 px grid.
   ========================================================================== */

import { memo } from 'react'

export function Logomark({ size = 28, active = false }: { size?: number; active?: boolean }) {
  const blades = [0, 60, 120, 180, 240, 300]
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lm-iris" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-iris-a)" />
          <stop offset="50%" stopColor="var(--color-iris-b)" />
          <stop offset="100%" stopColor="var(--color-iris-c)" />
        </linearGradient>
      </defs>
      <circle
        cx="14"
        cy="14"
        r="11.6"
        stroke={active ? 'url(#lm-iris)' : 'currentColor'}
        strokeWidth="1.5"
        opacity={active ? 1 : 0.34}
      />
      <g stroke={active ? 'url(#lm-iris)' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round">
        {blades.map((a) => (
          <line
            key={a}
            x1="14"
            y1="14"
            x2="14"
            y2="4.6"
            transform={`rotate(${a} 14 14)`}
            strokeDasharray="5.4 20"
            strokeDashoffset="-3.4"
          />
        ))}
      </g>
      <circle cx="14" cy="14" r="3.1" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
    </svg>
  )
}

export function Wordmark({ size = 28, active = true }: { size?: number; active?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Logomark size={size} active={active} />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
          PrivacyGlass
        </span>
        <span className="micro mt-1 text-ink-4">PG-1 · COMPANION</span>
      </span>
    </span>
  )
}

/* ============================================================================
   PG-1 TECHNICAL ELEVATION
   ----------------------------------------------------------------------------
   Front elevation with the temples laid flat, the way a spec sheet draws
   eyewear. Callout leaders point at where each part physically sits — the
   drawing doubles as the assembly reference in docs/.
   ========================================================================== */

export interface CalloutSpec {
  id: string
  label: string
  part: string
  /** Anchor on the drawing, in viewBox units. */
  x: number
  y: number
  /** Which way the leader runs. */
  side: 'up' | 'down'
  /** Where the label block sits. */
  lx: number
}

export const PG1_CALLOUTS: CalloutSpec[] = [
  { id: 'mcu', label: 'ESP32-S3', part: 'Wi-Fi sniff · BLE · TinyML', x: 826, y: 152, side: 'up', lx: 762 },
  { id: 'ble', label: 'nRF52840', part: 'FindMy parser', x: 906, y: 152, side: 'down', lx: 846 },
  { id: 'rf', label: 'AD8318', part: 'RF power · 1 MHz–8 GHz', x: 118, y: 152, side: 'up', lx: 40 },
  { id: 'emf', label: 'Coil + LM358', part: 'EM field · mG', x: 62, y: 152, side: 'down', lx: 26 },
  { id: 'lux', label: 'BH1750', part: 'Ambient light · lux', x: 500, y: 118, side: 'up', lx: 432 },
  { id: 'oled', label: '0.96" OLED', part: 'Heads-up threat state', x: 636, y: 176, side: 'down', lx: 574 },
  { id: 'ir', label: 'IR 940 nm', part: 'Lens retro-reflection', x: 300, y: 176, side: 'down', lx: 236 },
]

export const PG1Glasses = memo(function PG1Glasses({
  callouts = false,
  className = '',
  scanning = false,
}: {
  callouts?: boolean
  className?: string
  scanning?: boolean
}) {
  return (
    <svg
      viewBox="0 0 1000 300"
      className={className}
      fill="none"
      role="img"
      aria-label="PG-1 smart glasses, front elevation with component callouts"
    >
      <defs>
        <linearGradient id="pg-lens" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#2b3440" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#131a22" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0a0e13" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="pg-coat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-iris-a)" stopOpacity="0.55" />
          <stop offset="48%" stopColor="var(--color-iris-b)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--color-iris-c)" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="pg-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a6472" />
          <stop offset="40%" stopColor="#2c333d" />
          <stop offset="100%" stopColor="#171c23" />
        </linearGradient>
        <linearGradient id="pg-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-iris-c)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--color-iris-c)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--color-iris-c)" stopOpacity="0" />
        </linearGradient>
        <clipPath id="pg-clip-l">
          <rect x="196" y="96" width="228" height="112" rx="42" />
        </clipPath>
        <clipPath id="pg-clip-r">
          <rect x="576" y="96" width="228" height="112" rx="42" />
        </clipPath>
      </defs>

      {/* ── Temples ─────────────────────────────────────────────── */}
      <g>
        <rect x="18" y="128" width="182" height="42" rx="15" fill="url(#pg-frame)" />
        <rect
          x="18.5"
          y="128.5"
          width="181"
          height="41"
          rx="14.5"
          stroke="rgba(255,255,255,0.14)"
        />
        <rect x="800" y="128" width="182" height="42" rx="15" fill="url(#pg-frame)" />
        <rect
          x="800.5"
          y="128.5"
          width="181"
          height="41"
          rx="14.5"
          stroke="rgba(255,255,255,0.14)"
        />
      </g>

      {/* ── Component blocks inside the temples ─────────────────── */}
      <g opacity="0.92">
        <rect x="806" y="140" width="46" height="18" rx="3" fill="#0d1116" stroke="rgba(255,255,255,0.2)" />
        <rect x="884" y="140" width="34" height="18" rx="3" fill="#0d1116" stroke="rgba(255,255,255,0.2)" />
        <rect x="932" y="140" width="42" height="18" rx="3" fill="#0d1116" stroke="rgba(255,255,255,0.12)" />
        <rect x="96" y="140" width="46" height="18" rx="3" fill="#0d1116" stroke="rgba(255,255,255,0.2)" />
        <rect x="40" y="140" width="44" height="18" rx="3" fill="#0d1116" stroke="rgba(255,255,255,0.2)" />
      </g>

      {/* ── Frame front ─────────────────────────────────────────── */}
      <g>
        <rect x="188" y="88" width="244" height="128" rx="50" fill="url(#pg-frame)" />
        <rect x="568" y="88" width="244" height="128" rx="50" fill="url(#pg-frame)" />
        <path d="M432 122h136" stroke="url(#pg-frame)" strokeWidth="26" strokeLinecap="round" />
        <path
          d="M436 118c22-14 106-14 128 0"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1.5"
          fill="none"
        />
      </g>

      {/* ── Lenses ──────────────────────────────────────────────── */}
      <g>
        <rect x="196" y="96" width="228" height="112" rx="42" fill="url(#pg-lens)" />
        <rect x="576" y="96" width="228" height="112" rx="42" fill="url(#pg-lens)" />
        {/* anti-reflective coating catch-light — the iridescence motif */}
        <g clipPath="url(#pg-clip-l)">
          <ellipse cx="264" cy="126" rx="112" ry="40" fill="url(#pg-coat)" opacity="0.5" />
        </g>
        <g clipPath="url(#pg-clip-r)">
          <ellipse cx="644" cy="126" rx="112" ry="40" fill="url(#pg-coat)" opacity="0.5" />
        </g>
        <rect
          x="196.5"
          y="96.5"
          width="227"
          height="111"
          rx="41.5"
          stroke="rgba(255,255,255,0.2)"
        />
        <rect
          x="576.5"
          y="96.5"
          width="227"
          height="111"
          rx="41.5"
          stroke="rgba(255,255,255,0.2)"
        />
      </g>

      {/* ── HUD element inside the right lens ───────────────────── */}
      <g clipPath="url(#pg-clip-r)">
        <rect x="616" y="160" width="52" height="22" rx="4" fill="#00110c" stroke="var(--color-safe)" strokeOpacity="0.5" />
        <circle cx="628" cy="171" r="3.4" fill="var(--color-safe)" />
        <rect x="638" y="167.5" width="20" height="2.4" rx="1.2" fill="var(--color-safe)" opacity="0.75" />
        <rect x="638" y="173" width="12" height="2.4" rx="1.2" fill="var(--color-safe)" opacity="0.4" />
      </g>

      {/* ── Sensors on the bridge and rims ──────────────────────── */}
      <circle cx="500" cy="118" r="5.5" fill="#0b0f14" stroke="rgba(255,255,255,0.35)" />
      <circle cx="500" cy="118" r="2" fill="var(--color-iris-b)" opacity="0.8" />
      <g>
        <circle cx="292" cy="196" r="4.2" fill="#12060a" stroke="var(--color-threat)" strokeOpacity="0.55" />
        <circle cx="308" cy="196" r="4.2" fill="#12060a" stroke="var(--color-threat)" strokeOpacity="0.55" />
      </g>

      {/* ── Live scan sweep across the lenses ───────────────────── */}
      {scanning && (
        <g clipPath="url(#pg-clip-l)">
          <rect x="196" y="96" width="60" height="112" fill="url(#pg-sweep)" opacity="0.6">
            <animate
              attributeName="x"
              values="150;420;150"
              dur="4.4s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.2 1;0.4 0 0.2 1"
              keyTimes="0;0.5;1"
            />
          </rect>
        </g>
      )}

      {/* ── Callout leaders ─────────────────────────────────────── */}
      {callouts && (
        <g className="pg-callouts">
          {PG1_CALLOUTS.map((c) => {
            const endY = c.side === 'up' ? c.y - 62 : c.y + 62
            const labelY = c.side === 'up' ? endY - 6 : endY + 15
            return (
              <g key={c.id} opacity="0.96">
                <path
                  d={`M${c.x} ${c.y} L${c.x} ${endY}`}
                  stroke="var(--color-line-3)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <circle cx={c.x} cy={c.y} r="2.6" fill="var(--color-iris-b)" />
                <path
                  d={`M${c.x} ${endY} L${c.lx + 4} ${endY}`}
                  stroke="var(--color-line-3)"
                  strokeWidth="1"
                />
                <text
                  x={c.lx}
                  y={labelY}
                  fill="var(--color-ink)"
                  fontSize="13"
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                  letterSpacing="-0.02em"
                >
                  {c.label}
                </text>
                <text
                  x={c.lx}
                  y={labelY + 14}
                  fill="var(--color-ink-3)"
                  fontSize="10.5"
                  fontFamily="var(--font-sans)"
                >
                  {c.part}
                </text>
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
})
