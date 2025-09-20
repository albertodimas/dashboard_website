import { logger } from './logger'
// Utilidades de upload para el servidor (con módulos de Node.js)
import sharp from 'sharp'
import { mkdir, rm } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export type ImageType = 'avatar' | 'gallery' | 'service' | 'business'

// Configuración de tamaños por tipo de imagen
const IMAGE_SIZES = {
  avatar: [128, 256, 512],
  gallery: [400, 800, 1200],
  service: [200, 400, 600],
  business: [300, 600, 900]
}

// Calidad de compresión por tipo
const QUALITY_SETTINGS = {
  avatar: 85,
  gallery: 90,
  service: 85,
  business: 88
}

/**
 * Procesa y guarda una imagen en múltiples tamaños
 * @param file - Archivo de imagen (Buffer o base64)
 * @param id - ID único para la imagen
 * @param type - Tipo de imagen
 * @returns Path relativo de la imagen (sin extensión ni tamaño)
 */
export async function processAndSaveImage(
  file: Buffer | string,
  id: string,
  type: ImageType = 'avatar'
): Promise<string> {
  try {
    const safeId = id.replace(/[^A-Za-z0-9_-]/g, '') || generateImageId(type === 'avatar' ? 'staff' : type)
    const safeType: ImageType = (['avatar', 'gallery', 'service', 'business'] as const).includes(type) ? type : 'avatar'
    
    // Convertir base64 a Buffer si es necesario
    const buffer = typeof file === 'string' 
      ? Buffer.from(file.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      : file

    logger.info('Buffer size:', buffer.length)

    // Obtener configuración según el tipo
    const sizes = IMAGE_SIZES[safeType]
    const quality = QUALITY_SETTINGS[safeType]
    
    // Resolver ruta de public de forma robusta en monorepo:
    // 1) apps/web/public (preferida), 2) ./public si existe
    const appPublic = path.join(process.cwd(), 'apps', 'web', 'public')
    const rootPublic = path.join(process.cwd(), 'public')
    const basePublic = existsSync(appPublic) ? appPublic : (existsSync(rootPublic) ? rootPublic : appPublic)
    const publicDir = path.join(basePublic, safeType === 'avatar' ? 'avatars' : safeType)
    // Cleanup legacy directories created by incorrect Windows paths
    for (const legacy of ['D:dashboard_websiteappswebpublicavatars', 'D:dashboard_websiteappswebpublicgallery', 'D:dashboard_websiteappswebpublicservices', 'D:dashboard_websiteappswebpublicbusiness']) {
      const abs = path.join(process.cwd(), legacy)
      if (existsSync(abs)) {
        await rm(abs, { recursive: true, force: true })
      }
    }
    
    if (!existsSync(publicDir)) {
      logger.info('Creating directory:', publicDir)
      await mkdir(publicDir, { recursive: true })
    }

    // Procesar cada tamaño
    const promises = sizes.map(async (size) => {
      const filename = `${safeId}_${size}.webp`
      const filepath = path.join(publicDir, filename)
      
      logger.info('Processing size:', size, 'to file:', filepath)
      
      await sharp(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toFile(filepath)
      
      logger.info('Successfully created:', filepath)
    })

    // También guardar el original optimizado
    const originalFilename = `${safeId}_original.webp`
    const originalPath = path.join(publicDir, originalFilename)
    
    await sharp(buffer)
      .webp({ quality: 95 })
      .toFile(originalPath)

    await Promise.all(promises)
    
    // Retornar solo el ID (sin extensión)
    return safeId
  } catch (error) {
    logger.error('Error processing image:', error)
    throw new Error('Failed to process image')
  }
}

/**
 * Genera un ID único para una imagen
 * @param prefix - Prefijo para el ID
 * @returns ID único
 */
export function generateImageId(prefix: string = 'img'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}_${random}`
}
