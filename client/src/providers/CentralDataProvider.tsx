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
        // Set up timeout that only aborts if request is still pending
        timeoutId = setTimeout(() => {
          if (!controller.signal.aborted) {
            controller.abort('Request timeout after 30 seconds');
          }
        }, 30000);

        const response = await fetch(`/api/fixtures/date/${validDate}?all=true`, {
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

        if (error.name === 'AbortError') {
          console.warn(`⏰ [CentralDataProvider] Request timeout for ${validDate}`);
        } else {
          console.error(`❌ [CentralDataProvider] Error fetching fixtures for ${validDate}:`, error);
        }
        return [];
      }
    },
    staleTime: CACHE_DURATIONS.ONE_HOUR,
    gcTime: CACHE_DURATIONS.SIX_HOURS,
    refetchOnWindowFocus: false,
    retry: false, // Disable retries to prevent cascading errors
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
        // Set up timeout that only aborts if request is still pending
        timeoutId = setTimeout(() => {
          if (!controller.signal.aborted) {
            controller.abort('Request timeout after 15 seconds');
          }
        }, 15000);

        const response = await fetch('/api/fixtures/live', {
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