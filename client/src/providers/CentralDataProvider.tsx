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
      const response = await fetch(`/api/fixtures/date/${selectedDate}?all=true`);
      if (!response.ok) throw new Error('Failed to fetch fixtures');
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
      const response = await fetch('/api/fixtures/live');
      if (!response.ok) throw new Error('Failed to fetch live fixtures');
      const data: FixtureResponse[] = await response.json();

      console.log(`Central cache: Received ${data.length} live fixtures`);

      // Update Redux store
      dispatch(fixturesActions.setLiveFixtures(data));

      return data;
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