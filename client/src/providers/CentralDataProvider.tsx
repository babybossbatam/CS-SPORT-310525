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
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for date queries
      
      try {
        const response = await fetch(`/api/fixtures/date/${selectedDate}?all=true`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`Failed to fetch fixtures: ${response.status}`);
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
        
        // Handle different types of errors gracefully
        if (error.name === 'AbortError') {
          console.warn(`⏰ [CentralDataProvider] Date fixtures request timeout for ${selectedDate}`);
          throw new Error('Request timeout - please check your connection');
        } else if (error.message?.includes('Failed to fetch')) {
          console.warn(`🌐 [CentralDataProvider] Network error fetching fixtures for ${selectedDate}`);
          throw new Error('Network error - please check your connection');
        } else {
          console.error(`❌ [CentralDataProvider] Error fetching fixtures for ${selectedDate}:`, error);
          throw error;
        }
      }
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch('/api/fixtures/live', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`Failed to fetch live fixtures: ${response.status}`);
        const data: FixtureResponse[] = await response.json();

      console.log(`Central cache: Received ${data.length} live fixtures`);

        // Update Redux store
        dispatch(fixturesActions.setLiveFixtures(data));

        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle different types of errors gracefully
        if (error.name === 'AbortError') {
          console.warn("⏰ [CentralDataProvider] Live fixtures request timeout");
          throw new Error('Request timeout - please check your connection');
        } else if (error.message?.includes('Failed to fetch')) {
          console.warn("🌐 [CentralDataProvider] Network error fetching live fixtures");
          throw new Error('Network error - please check your connection');
        } else {
          console.error("❌ [CentralDataProvider] Error fetching live fixtures:", error);
          throw error;
        }
      }
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