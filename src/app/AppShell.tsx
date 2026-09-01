import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '@/components/Icon'
import { Logomark } from '@/components/Brand'
import { cx, LiveDot } from '@/components/ui'
import { selHw, selKlass, selPlace, selScanning, useSelect } from '@/engine/store'
import { CLASS_META } from '@/engine/fusion'
import { haptic } from '@/lib/hooks'

const TABS: Array<{ to: string; icon: IconName; label: string; end?: boolean }> = [
  { to: '/',        icon: 'shield', label: 'Shield',  end: true },
  { to: '/devices', icon: 'radio',  label: 'Devices' },
  { to: '/history', icon: 'clock',  label: 'History' },
  { to: '/settings',icon: 'sliders',label: 'Settings' },
]

function Header() {
  const place    = useSelect(selPlace)
  const klass    = useSelect(selKlass)
  const hw       = useSelect(selHw)
  const scanning = useSelect(selScanning)

  return (
    <header
      className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl"
      style={{ paddingTop: 'var(--spacing-safe-t)' }}
    >
      <div className="flex h-14 items-center gap-3 px-4">
        <span className="press -ml-1.5 grid h-10 w-10 shrink-0 place-items-center rounded-sm text-ink-2">
          <Logomark size={22} active />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon name="pin" size={11} className="shrink-0 text-ink-4" />
            <span className="truncate text-[13px] font-medium text-ink">{place}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2.5">
            <LiveDot
              label={scanning ? `SCANNING · ${CLASS_META[klass].short}` : 'PAUSED'}
              active={scanning}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Icon name="battery" size={15} className="text-ink-3" />
          <span className="readout text-[11.5px] text-ink-2">{hw.batteryPct}%</span>
        </div>
      </div>
    </header>
  )
}

function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[520px] border-t border-line bg-bg/92 backdrop-blur-xl"
      style={{ paddingBottom: 'var(--spacing-safe-b)' }}
      aria-label="Primary"
    >
      <div className="grid h-[62px] grid-cols-4 items-center px-1">
        {TABS.map((t) => (
          <Tab key={t.to} {...t} />
        ))}
      </div>
    </nav>
  )
}

function Tab({ to, icon, label, end }: (typeof TABS)[0]) {
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
  const klass    = useSelect(selKlass)
  const { pathname } = useLocation()

  return (
    <div className={cx('min-h-dvh', CLASS_META[klass].tone)}>
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
        <main key={pathname} className="anim-rise pb-[92px]" style={{ minHeight: 'calc(100dvh - 56px)' }}>
          <Outlet />
        </main>
        <TabBar />
      </div>
    </div>
  )
}
