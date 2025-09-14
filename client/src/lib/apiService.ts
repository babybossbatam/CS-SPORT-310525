
// API Service for making HTTP requests
export interface ApiRequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const { signal, headers = {} } = options;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal,
  };

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request was aborted');
    }
    throw error;
  }
}
