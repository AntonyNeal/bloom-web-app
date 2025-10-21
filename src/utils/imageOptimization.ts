/**
 * Image Optimization Utilities
 * Safe performance optimizations for image loading
 */

/**
 * Get optimal image loading attributes based on position
 * @param priority - Whether image is above the fold (eager) or below (lazy)
 * @returns Object with loading, decoding, and fetchpriority attributes
 */
export function getImageLoadingProps(priority: 'high' | 'low' | 'auto' = 'auto') {
  return {
    // Native lazy loading for below-the-fold images
    loading: priority === 'high' ? 'eager' : 'lazy',
    
    // Async decoding prevents blocking main thread
    decoding: 'async',
    
    // Fetch priority hint for browsers that support it
    fetchpriority: priority,
  } as const;
}

/**
 * Preload critical images in head
 * Call this for hero images or LCP elements
 */
export function preloadImage(src: string, type: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg') {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.type = type;
  document.head.appendChild(link);
}

/**
 * Generate responsive image srcset
 * @param baseUrl - Base URL without size suffix
 * @param sizes - Array of widths to generate
 * @returns srcset string
 */
export function generateSrcSet(baseUrl: string, sizes: number[] = [320, 640, 960, 1280]) {
  return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
}
