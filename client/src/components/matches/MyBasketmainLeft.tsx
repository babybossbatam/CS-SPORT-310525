
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, addDays, subDays } from "date-fns";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/utils";

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
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return format(today, "yyyy-MM-dd");
  });
  
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [timeFilterActive, setTimeFilterActive] = useState(false);

  // Get current UTC date string
  const getCurrentUTCDateString = () => {
    const now = new Date();
    return format(now, "yyyy-MM-dd");
  };

  // Dedicated date display function for Basketball
  const getBasketballDisplayName = () => {
    const today = getCurrentUTCDateString();
    const yesterday = format(subDays(parseISO(today), 1), "yyyy-MM-dd");
    const tomorrow = format(addDays(parseISO(today), 1), "yyyy-MM-dd");

    if (selectedDate === today) {
      return "Today's Basketball Games";
    } else if (selectedDate === yesterday) {
      return "Yesterday's Basketball Games";
    } else if (selectedDate === tomorrow) {
      return "Tomorrow's Basketball Games";
    } else {
      return format(parseISO(selectedDate), "EEE, do MMM");
    }
  };

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
    <>
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {getBasketballDisplayName()}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Live button */}
            <button 
              onClick={() => {
                setLiveFilterActive(!liveFilterActive);
                setTimeFilterActive(false);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit transition-all duration-200 ${
                liveFilterActive 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-300 text-black hover:bg-gray-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${liveFilterActive ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
              LIVE
            </button>

            {/* Spacer */}
            <div className="flex items-center gap-2"></div>

            {/* By time button */}
            <button 
              onClick={() => {
                setTimeFilterActive(!timeFilterActive);
                setLiveFilterActive(false);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit transition-all duration-200 ${
                timeFilterActive 
                  ? 'bg-gray-400 text-black hover:bg-gray-500' 
                  : 'bg-gray-300 text-black hover:bg-gray-400'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              By time
            </button>
          </div>
        </div>
      </Card>

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
        <div className="space-y-4">
          {/* Basketball News Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <h3 className="font-semibold text-gray-700 p-3">Basketball News</h3>
            <div className="px-3 pb-3">
              <p className="text-gray-600 text-sm">Live Basketball News</p>
              <p className="text-gray-500 text-xs mt-1">No news available at the moment</p>
            </div>
          </div>
          
          {/* Coming Soon Message */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Basketball Scores Coming Soon</h2>
            <p className="text-gray-600">
              We're working on adding basketball scores and statistics. Check back soon for updates on NBA, EuroLeague, and other basketball competitions!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default MyBasketmainLeft;
