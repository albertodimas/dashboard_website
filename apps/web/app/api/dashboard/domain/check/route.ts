import { NextRequest, NextResponse } from 'next/server'
import dns from 'node:dns/promises'

export const dynamic = 'force-dynamic'

function isValidDomain(domain: string) {
  // Basic FQDN validation (no protocol, no path)
  // allows subdomains: foo.bar.com
  const fqdn = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
  return fqdn.test(domain)
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const domain = (url.searchParams.get('domain') || '').trim().toLowerCase()
    if (!domain) return NextResponse.json({ valid: false, reason: 'empty' })

    if (!isValidDomain(domain)) {
      return NextResponse.json({ valid: false, reason: 'format', message: 'Invalid domain format' })
    }

    // Optional DNS verification behind a feature flag
    const enabled = /^(1|true|yes)$/i.test(process.env.DNS_VERIFY_ENABLED || '')

    if (!enabled) {
      // Soft validation (existing behavior)
      return NextResponse.json({
        valid: true,
        verification: {
          method: 'DNS',
          enabled: false,
          instructions: [
            'Create a CNAME record pointing your custom domain to your app domain (e.g., app.example.com).',
            'Alternatively, configure an A/ALIAS record once a static IP is available.',
            'After DNS propagation, save the custom domain here and we will verify ownership.'
          ]
        }
      })
    }

    // Real DNS checks
    const targetCname = (process.env.DNS_VERIFY_TARGET_CNAME || '').trim().toLowerCase() || undefined
    const targetIps = (process.env.DNS_VERIFY_TARGET_IPS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    let cnameRecords: string[] = []
    let aRecords: string[] = []
    let aaaaRecords: string[] = []

    try {
      cnameRecords = (await dns.resolveCname(domain)).map(s => s.toLowerCase())
    } catch {}
    try {
      aRecords = await dns.resolve4(domain)
    } catch {}
    try {
      aaaaRecords = await dns.resolve6(domain)
    } catch {}

    const matchesCname = targetCname
      ? cnameRecords.some(c => c === targetCname || c.endsWith(`.${targetCname}`))
      : false
    const matchesIp = targetIps.length > 0
      ? aRecords.some(ip => targetIps.includes(ip))
      : false

    const verified = Boolean(matchesCname || matchesIp)

    return NextResponse.json({
      valid: true,
      verification: {
        method: 'DNS',
        enabled: true,
        verified,
        records: {
          cname: cnameRecords,
          a: aRecords,
          aaaa: aaaaRecords,
        },
        target: {
          ...(targetCname ? { cname: targetCname } : {}),
          ...(targetIps.length ? { ips: targetIps } : {}),
        },
        message: verified
          ? 'DNS is correctly configured.'
          : 'DNS records found. Configure to match target to verify ownership.'
      }
    })
  } catch {
    return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 })
  }
}
