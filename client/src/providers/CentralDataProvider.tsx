import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/lib/store';
import { fixturesActions } from '@/lib/store';
import { FixtureResponse } from '@/types/fixtures';
import { CACHE_DURATIONS } from '@/lib/cacheConfig';
import { MySmartTimeFilter } from '@/lib/MySmartTimeFilter';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';
import { apiRequest } from '@/lib/api'; // Assuming apiRequest is available

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

  // State to manage fixtures and loading status within the provider
  const [fixtures, setFixtures] = useState<FixtureResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [liveFixtures, setLiveFixturesState] = useState<FixtureResponse[]>([]); // Local state for live fixtures

  // Ensure selectedDate is a valid date string, otherwise default to today
  const validDate = selectedDate || new Date().toISOString().slice(0, 10);

  // Function to fetch fixtures, now using useCallback for memoization
  const fetchFixtures = useCallback(async (targetDate: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      console.log(`🔄 [CentralDataProvider] Fetching fixtures for ${targetDate}`);

      // Fetch comprehensive fixture data with multiple sources
      const responses = await Promise.allSettled([
        // Primary: Multi-timezone endpoint for comprehensive coverage
        apiRequest('GET', `/api/fixtures/date/${targetDate}?all=true&skipFilter=true&timezone=true`),
        // Secondary: Direct league fixtures for popular leagues
        apiRequest('GET', `/api/fixtures/date/${targetDate}?leagues=38,39,140,135,61,78,71,88,253,848,2,3,4,5`),
        // Tertiary: Live fixtures if it's today
        ...(targetDate === new Date().toISOString().split('T')[0] ? [
          apiRequest('GET', '/api/fixtures/live')
        ] : [])
      ]);

      let allFixtures: any[] = [];
      const fixtureIds = new Set<number>();

      // Process all successful responses
      for (const response of responses) {
        if (response.status === 'fulfilled') {
          try {
            const data = await response.value.json();
            if (Array.isArray(data)) {
              // Deduplicate by fixture ID
              data.forEach((fixture: any) => {
                if (fixture?.fixture?.id && !fixtureIds.has(fixture.fixture.id)) {
                  fixtureIds.add(fixture.fixture.id);
                  allFixtures.push(fixture);
                }
              });
            }
          } catch (parseError) {
            console.warn(`⚠️ [CentralDataProvider] Failed to parse response:`, parseError);
          }
        }
      }

      // If we still don't have enough fixtures, try fallback sources
      if (allFixtures.length < 50) {
        console.log(`🔄 [CentralDataProvider] Fetching additional fixtures (current: ${allFixtures.length})`);

        try {
          const fallbackResponse = await apiRequest('GET', `/api/fixtures/date/${targetDate}?minimal=false&world=true`);
          const fallbackData = await fallbackResponse.json();

          if (Array.isArray(fallbackData)) {
            fallbackData.forEach((fixture: any) => {
              if (fixture?.fixture?.id && !fixtureIds.has(fixture.fixture.id)) {
                fixtureIds.add(fixture.fixture.id);
                allFixtures.push(fixture);
              }
            });
          }
        } catch (fallbackError) {
          console.warn(`⚠️ [CentralDataProvider] Fallback fetch failed:`, fallbackError);
        }
      }

      setFixtures(allFixtures);
      console.log(`✅ [CentralDataProvider] Loaded ${allFixtures.length} unique fixtures for ${targetDate}`);

      if (allFixtures.length === 0) {
        console.warn(`⚠️ [CentralDataProvider] No fixtures found for ${targetDate}`);
      }
    } catch (error) {
      console.error(`❌ [CentralDataProvider] Error fetching fixtures for ${targetDate}:`, error);
      setFixtures([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, setFixtures]); // Dependencies for useCallback

  // Fetch fixtures when date changes
  useEffect(() => {
    if (selectedDate) {
      // Clear existing fixtures when date changes to ensure fresh data
      if (fixtures.length > 0) {
        setFixtures([]);
      }
      fetchFixtures(selectedDate);
    }
  }, [selectedDate, fetchFixtures, fixtures.length]); // Added fixtures.length as dependency

  // Refresh live fixtures every 2 minutes for today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
      const interval = setInterval(() => {
        console.log(`🔄 [CentralDataProvider] Auto-refreshing fixtures for today`);
        fetchFixtures(selectedDate); // Use fetchFixtures to update the main fixtures state
      }, 2 * 60 * 1000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [selectedDate, fetchFixtures]); // Dependencies for useEffect

  // Fetch live fixtures using React Query
  const {
    data: queryLiveFixtures = [],
    isLoading: isLoadingLiveQuery,
    error: liveErrorQuery,
    refetch: refetchLive,
  } = useQuery({
    queryKey: ['central-live-fixtures'],
    queryFn: async () => {
      console.log('🔴 [CentralDataProvider] Fetching live fixtures via useQuery');
      try {
        const response = await apiRequest('GET', '/api/fixtures/live');
        const data: FixtureResponse[] = await response.json();
        console.log(`Central cache: Received ${data.length} live fixtures via useQuery`);
        setLiveFixturesState(data); // Update local state for live fixtures
        return data;
      } catch (fetchError: any) {
        console.warn(`Failed to fetch live fixtures via useQuery:`, fetchError);
        setLiveFixturesState([]); // Ensure state is cleared on error
        return [];
      }
    },
    staleTime: 120000, // 2 minutes for live data
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 300000, // Refetch every 5 minutes (much less aggressive)
    refetchOnWindowFocus: false, // Disable to prevent memory leaks
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    throwOnError: false,
  });

  // Combined loading state
  const isLoadingCombined = isLoading || isLoadingLiveQuery;

  // Error handling for date fixtures (from fetchFixtures)
  const dateError = !isLoading && fixtures.length === 0 && validDate && !(() => { // Check if there was an attempt to fetch but no data
    const today = new Date().toISOString().split('T')[0];
    return validDate === today && queryLiveFixtures.length === 0 && !isLoadingLiveQuery; // If today and live is also empty, might not be an error
  })();

  // Context value provided to children
  const contextValue: CentralDataContextType = {
    fixtures: fixtures, // Use local state for date fixtures
    liveFixtures: liveFixtures, // Use local state for live fixtures
    isLoading: isLoadingCombined,
    error: dateError ? 'Failed to load today\'s matches.' : (liveErrorQuery?.message || null),
    refetchLive: () => refetchLive(), // Use React Query's refetch for live data
    refetchDate: () => fetchFixtures(selectedDate) // Use the local fetchFixtures for date data
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