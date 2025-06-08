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

// Create rate limiting map
const requestTimestamps = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 1800000; // 30 minutes minimum between same requests

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
export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  options?: any
): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...options, // Include signal and other options
  };

  // Add body for non-GET requests
  if (options?.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error(`API request failed: ${method} ${endpoint}`, error);
    throw error;
  }
};

// Query function type
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const keyString = Array.isArray(queryKey) ? queryKey.join('-') : String(queryKey);

    if (!checkRateLimit(keyString)) {
      console.warn('Rate limiting request to:', keyString);
      return null as any;
    }

    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include"
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
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
      cacheTime: CACHE_DURATIONS.SIX_HOURS, // Keep unused data in cache for 6 hours
      gcTime: CACHE_DURATIONS.SIX_HOURS, // 6 hours
      retry: 1,
      retryDelay: 2000,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 2000
    },
  },
});