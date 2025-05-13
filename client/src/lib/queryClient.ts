import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  timeout: number = 15000 // Default 15 second timeout
): Promise<Response> {
  // Create an AbortController to handle request timeouts
  const controller = new AbortController();
  const { signal } = controller;
  
  let timeoutId: number | undefined;
  
  // Only set up timeout if timeout value is valid
  if (timeout > 0) {
    timeoutId = window.setTimeout(() => {
      try {
        controller.abort("Request timeout");
      } catch (e) {
        console.warn('Error aborting request:', e);
      }
    }, timeout);
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal
    });
    
    // Clear the timeout since the request completed
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Clear the timeout to prevent memory leaks
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    
    // Log error and handle specific error types
    console.error(`API request error for ${method} ${url}:`, error);
    
    if (error instanceof Error) {
      // Handle abort errors
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout: The ${method} request to ${url} took too long to complete. Please try again later.`);
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: Could not connect to the server. Please check your internet connection and try again.`);
      }
      
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error(`Network error: The server is unreachable. Please check your connection and try again.`);
      }
    }
    
    // Rethrow the original error if not handled above
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  timeout?: number;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, timeout = 15000 }) =>
  async ({ queryKey }) => {
    // Create an AbortController to handle request timeouts
    const controller = new AbortController();
    const { signal } = controller;
    
    let timeoutId: number | undefined;
    
    // Only set up timeout if timeout value is valid
    if (timeout > 0) {
      timeoutId = window.setTimeout(() => {
        try {
          controller.abort("Request timeout");
        } catch (e) {
          console.warn('Error aborting request:', e);
        }
      }, timeout);
    }
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        signal
      });
      
      // Clear the timeout since the request completed
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Clear the timeout to prevent memory leaks
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      
      // Log error and handle specific error types
      console.error(`Query error for ${queryKey[0]}:`, error);
      
      if (error instanceof Error) {
        // Handle abort errors
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout: The query to ${queryKey[0]} took too long to complete. Please try again later.`);
        }
        
        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error(`Network error: Could not connect to the server. Please check your internet connection and try again.`);
        }
        
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          throw new Error(`Network error: The server is unreachable. Please check your connection and try again.`);
        }
      }
      
      // Rethrow the original error if not handled above
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ 
        on401: "throw",
        timeout: 15000 // 15 second timeout for all queries by default
      }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes (instead of Infinity)
      gcTime: 10 * 60 * 1000, // 10 minutes (replaced cacheTime with gcTime for TanStack Query v5)
      retry: 1, // Allow one retry for transient network issues
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff capped at 30 seconds
      refetchOnMount: false,
      refetchOnReconnect: true, // Re-fetch when reconnected to handle connection issues
    },
    mutations: {
      retry: 1, // Allow one retry for transient network issues
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff capped at 30 seconds
    },
  },
});