import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/lib/store';
import { fixturesActions } from '@/lib/store';
import { FixtureResponse } from '@/types/fixtures';
import { CACHE_DURATIONS } from '@/lib/cacheConfig';
import { MySmartTimeFilter } from '@/lib/MySmartTimeFilter';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';
import { clearCache } from '@/lib/clearCache';
import { handleNetworkRecovery } from '@/lib/errorHandler';
import { autoDiagnoseOnError } from '@/lib/networkConnectivityCheck';

// Dummy functions for getStoredFixtures and getStoredLiveFixtures, replace with actual implementation
const getStoredFixtures = (date: string): FixtureResponse[] | undefined => {
  // Placeholder: In a real app, this would fetch from localStorage or another storage
  // console.log(`[getStoredFixtures] Called for date: ${date}`);
  return undefined;
};
const getStoredLiveFixtures = (): FixtureResponse[] | undefined => {
  // Placeholder: In a real app, this would fetch from localStorage or another storage
  // console.log(`[getStoredLiveFixtures] Called`);
  return undefined;
};


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
        console.warn(`🌐 [CentralDataProvider] Network error for ${validDate}:`, error?.message || 'Server unreachable or connection lost');

        // Enhanced fallback strategy
        // 1. Try cached data from localStorage
        const cachedData = getStoredFixtures(validDate);
        if (cachedData && cachedData.length > 0) {
          console.log(`📦 [CentralDataProvider] Using cached fallback data for ${validDate} (${cachedData.length} fixtures)`);
          return cachedData;
        }

        // 2. Try cached data from previous/next day as emergency fallback
        const yesterday = new Date(validDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(validDate);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterdayData = getStoredFixtures(yesterday.toISOString().split('T')[0]);
        const tomorrowData = getStoredFixtures(tomorrow.toISOString().split('T')[0]);

        if (yesterdayData?.length > 0 || tomorrowData?.length > 0) {
          const emergencyData = [...(yesterdayData || []), ...(tomorrowData || [])];
          console.log(`🚨 [CentralDataProvider] Using emergency fallback data for ${validDate} (${emergencyData.length} fixtures from adjacent days)`);
          return emergencyData.slice(0, 10); // Limit to prevent UI overload
        }

        // 3. Return minimal sample data to prevent empty UI
        console.warn(`⚠️ [CentralDataProvider] No fallback data available for ${validDate}, returning sample data`);
        return [{
          fixture: {
            id: 999999,
            date: `${validDate}T12:00:00Z`,
            status: { short: 'NS', long: 'Not Started' }
          },
          teams: {
            home: { name: 'Network Error', logo: '/assets/fallback-logo.png' },
            away: { name: 'Please Refresh', logo: '/assets/fallback-logo.png' }
          },
          goals: { home: null, away: null },
          league: { id: 0, name: 'Connection Issue', logo: '/assets/fallback-logo.png' },
          isOfflineData: true
        }];
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

      } catch (error: any) {
        console.warn('Failed to fetch live fixtures:', error);

        // Enhanced live fixtures fallback
        // 1. Try cached live data
        const cachedLiveData = getStoredLiveFixtures();
        if (cachedLiveData && cachedLiveData.length > 0) {
          console.log(`📦 [CentralDataProvider] Using cached live fixtures (${cachedLiveData.length} fixtures)`);
          return cachedLiveData;
        }

        // 2. Check if we have any recent fixtures that might be live
        const today = new Date().toISOString().split('T')[0];
        const todayFixtures = getStoredFixtures(today);
        const potentialLive = todayFixtures?.filter(f =>
          f.fixture.status.short === '1H' ||
          f.fixture.status.short === '2H' ||
          f.fixture.status.short === 'HT'
        ) || [];

        if (potentialLive.length > 0) {
          console.log(`🔄 [CentralDataProvider] Using potentially live fixtures from cache (${potentialLive.length} fixtures)`);
          return potentialLive;
        }

        // 3. Return empty array - let components handle empty state gracefully
        console.log(`📭 [CentralDataProvider] No live fixtures available (offline mode)`);
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