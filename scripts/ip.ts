/**
 * Prints the LAN addresses to open on a phone, so nobody has to go digging
 * through system settings to find them.
 */
import { networkInterfaces } from 'node:os'

const addresses: string[] = []

for (const [name, nets] of Object.entries(networkInterfaces())) {
  for (const net of nets ?? []) {
    if (net.family !== 'IPv4' || net.internal) continue
    addresses.push(`${net.address}  (${name})`)
  }
}

if (addresses.length === 0) {
  console.log('No LAN address found — are you connected to Wi-Fi?')
} else {
  console.log('Open one of these on your phone (same Wi-Fi network):\n')
  for (const a of addresses) {
    const ip = a.split(' ')[0]
    console.log(`  https://${ip}:5173      ${a.replace(ip, '').trim()}`)
  }
  console.log('\nUse `bun run dev:https` so geolocation and voice search work.')
}
