import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness } from '@/lib/auth-utils'

const RESERVED = new Set([
  'login','register','dashboard','api','admin','auth','business','settings','profile','logout','signup','signin',
  'forgot-password','reset-password','verify','confirm','public','static','_next','favicon.ico','robots.txt',
  'sitemap.xml','cliente','client','book','directory','assets','images','css','js','fonts'
])

function cleanSlug(input: string): string {
  return input.trim().replace(/^\/+|\/+$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const raw = searchParams.get('slug') || ''
    const slug = cleanSlug(raw)
    if (!slug) return NextResponse.json({ available: true, suggestion: null })

    // basic validation
    if (!/^[a-zA-Z0-9\-\/]+$/.test(slug) || slug.includes('//')) {
      return NextResponse.json({ available: false, reason: 'invalid', message: 'Only letters, numbers, hyphens and slashes; no //', suggestion: null })
    }
    const first = slug.split('/')[0].toLowerCase()
    if (RESERVED.has(first)) {
      return NextResponse.json({ available: false, reason: 'reserved', message: `Reserved path: ${first}`, suggestion: `${first}-1` })
    }

    const currentBiz = await getCurrentBusiness().catch(() => null)
    const existing = await prisma.business.findFirst({
      where: {
        customSlug: slug,
        ...(currentBiz ? { NOT: { id: currentBiz.id } } : {})
      },
      select: { id: true }
    })
    if (!existing) return NextResponse.json({ available: true, suggestion: null })

    // suggest a free one
    const base = slug
    for (let i = 1; i < 100; i++) {
      const candidate = `${base}-${i}`
      const exists = await prisma.business.findFirst({ where: { customSlug: candidate }, select: { id: true } })
      if (!exists) {
        return NextResponse.json({ available: false, suggestion: candidate })
      }
    }
    return NextResponse.json({ available: false, suggestion: null })
  } catch (e) {
    return NextResponse.json({ available: false, error: 'check-failed' }, { status: 500 })
  }
}

