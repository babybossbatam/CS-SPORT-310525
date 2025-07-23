import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { CACHE_STALE_TIMES } from "./constants";
import { CACHE_DURATIONS } from "./cacheConfig";

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
  if (key.includes("central-")) return true;

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
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Ensure URL is properly formatted
    const apiUrl = url.startsWith("/")
      ? `${window.location.origin}${url}`
      : url;

    console.log(`📡 [apiRequest] Making ${method} request to: ${apiUrl}`);

    // Add timeout and AbortController for better network handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        controller.abort('Request timeout after 30 seconds');
      } catch (abortError) {
        // Silently handle abort errors during cleanup
      }
    }, 30000); // 30 second timeout

    const response = await fetch(apiUrl, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        Accept: "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: "cors",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`📡 [apiRequest] Response status: ${response.status} for ${method} ${url}`);

    await throwIfResNotOk(response);
    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Handle AbortError (timeout) - don't log as error, it's expected behavior
    if (error instanceof Error && (error.name === 'AbortError' || errorMessage.includes('signal is aborted'))) {
      console.log(
        `🛑 [apiRequest] Request aborted/timeout for ${method} ${url} (expected behavior)`,
      );
      throw new Error(
        `Request timeout: The server took too long to respond. Please try again.`,
      );
    }

    console.error(`❌ [apiRequest] Error for ${method} ${url}:`, {
      error: errorMessage,
      url: url,
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    });

    // Handle specific error types with more detailed messages
    if (
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("NetworkError") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("ERR_NETWORK") ||
      errorMessage.includes("ERR_INTERNET_DISCONNECTED")
    ) {
      console.error(
        `🌐 [apiRequest] Network connectivity issue for ${method} ${url}: ${errorMessage}`,
      );
      throw new Error(
        `Network error: Unable to connect to server. Please check your internet connection and try again.`,
      );
    }

    if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
      console.error(
        `⏱️ [apiRequest] Timeout error for ${method} ${url}: ${errorMessage}`,
      );
      throw new Error(
        `Timeout error: The server took too long to respond. Please try again.`,
      );
    }

    // Re-throw the original error for other cases
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
    const keyString = Array.isArray(queryKey)
      ? queryKey.join("-")
      : String(queryKey);

    if (!checkRateLimit(keyString)) {
      console.warn("Rate limiting request to:", keyString);
      return null as any;
    }

    try {
      const url = queryKey[0] as string;
      const apiUrl = url.startsWith("/")
        ? `${window.location.origin}${url}`
        : url;

      const res = await fetch(apiUrl, {
        credentials: "include",
        signal: signal,
        headers: {
          Accept: "application/json",
        },
        mode: "cors",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Handle AbortError specifically - don't treat as error, it's expected
      if (error instanceof Error && (error.name === 'AbortError' || errorMessage.includes('signal is aborted'))) {
        console.log(`🛑 Query aborted for ${queryKey[0]}: ${errorMessage} (expected behavior)`);
        return null as any; // Return null for aborted queries
      }

      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("fetch")
      ) {
        console.warn(
          `🌐 Network issue for query ${queryKey[0]}: ${errorMessage}`,
        );
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
        on401: "throw",
      }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: CACHE_DURATIONS.ONE_HOUR, // Data stays fresh for 60 minutes
      gcTime: CACHE_DURATIONS.SIX_HOURS, // 6 hours
      retry: (failureCount, error) => {
        // Don't retry timeout errors
        if (
          error?.message?.includes("timeout") ||
          error?.message?.includes("timed out")
        ) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Prevent memory leaks
      networkMode: "online",
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry timeout errors for mutations either
        if (
          error?.message?.includes("timeout") ||
          error?.message?.includes("timed out")
        ) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: 2000,
      networkMode: "online",
    },
  },
  // Increase max query cache size to prevent excessive cleanup
  queryCache: undefined,
  mutationCache: undefined,
});