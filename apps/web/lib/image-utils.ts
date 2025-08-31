/**
 * Utility functions for handling image URLs from various sources
 */

/**
 * Converts a Google Drive sharing URL to a direct image URL
 * Example input: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 * Example output: https://drive.google.com/uc?export=view&id=FILE_ID
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return ''
  
  // Check if it's a Google Drive URL
  if (url.includes('drive.google.com')) {
    // Extract file ID from various Google Drive URL formats
    let fileId = ''
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileMatch) {
      fileId = fileMatch[1]
    }
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (openMatch) {
      fileId = openMatch[1]
    }
    
    // Format: https://drive.google.com/uc?id=FILE_ID or export=view&id=FILE_ID
    const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (ucMatch && url.includes('/uc')) {
      fileId = ucMatch[1]
    }
    
    // If we found a file ID, return the direct view URL
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`
    }
  }
  
  // Return original URL if not a Google Drive URL or couldn't parse
  return url
}

/**
 * Converts various image sharing service URLs to direct image URLs
 * Supports: Google Drive, Dropbox, OneDrive, etc.
 */
export function getDirectImageUrl(url: string): string {
  if (!url) return ''
  
  // Handle Google Drive URLs
  if (url.includes('drive.google.com')) {
    return convertGoogleDriveUrl(url)
  }
  
  // Handle Dropbox URLs
  if (url.includes('dropbox.com')) {
    // Change dl=0 to raw=1 for direct image access
    if (url.includes('dl=0')) {
      return url.replace('dl=0', 'raw=1')
    }
    // Add raw=1 if no parameter exists
    if (!url.includes('raw=1')) {
      return url.includes('?') ? `${url}&raw=1` : `${url}?raw=1`
    }
  }
  
  // Handle OneDrive URLs
  if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
    // OneDrive embed URLs can be used directly
    if (!url.includes('embed')) {
      return url.replace('/view', '/embed')
    }
  }
  
  // Return original URL for direct image URLs or unsupported services
  return url
}

/**
 * Validates if a URL points to an image
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i
  if (imageExtensions.test(url)) {
    return true
  }
  
  // Check for known image hosting services
  const imageServices = [
    'drive.google.com',
    'dropbox.com',
    '1drv.ms',
    'onedrive.live.com',
    'imgur.com',
    'cloudinary.com',
    'unsplash.com',
    'pexels.com'
  ]
  
  return imageServices.some(service => url.includes(service))
}

/**
 * Gets a placeholder image URL for when no image is provided
 */
export function getPlaceholderImage(type: 'avatar' | 'business' | 'service' = 'avatar'): string {
  const placeholders = {
    avatar: 'https://ui-avatars.com/api/?background=6366f1&color=fff&name=Staff+Member',
    business: 'https://via.placeholder.com/400x200/6366f1/ffffff?text=Business',
    service: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Service'
  }
  
  return placeholders[type]
}