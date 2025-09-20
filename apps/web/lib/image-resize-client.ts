import { logger } from './logger'
/**
 * Utilidades para redimensionar y comprimir imágenes en el cliente
 * antes de subirlas al servidor
 */

/**
 * Redimensiona una imagen manteniendo su proporción
 * @param file - Archivo de imagen original
 * @param maxWidth - Ancho máximo (por defecto 1920px)
 * @param maxHeight - Alto máximo (por defecto 1920px)
 * @param quality - Calidad de compresión (0.0 - 1.0)
 * @returns Promise con el Blob de la imagen redimensionada
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calcular las dimensiones finales manteniendo la proporción
        let width = img.width
        let height = img.height
        
        // Solo redimensionar si es necesario
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height
          
          if (width > height) {
            width = Math.min(width, maxWidth)
            height = width / aspectRatio
          } else {
            height = Math.min(height, maxHeight)
            width = height * aspectRatio
          }
        }
        
        // Crear canvas y redimensionar
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Dibujar la imagen redimensionada
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Could not convert canvas to blob'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('Could not load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Could not read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Comprime una imagen hasta que esté por debajo del tamaño máximo
 * @param file - Archivo de imagen original
 * @param maxSizeMB - Tamaño máximo en MB (por defecto 5MB)
 * @returns Promise con el File de la imagen comprimida
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 5
): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  // Si el archivo ya es pequeño, devolverlo tal cual
  if (file.size <= maxSizeBytes) {
    return file
  }
  
  let quality = 0.9
  let compressedBlob: Blob = file
  let attempts = 0
  const maxAttempts = 10
  
  // Intentar comprimir con diferentes niveles de calidad
  while (compressedBlob.size > maxSizeBytes && quality > 0.1 && attempts < maxAttempts) {
    try {
      // Redimensionar con la calidad actual
      compressedBlob = await resizeImage(
        file,
        1920, // Máximo ancho
        1920, // Máximo alto
        quality
      )
      
      // Si aún es muy grande, reducir más la calidad
      if (compressedBlob.size > maxSizeBytes) {
        quality -= 0.1
      }
      
      attempts++
    } catch (error) {
      logger.error('Error compressing image:', error)
      break
    }
  }
  
  // Si después de comprimir sigue siendo muy grande, redimensionar más agresivamente
  if (compressedBlob.size > maxSizeBytes) {
    try {
      compressedBlob = await resizeImage(
        file,
        1200, // Reducir el tamaño máximo
        1200,
        0.7   // Calidad más baja
      )
    } catch (error) {
      logger.error('Error in aggressive compression:', error)
    }
  }
  
  // Crear un nuevo File con el blob comprimido
  return new File(
    [compressedBlob],
    file.name,
    { type: 'image/jpeg', lastModified: Date.now() }
  )
}

/**
 * Obtiene las dimensiones de una imagen
 * @param file - Archivo de imagen
 * @returns Promise con las dimensiones {width, height}
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        })
      }
      
      img.onerror = () => {
        reject(new Error('Could not load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Could not read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Convierte bytes a una cadena legible (KB, MB, etc.)
 * @param bytes - Número de bytes
 * @returns Cadena formateada
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}