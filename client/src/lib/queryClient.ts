import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { CACHE_STALE_TIMES } from './constants';

// Helper to throw error for non-ok responses
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Create rate limiting map
const requestTimestamps = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between same requests

// Helper to check rate limit
const checkRateLimit = (key: string) => {
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
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include"
    });
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request error for ${method} ${url}:`, error);
    throw error;
  }
}

// Query function type with caching
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const keyString = Array.isArray(queryKey) ? queryKey.join('-') : String(queryKey);
    
    // More aggressive rate limiting for league requests
    if (keyString.includes('/api/leagues') && !checkRateLimit(keyString)) {
      const cached = queryClient.getQueryData(queryKey);
      if (cached) return cached;
    }
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include"
      });
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Cache leagues data more aggressively
      if (keyString.includes('/api/leagues')) {
        queryClient.setQueryData(queryKey, data);
      }
      
      return data;
    } catch (error) {
      console.error(`Query error for ${queryKey[0]}:`, error);
      throw error;
    }
  };

// Query client with optimized configurations
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ 
        on401: "throw"
      }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: CACHE_STALE_TIMES.LEAGUES,
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      retry: 1,
      retryDelay: 2000,
      refetchOnMount: false,
      refetchOnReconnect: false,
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    },
    mutations: {
      retry: 1,
      retryDelay: 2000
    },
  },
});