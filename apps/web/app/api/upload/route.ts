import { NextRequest, NextResponse } from 'next/server'
import { processAndSaveImage, generateImageId, ImageType } from '@/lib/upload-utils-server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = (formData.get('type') as ImageType) || 'avatar'
    const id = formData.get('id') as string // ID existente (para actualizar)
    
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

    // Convertir el archivo a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generar ID único o usar el existente
    const imageId = id || generateImageId(type === 'avatar' ? 'staff' : type)

    // Procesar y guardar la imagen
    const savedId = await processAndSaveImage(buffer, imageId, type)

    return NextResponse.json({
      success: true,
      imageId: savedId,
      url: `/${type === 'avatar' ? 'avatars' : type}/${savedId}_256.webp`
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