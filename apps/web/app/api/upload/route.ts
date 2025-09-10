import { NextRequest, NextResponse } from 'next/server'
import { processAndSaveImage, generateImageId, ImageType } from '@/lib/upload-utils-server'
import { getAuthFromCookie } from '@/lib/jwt-auth'
import { verifyClientToken } from '@/lib/client-auth'
import { getClientIP, limitByIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP to avoid abuse (20 uploads / 10 minutes)
    const ip = getClientIP(request)
    const rate = await limitByIP(ip, 'upload:image', 20, 60 * 10)
    if (!rate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many uploads', retryAfter: rate.retryAfterSec }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rate.retryAfterSec || 600) } }
      )
    }

    // Require authentication: either app user (auth-token) or client (client-token)
    const userSession = await getAuthFromCookie()
    const clientToken = request.cookies.get('client-token')?.value
    const clientSession = clientToken ? await verifyClientToken(clientToken) : null
    if (!userSession && !clientSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = (formData.get('type') as ImageType) || 'avatar'
    let id = formData.get('id') as string // ID existente (para actualizar)
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validar el archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Límite de tamaño: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Validar y sanear tipo e id
    const allowedTypes: ImageType[] = ['avatar', 'gallery', 'service', 'business']
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }
    const idPattern = /^[A-Za-z0-9_-]+$/
    if (id && !idPattern.test(id)) {
      id = ''
    }

    // Convertir el archivo a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generar ID único o usar el existente
    const imageId = id || generateImageId(type === 'avatar' ? 'staff' : type)

    // Procesar y guardar la imagen
    const savedId = await processAndSaveImage(buffer, imageId, type)

    // Pick a default size per type that actually exists
    const sizeMap: Record<ImageType, number> = {
      avatar: 256,
      gallery: 800,
      service: 400,
      business: 600,
    }
    const defaultSize = sizeMap[type]

    return NextResponse.json({
      success: true,
      imageId: savedId,
      url: `/${type === 'avatar' ? 'avatars' : type}/${savedId}_` + defaultSize + `.webp`
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

// Configuración para Next.js
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
