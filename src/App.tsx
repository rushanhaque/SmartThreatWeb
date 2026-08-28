import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { startTelemetry } from '@/engine/store'
import { AppShell } from '@/app/AppShell'
import { Shield } from '@/app/screens/Shield'

/* Route-level code splitting. The Shield screen is eagerly bundled because it
   is the landing target of every push notification — it must paint on the
   first frame, not after a chunk request over hotel Wi-Fi. */
const Landing = lazy(() => import('@/landing/Landing'))
const Devices = lazy(() => import('@/app/screens/Devices'))
const DeviceDetail = lazy(() => import('@/app/screens/DeviceDetail'))
const Signals = lazy(() => import('@/app/screens/Signals'))
const History = lazy(() => import('@/app/screens/History'))
const Settings = lazy(() => import('@/app/screens/Settings'))
const DeepScan = lazy(() => import('@/app/screens/DeepScan'))
const LensFinder = lazy(() => import('@/app/screens/LensFinder'))
const TrackerWatch = lazy(() => import('@/app/screens/TrackerWatch'))
const Incident = lazy(() => import('@/app/screens/Incident'))
const Onboarding = lazy(() => import('@/app/screens/Onboarding'))

function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="micro animate-pulse">LOADING</div>
    </div>
  )
}

export default function App() {
  useEffect(() => startTelemetry(), [])

  return (
    <>
      <ScrollReset />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Full-bleed flows live outside the shell: they own the whole
              viewport and deliberately hide the tab bar. */}
          <Route path="/app/scan" element={<DeepScan />} />
          <Route path="/app/lens" element={<LensFinder />} />
          <Route path="/app/tracker" element={<TrackerWatch />} />

          <Route path="/app" element={<AppShell />}>
            <Route index element={<Shield />} />
            <Route path="devices" element={<Devices />} />
            <Route path="devices/:id" element={<DeviceDetail />} />
            <Route path="signals" element={<Signals />} />
            <Route path="history" element={<History />} />
            <Route path="history/:id" element={<Incident />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
