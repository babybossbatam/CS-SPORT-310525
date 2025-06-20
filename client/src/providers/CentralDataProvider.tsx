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

  // Single source of truth for date fixtures
  const {
    data: dateFixtures = [],
    isLoading: isLoadingDate,
    error: dateError,
    refetch: refetchDate
  } = useQuery({
    queryKey: ['central-date-fixtures', selectedDate],
    queryFn: async () => {
      console.log(`🔄 [CentralDataProvider] Fetching fixtures for ${selectedDate}`);
      
      const fetchWithRetry = async (retryCount = 0, maxRetries = 2): Promise<FixtureResponse[]> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for date queries
        
        try {
          const response = await fetch(`/api/fixtures/date/${selectedDate}?all=true`, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            keepalive: false,
            cache: 'no-cache'
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Failed to fetch fixtures: ${response.status} - ${errorText}`);
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
            date: selectedDate, 
            fixtures: basicFiltered 
          }));

          return basicFiltered;
        } catch (error) {
          clearTimeout(timeoutId);
          
          const isNetworkError = error.name === 'AbortError' || 
                                error.message?.includes('Failed to fetch') ||
                                error.message?.includes('NetworkError');
          
          if (isNetworkError && retryCount < maxRetries) {
            console.warn(`🔄 [CentralDataProvider] Retrying ${retryCount + 1}/${maxRetries} for ${selectedDate}`);
            
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 2000));
            
            return fetchWithRetry(retryCount + 1, maxRetries);
          }
          
          // After all retries failed, return empty array instead of throwing
          if (isNetworkError) {
            console.warn(`🌐 [CentralDataProvider] Network error after ${maxRetries} retries, returning empty fixtures for ${selectedDate}`);
            
            // Update Redux store with empty array
            dispatch(fixturesActions.setFixturesByDate({ 
              date: selectedDate, 
              fixtures: [] 
            }));
            
            return [];
          }
          
          console.error(`❌ [CentralDataProvider] Error fetching fixtures for ${selectedDate}:`, error);
          
          // Return empty array instead of throwing for any other errors
          dispatch(fixturesActions.setFixturesByDate({ 
            date: selectedDate, 
            fixtures: [] 
          }));
          
          return [];
        }
      };

      return fetchWithRetry();
    },
    staleTime: CACHE_DURATIONS.TWO_HOURS,
    gcTime: CACHE_DURATIONS.SIX_HOURS,
    refetchOnWindowFocus: false,
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
      const fetchWithRetry = async (retryCount = 0, maxRetries = 2): Promise<FixtureResponse[]> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch('/api/fixtures/live', {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            keepalive: false,
            cache: 'no-cache'
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Failed to fetch live fixtures: ${response.status} - ${errorText}`);
          }
          const data: FixtureResponse[] = await response.json();

          console.log(`Central cache: Received ${data.length} live fixtures`);

          // Update Redux store
          dispatch(fixturesActions.setLiveFixtures(data));

          return data;
        } catch (error) {
          clearTimeout(timeoutId);
          
          const isNetworkError = error.name === 'AbortError' || 
                                error.message?.includes('Failed to fetch') ||
                                error.message?.includes('NetworkError');
          
          if (isNetworkError && retryCount < maxRetries) {
            console.warn(`🔄 [CentralDataProvider] Retrying live fixtures ${retryCount + 1}/${maxRetries}`);
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            
            return fetchWithRetry(retryCount + 1, maxRetries);
          }
          
          // After all retries failed, return empty array instead of throwing
          if (isNetworkError) {
            console.warn("🌐 [CentralDataProvider] Network error after retries, returning empty live fixtures");
            
            // Update Redux store with empty array
            dispatch(fixturesActions.setLiveFixtures([]));
            
            return [];
          }
          
          console.error("❌ [CentralDataProvider] Error fetching live fixtures:", error);
          
          // Return empty array instead of throwing for any other errors
          dispatch(fixturesActions.setLiveFixtures([]));
          
          return [];
        }
      };

      return fetchWithRetry();
    },
    staleTime: 30000, // 30 seconds for live data
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 35000, // Refetch every 35 seconds
    refetchOnWindowFocus: true,
  });

  // Prefetch related data
  useEffect(() => {
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