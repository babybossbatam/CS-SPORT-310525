
// Global request cache for deduplication
interface CachedRequest {
  promise: Promise<Response>;
  timestamp: number;
}

const globalRequestCache = new Map<string, CachedRequest>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Cleanup expired cache entries
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, cached] of globalRequestCache.entries()) {
    if (now - cached.timestamp > CACHE_DURATION) {
      globalRequestCache.delete(key);
    }
  }
};

// Run cleanup every 60 seconds
setInterval(cleanupCache, 60 * 1000);

// API Service for making HTTP requests
export interface ApiRequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  skipDeduplication?: boolean;
}

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const { signal, headers = {}, skipDeduplication = false } = options;
  
  // Create cache key
  const cacheKey = `${method}:${url}`;
  
  // Check for existing request (only for GET requests and if deduplication is enabled)
  if (method === 'GET' && !skipDeduplication) {
    const cached = globalRequestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`🔄 [apiRequest] Using deduplicated request for: ${url}`);
      try {
        return await cached.promise;
      } catch (error) {
        // If cached request failed, remove from cache and continue with new request
        globalRequestCache.delete(cacheKey);
      }
    }
  }
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal,
  };

  const requestPromise = fetch(url, config).then(async (response) => {
    console.log(`📡 [apiRequest] Response status: ${response.status} for ${method} ${url}`);
    
    // Clone response for caching (response can only be read once)
    const clonedResponse = response.clone();
    
    // Remove from cache after completion
    setTimeout(() => {
      globalRequestCache.delete(cacheKey);
    }, 1000);
    
    return response;
  }).catch((error) => {
    // Remove from cache on error
    globalRequestCache.delete(cacheKey);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request was aborted');
    }
    throw error;
  });

  // Cache the request promise for deduplication (only for GET requests)
  if (method === 'GET' && !skipDeduplication) {
    globalRequestCache.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now(),
    });
  }

  try {
    return await requestPromise;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request was aborted');
    }
    throw error;
  }
}
