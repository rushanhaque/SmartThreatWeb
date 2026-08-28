/* ============================================================================
   UI PRIMITIVES
   ----------------------------------------------------------------------------
   Every component here is status-aware: it reads `--accent` from the nearest
   `.t-safe | .t-caution | .t-threat` ancestor rather than taking a colour prop.
   Wrapping a subtree in one class re-themes everything inside it, which is how
   the whole app can shift from green to red in a single state change without a
   colour value being threaded through forty components.
   ========================================================================== */

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Icon, type IconName } from './Icon'
import { useScrollLock } from '@/lib/hooks'

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')

/* ── Micro label ─────────────────────────────────────────────────────────── */

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('micro', className)}>{children}</div>
}

/* ── Button ──────────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'accent' | 'quiet' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
  iconAfter?: IconName
  full?: boolean
}

const BTN_BASE =
  'press relative inline-flex items-center justify-center gap-2 font-medium rounded-md select-none disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap'

const BTN_SIZE = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-4 text-[14px]',
  lg: 'h-[52px] px-5 text-[15px]',
}

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-void hover:bg-white active:bg-white',
  accent:
    'text-[var(--accent)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_34%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]',
  quiet: 'bg-surface-2 text-ink border border-line hover:bg-surface-3',
  ghost: 'text-ink-2 hover:text-ink hover:bg-surface-2',
  danger: 'bg-threat/12 text-threat border border-threat/35 hover:bg-threat/20',
}

export function Button({
  variant = 'quiet',
  size = 'md',
  icon,
  iconAfter,
  full,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(BTN_BASE, BTN_SIZE[size], BTN_VARIANT[variant], full && 'w-full', className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 19 : 17} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={size === 'lg' ? 19 : 17} />}
    </button>
  )
}

export function IconButton({
  name,
  label,
  size = 20,
  className,
  ...rest
}: { name: IconName; label: string; size?: number } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      className={cx(
        'press grid h-10 w-10 place-items-center rounded-sm text-ink-2',
        'hover:bg-surface-2 hover:text-ink',
        className,
      )}
      {...rest}
    >
      <Icon name={name} size={size} />
    </button>
  )
}

/* ── Panel / Card ────────────────────────────────────────────────────────── */

