import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/lib/store';
import { fixturesActions } from '@/lib/store';
import { FixtureResponse } from '@/types/fixtures';
import { CACHE_DURATIONS } from '@/lib/cacheConfig';
import { MySmartTimeFilter } from '@/lib/MySmartTimeFilter';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';

interface CentralDataContextType {
  fixtures: FixtureResponse[];
  liveFixtures: FixtureResponse[];
  isLoading: boolean;
  error: string | null;
  refetchLive: () => void;
  refetchDate: () => void;
}

const CentralDataContext = createContext<CentralDataContextType | null>(null);

interface CentralDataProviderProps {
  children: React.ReactNode;
  selectedDate: string;
}

export function CentralDataProvider({ children, selectedDate }: CentralDataProviderProps) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  // Ensure selectedDate is a valid date string, otherwise default to today
  const validDate = selectedDate || new Date().toISOString().slice(0, 10);

  // Single source of truth for date fixtures
  const {
    data: dateFixtures = [],
    isLoading: isLoadingDate,
    error: dateError,
    refetch: refetchDate
  } = useQuery({
    queryKey: ['central-date-fixtures', validDate],
    queryFn: async () => {
      console.log(`🔄 [CentralDataProvider] Fetching fixtures for ${validDate}`);

      let timeoutId: NodeJS.Timeout | null = null;
      const controller = new AbortController();

      try {
        // Quick connection health check
        if (!navigator.onLine) {
          throw new Error('No internet connection');
        }

        // Set up timeout that only aborts if request is still pending - reduced to 10 seconds for faster recovery
        timeoutId = setTimeout(() => {
          if (!controller.signal.aborted) {
            controller.abort('Request timeout after 10 seconds');
          }
        }, 10000);

        // Build the URL with proper host detection - force port 5000 for API calls
        const baseUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
        const apiUrl = `${baseUrl}/api/fixtures/date/${validDate}?all=true`;
        
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Add explicit network settings for better reliability
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'same-origin',
          keepalive: false
        });

        // Clear timeout on successful response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!response.ok) {
          console.warn(`Date fixtures API returned ${response.status} for ${validDate}`);
          return [];
        }

        const data: FixtureResponse[] = await response.json();

        console.log(`📊 [CentralDataProvider] Raw data received: ${data.length} fixtures`);

        // Basic validation only - let components handle their own filtering
        const basicFiltered = data.filter(fixture => {
          return fixture?.league && fixture?.teams && fixture?.teams?.home && fixture?.teams?.away;
        });

        console.log(`📊 [CentralDataProvider] After basic filtering: ${basicFiltered.length} fixtures`);

        // Update Redux store with all valid fixtures
        dispatch(fixturesActions.setFixturesByDate({
          date: validDate,
          fixtures: basicFiltered as any
        }));

        return basicFiltered;
      } catch (error: any) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Check for cached data first for any error type
        const cachedData = queryClient.getQueryData(['central-date-fixtures', validDate]);

        if (error.name === 'AbortError') {
          console.warn(`⏰ [CentralDataProvider] Request timeout for ${validDate} after 10 seconds`);
        } else if (error.message === 'Failed to fetch') {
          console.warn(`🌐 [CentralDataProvider] Network error for ${validDate}: Server unreachable or connection lost`);
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.warn(`🔌 [CentralDataProvider] Fetch API error for ${validDate}: ${error.message}`);
        } else if (error.message?.includes('timeout')) {
          console.warn(`⏰ [CentralDataProvider] Network timeout for ${validDate}: ${error.message}`);
        } else {
          console.error(`❌ [CentralDataProvider] Unexpected error fetching fixtures for ${validDate}:`, {
            message: error?.message || 'Unknown error',
            name: error?.name || 'UnknownError',
            stack: error?.stack?.substring(0, 200) || 'No stack trace',
            errorType: typeof error,
            fullError: error
          });
        }

        // Always try to return cached data if available
        if (cachedData && Array.isArray(cachedData)) {
          console.log(`💾 [CentralDataProvider] Using stale cache data for ${validDate} (${cachedData.length} fixtures) due to ${error?.name || 'unknown error'}`);
          return cachedData;
        }

        // If no cached data available, try to get data from nearby dates (expanded range)
        const dates = [];
        for (let i = -3; i <= 3; i++) {
          const date = new Date(validDate);
          date.setDate(date.getDate() + i);
          dates.push(date.toISOString().slice(0, 10));
        }

        // Try most recent dates first
        const sortedDates = dates.sort((a, b) => {
          const diffA = Math.abs(new Date(a).getTime() - new Date(validDate).getTime());
          const diffB = Math.abs(new Date(b).getTime() - new Date(validDate).getTime());
          return diffA - diffB;
        });

        for (const date of sortedDates) {
          if (date !== validDate) {
            const fallbackData = queryClient.getQueryData(['central-date-fixtures', date]);
            if (fallbackData && Array.isArray(fallbackData) && fallbackData.length > 0) {
              console.log(`🔄 [CentralDataProvider] Using fallback data from ${date} for ${validDate} (${fallbackData.length} fixtures)`);
              return fallbackData;
            }
          }
        }

        // Try to get any fixture data from the cache as last resort
        const allQueries = queryClient.getQueryCache().findAll(['central-date-fixtures']);
        for (const query of allQueries) {
          if (query.state.data && Array.isArray(query.state.data) && query.state.data.length > 0) {
            console.log(`🔄 [CentralDataProvider] Using emergency fallback data for ${validDate} (${query.state.data.length} fixtures)`);
            return query.state.data;
          }
        }

        console.warn(`⚠️ [CentralDataProvider] No fallback data available for ${validDate}, returning empty array`);
        return [];
      }
    },
    staleTime: CACHE_DURATIONS.ONE_HOUR,
    gcTime: CACHE_DURATIONS.SIX_HOURS,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Retry on network errors, but with more specific conditions
      const isNetworkError = (
        error?.message === 'Failed to fetch' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('fetch') ||
        error?.name === 'AbortError' ||
        error?.name === 'TypeError' ||
        error?.code === 'NETWORK_ERROR'
      );

      const shouldRetry = isNetworkError && failureCount < 3; // Increased to 3 retries

      if (shouldRetry) {
        const delay = Math.min(1000 * Math.pow(2, failureCount), 8000); // Exponential backoff with max 8s
        console.log(`🔄 [CentralDataProvider] Retry attempt ${failureCount + 1}/3 for ${validDate} in ${delay}ms (reason: ${error?.message || error?.name || 'unknown'})`);
        return true;
      }

      if (!shouldRetry && isNetworkError) {
        console.log(`⛔ [CentralDataProvider] No more retries for ${validDate} after ${failureCount + 1} attempts`);
      }

      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 8000), // Exponential backoff
    throwOnError: false, // Don't throw errors to prevent unhandled rejections
    enabled: !!validDate,
  });

  // Single source of truth for live fixtures
  const {
    data: liveFixtures = [],
    isLoading: isLoadingLive,
    error: liveError,
    refetch: refetchLive
  } = useQuery({
    queryKey: ['central-live-fixtures'],
    queryFn: async () => {
      console.log('🔴 [CentralDataProvider] Fetching live fixtures');

      let timeoutId: NodeJS.Timeout | null = null;
      const controller = new AbortController();

      try {
        // Set up timeout that only aborts if request is still pending - reduced to 10 seconds for live data
        timeoutId = setTimeout(() => {
          if (!controller.signal.aborted) {
            controller.abort('Request timeout after 10 seconds');
          }
        }, 10000);

        // Build the URL with proper host detection - force port 5000 for API calls
        const baseUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
        const apiUrl = `${baseUrl}/api/fixtures/live`;
        
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });

        // Clear timeout on successful response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!response.ok) {
          console.warn(`Live fixtures API returned ${response.status}`);
          return [];
        }

        const data: FixtureResponse[] = await response.json();
        console.log(`Central cache: Received ${data.length} live fixtures`);

        // Update Redux store
        dispatch(fixturesActions.setLiveFixtures(data as any));
        return data;

      } catch (fetchError: any) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (fetchError.name === 'AbortError') {
          console.warn(`⏰ [CentralDataProvider] Live fixtures request timeout`);
        } else {
          console.warn(`Failed to fetch live fixtures:`, fetchError);
        }
        // Return empty array instead of throwing
        return [];
      }

    },
    staleTime: 120000, // 2 minutes for live data
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 300000, // Refetch every 5 minutes (much less aggressive)
    refetchOnWindowFocus: false, // Disable to prevent memory leaks
    retry: 3, // Enable retries with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    throwOnError: false, // Don't throw errors to prevent unhandled rejections
  });

  // Cleanup and memory management
  useEffect(() => {
    // Increase max listeners to prevent warnings
    if (typeof process !== 'undefined' && process.setMaxListeners) {
      process.setMaxListeners(20);
    }

    // Cleanup on unmount
    return () => {
      // Clear any pending timeouts or intervals
      if (typeof window !== 'undefined') {
        // Force garbage collection of unused queries
        queryClient.clear();
      }
    };
  }, []);

  // Prefetch related data with reduced frequency
  useEffect(() => {
    const prefetchTimer = setTimeout(() => {
      // Prefetch tomorrow's fixtures
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      queryClient.prefetchQuery({
        queryKey: ['central-date-fixtures', tomorrowStr],
        queryFn: async () => {
          const response = await fetch(`/api/fixtures/date/${tomorrowStr}?all=true`);
          if (!response.ok) return [];
          return response.json();
        },
        staleTime: CACHE_DURATIONS.FOUR_HOURS,
      });
    }, 5000); // Delay prefetch to reduce initial load

    return () => clearTimeout(prefetchTimer);
  }, [selectedDate, queryClient]);

  const contextValue: CentralDataContextType = {
    fixtures: dateFixtures,
    liveFixtures,
    isLoading: isLoadingDate || isLoadingLive,
    error: dateError?.message || liveError?.message || null,
    refetchLive,
    refetchDate
  };

  return (
    <CentralDataContext.Provider value={contextValue}>
      {children}
    </CentralDataContext.Provider>
  );
}

export function useCentralData() {
  const context = useContext(CentralDataContext);
  if (!context) {
    throw new Error('useCentralData must be used within CentralDataProvider');
  }
  return context;
}