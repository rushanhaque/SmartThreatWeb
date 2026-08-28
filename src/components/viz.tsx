/* ============================================================================
   VISUALISATION
   ----------------------------------------------------------------------------
   Hand-rolled SVG rather than a charting library. Three reasons that matter
   here: the bundle stays small enough to load on hotel Wi-Fi, every mark can
   be tuned for a 390 px viewport, and the shapes can be *specific* to this
   product — an aperture, a spectrum, an evidence chain — instead of generic
   donuts and bars.
   ========================================================================== */

import { memo, useMemo } from 'react'
import type { FusionBreakdown, SensorFrame, ThreatClass } from '@/engine/types'
import { CHANNEL_LABEL, WEIGHTS } from '@/engine/fusion'
import { cx, Label } from './ui'

/* ============================================================================
   APERTURE RING — the app's primary instrument
   ----------------------------------------------------------------------------
   72 blades, one per 5°, so the ring reads as an aperture rather than a
   progress donut. Blades fill clockwise with the score; the leading edge
   carries the accent at full strength and falls off behind it, which gives the
   ring a direction of travel without animating anything per-frame.
   ========================================================================== */

const BLADES = 72
const TAU = Math.PI * 2

export const ApertureRing = memo(function ApertureRing({
  score,
  klass,
  size = 268,
  scanning = true,
  children,
}: {
  score: number
  klass: ThreatClass
  size?: number
  scanning?: boolean
  children?: React.ReactNode
}) {
  const filled = Math.round((score / 100) * BLADES)

  const blades = useMemo(
    () =>
      Array.from({ length: BLADES }, (_, i) => {
        // Start at 12 o'clock, run clockwise.
        const a = (i / BLADES) * TAU - Math.PI / 2
        const inner = 108
        const outer = 126
        return {
          i,
          x1: 150 + Math.cos(a) * inner,
          y1: 150 + Math.sin(a) * inner,
          x2: 150 + Math.cos(a) * outer,
          y2: 150 + Math.sin(a) * outer,
          major: i % 6 === 0,
        }
      }),
    [],
  )

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 300 300" width={size} height={size} className="absolute inset-0">
        <defs>
          <radialGradient id="ap-core" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.13" />
            <stop offset="65%" stopColor="var(--accent)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="ap-sweep" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* soft core wash — gives the centre readout something to sit on */}
        <circle cx="150" cy="150" r="120" fill="url(#ap-core)" />

        {/* structural hairlines */}
        <circle cx="150" cy="150" r="99" stroke="var(--color-line)" strokeWidth="1" fill="none" />
        <circle cx="150" cy="150" r="134" stroke="var(--color-line)" strokeWidth="1" fill="none" />

        {/* rotating sweep — the only continuously animated element */}
        {scanning && (
          <g style={{ transformOrigin: '150px 150px', animation: 'sweep-rotate 6s linear infinite' }}>
            <path d="M150 150 L150 22 A128 128 0 0 1 214 39 Z" fill="url(#ap-sweep)" opacity="0.16" />
            <line x1="150" y1="150" x2="150" y2="24" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
          </g>
        )}

        {/* aperture blades */}
        <g strokeLinecap="round">
          {blades.map((b) => {
            const on = b.i < filled
            // Falloff behind the leading blade reads as motion, not decoration.
            const lead = filled - b.i
            const opacity = on ? (lead <= 3 ? 1 : lead <= 10 ? 0.78 : 0.5) : b.major ? 0.22 : 0.11
            return (
              <line
                key={b.i}
                x1={b.x1}
                y1={b.y1}
                x2={b.x2}
                y2={b.y2}
                stroke={on ? 'var(--accent)' : 'var(--color-ink)'}
                strokeWidth={b.major ? 2.2 : 1.5}
                opacity={opacity}
                style={{ transition: 'opacity .5s var(--ease-out-quart), stroke .4s' }}
              />
            )
          })}
        </g>

        {/* cardinal ticks — 0 / 25 / 50 / 75 */}
        <g fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--color-ink-4)" letterSpacing="0.1em">
          <text x="150" y="14" textAnchor="middle">0</text>
          <text x="292" y="153" textAnchor="end">25</text>
          <text x="150" y="296" textAnchor="middle">50</text>
          <text x="8" y="153">75</text>
        </g>
      </svg>

      <div className="relative z-[1] flex flex-col items-center">{children}</div>
    </div>
  )
})