export function Panel({
  children,
  className,
  lit = true,
  bracket = false,
  ...rest
}: { children: ReactNode; lit?: boolean; bracket?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('panel', lit && 'panel-lit', bracket && 'bracketed', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export function PanelHeader({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5">
      <div className="min-w-0">
        <Label>{title}</Label>
        {hint && <p className="mt-1.5 truncate text-[12.5px] text-ink-3">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/* ── Status pill ─────────────────────────────────────────────────────────── */

export function Pill({
  children,
  icon,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  icon?: IconName
  tone?: 'neutral' | 'accent' | 'muted'
  className?: string
}) {
  const tones = {
    neutral: 'border-line text-ink-2 bg-surface-2/70',
    accent:
      'border-[color-mix(in_srgb,var(--accent)_38%,transparent)] text-[var(--accent)] bg-[var(--accent-soft)]',
    muted: 'border-transparent text-ink-3 bg-surface-2/50',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium leading-none',
        tones[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  )
}

/* ── Live indicator ──────────────────────────────────────────────────────── */

export function LiveDot({ label = 'Live', active = true }: { label?: string; active?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        {active && (
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60"
            style={{ animation: 'blip 2s ease-out infinite' }}
          />
        )}
        <span
          className={cx(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            active ? 'bg-[var(--accent)]' : 'bg-ink-4',
          )}
        />
      </span>
      <span className="micro">{label}</span>
    </span>
  )
}

/* ── Segmented control ───────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ left: number; width: number } | null>(null)

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-v="${value}"]`)
    if (!el) return
    setBox({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value, options.length])

  return (
    <div
      ref={ref}
      role="tablist"
      className={cx(
        'relative flex rounded-sm border border-line bg-bg-2 p-1',
        className,
      )}
    >
      {box && (
        <span
          aria-hidden
          className="absolute inset-y-1 rounded-[6px] border border-line-2 bg-surface-2"
          style={{
            left: box.left,
            width: box.width,
            transition: 'left .32s var(--ease-out-expo), width .32s var(--ease-out-expo)',
          }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          data-v={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'relative z-[1] flex-1 rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors duration-200',
            o.value === value ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ── Switch ──────────────────────────────────────────────────────────────── */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-[26px] w-[44px] shrink-0 rounded-full border transition-colors duration-300',
        checked
          ? 'border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_26%,transparent)]'
          : 'border-line bg-surface-2',
      )}
    >
      <span
        className={cx(
          'absolute top-[3px] h-[18px] w-[18px] rounded-full',
          checked ? 'bg-[var(--accent)]' : 'bg-ink-3',
        )}
        style={{
          left: checked ? 23 : 3,
          transition: 'left .3s var(--ease-out-expo), background-color .3s',
        }}
      />
    </button>
  )
}

/* ── List row ────────────────────────────────────────────────────────────── */

export function Row({
  title,
  sub,
  right,
  icon,
  onClick,
  className,
  dense,
}: {
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
  icon?: ReactNode
  onClick?: () => void
  className?: string
  dense?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-3 text-left',
        dense ? 'px-4 py-2.5' : 'px-4 py-3.5',
        onClick && 'press hover:bg-surface-2/60',
        className,
      )}
    >
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-ink">{title}</div>
        {sub && <div className="mt-0.5 truncate text-[12.5px] text-ink-3">{sub}</div>}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
      {onClick && !right && <Icon name="chevron-right" size={16} className="shrink-0 text-ink-4" />}
    </Tag>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cx('h-px w-full bg-line', className)} />
}

/* ── Key/value readout — the app's densest information unit ──────────────── */

export function Stat({
  label,
  value,
  unit,
  tone,
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  tone?: 'accent' | 'default'
  className?: string
}) {
  return (
    <div className={cx('min-w-0', className)}>
      <Label>{label}</Label>
      <div
        className={cx(
          'readout mt-1.5 flex items-baseline gap-1 text-[19px] font-semibold leading-none',
          tone === 'accent' ? 'text-[var(--accent)]' : 'text-ink',
        )}
      >
        <span className="truncate">{value}</span>
        {unit && <span className="text-[11px] font-normal text-ink-3">{unit}</span>}
      </div>
    </div>
  )
}

/* ── Bottom sheet ────────────────────────────────────────────────────────
   Native-feeling modal: springs up from the bottom edge, dims the page,
   traps scroll, and dismisses on backdrop tap or Escape.                   */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}) {
  useScrollLock(open)
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) setMounted(true)
    else {
      const t = setTimeout(() => setMounted(false), 280)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-void/72 backdrop-blur-[3px]"
        style={{
          opacity: open ? 1 : 0,
          transition: 'opacity .26s var(--ease-out-quart)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] w-full max-w-[520px] overflow-hidden rounded-t-[22px] border border-line bg-surface"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(101%)',
          transition: 'transform .38s var(--ease-out-expo)',
          paddingBottom: 'var(--spacing-safe-b)',
        }}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="h-1 w-9 rounded-full bg-ink-4" />
        </div>
        {title && (
          <div className="flex items-center justify-between border-b border-line px-4 pb-3">
            <h2 className="text-[15px] font-semibold">{title}</h2>
            <IconButton name="close" label="Close" onClick={onClose} size={18} />
          </div>
        )}
        <div className="max-h-[68vh] overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-line bg-bg-2 p-4">{footer}</div>}
      </div>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

export function Empty({
  icon = 'search',
  title,
  body,
  action,
}: {
  icon?: IconName
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface-2 text-ink-3">
        <Icon name={icon} size={20} />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-[34ch] text-[13px] leading-relaxed text-ink-3">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ── Progress ────────────────────────────────────────────────────────────── */

export function Bar({
  value,
  className,
  height = 4,
}: {
  value: number
  className?: string
  height?: number
}) {
  return (
    <div
      className={cx('w-full overflow-hidden rounded-full bg-surface-3', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[var(--accent)]"
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          transition: 'width .6s var(--ease-out-expo)',
        }}
      />
    </div>
  )
}

export { cx }
