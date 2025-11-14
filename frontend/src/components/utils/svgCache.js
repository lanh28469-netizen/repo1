/**
 * Utility functions for caching SVG content using Cache Storage API
 */

const CACHE_NAME = 'vietnam-map-svg-cache';
const SVG_URL = '/vietnam_map_detailed.svg';

/**
 * Open the cache and return the cache object
 * @returns {Promise<Cache>} Cache object
 */
const openCache = async () => {
  try {
    return await caches.open(CACHE_NAME);
  } catch (error) {
    console.error('Error opening cache:', error);
    throw error;
  }
};

/**
 * Check if SVG is already cached
 * @returns {Promise<boolean>} True if SVG is cached
 */
export const isSVGCached = async () => {
  try {
    const cache = await openCache();
    const cached = await cache.match(SVG_URL);
    return cached !== undefined;
  } catch (error) {
    console.error('Error checking if SVG is cached:', error);
    return false;
  }
};

/**
 * Get cached SVG content from Cache Storage
 * @returns {Promise<string|null>} Cached SVG content or null if not found
 */
export const getCachedSVG = async () => {
  try {
    const cache = await openCache();
    const cachedResponse = await cache.match(SVG_URL);
    
    if (cachedResponse) {
      const svgContent = await cachedResponse.text();
      return svgContent;
    }
    return null;
  } catch (error) {
    console.error('Error reading cached SVG:', error);
    return null;
  }
};

/**
 * Cache SVG content using Cache Storage API
 * @param {string} svgContent - The SVG content to cache
 */
export const cacheSVG = async (svgContent) => {
  try {
    const cache = await openCache();
    const response = new Response(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
      }
    });
    await cache.put(SVG_URL, response);
    console.log('SVG content cached successfully in Cache Storage');
  } catch (error) {
    console.error('Error caching SVG:', error);
  }
};

/**
 * Load SVG content from URL and cache it using Cache Storage
 * @param {string} svgPath - Path to the SVG file
 * @returns {Promise<string>} SVG content
 */
export const loadAndCacheSVG = async (svgPath) => {
  // First check if we have cached content in Cache Storage
  const cachedContent = await getCachedSVG();
  if (cachedContent) {
    return cachedContent;
  }

  try {
    console.log('Loading SVG from URL:', svgPath);
    const response = await fetch(svgPath);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.status}`);
    }
    
    const svgContent = await response.text();
    
    // Cache the content for future use using Cache Storage API
    await cacheSVG(svgContent);
    
    return svgContent;
  } catch (error) {
    console.error('Error loading SVG:', error);
    throw error;
  }
};

/**
 * Clear SVG cache from Cache Storage
 */
export const clearSVGCache = async () => {
  try {
    const cache = await openCache();
    await cache.delete(SVG_URL);
    console.log('SVG cache cleared from Cache Storage');
  } catch (error) {
    console.error('Error clearing SVG cache:', error);
  }
};

/**
 * Get cache info (for debugging)
 * @returns {Promise<object|null>} Cache info or null if no cache
 */
export const getCacheInfo = async () => {
  try {
    const cache = await openCache();
    const cached = await cache.match(SVG_URL);
    
    if (cached) {
      const headers = cached.headers;
      const dateHeader = headers.get('date') || headers.get('last-modified');
      const contentLength = headers.get('content-length');
      
      return {
        cached: true,
        url: SVG_URL,
        date: dateHeader,
        size: contentLength,
        cacheName: CACHE_NAME
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting cache info:', error);
    return null;
  }
};

/**
 * Get cache size in bytes
 * @returns {Promise<number>} Cache size in bytes
 */
export const getCacheSize = async () => {
  try {
    const cache = await openCache();
    const cached = await cache.match(SVG_URL);
    
    if (cached) {
      const text = await cached.text();
      return new Blob([text]).size;
    }
    return 0;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

/**
 * Delete the entire SVG cache
 */
export const deleteSVGCache = async () => {
  try {
    const deleted = await caches.delete(CACHE_NAME);
    console.log('SVG cache deleted:', deleted);
    return deleted;
  } catch (error) {
    console.error('Error deleting SVG cache:', error);
    return false;
  }
};
