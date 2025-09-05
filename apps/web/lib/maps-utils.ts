/**
 * Generate a Google Maps URL for directions to a specific address
 * @param address - Street address
 * @param city - City name
 * @param state - State/Province
 * @param country - Country (optional)
 * @returns Google Maps URL for directions
 */
export function getGoogleMapsDirectionsUrl(
  address: string,
  city?: string,
  state?: string,
  country?: string
): string {
  // Build the full address string
  const parts = [address, city, state, country].filter(Boolean)
  const fullAddress = parts.join(', ')
  
  // Encode the address for URL
  const encodedAddress = encodeURIComponent(fullAddress)
  
  // Return Google Maps directions URL
  // This will open with directions from user's current location to the destination
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
}

/**
 * Generate a Google Maps URL to show a location
 * @param address - Street address
 * @param city - City name
 * @param state - State/Province
 * @param country - Country (optional)
 * @returns Google Maps URL to view location
 */
export function getGoogleMapsLocationUrl(
  address: string,
  city?: string,
  state?: string,
  country?: string
): string {
  const parts = [address, city, state, country].filter(Boolean)
  const fullAddress = parts.join(', ')
  const encodedAddress = encodeURIComponent(fullAddress)
  
  // Return Google Maps search URL
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
}

/**
 * Generate a Google Maps embed URL for iframe
 * @param address - Street address
 * @param city - City name
 * @param state - State/Province
 * @param country - Country (optional)
 * @returns Google Maps embed URL
 */
export function getGoogleMapsEmbedUrl(
  address: string,
  city?: string,
  state?: string,
  country?: string
): string {
  const parts = [address, city, state, country].filter(Boolean)
  const fullAddress = parts.join(', ')
  const encodedAddress = encodeURIComponent(fullAddress)
  
  // Return Google Maps embed URL (requires API key for production use)
  return `https://www.google.com/maps/embed/v1/place?q=${encodedAddress}&key=YOUR_API_KEY`
}