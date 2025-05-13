
import { QueryClient } from '@tanstack/react-query';
import { CACHE_STALE_TIMES } from './constants';

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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_STALE_TIMES.LIVE_FIXTURES,
      retry: 1,
      retryDelay: 2000,
      queryFn: async ({ queryKey }) => {
        // Rate limit check
        const keyString = queryKey.join('-');
        if (!checkRateLimit(keyString)) {
          throw new Error('Too many requests. Please wait before retrying.');
        }

        try {
          const response = await fetch(`/api/${queryKey.join('/')}`);
          
          if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          return data;
        } catch (error: any) {
          // Handle specific error types
          if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
          }
          
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection.');
          }

          throw error;
        }
      }
    }
  }
});
