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

// API request helper
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  // Ensure the URL is properly formatted for the current environment
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  
  console.log(`🔄 [API Request] ${method} ${fullUrl}`);
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      // Add timeout handling
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    await throwIfResNotOk(res);
    console.log(`✅ [API Request] ${method} ${fullUrl} - Success`);
    return res;
  } catch (error) {
    console.error(`❌ [API Request] Failed: ${method} ${fullUrl}`, error);

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
      
      const res = await fetch(fullUrl, {
        credentials: "include",
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.warn(`🔐 [Query] Unauthorized access to: ${fullUrl}`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
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
      retry: 0, // Disable retries to prevent cascading requests
      retryDelay: 2000,
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Prevent memory leaks
      networkMode: 'online',
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