/* ============================================================================
   SPARKLINE — inline RSSI / value trend, ~40 points
   ========================================================================== */

export const Sparkline = memo(function Sparkline({
  data,
  width = 64,
  height = 20,
  strokeWidth = 1.4,
  fill = false,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  fill?: boolean
  className?: string
}) {
  const d = useMemo(() => {
    if (data.length < 2) return { line: '', area: '' }
    const min = Math.min(...data)
    const max = Math.max(...data)
    const span = max - min || 1
    const step = width / (data.length - 1)
    const pts = data.map((v, i) => [i * step, height - ((v - min) / span) * (height - 2) - 1])
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    const area = `${line} L${width} ${height} L0 ${height} Z`
    return { line, area }
  }, [data, width, height])

  return (
    <svg width={width} height={height} className={className} aria-hidden="true">
      {fill && <path d={d.area} fill="var(--accent)" opacity="0.1" />}
      <path
        d={d.line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})

/* ============================================================================
   TRACE — full-width sensor time series with threshold band
   ========================================================================== */

export function Trace({
  frames,
  channel,
  height = 116,
  threshold,
  unit,
  domain,
}: {
  frames: SensorFrame[]
  channel: 'rfDbm' | 'emfMg' | 'lux'
  height?: number
  threshold?: number
  unit: string
  domain: [number, number]
}) {
  const W = 340
  const H = height
  const values = frames.map((f) => f[channel])
  const [lo, hi] = domain

  const { line, area, last } = useMemo(() => {
    if (values.length < 2) return { line: '', area: '', last: 0 }
    const step = W / (values.length - 1)
    const y = (v: number) => H - ((v - lo) / (hi - lo)) * (H - 10) - 5
    const pts = values.map((v, i) => [i * step, y(Math.min(hi, Math.max(lo, v)))] as const)
    const line = pts.map(([x, yy], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${yy.toFixed(1)}`).join(' ')
    return { line, area: `${line} L${W} ${H} L0 ${H} Z`, last: values[values.length - 1] }
  }, [values, lo, hi, H])

  const thresholdY = threshold != null ? H - ((threshold - lo) / (hi - lo)) * (H - 10) - 5 : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`tr-${channel}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baseline grid — quartiles only, so the trace stays the loudest mark */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            y1={H * f}
            x2={W}
            y2={H * f}
            stroke="var(--color-line)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {thresholdY != null && (
          <line
            x1="0"
            y1={thresholdY}
            x2={W}
            y2={thresholdY}
            stroke="var(--color-caution)"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.6"
            vectorEffect="non-scaling-stroke"
          />
        )}

        <path d={area} fill={`url(#tr-${channel})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="pointer-events-none absolute top-1 right-0 flex items-baseline gap-1">
        <span className="readout text-[15px] font-semibold text-[var(--accent)]">
          {channel === 'lux' ? Math.round(last) : last.toFixed(1)}
        </span>
        <span className="micro">{unit}</span>
      </div>
    </div>
  )
}

/* ============================================================================
   EVIDENCE STACK — the fusion breakdown, made legible
   ----------------------------------------------------------------------------
   Each row shows two quantities at once: how strongly a channel fired (the
   bar) and how much that channel is allowed to matter (the weight chip). This
   is the screen that answers "why did it say that?" — the single most
   important question a detection product has to be able to answer.
   ========================================================================== */

export function EvidenceStack({
  breakdown,
  compact = false,
}: {
  breakdown: FusionBreakdown
  compact?: boolean
}) {
  const rows = (Object.keys(WEIGHTS) as Array<keyof FusionBreakdown>).map((k) => ({
    key: k,
    label: CHANNEL_LABEL[k],
    value: breakdown[k],
    weight: WEIGHTS[k],
    contribution: breakdown[k] * WEIGHTS[k],
  }))
  const max = Math.max(...rows.map((r) => r.contribution), 0.001)

  return (
    <div className={cx('space-y-2.5', compact ? 'px-4 pb-4' : 'px-4 pb-4')}>
      {rows.map((r) => {
        const active = r.value > 0.12
        return (
          <div key={r.key} className="flex items-center gap-3">
            <div className="w-[104px] shrink-0">
              <div
                className={cx(
                  'truncate text-[12.5px] font-medium',
                  active ? 'text-ink' : 'text-ink-4',
                )}
              >
                {r.label}
              </div>
            </div>

            <div className="relative h-[18px] flex-1 overflow-hidden rounded-[3px] bg-bg-2">
              {/* ghost bar: the channel's maximum possible contribution */}
              <div
                className="absolute inset-y-0 left-0 rounded-[3px] border border-line"
                style={{ width: `${(r.weight / max) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-[3px] bg-[var(--accent)]"
                style={{
                  width: `${(r.contribution / max) * 100}%`,
                  opacity: active ? 0.85 : 0.25,
                  transition: 'width .7s var(--ease-out-expo), opacity .4s',
                }}
              />
            </div>

            <div className="readout w-[52px] shrink-0 text-right text-[11px] text-ink-3">
              ×{r.weight.toFixed(2)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============================================================================
   SIGNAL BARS — 4-step RSSI
   ========================================================================== */

export function SignalBars({ bars, className }: { bars: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-end gap-[2px]', className)} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cx(
            'w-[3px] rounded-[1px]',
            i < bars ? 'bg-[var(--accent)]' : 'bg-ink-4/45',
          )}
          style={{ height: 4 + i * 3 }}
        />
      ))}
    </span>
  )
}

/* ============================================================================
   PROXIMITY FIELD — polar plot of everything the glasses can hear
   ----------------------------------------------------------------------------
   Radius is derived from RSSI, so distance on screen means distance in the
   room. Angle is hashed from the MAC: stable between renders (a device does
   not jump around) but not a claim about real bearing, which a single antenna
   cannot resolve. That honesty is deliberate — the rings are labelled in
   metres, the bearing is not labelled at all.
   ========================================================================== */

export function ProximityField({
  points,
  size = 300,
}: {
  points: Array<{ id: string; rssi: number; tone: 'safe' | 'caution' | 'threat' | 'muted'; label?: string }>
  size?: number
}) {
  const R = 140
  const placed = useMemo(
    () =>
      points.map((p) => {
        let h = 0
        for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) >>> 0
        const angle = (h % 3600) / 3600 * TAU
        const t = Math.min(1, Math.max(0, (-p.rssi - 30) / 60))
        const r = 22 + t * (R - 34)
        return { ...p, x: 150 + Math.cos(angle) * r, y: 150 + Math.sin(angle) * r, r }
      }),
    [points],
  )

  const TONE: Record<string, string> = {
    safe: 'var(--color-safe)',
    caution: 'var(--color-caution)',
    threat: 'var(--color-threat)',
    muted: 'var(--color-ink-4)',
  }

  return (
    <svg viewBox="0 0 300 300" width={size} height={size} className="mx-auto block">
      {/* range rings at roughly 2 / 6 / 15 m */}
      {[46, 92, 138].map((r, i) => (
        <g key={r}>
          <circle
            cx="150"
            cy="150"
            r={r}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="1"
            strokeDasharray={i === 2 ? '2 4' : undefined}
          />
          <text
            x="152"
            y={150 - r + 11}
            fontFamily="var(--font-mono)"
            fontSize="8"
            fill="var(--color-ink-4)"
            letterSpacing="0.1em"
          >
            {['2M', '6M', '15M'][i]}
          </text>
        </g>
      ))}

      {/* crosshair */}
      <line x1="150" y1="8" x2="150" y2="292" stroke="var(--color-line)" strokeWidth="1" />
      <line x1="8" y1="150" x2="292" y2="150" stroke="var(--color-line)" strokeWidth="1" />

      {/* the wearer */}
      <circle cx="150" cy="150" r="7" fill="var(--color-bg)" stroke="var(--color-ink-2)" strokeWidth="1.4" />
      <circle cx="150" cy="150" r="2.4" fill="var(--color-ink)" />

      {placed.map((p) => (
        <g key={p.id} style={{ transition: 'transform .8s var(--ease-out-expo)' }}>
          {p.tone === 'threat' && (
            <circle cx={p.x} cy={p.y} r="12" fill={TONE[p.tone]} opacity="0.14">
              <animate attributeName="r" values="8;18;8" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.22;0;0.22" dur="2.4s" repeatCount="indefinite" />
            </circle>
          )}
          <circle
            cx={p.x}
            cy={p.y}
            r={p.tone === 'muted' ? 2.6 : 4}
            fill={TONE[p.tone]}
            opacity={p.tone === 'muted' ? 0.55 : 1}
          />
          {p.label && (
            <text
              x={p.x + 8}
              y={p.y + 3.5}
              fontFamily="var(--font-mono)"
              fontSize="8.5"
              fill="var(--color-ink-3)"
              letterSpacing="0.06em"
            >
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

/* ============================================================================
   SPECTRUM — banded RF occupancy, 1 MHz to 6.5 GHz
   ========================================================================== */

const BANDS = [
  { label: '433M', key: 'ism433', hint: 'ISM · remotes, bugs' },
  { label: '868M', key: 'ism868', hint: 'LoRa, alarms' },
  { label: '1.2G', key: 'analog', hint: 'Analog video' },
  { label: '2.4G', key: 'wifi24', hint: 'Wi-Fi · BLE' },
  { label: '5.2G', key: 'wifi5', hint: 'Wi-Fi 5 GHz' },
  { label: '5.8G', key: 'analog58', hint: 'Analog cam' },
]

export function Spectrum({ levels, peakBand }: { levels: number[]; peakBand?: number }) {
  return (
    <div className="flex h-[128px] items-end gap-1.5 px-4 pb-1">
      {BANDS.map((b, i) => {
        const v = levels[i] ?? 0
        const hot = i === peakBand
        return (
          <div key={b.key} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-[92px] w-full items-end overflow-hidden rounded-[3px] bg-bg-2">
              {/* 25 % gridlines inside each column keep the scale readable */}
              {[0.25, 0.5, 0.75].map((g) => (
                <span
                  key={g}
                  className="absolute inset-x-0 h-px bg-line"
                  style={{ bottom: `${g * 100}%` }}
                />
              ))}
              <div
                className={cx(
                  'relative w-full rounded-t-[2px]',
                  hot ? 'bg-[var(--accent)]' : 'bg-ink-4',
                )}
                style={{
                  height: `${Math.min(100, v * 100)}%`,
                  opacity: hot ? 0.95 : 0.5,
                  transition: 'height .8s var(--ease-out-expo)',
                }}
              />
            </div>
            <span
              className={cx(
                'font-mono text-[8.5px] tracking-[0.1em]',
                hot ? 'text-[var(--accent)]' : 'text-ink-4',
              )}
            >
              {b.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ============================================================================
   ARC GAUGE — compact single-value dial for EMF and lux
   ========================================================================== */

export function Gauge({
  value,
  max,
  label,
  unit,
  danger,
  size = 92,
}: {
  value: number
  max: number
  label: string
  unit: string
  danger?: number
  size?: number
}) {
  const pct = Math.min(1, Math.max(0, value / max))
  const R = 38
  const CIRC = Math.PI * R // 180° arc
  const dangerPct = danger != null ? Math.min(1, danger / max) : null

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 58" width={size} height={size * 0.58}>
        <path
          d={`M ${50 - R} 50 A ${R} ${R} 0 0 1 ${50 + R} 50`}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {dangerPct != null && (
          <path
            d={`M ${50 - R} 50 A ${R} ${R} 0 0 1 ${50 + R} 50`}
            fill="none"
            stroke="var(--color-caution)"
            strokeWidth="1.5"
            strokeDasharray={`1.5 ${CIRC}`}
            strokeDashoffset={-CIRC * dangerPct}
            opacity="0.7"
          />
        )}
        <path
          d={`M ${50 - R} 50 A ${R} ${R} 0 0 1 ${50 + R} 50`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${CIRC * pct} ${CIRC}`}
          style={{ transition: 'stroke-dasharray .8s var(--ease-out-expo)' }}
        />
      </svg>
      <div className="-mt-3 text-center">
        <div className="readout text-[17px] font-semibold leading-none">
          {value < 10 ? value.toFixed(1) : Math.round(value)}
          <span className="ml-0.5 text-[10px] font-normal text-ink-3">{unit}</span>
        </div>
        <Label className="mt-1.5">{label}</Label>
      </div>
    </div>
  )
}

/* ============================================================================
   SCORE HISTORY — 24 h threat ribbon
   ========================================================================== */

export function ThreatRibbon({ points }: { points: Array<{ score: number; klass: ThreatClass }> }) {
  const TONE: Record<ThreatClass, string> = {
    safe: 'var(--color-safe)',
    caution: 'var(--color-caution)',
    threat: 'var(--color-threat)',
  }
  return (
    <div className="flex h-9 items-end gap-[2px] px-4">
      {points.map((p, i) => (
        <div
          key={i}
          className="flex-1 rounded-[1px]"
          style={{
            height: `${Math.max(8, p.score)}%`,
            background: TONE[p.klass],
            opacity: p.klass === 'safe' ? 0.4 : 0.9,
          }}
        />
      ))}
    </div>
  )
}
