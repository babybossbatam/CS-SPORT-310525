
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

  // Fetch today's fixtures
  const { data: fixtures = [], isLoading, error } = useQuery({
    queryKey: ['home-fixtures', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/fixtures/date/${selectedDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch fixtures');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchInterval: 60000, // Refetch every minute for live updates
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

  if (error) {
    console.error('Error loading home fixtures:', error);
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
