/**
 * Utility functions for formatting values consistently across the application
 */

/**
 * Format a price value to always show 2 decimal places
 * @param price - The price value to format
 * @returns Formatted price string with 2 decimal places
 */
export function formatPrice(price: number | string | undefined | null): string {
  if (price === undefined || price === null) {
    return '0.00';
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0.00';
  }
  
  return numPrice.toFixed(2);
}

/**
 * Format a discount percentage to always show as an integer
 * @param discount - The discount percentage to format
 * @returns Formatted discount as an integer
 */
export function formatDiscount(discount: number | string | undefined | null): number {
  if (discount === undefined || discount === null) {
    return 0;
  }
  
  const numDiscount = typeof discount === 'string' ? parseFloat(discount) : discount;
  
  if (isNaN(numDiscount)) {
    return 0;
  }
  
  return Math.round(Math.max(0, Math.min(100, numDiscount)));
}

/**
 * Format currency with dollar sign and 2 decimal places
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  return `$${formatPrice(amount)}`;
}