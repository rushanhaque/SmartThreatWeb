/* ============================================================================
   LENS FINDER — the optical channel
   ----------------------------------------------------------------------------
   Radio finds transmitters. This finds the ones that do not transmit: SD-card
   cameras, analogue units, anything powered but silent. It exploits the one
   thing every camera has and cannot hide — a lens that retro-reflects infrared
   straight back at its source.

   The 940 nm array on the bridge illuminates; the user looks for the bright
   point that moves with them. This screen is the aiming aid: a reticle, a
   sweep pattern, and a checklist of where these things actually get hidden.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Label, Panel, Pill, Switch, cx } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { haptic, useScrollLock } from '@/lib/hooks'

const HOTSPOTS = [
  { x: 0.28, y: 0.34, r: 7, delay: 0, label: 'Smoke detector' },
  { x: 0.72, y: 0.58, r: 4, delay: 1.4, label: 'Alarm clock' },
]

const CHECKLIST = [
  'Smoke detectors and sprinkler heads directly above the bed',
  'Alarm clocks, radios, and anything with a dark plastic window',
  'Air purifiers, chargers, and plug adaptors facing the room',
  'The seam and back edge of every mirror',
  'Picture frames, wall art, and ceiling vents',
  'TV bezels, set-top boxes, and speaker grilles',
]

export default function LensFinder() {
  const navigate = useNavigate()
  const [ir, setIr] = useState(true)
  const [found, setFound] = useState(false)
  const [useCamera, setUseCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  useScrollLock(true)

  useEffect(() => {
    if (!useCamera) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      return
    }
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {
        setCameraError('Camera unavailable — showing the simulated viewfinder instead.')
        setUseCamera(false)
      })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [useCamera])

  // A hit is a decision the user makes, not one the app makes for them.
  useEffect(() => {
    if (!ir) setFound(false)
  }, [ir])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-void t-caution">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div
        className="flex h-14 shrink-0 items-center justify-between px-4"
        style={{ paddingTop: 'var(--spacing-safe-t)' }}
      >
        <div>
          <Label>LENS FINDER</Label>
          <div className="mt-1 text-[13px] font-medium text-ink">IR 940 nm retro-reflection</div>
        </div>
        <button
          onClick={() => navigate('/app')}
          aria-label="Close lens finder"
          className="press grid h-10 w-10 place-items-center rounded-sm text-ink-2"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      {/* ── Viewfinder ───────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-3 overflow-hidden rounded-lg border border-line-2 bg-[#05070a]">
          {useCamera ? (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full object-cover opacity-70"
              style={{ filter: 'grayscale(1) contrast(1.15) brightness(0.75)' }}
            />
          ) : (
            <SimulatedRoom ir={ir} />
          )}

          {/* Reticle overlay */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <g stroke="var(--color-line-2)" strokeWidth="0.15" vectorEffect="non-scaling-stroke">
              {[33.3, 66.6].map((v) => (
                <line key={`v${v}`} x1={v} y1="0" x2={v} y2="100" />
              ))}
              {[33.3, 66.6].map((v) => (
                <line key={`h${v}`} x1="0" y1={v} x2="100" y2={v} />
              ))}
            </g>
          </svg>

          {/* Corner brackets */}
          {[
            'top-3 left-3 border-t border-l',
            'top-3 right-3 border-t border-r',
            'bottom-3 left-3 border-b border-l',
            'bottom-3 right-3 border-b border-r',
          ].map((c) => (
            <span key={c} className={cx('absolute h-6 w-6 border-ink-2/50', c)} />
          ))}

          {/* Scan line */}
          {ir && (
            <div
              className="pointer-events-none absolute inset-x-0 h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-threat) 55%, transparent), transparent)',
                animation: 'lens-scan 3.6s var(--ease-in-out-soft) infinite',
              }}
            />
          )}

          {/* IR array status */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span
              className={cx('h-2 w-2 rounded-full', ir ? 'bg-threat' : 'bg-ink-4')}
              style={ir ? { animation: 'ticker 1.6s ease-in-out infinite' } : undefined}
            />
            <span className="micro text-ink-2">{ir ? 'IR ARRAY ON · 940 NM' : 'IR ARRAY OFF'}</span>
          </div>

          {cameraError && (
            <div className="absolute right-4 bottom-4 left-4 rounded-sm border border-line bg-bg/90 px-3 py-2 text-[11.5px] text-ink-3">
              {cameraError}
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────── */}
      <div
        className="shrink-0 space-y-3 px-4 pt-3"
        style={{ paddingBottom: 'calc(1rem + var(--spacing-safe-b))' }}
      >
        <Panel className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-ink">Infrared array</div>
              <p className="mt-0.5 text-[12px] text-ink-3">
                Invisible to the eye. Lenses bounce it straight back.
              </p>
            </div>
            <Switch checked={ir} onChange={setIr} label="Infrared array" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 border-t border-line pt-3">
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-ink">Use phone camera</div>
              <p className="mt-0.5 text-[12px] text-ink-3">
                Most phone sensors still see some 940 nm light.
              </p>
            </div>
            <Switch checked={useCamera} onChange={setUseCamera} label="Use phone camera" />
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-2">
          <Button
            icon={found ? 'check' : 'target'}
            variant={found ? 'accent' : 'quiet'}
            onClick={() => {
              setFound(!found)
              haptic(found ? 'tap' : 'threat')
            }}
          >
            {found ? 'Reflection marked' : 'Mark a reflection'}
          </Button>
          <Button icon="arrow-left" variant="ghost" onClick={() => navigate('/app')}>
            Back to shield
          </Button>
        </div>

        <details className="group rounded-md border border-line bg-surface/60">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
            <span className="text-[13px] font-medium text-ink">Where these actually get hidden</span>
            <Icon
              name="chevron-down"
              size={16}
              className="text-ink-4 transition-transform duration-300 group-open:rotate-180"
            />
          </summary>
          <ul className="space-y-2 border-t border-line px-4 py-3">
            {CHECKLIST.map((c, i) => (
              <li key={c} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
                <span className="readout shrink-0 text-ink-4">{String(i + 1).padStart(2, '0')}</span>
                {c}
              </li>
            ))}
          </ul>
        </details>
      </div>

      <style>{`
        @keyframes lens-scan {
          0%   { top: 4%;  opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { top: 96%; opacity: 0; }
        }
        @keyframes lens-glint {
          0%, 100% { opacity: 0.25; transform: scale(0.9); }
          50%      { opacity: 1;    transform: scale(1.25); }
        }
      `}</style>
    </div>
  )
}

