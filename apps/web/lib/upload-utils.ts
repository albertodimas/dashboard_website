// Solo importar sharp en el servidor
let sharp: any
if (typeof window === 'undefined') {
  sharp = require('sharp')
}

// Tipos de imágenes soportadas
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
  // Esta función solo debe ejecutarse en el servidor
  if (typeof window !== 'undefined') {
    throw new Error('processAndSaveImage can only be used on the server')
  }

  try {
    const path = require('path')
    const { existsSync } = require('fs')
    const { mkdir } = require('fs/promises')
    
    // Convertir base64 a Buffer si es necesario
    const buffer = typeof file === 'string' 
      ? Buffer.from(file.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      : file

    // Obtener configuración según el tipo
    const sizes = IMAGE_SIZES[type]
    const quality = QUALITY_SETTINGS[type]
    
    // Crear directorio si no existe
    const publicDir = path.join(process.cwd(), 'apps', 'web', 'public', type === 'avatar' ? 'avatars' : type)
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true })
    }

    // Procesar cada tamaño
    const promises = sizes.map(async (size: number) => {
      const filename = `${id}_${size}.webp`
      const filepath = path.join(publicDir, filename)
      
      await sharp(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toFile(filepath)
    })

    // También guardar el original optimizado
    const originalFilename = `${id}_original.webp`
    const originalPath = path.join(publicDir, originalFilename)
    
    await sharp(buffer)
      .webp({ quality: 95 })
      .toFile(originalPath)

    await Promise.all(promises)
    
    // Retornar solo el ID (sin extensión)
    return id
  } catch (error) {
    console.error('Error processing image:', error)
    throw new Error('Failed to process image')
  }
}

/**
 * Genera una URL de imagen con el tamaño apropiado
 * @param id - ID de la imagen
 * @param type - Tipo de imagen
 * @param size - Tamaño deseado (usar el más cercano disponible)
 * @returns URL completa de la imagen
 */
export function getImageUrl(
  id: string | null | undefined,
  type: ImageType = 'avatar',
  size: number = 256
): string {
  if (!id) {
    return getPlaceholderUrl(type)
  }

  // Encontrar el tamaño más cercano disponible
  const sizes = IMAGE_SIZES[type]
  const closestSize = sizes.reduce((prev, curr) => 
    Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
  )

  const folder = type === 'avatar' ? 'avatars' : type
  return `/${folder}/${id}_${closestSize}.webp`
}

/**
 * Genera un set de URLs para srcset
 * @param id - ID de la imagen
 * @param type - Tipo de imagen
 * @returns String para usar en srcset
 */
export function getImageSrcSet(
  id: string | null | undefined,
  type: ImageType = 'avatar'
): string {
  if (!id) return ''

  const sizes = IMAGE_SIZES[type]
  const folder = type === 'avatar' ? 'avatars' : type
  
  return sizes
    .map(size => `/${folder}/${id}_${size}.webp ${size}w`)
    .join(', ')
}

/**
 * Obtiene una URL de placeholder según el tipo
 */
export function getPlaceholderUrl(type: ImageType): string {
  const placeholders = {
    avatar: 'https://ui-avatars.com/api/?background=6366f1&color=fff&size=256&name=User',
    gallery: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="system-ui" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E',
    service: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="system-ui" font-size="18"%3EService%3C/text%3E%3C/svg%3E',
    business: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="system-ui" font-size="20"%3EBusiness%3C/text%3E%3C/svg%3E'
  }
  
  return placeholders[type]
}

/**
 * Elimina las imágenes de un ID específico
 * @param id - ID de las imágenes a eliminar
 * @param type - Tipo de imagen
 */
export async function deleteImages(
  id: string,
  type: ImageType = 'avatar'
): Promise<void> {
  // Esta función solo debe ejecutarse en el servidor
  if (typeof window !== 'undefined') {
    return
  }

  const path = require('path')
  const { unlink } = require('fs/promises')
  const sizes = IMAGE_SIZES[type]
  const folder = type === 'avatar' ? 'avatars' : type
  const publicDir = path.join(process.cwd(), 'apps', 'web', 'public', folder)
  
  const promises = [
    ...sizes.map((size: number) => 
      unlink(path.join(publicDir, `${id}_${size}.webp`)).catch(() => {})
    ),
    unlink(path.join(publicDir, `${id}_original.webp`)).catch(() => {})
  ]
  
  await Promise.all(promises)
}

/**
 * Valida que un archivo sea una imagen válida
 * @param file - Archivo a validar
 * @returns true si es válido
 */
export function validateImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.')
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 10MB.')
  }
  
  return true
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