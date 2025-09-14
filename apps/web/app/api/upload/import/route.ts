import { NextRequest, NextResponse } from 'next/server'
import { processAndSaveImage, generateImageId, ImageType } from '@/lib/upload-utils-server'
import path from 'path'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'

// Import an external image URL, save raw original and generate derivatives
export async function POST(request: NextRequest) {
  try {
    const { url, type }: { url?: string; type?: ImageType } = await request.json().catch(() => ({}))
    if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 })

    const imageType: ImageType = (['avatar', 'gallery', 'service', 'business'] as const).includes((type as any)) ? (type as ImageType) : 'gallery'

    // Basic URL validation
    let parsed: URL
    try { parsed = new URL(url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'URL must be http or https' }, { status: 400 })
    }

    // Fetch the remote image with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(parsed.toString(), { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return NextResponse.json({ error: `Failed to fetch: ${res.status}` }, { status: 400 })

    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL is not an image' }, { status: 400 })
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine extension from content-type or fallback by path
    const extFromType = contentType.split('/')[1]?.split(';')[0] || ''
    let ext = extFromType || path.extname(parsed.pathname).replace('.', '') || 'jpg'
    if (ext === 'jpeg') ext = 'jpg'

    const id = generateImageId(imageType === 'avatar' ? 'staff' : imageType)

    // Resolve public dir (same logic as upload-utils-server)
    const appPublic = path.join(process.cwd(), 'apps', 'web', 'public')
    const rootPublic = path.join(process.cwd(), 'public')
    const basePublic = existsSync(appPublic) ? appPublic : (existsSync(rootPublic) ? rootPublic : appPublic)
    const folder = imageType === 'avatar' ? 'avatars' : imageType
    const publicDir = path.join(basePublic, folder)
    if (!existsSync(publicDir)) await mkdir(publicDir, { recursive: true })

    // Save raw original without recompression
    const originalFilename = `${id}_original.${ext}`
    const originalPath = path.join(publicDir, originalFilename)
    await writeFile(originalPath, buffer)

    // Generate derivatives (and also the webp original as implemented there)
    await processAndSaveImage(buffer, id, imageType)

    // Default URL to 800w variant for gallery
    const defaultSizeMap: Record<ImageType, number> = {
      avatar: 256,
      gallery: 800,
      service: 400,
      business: 600,
    }
    const size = defaultSizeMap[imageType]
    const defaultUrl = `/${folder}/${id}_${size}.webp`

    return NextResponse.json({
      success: true,
      imageId: id,
      url: defaultUrl,
      original: `/${folder}/${originalFilename}`,
      contentType,
      bytes: buffer.length,
    })
  } catch (e: any) {
    const message = e?.name === 'AbortError' ? 'Fetch timed out' : 'Failed to import image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

