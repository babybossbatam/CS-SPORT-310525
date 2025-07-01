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

// API request helper with improved error handling
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    // Set timeout with proper cleanup
    timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort(new Error('Request timeout after 15 seconds'));
      }
    }, 15000);

    // Ensure URL is properly formatted
    const apiUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
    
    const res = await fetch(apiUrl, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        'Accept': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
      mode: 'cors'
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Clean up timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle specific error types
    if (error instanceof Error && (error.name === 'AbortError' || errorMessage.includes('aborted'))) {
      console.warn(`⏱️ API request aborted for ${method} ${url}:`, errorMessage);
      throw new Error(`Request cancelled: ${url}`);
    }
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
      console.error(`🌐 Network connectivity issue for ${method} ${url}: ${errorMessage}`);
      throw new Error(`Network error: Please check your connection and try again`);
    }
    
    console.error(`❌ API request error for ${method} ${url}:`, error);
    throw error;
  }
}

// Query function type
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const keyString = Array.isArray(queryKey) ? queryKey.join('-') : String(queryKey);

    if (!checkRateLimit(keyString)) {
      console.warn('Rate limiting request to:', keyString);
      return null as any;
    }

    // Use the signal from React Query if available, otherwise create our own
    const controller = signal ? undefined : new AbortController();
    const requestSignal = signal || controller?.signal;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Only set timeout if we created our own controller
      if (controller) {
        timeoutId = setTimeout(() => {
          if (!controller.signal.aborted) {
            controller.abort(new Error('Query timeout after 10 seconds'));
          }
        }, 10000);
      }

      const url = queryKey[0] as string;
      const apiUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
      
      const res = await fetch(apiUrl, {
        credentials: "include",
        signal: requestSignal,
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof Error && (error.name === 'AbortError' || errorMessage.includes('aborted'))) {
        console.warn(`⏱️ Query aborted for ${queryKey[0]}: ${errorMessage}`);
        return null as any; // Return null instead of throwing for queries
      }
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        console.warn(`🌐 Network issue for query ${queryKey[0]}: ${errorMessage}`);
        return null as any; // Return null for network issues in queries
      }
      
      console.error(`Query error for ${queryKey[0]}:`, error);
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