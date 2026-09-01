import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { startTelemetry } from '@/engine/store'
import { AppShell } from '@/app/AppShell'
import { Shield } from '@/app/screens/Shield'

const Devices = lazy(() => import('@/app/screens/Devices'))
const History = lazy(() => import('@/app/screens/History'))
const Settings = lazy(() => import('@/app/screens/Settings'))

function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
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
          <Route path="/" element={<AppShell />}>
            <Route index element={<Shield />} />
            <Route path="devices" element={<Devices />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
