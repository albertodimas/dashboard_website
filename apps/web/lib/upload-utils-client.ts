// Utilidades de imágenes para el cliente (sin módulos de Node.js)

export type ImageType = 'avatar' | 'gallery' | 'service' | 'business'

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

  const sizes = {
    avatar: [128, 256, 512],
    gallery: [400, 800, 1200],
    service: [200, 400, 600],
    business: [300, 600, 900]
  }

  // Encontrar el tamaño más cercano disponible
  const availableSizes = sizes[type]
  const closestSize = availableSizes.reduce((prev, curr) => 
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

  const sizes = {
    avatar: [128, 256, 512],
    gallery: [400, 800, 1200],
    service: [200, 400, 600],
    business: [300, 600, 900]
  }

  const availableSizes = sizes[type]
  const folder = type === 'avatar' ? 'avatars' : type
  
  return availableSizes
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
 * Genera un ID único para una imagen
 * @param prefix - Prefijo para el ID
 * @returns ID único
 */
export function generateImageId(prefix: string = 'img'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}_${timestamp}_${random}`
}