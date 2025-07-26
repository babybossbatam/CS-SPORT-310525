import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, addDays, subDays } from "date-fns";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/utils";
import TodayMatchPageCard from "@/components/matches/TodayMatchPageCard";

interface MyBasketmainLeftProps {
  fixtures?: any[];
  onMatchClick?: (matchId: number) => void;
  onMatchCardClick?: (fixture: any) => void;
}

const MyBasketmainLeft: React.FC<MyBasketmainLeftProps> = ({
  fixtures = [],
  onMatchClick,
  onMatchCardClick
}) => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [timeFilterActive, setTimeFilterActive] = useState(false);

  // Apply UTC date filtering to fixtures - similar to MyMainLayout
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length || !selectedDate) return [];

    console.log(
      `🔍 [MyBasketmainLeft UTC] Processing ${fixtures.length} fixtures for date: ${selectedDate}`,
    );

    // Use UTC dates throughout - no timezone conversion
    const todayUTC = new Date();
    const todayUTCString = todayUTC.toISOString().split('T')[0]; // YYYY-MM-DD in UTC

    const filtered = fixtures.filter((fixture) => {
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        // Extract UTC date from fixture date (no timezone conversion)
        const fixtureUTCDate = new Date(fixture.fixture.date);
        const fixtureDateString = fixtureUTCDate.toISOString().split('T')[0]; // YYYY-MM-DD in UTC

        // Simple UTC date matching
        const shouldInclude = fixtureDateString === selectedDate;

        if (!shouldInclude) {
          console.log(
            `❌ [MyBasketmainLeft UTC FILTER] Match excluded: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
            {
              fixtureUTCDate: fixture.fixture.date,
              extractedUTCDate: fixtureDateString,
              selectedDate,
              status: fixture.fixture.status.short,
              reason: 'UTC date mismatch'
            },
          );
          return false;
        }

        console.log(
          `✅ [MyBasketmainLeft UTC FILTER] Match included: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          {
            fixtureUTCDate: fixture.fixture.date,
            extractedUTCDate: fixtureDateString,
            selectedDate,
            status: fixture.fixture.status.short
          },
        );

        return true;
      }

      return false;
    });

    console.log(
      `✅ [MyBasketmainLeft UTC] After UTC filtering: ${filtered.length} matches for ${selectedDate}`,
    );
    return filtered;
  }, [fixtures, selectedDate]);

  // Fetch live basketball fixtures
  const { data: liveBasketballFixtures = [], isLoading: isLoadingLive } = useQuery({
    queryKey: ["basketball-live-fixtures"],
    queryFn: async () => {
      console.log("Fetching basketball live fixtures");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();
      // Filter for basketball only (you may need to adjust this based on your API)
      const basketballFixtures = data.filter((fixture: any) => 
        fixture.league?.name?.toLowerCase().includes('basketball') ||
        fixture.league?.name?.toLowerCase().includes('nba') ||
        fixture.league?.name?.toLowerCase().includes('euroleague')
      );
      console.log(`Received ${basketballFixtures.length} basketball live fixtures`);
      return basketballFixtures;
    },
    staleTime: 30000,
    gcTime: 2 * 60 * 1000,
    enabled: liveFilterActive,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 30000,
  });

  const handleMatchClick = (matchId: number) => {
    console.log('🏀 [MyBasketmainLeft] Basketball match clicked:', matchId);
    onMatchClick?.(matchId);
  };

  const handleMatchCardClick = (fixture: any) => {
    console.log('🏀 [MyBasketmainLeft] Basketball match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      source: 'MyBasketmainLeft'
    });
    onMatchCardClick?.(fixture);
  };

  return (
    <div>
      {liveFilterActive ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8 text-center">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Live Basketball Games</h3>
          {isLoadingLive ? (
            <p className="text-gray-600">Loading live games...</p>
          ) : liveBasketballFixtures.length > 0 ? (
            <div className="space-y-3">
              {liveBasketballFixtures.map((fixture: any) => (
                <div 
                  key={fixture.fixture?.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => handleMatchCardClick(fixture)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{fixture.teams?.home?.name}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-bold">
                        {fixture.goals?.home || 0} - {fixture.goals?.away || 0}
                      </span>
                      <div className="text-xs text-red-500 font-medium">LIVE</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{fixture.teams?.away?.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No live basketball games at the moment</p>
          )}
        </div>
      ) : (
        <div>
          <TodayMatchPageCard
            fixtures={filteredFixtures}
            onMatchClick={handleMatchClick}
            onMatchCardClick={handleMatchCardClick}
          />
        </div>
      )}
    </div>
  );
};

export default MyBasketmainLeft;