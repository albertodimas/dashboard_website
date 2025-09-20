import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getClientIP, limitByIP } from '@/lib/rate-limit'
import { verifyCode as verifyCodeRedis, clearCode as clearCodeRedis, getData as getCodeData } from '@/lib/verification-redis'
import { generateClientToken } from '@/lib/client-auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const schema = z.object({
      email: z.string().email(),
      code: z.string().min(4).max(12),
    })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Peticion invalida', details: parsed.error.flatten() }, { status: 400 })
    }
    const { email, code } = parsed.data

    // Rate limit by IP (5 attempts / 10 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'cliente:verify-code', 5, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiados intentos. Intenta mas tarde', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }

    // Verify code in Redis
    const valid = await verifyCodeRedis(email, code)
    if (!valid) {
      return NextResponse.json(
        { error: 'Codigo invalido o expirado' },
        { status: 400 }
      )
    }

    // Fetch registration data (if provided at send-verification)
    const reg = await getCodeData<{ name?: string; password?: string; phone?: string }>(email)
    const hashedPassword = reg?.password ? await bcrypt.hash(reg.password, 10) : undefined

    // Check if customer exists
    let customer = await prisma.customer.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (customer) {
      // Update existing customer
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ...(hashedPassword ? { password: hashedPassword } : {}),
          ...(reg?.name ? { name: reg.name } : {}),
          ...(reg?.phone ? { phone: reg.phone } : {}),
          emailVerified: true
        }
      })
    } else {
      // Create new customer only if we have required data
      if (!reg?.name || !hashedPassword) {
        return NextResponse.json(
          { error: 'Registro incompleto. Reenvia el codigo y completa el formulario.' },
          { status: 400 }
        )
      }
      const defaultTenant = await prisma.tenant.findFirst()
      if (!defaultTenant) {
        return NextResponse.json(
          { error: 'Error de configuracion del sistema' },
          { status: 500 }
        )
      }
      customer = await prisma.customer.create({
        data: {
          tenantId: defaultTenant.id,
          email: email.toLowerCase(),
          name: reg.name,
          phone: reg.phone,
          password: hashedPassword,
          emailVerified: true,
          source: 'PORTAL'
        }
      })
    }

    // Clear verification code + data
    await clearCodeRedis(email)

    // Get customer's packages and appointments
    const packages = await prisma.packagePurchase.findMany({
      where: {
        customerId: customer.id,
        status: 'ACTIVE',
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
      },
      include: {
        package: {
          include: {
            business: { select: { name: true, slug: true } },
            services: { include: { service: { select: { name: true, duration: true, price: true } } } }
          }
        }
      }
    })

    const appointments = await prisma.appointment.findMany({
      where: { customerId: customer.id, startTime: { gte: new Date() } },
      include: {
        service: { select: { name: true, duration: true } },
        business: { select: { name: true } },
        staff: { select: { name: true } }
      },
      orderBy: { startTime: 'asc' },
      take: 10
    })

    // Generate client token
    const token = await generateClientToken({
      customerId: customer.id,
      email: customer.email,
      name: customer.name
    })

    // Upsert relación con negocio referido si aplica + limpiar unregisteredBusinesses
    try {
      const referringCookie = request.cookies.get('referring-business')?.value
      let referringBusinessId = referringCookie
      if (!referringBusinessId) {
        const referer = request.headers.get('referer') || ''
        const match = referer.match(/\/(business|b)\/([^\/?#]+)/) || referer.match(/^https?:\/\/[^\/]+\/([^\/?#]+)/)
        const slug = match && match[2] ? match[2] : (match && match[1] ? match[1] : '')
        if (slug) {
          const biz = await prisma.business.findFirst({ where: { OR: [{ slug }, { customSlug: slug }] }, select: { id: true } })
          referringBusinessId = biz?.id
        }
      }
      if (referringBusinessId) {
        const existingRelation = await prisma.businessCustomer.findUnique({
          where: { businessId_customerId: { businessId: referringBusinessId, customerId: customer.id } }
        })
        if (!existingRelation) {
          await prisma.businessCustomer.create({ data: { businessId: referringBusinessId, customerId: customer.id, lastVisit: new Date(), totalVisits: 1 } })
        } else {
          await prisma.businessCustomer.update({
            where: { businessId_customerId: { businessId: referringBusinessId, customerId: customer.id } },
            data: { lastVisit: new Date(), totalVisits: { increment: 1 }, isActive: true }
          })
        }
        const current = await prisma.customer.findUnique({ where: { id: customer.id }, select: { metadata: true } })
        const meta: any = (current?.metadata as any) || {}
        const arr: string[] = Array.isArray(meta.unregisteredBusinesses) ? meta.unregisteredBusinesses : []
        if (arr.includes(referringBusinessId)) {
          const updated = arr.filter((id) => id !== referringBusinessId)
          await prisma.customer.update({ where: { id: customer.id }, data: { metadata: { ...meta, unregisteredBusinesses: updated } } })
        }
      }
    } catch (e) {
      logger.warn('[verify-code] No se pudo upsert relación referida:', e)
    }

    const response = NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
      packages,
      appointments,
      message: 'Email verificado exitosamente'
    })

    // Set cookie with client token (7d)
    response.cookies.set('client-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    return response
  } catch (error) {
    logger.error('Verify code error:', error)
    return NextResponse.json({ error: 'Error al verificar codigo' }, { status: 500 })
  }
}
