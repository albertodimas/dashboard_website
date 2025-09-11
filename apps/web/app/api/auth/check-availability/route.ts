import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || undefined
    const subdomain = searchParams.get('subdomain') || undefined

    let emailAvailable: boolean | undefined
    let subdomainAvailable: boolean | undefined

    if (email) {
      const exists = await prisma.user.findFirst({ where: { email } })
      emailAvailable = !exists
    }

    if (subdomain) {
      const exists = await prisma.tenant.findFirst({ where: { subdomain } })
      subdomainAvailable = !exists
    }

    // Suggest a subdomain if taken
    let suggestion: string | undefined
    if (subdomain && subdomainAvailable === false) {
      for (let i = 1; i <= 99; i++) {
        const candidate = `${subdomain}-${i}`
        const exists = await prisma.tenant.findFirst({ where: { subdomain: candidate } })
        if (!exists) { suggestion = candidate; break }
      }
    }

    return NextResponse.json({
      success: true,
      emailAvailable,
      subdomainAvailable,
      suggestion
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to check availability' }, { status: 500 })
  }
}

