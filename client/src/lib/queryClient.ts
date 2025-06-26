import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { CACHE_STALE_TIMES } from './constants';
import { CACHE_DURATIONS } from './cacheConfig';

// Helper to throw error for non-ok responses
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Simplified rate limiting for non-central requests
const requestTimestamps = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 600000; // 10 minutes for non-central requests

const checkRateLimit = (key: string) => {
  // Skip rate limiting for central cache keys
  if (key.includes('central-')) return true;

  const now = Date.now();
  const lastRequest = requestTimestamps.get(key);

  if (lastRequest && now - lastRequest < MIN_REQUEST_INTERVAL) {
    return false;
  }

  requestTimestamps.set(key, now);
  return true;
};

// Request queue to limit concurrent requests
const requestQueue = new Map<string, Promise<any>>();

export async function apiRequest(
  url: string,
  options: RequestInit = {},
  timeout: number = 15000 // Increased timeout to 15 seconds
): Promise<Response> {
  // Ensure the URL is properly formatted for the current environment
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;

  // For live fixtures, use request deduplication to prevent multiple simultaneous requests
  if (fullUrl.includes('/api/fixtures/live')) {
    const cacheKey = `live-request-${fullUrl}`;
    if (requestQueue.has(cacheKey)) {
      console.log(`🔄 [API Request] Deduplicating live request: ${fullUrl}`);
      return requestQueue.get(cacheKey)!;
    }
  }

  console.log(`🔄 [API Request] ${options.method || 'GET'} ${fullUrl}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestPromise = async (): Promise<Response> => {
    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Remove from queue after completion
      if (fullUrl.includes('/api/fixtures/live')) {
        const cacheKey = `live-request-${fullUrl}`;
        requestQueue.delete(cacheKey);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Remove from queue on error
      if (fullUrl.includes('/api/fixtures/live')) {
        const cacheKey = `live-request-${fullUrl}`;
        requestQueue.delete(cacheKey);
      }

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🌐 Network error - check if server is running on port 5000');
        throw new Error('Network connection failed. Please check if the server is running on port 5000.');
      }

      // Check if it's a timeout error
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        console.error('⏱️ Request timeout');
        throw new Error('Request timeout. Please try again.');
      }

      // Check if it's an abort error
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('🚫 Request aborted');
        throw new Error('Request was cancelled. Please try again.');
      }

      throw error;
    }
  };

  // Add to queue for live requests
  if (fullUrl.includes('/api/fixtures/live')) {
    const cacheKey = `live-request-${fullUrl}`;
    const promise = requestPromise();
    requestQueue.set(cacheKey, promise);
    return promise;
  }

  return requestPromise();
}

// Query function type
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const keyString = Array.isArray(queryKey) ? queryKey.join('-') : String(queryKey);

    if (!checkRateLimit(keyString)) {
      console.warn('⏳ Rate limiting request to:', keyString);
      return null as any;
    }

    const url = queryKey[0] as string;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;

    try {
      console.log(`🔄 [Query] Fetching: ${fullUrl}`);
      const response = await apiRequest(url, { signal }, 15000); // 15 second timeout

      if (unauthorizedBehavior === "returnNull" && response.status === 401) {
        console.warn(`🔐 [Query] Unauthorized access to: ${fullUrl}`);
        return null;
      }

      await throwIfResNotOk(response);
      const data = await response.json();
      console.log(`✅ [Query] Success: ${fullUrl}`);
      return data;
    } catch (error) {
      console.error(`❌ [Query] Error for ${fullUrl}:`, error);

      // Return null for network errors to prevent cascading failures
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn(`🌐 [Query] Network error, returning null for: ${fullUrl}`);
        return null as any;
      }

      throw error;
    }
  };

// Query client with configurations
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ 
        on401: "throw"
      }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: CACHE_DURATIONS.ONE_HOUR, // Data stays fresh for 60 minutes
      gcTime: CACHE_DURATIONS.SIX_HOURS, // 6 hours
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        // Don't retry timeout errors immediately
        if (error instanceof Error && error.message.includes('timeout')) {
          return failureCount < 1;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(2000 * 2 ** attemptIndex, 30000),
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Prevent memory leaks
      networkMode: 'online',
      // Increase timeout for all queries
      meta: {
        timeout: 15000, // 15 seconds
      },
    },
    mutations: {
      retry: 1,
      retryDelay: 2000,
      networkMode: 'online',
    },
  },
  // Increase max query cache size to prevent excessive cleanup
  queryCache: undefined,
  mutationCache: undefined,
});