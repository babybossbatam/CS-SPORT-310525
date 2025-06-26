
import { QueryClient } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Rate limiting configuration
const RATE_LIMIT_DELAY = 100; // 100ms between requests
const requestTimestamps = new Map<string, number>();

const checkRateLimit = (key: string) => {
  // Skip rate limiting for central cache keys
  if (key.includes('central-')) return true;

  const now = Date.now();
  const lastRequest = requestTimestamps.get(key);

  if (lastRequest && now - lastRequest < RATE_LIMIT_DELAY) {
    return false;
  }

  requestTimestamps.set(key, now);
  return true;
};

// Enhanced API request function with proper error handling and retries
export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: any
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include"
    });

    if (!res.ok) {
      console.error(`API request failed: ${method} ${url}`, {
        status: res.status,
        statusText: res.statusText
      });
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    return res;
  } catch (error) {
    console.error(`API request error for ${method} ${url}:`, error);
    throw error;
  }
}

// Create query client with enhanced configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Centralized API functions
export const api = {
  // Fixtures
  async getFixtures(date: string) {
    const url = `${API_BASE_URL}/api/fixtures/date/${date}`;
    const response = await apiRequest(url);
    return response.json();
  },

  async getLiveFixtures() {
    const url = `${API_BASE_URL}/api/fixtures/live`;
    const response = await apiRequest(url);
    return response.json();
  },

  async getFixtureById(id: number) {
    const url = `${API_BASE_URL}/api/fixtures/${id}`;
    const response = await apiRequest(url);
    return response.json();
  },

  // Leagues
  async getLeagues() {
    const url = `${API_BASE_URL}/api/leagues`;
    const response = await apiRequest(url);
    return response.json();
  },

  async getPopularLeagues() {
    const url = `${API_BASE_URL}/api/leagues/popular`;
    const response = await apiRequest(url);
    return response.json();
  },

  async getLeagueById(id: number) {
    const url = `${API_BASE_URL}/api/leagues/${id}`;
    const response = await apiRequest(url);
    return response.json();
  },

  async getLeagueFixtures(id: number, season?: number) {
    let url = `${API_BASE_URL}/api/leagues/${id}/fixtures`;
    if (season) {
      url += `?season=${season}`;
    }
    const response = await apiRequest(url);
    return response.json();
  },

  // User preferences
  async getUserPreferences(userId: number) {
    const url = `${API_BASE_URL}/api/user/${userId}/preferences`;
    const response = await apiRequest(url);
    return response.json();
  },

  async updateUserPreferences(userId: number, preferences: any) {
    const url = `${API_BASE_URL}/api/user/${userId}/preferences`;
    const response = await apiRequest(url, "PATCH", preferences);
    return response.json();
  },

  // Authentication
  async register(userData: any) {
    const url = `${API_BASE_URL}/api/auth/register`;
    const response = await apiRequest(url, "POST", userData);
    return response.json();
  },

  async login(credentials: any) {
    const url = `${API_BASE_URL}/api/auth/login`;
    const response = await apiRequest(url, "POST", credentials);
    return response.json();
  },
};

export default queryClient;
