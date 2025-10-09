
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import SportsCategoryTabs from "@/components/layout/SportsCategoryTabs";
import TournamentHeader from "@/components/layout/TournamentHeader";
import MyMainLayout from "@/components/layout/MyMainLayout";
import Footer from "@/components/layout/Footer";
import RegionModal from "@/components/modals/RegionModal";
import { Trophy } from "lucide-react";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(() => getCurrentUTCDateString());

  // Fetch today's fixtures with optimized strategy and better error handling
  const { data: fixtures = [], isLoading, error } = useQuery({
    queryKey: ['home-fixtures', selectedDate],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced to 5 seconds
        
        const response = await fetch(`/api/fixtures/date/${selectedDate}`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'max-age=120', // Increased cache to 2 minutes
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limit hit, wait and return empty for now
            console.warn('Rate limit hit, returning empty fixtures');
            return [];
          }
          console.warn(`Failed to fetch fixtures for ${selectedDate}, status: ${response.status}`);
          return [];
        }
        
        const data = await response.json();
        const validFixtures = Array.isArray(data) ? data.filter(fixture => 
          fixture && 
          fixture.fixture && 
          fixture.fixture.id &&
          fixture.teams &&
          fixture.teams.home &&
          fixture.teams.away
        ) : [];
        
        return validFixtures.slice(0, 25); // Reduced to 25 matches for better performance
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Request timeout for fixtures');
        } else {
          console.warn('Error fetching fixtures:', error);
        }
        return [];
      }
    },
    staleTime: 180000, // 3 minutes
    gcTime: 300000, // 5 minutes
    refetchInterval: false,
    retry: (failureCount, error) => {
      // Don't retry on abort errors or rate limits
      if (error?.name === 'AbortError' || error?.message?.includes('429')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 3000,
    enabled: !!selectedDate,
  });

  // Memoize the filtered fixtures to prevent unnecessary re-renders
  const optimizedFixtures = useMemo(() => {
    if (!fixtures.length) return [];
    
    // Filter and sort fixtures for better performance
    return fixtures
      .filter(fixture => fixture && fixture.fixture?.id)
      .slice(0, 50) // Limit to first 50 matches for performance
      .sort((a, b) => {
        // Sort by status priority (live > upcoming > finished)
        const statusOrder = { 'LIVE': 0, '1H': 0, '2H': 0, 'HT': 0, 'NS': 1, 'FT': 2, 'AET': 2, 'PEN': 2 };
        const aOrder = statusOrder[a.fixture?.status?.short] ?? 3;
        const bOrder = statusOrder[b.fixture?.status?.short] ?? 3;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        // Then sort by time
        return new Date(a.fixture?.date || 0) - new Date(b.fixture?.date || 0);
      });
  }, [fixtures]);

  // Add loading timeout protection
  React.useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout reached for home fixtures');
      }, 10000); // 10 second timeout warning
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (error) {
    console.error('Error loading home fixtures:', error);
  }

  // Show error state if there's an error
  if (error && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <SportsCategoryTabs />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Unable to load matches</h2>
            <p className="text-gray-600 mb-4">Please try refreshing the page</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader
        title="Today's Football Matches"
        icon={<Trophy className="h-4 w-4 text-neutral-600" />}
      />

      <div className="flex-1 h-full" style={{ marginTop: "52px", marginBottom: "-34px" }}>
        <MyMainLayout 
          fixtures={optimizedFixtures} 
          loading={isLoading}
        />
      </div>

      <div className="mt-10">
        <Footer />
      </div>
      <RegionModal />
    </div>
  );
};

export default Home;
