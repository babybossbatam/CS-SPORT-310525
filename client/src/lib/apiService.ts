// API Service for making HTTP requests
export interface ApiRequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

// Assuming API_BASE_URL is defined elsewhere, e.g., in a config file
const API_BASE_URL = 'http://localhost:3000/api'; // Example base URL

export const apiRequest = async (
  method: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Set a 15 second timeout by default
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const requestOptions = {
    ...options,
    signal: controller.signal,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...requestOptions,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`API request timeout: ${endpoint}`);
      throw new Error(`Request timeout: ${endpoint}`);
    }
    throw error;
  }
};