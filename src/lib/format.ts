/* Small, dependency-free formatters. Every readout in the app goes through
   one of these so units and rounding stay consistent across 30+ screens. */

export function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Compact relative time: "now", "4m", "2h", "3d". */
export function ago(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 45) return 'now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.round(h / 24)}d`
}

/** "17 min", "1 h 04 m" — used where precision matters (tracker dwell time). */
export function duration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h) return `${h} h ${String(m).padStart(2, '0')} m`
  if (m) return `${m} min ${String(s).padStart(2, '0')} s`
  return `${s} s`
}

export function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function dayLabel(ts: number, now = Date.now()): string {
  const d = new Date(ts)
  const days = Math.floor((now - ts) / 86_400_000)
  if (days < 1) return 'Today'
  if (days < 2) return 'Yesterday'
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

/** RSSI → 0–4 bars. −40 is on top of you, −90 is a rumour. */
export function rssiBars(rssi: number): number {
  if (rssi >= -50) return 4
  if (rssi >= -62) return 3
  if (rssi >= -74) return 2
  if (rssi >= -85) return 1
  return 0
}

/** Free-space path loss, 2.4 GHz, tuned against the PG-1's antenna. */
export function rssiToMetres(rssi: number): number {
  const txPower = -40
  return Math.round(Math.pow(10, (txPower - rssi) / 20) * 10) / 10
}

export function proximityLabel(rssi: number): string {
  const m = rssiToMetres(rssi)
  if (m < 1) return 'within arm’s reach'
  if (m < 3) return `≈ ${m} m — same surface`
  if (m < 8) return `≈ ${m} m — same room`
  return `≈ ${m} m — beyond the wall`
}

export function throughput(kbps: number): string {
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`
  if (kbps < 1) return '—'
  return `${Math.round(kbps)} kbps`
}

export function pct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`
}

/** Groups a MAC for glanceability: OUI half rendered separately by the UI. */
export function splitMac(mac: string): [string, string] {
  if (mac.length < 17) return [mac, '']
  return [mac.slice(0, 8), mac.slice(9)]
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}
