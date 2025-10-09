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

  // OPTIMIZED: Request deduplication with improved memory management
const pendingRequests = new Map<string, Promise<FixtureResponse[]>>();
const requestCooldowns = new Map<string, number>();
const COOLDOWN_PERIOD = 30000; // 30 seconds between requests

  // Single source of truth for date fixtures with intelligent deduplication
  const {
    data: dateFixtures = [],
    isLoading: isLoadingDate,
    error: dateError,
    refetch: refetchDate
  } = useQuery({
    queryKey: ['central-date-fixtures', validDate],
    queryFn: async () => {
      const requestKey = `fixtures-${validDate}`;
      const now = Date.now();
      
      // Check cooldown period to prevent excessive requests
      const lastRequest = requestCooldowns.get(requestKey);
      if (lastRequest && now - lastRequest < COOLDOWN_PERIOD) {
        console.log(`🛑 [CentralDataProvider] Request on cooldown for ${validDate}, skipping...`);
        return [];
      }
      
      // Check if request is already pending
      if (pendingRequests.has(requestKey)) {
        console.log(`🔄 [CentralDataProvider] Request already pending for ${validDate}, waiting...`);
        return await pendingRequests.get(requestKey)!;
      }
      
      // Set cooldown
      requestCooldowns.set(requestKey, now);

      // Create new request promise
      const requestPromise = (async () => {
        console.log(`🔄 [CentralDataProvider] Starting new request for ${validDate}`);

        try {
          // Quick connection health check
          if (!navigator.onLine) {
            throw new Error('No internet connection');
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort('Request timeout after 8 seconds');
          }, 8000); // Reduced timeout for faster recovery

          const response = await fetch(`/api/fixtures/date/${validDate}?all=true`, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`API returned ${response.status} for ${validDate}`);
          }

          const data: FixtureResponse[] = await response.json();
          console.log(`📊 [CentralDataProvider] Received ${data.length} fixtures for ${validDate}`);

          // Basic validation
          const validFixtures = data.filter(fixture => {
            return fixture?.league && fixture?.teams?.home && fixture?.teams?.away;
          });

          // Update Redux store
          dispatch(fixturesActions.setFixturesByDate({
            date: validDate,
            fixtures: validFixtures as any
          }));

          return validFixtures;
        } catch (error: any) {
          console.warn(`⚠️ [CentralDataProvider] Error for ${validDate}:`, error.message);
          
          // Try to get cached data
          const cachedData = queryClient.getQueryData(['central-date-fixtures', validDate]);
          if (cachedData && Array.isArray(cachedData)) {
            console.log(`💾 [CentralDataProvider] Using cached data for ${validDate}`);
            return cachedData;
          }
          
          return [];
        } finally {
          // Always clean up pending request
          pendingRequests.delete(requestKey);
        }
      })();

      // Store the pending request
      pendingRequests.set(requestKey, requestPromise);
      return await requestPromise;
    },
    staleTime: CACHE_DURATIONS.THIRTY_MINUTES, // Increased for better performance
    gcTime: CACHE_DURATIONS.SIX_HOURS,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent unnecessary refetches
    retry: 1, // Reduced retries
    retryDelay: 2000,
    throwOnError: false,
    enabled: !!validDate,
  });

  // OPTIMIZED: Live fixtures with much less aggressive fetching
  const {
    data: liveFixtures = [],
    isLoading: isLoadingLive,
    error: liveError,
    refetch: refetchLive
  } = useQuery({
    queryKey: ['central-live-fixtures'],
    queryFn: async () => {
      const liveRequestKey = 'live-fixtures';
      const now = Date.now();
      
      // Check cooldown for live requests too (30 seconds minimum)
      const lastLiveRequest = requestCooldowns.get(liveRequestKey);
      if (lastLiveRequest && now - lastLiveRequest < COOLDOWN_PERIOD) {
        console.log(`🛑 [CentralDataProvider] Live request on cooldown, skipping...`);
        const cached = queryClient.getQueryData(['central-live-fixtures']);
        return Array.isArray(cached) ? cached : [];
      }
      
      requestCooldowns.set(liveRequestKey, now);
      
      // Prevent concurrent live requests
      if (pendingRequests.has(liveRequestKey)) {
        return await pendingRequests.get(liveRequestKey)!;
      }

      const requestPromise = (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort('Live request timeout after 5 seconds');
          }, 5000); // Reduced timeout for live data

          const response = await fetch('/api/fixtures/live', {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Live API returned ${response.status}`);
          }

          const data: FixtureResponse[] = await response.json();
          console.log(`🔴 [CentralDataProvider] Received ${data.length} live fixtures`);

          dispatch(fixturesActions.setLiveFixtures(data as any));
          return data;
        } catch (error: any) {
          console.warn(`⚠️ [CentralDataProvider] Live fixtures error:`, error.message);
          // Return cached data if available
          const cached = queryClient.getQueryData(['central-live-fixtures']);
          return Array.isArray(cached) ? cached : [];
        } finally {
          pendingRequests.delete(liveRequestKey);
        }
      })();

      pendingRequests.set(liveRequestKey, requestPromise);
      return await requestPromise;
    },
    staleTime: 300000, // 5 minutes for live data (further increased)
    gcTime: 10 * 60 * 1000,
    refetchInterval: 900000, // Refetch every 15 minutes (much less aggressive)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchIntervalInBackground: false, // Don't refetch in background
    retry: 1, // Reduced retries
    retryDelay: 5000,
    throwOnError: false,
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