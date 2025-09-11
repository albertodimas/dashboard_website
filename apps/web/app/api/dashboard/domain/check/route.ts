import { NextRequest, NextResponse } from 'next/server'

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

    // Future: perform DNS lookups (A/CNAME) to verify mapping
    // Keeping it as a soft validation for now
    return NextResponse.json({
      valid: true,
      verification: {
        method: 'DNS',
        instructions: [
          'Create a CNAME record pointing your custom domain to your app domain (e.g., app.yourdomain.com).',
          'Alternatively, configure an A/ALIAS record once static IP is available.',
          'After DNS propagation, save the custom domain here and we will verify ownership.'
        ]
      }
    })
  } catch {
    return NextResponse.json({ valid: false, reason: 'error' }, { status: 500 })
  }
}

