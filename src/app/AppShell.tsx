/* ============================================================================
   APP SHELL
   ----------------------------------------------------------------------------
   Phone-shaped frame, a status-aware header, and a five-slot tab bar whose
   centre slot is the Deep Scan trigger rather than a destination — scanning is
   an action, and burying an action in a tab is how it never gets used.

   On desktop the same layout is centred in a device frame with the marketing
   context alongside, because the mobile composition *is* the design; widening
   it into a dashboard would produce a different, worse product.
   ========================================================================== */

import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '@/components/Icon'
import { Logomark } from '@/components/Brand'
import { cx, LiveDot } from '@/components/ui'
import { selHw, selKlass, selPlace, selScanning, useSelect } from '@/engine/store'
import { CLASS_META } from '@/engine/fusion'
import { haptic } from '@/lib/hooks'

const TABS: Array<{ to: string; icon: IconName; label: string; end?: boolean }> = [
  { to: '/app', icon: 'shield', label: 'Shield', end: true },
  { to: '/app/devices', icon: 'radio', label: 'Devices' },
  { to: '/app/signals', icon: 'waves', label: 'Signals' },
  { to: '/app/history', icon: 'clock', label: 'History' },
]

function Header() {
  const place = useSelect(selPlace)
  const klass = useSelect(selKlass)
  const hw = useSelect(selHw)
  const scanning = useSelect(selScanning)
  const navigate = useNavigate()

  return (
    <header
      className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl"
      style={{ paddingTop: 'var(--spacing-safe-t)' }}
    >
      <div className="flex h-14 items-center gap-3 px-4">
        <button
          onClick={() => navigate('/')}
          aria-label="PrivacyGlass home"
          className="press -ml-1.5 grid h-10 w-10 shrink-0 place-items-center rounded-sm text-ink-2"
        >
          <Logomark size={22} active />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon name="pin" size={11} className="shrink-0 text-ink-4" />
            <span className="truncate text-[13px] font-medium text-ink">{place}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2.5">
            <LiveDot label={scanning ? `SCANNING · ${CLASS_META[klass].short}` : 'PAUSED'} active={scanning} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="mr-1 hidden items-center gap-1.5 xs:flex">
            <Icon name="battery" size={15} className="text-ink-3" />
            <span className="readout text-[11.5px] text-ink-2">{hw.batteryPct}%</span>
          </div>
          <NavLink
            to="/app/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              cx(
                'press grid h-9 w-9 place-items-center rounded-sm',
                isActive ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink',
              )
            }
          >
            <Icon name="sliders" size={18} />
          </NavLink>
        </div>
      </div>
    </header>
  )
}

function TabBar() {
  const navigate = useNavigate()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[520px] border-t border-line bg-bg/92 backdrop-blur-xl"
      style={{ paddingBottom: 'var(--spacing-safe-b)' }}
      aria-label="Primary"
    >
      <div className="grid h-[62px] grid-cols-5 items-center px-1">
        {TABS.slice(0, 2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}

        <div className="flex justify-center">
          <button
            onClick={() => {
              haptic('tap')
              navigate('/app/scan')
            }}
            aria-label="Run a deep scan"
            className="press iris-edge relative -mt-7 grid h-[54px] w-[54px] place-items-center rounded-full border border-line-2 bg-surface-2 text-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.9)]"
          >
            <Icon name="scan" size={22} />
          </button>
        </div>

        {TABS.slice(2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}
      </div>
    </nav>
  )
}

function Tab({ to, icon, label, end }: { to: string; icon: IconName; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={() => haptic('tap')}
      className={({ isActive }) =>
        cx(
          'press relative flex h-full flex-col items-center justify-center gap-1',
          isActive ? 'text-ink' : 'text-ink-3',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="absolute top-0 h-[2px] w-7 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-iris-a), var(--color-iris-b), var(--color-iris-c))',
              }}
            />
          )}
          <Icon name={icon} size={20} strokeWidth={isActive ? 1.9 : 1.6} />
          <span className="text-[10px] font-medium tracking-[0.03em]">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function AppShell() {
  const klass = useSelect(selKlass)
  const { pathname } = useLocation()

  return (
    <div className={cx('min-h-dvh', CLASS_META[klass].tone)}>
      {/* Ambient wash: the whole viewport carries the current threat colour at
          the edge of perception. You feel the state before you read it. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[46vh]"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 13%, transparent) 0%, transparent 72%)',
          transition: 'background 1.2s var(--ease-out-quart)',
        }}
      />

      <div className="relative z-[1] mx-auto min-h-dvh w-full max-w-[520px] border-line md:border-x">
        <Header />
        <main
          key={pathname}
          className="anim-rise pb-[92px]"
          style={{ minHeight: 'calc(100dvh - 56px)' }}
        >
          <Outlet />
        </main>
        <TabBar />
      </div>
    </div>
  )
}
