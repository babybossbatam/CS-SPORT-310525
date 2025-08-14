
/**
 * Simple API request wrapper
 */
export async function apiRequest(method: string, url: string, options?: RequestInit): Promise<Response> {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  // Handle relative URLs by adding base URL if needed
  const fullUrl = url.startsWith('/') ? url : `/${url}`;
  
  return fetch(fullUrl, config);
}