/* A stylised room in IR: warm surfaces fall away, and the two retro-reflective
   points stay bright regardless of distance. That contrast *is* the technique. */
function SimulatedRoom({ ir }: { ir: boolean }) {
  return (
    <svg viewBox="0 0 100 140" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="lf-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1116" />
          <stop offset="100%" stopColor="#06080b" />
        </linearGradient>
        <radialGradient id="lf-glint">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="35%" stopColor="var(--color-threat)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-threat)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="100" height="140" fill="url(#lf-wall)" />

      {/* room furniture, drawn as flat IR-dark silhouettes */}
      <g stroke="#1b232c" strokeWidth="0.6" fill="#0a0e13">
        <rect x="8" y="86" width="84" height="34" rx="3" />
        <rect x="14" y="78" width="26" height="12" rx="2" />
        <rect x="60" y="76" width="30" height="14" rx="2" />
        <circle cx="28" cy="47" r="6.5" />
        <rect x="66" y="72" width="12" height="9" rx="1.5" />
        <rect x="4" y="10" width="92" height="52" rx="2" fill="none" />
      </g>
      <g stroke="#151c24" strokeWidth="0.4">
        <line x1="0" y1="62" x2="100" y2="62" />
        <line x1="0" y1="120" x2="100" y2="120" />
      </g>

      {ir &&
        HOTSPOTS.map((h, i) => (
          <g key={i}>
            <circle
              cx={h.x * 100}
              cy={h.y * 140}
              r={h.r * 1.6}
              fill="url(#lf-glint)"
              style={{ animation: `lens-glint 2.2s ease-in-out ${h.delay}s infinite` }}
            />
            <circle cx={h.x * 100} cy={h.y * 140} r="1.1" fill="#fff" />
            <circle
              cx={h.x * 100}
              cy={h.y * 140}
              r={h.r + 4}
              fill="none"
              stroke="var(--color-threat)"
              strokeWidth="0.35"
              strokeDasharray="1.5 2"
              opacity="0.7"
            />
            <text
              x={h.x * 100 + h.r + 7}
              y={h.y * 140 + 1.5}
              fontSize="3"
              fontFamily="var(--font-mono)"
              fill="var(--color-threat)"
              letterSpacing="0.1"
            >
              {h.label}
            </text>
          </g>
        ))}
    </svg>
  )
}
