/* ============================================================================
   OUI SEED TABLE
   ----------------------------------------------------------------------------
   Ships with the app so a first scan works offline. In production this file is
   generated from the IEEE MA-L registry (standards-oui.ieee.org/oui/oui.csv)
   and delivered as a compressed binary blob to the glasses' SPIFFS partition.
   Camera-vendor classification below is the curated subset that matters.
   ========================================================================== */

export interface OuiEntry {
  oui: string
  vendor: string
  category: 'camera' | 'tracker' | 'network' | 'consumer' | 'iot'
}

export const OUI_TABLE: OuiEntry[] = [
  // — Surveillance / IP camera vendors ————————————————————————————
  { oui: 'FC:2F:40', vendor: 'Dahua Technology', category: 'camera' },
  { oui: '4C:11:BF', vendor: 'Dahua Technology', category: 'camera' },
  { oui: 'D8:A0:1D', vendor: 'Hikvision', category: 'camera' },
  { oui: '44:19:B6', vendor: 'Hikvision', category: 'camera' },
  { oui: 'C0:56:E3', vendor: 'Hikvision', category: 'camera' },
  { oui: '00:12:16', vendor: 'XiongMai Technology', category: 'camera' },
  { oui: 'A4:14:37', vendor: 'Hangzhou Hikvision', category: 'camera' },
  { oui: '2C:AA:8E', vendor: 'Wyze Labs', category: 'camera' },
  { oui: '7C:78:B2', vendor: 'Wyze Labs', category: 'camera' },
  { oui: '9C:A3:A9', vendor: 'IMOU / Lechange', category: 'camera' },
  { oui: '50:C7:BF', vendor: 'TP-Link Tapo', category: 'camera' },
  { oui: 'B0:C5:54', vendor: 'D-Link Camera', category: 'camera' },
  { oui: '78:11:DC', vendor: 'Xiaomi Mijia Cam', category: 'camera' },
  { oui: 'E0:62:67', vendor: 'ESP32-CAM module', category: 'camera' },

  // — Trackers ————————————————————————————————————————————————————
  { oui: '00:04:C0', vendor: 'Apple FindMy', category: 'tracker' },
  { oui: 'D0:03:4B', vendor: 'Apple AirTag', category: 'tracker' },
  { oui: '90:8C:43', vendor: 'Tile Inc.', category: 'tracker' },
  { oui: 'F4:0E:11', vendor: 'Chipolo', category: 'tracker' },
  { oui: '68:6E:F9', vendor: 'Samsung SmartTag', category: 'tracker' },
  { oui: 'FF:FF:00', vendor: 'iTAG (unbranded)', category: 'tracker' },

  // — Everyday radios, for contrast ————————————————————————————————
  { oui: 'A4:83:E7', vendor: 'Apple, Inc.', category: 'consumer' },
  { oui: 'DC:A6:32', vendor: 'Raspberry Pi Trading', category: 'iot' },
  { oui: 'B8:27:EB', vendor: 'Raspberry Pi Foundation', category: 'iot' },
  { oui: 'AC:84:C6', vendor: 'TP-Link Router', category: 'network' },
  { oui: '30:B5:C2', vendor: 'TP-Link Router', category: 'network' },
  { oui: 'C8:3A:35', vendor: 'Tenda Technology', category: 'network' },
  { oui: '5C:A6:E6', vendor: 'Samsung Electronics', category: 'consumer' },
  { oui: '3C:5C:C4', vendor: 'Amazon Technologies', category: 'iot' },
  { oui: '00:1A:11', vendor: 'Google, Inc.', category: 'iot' },
  { oui: 'F0:B4:29', vendor: 'Xiaomi Communications', category: 'consumer' },
  { oui: '88:36:6C', vendor: 'OnePlus Technology', category: 'consumer' },
  { oui: '2C:F0:5D', vendor: 'Micro-Star INTL', category: 'consumer' },
  { oui: '48:E1:5C', vendor: 'Realme Chongqing', category: 'consumer' },
  { oui: 'E4:5F:01', vendor: 'Sonoff / ITEAD', category: 'iot' },
]

const INDEX = new Map(OUI_TABLE.map((e) => [e.oui, e]))

export function lookupOui(mac: string): OuiEntry | null {
  return INDEX.get(mac.slice(0, 8).toUpperCase()) ?? null
}

export const CAMERA_OUIS = OUI_TABLE.filter((e) => e.category === 'camera')
export const TRACKER_OUIS = OUI_TABLE.filter((e) => e.category === 'tracker')

/** Locally-administered bit set ⇒ the OS randomised this address. */
export function isRandomisedMac(mac: string): boolean {
  const firstOctet = parseInt(mac.slice(0, 2), 16)
  return Boolean(firstOctet & 0b10)
}
