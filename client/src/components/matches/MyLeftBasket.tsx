
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { RootState, uiActions } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, MapPin, Tv, TrendingUp, Users, Zap } from "lucide-react";
import { format, parseISO, addDays, subDays } from "date-fns";
import TodayPopularFootballLeaguesNew from "@/components/matches/TodayPopularFootballLeaguesNew";
import TodaysMatchesByCountryNew from "@/components/matches/TodaysMatchesByCountryNew";
import LiveMatchForAllCountry from "@/components/matches/LiveMatchForAllCountry";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import MyHomeFeaturedMatchNew from "@/components/matches/MyHomeFeaturedMatchNew";

interface MyLeftBasketProps {
  fixtures: any[];
  onMatchClick?: (matchId: number) => void;
  onMatchCardClick?: (fixture: any) => void;
}

const MyLeftBasket: React.FC<MyLeftBasketProps> = ({ 
  fixtures, 
  onMatchClick,
  onMatchCardClick
}) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [timeFilterActive, setTimeFilterActive] = useState(false);

  // Dedicated date display function for MyLeftBasket
  const getTodayMatchPageDisplayName = () => {
    const today = getCurrentUTCDateString();
    const yesterday = format(subDays(parseISO(today), 1), "yyyy-MM-dd");
    const tomorrow = format(addDays(parseISO(today), 1), "yyyy-MM-dd");

    if (selectedDate === today) {
      return "Today's Matches";
    } else if (selectedDate === yesterday) {
      return "Yesterday's Matches";
    } else if (selectedDate === tomorrow) {
      return "Tomorrow's Matches";
    } else {
      // For any other date, show the formatted date
      return format(parseISO(selectedDate), "EEE, do MMM");
    }
  };

  // Fetch live fixtures once when either live filter is active
  const { data: sharedLiveFixtures = [], isLoading: isLoadingLive } = useQuery({
    queryKey: ["shared-live-fixtures"],
    queryFn: async () => {
      console.log("Fetching shared live fixtures");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();
      console.log(`Received ${data.length} shared live fixtures`);
      return data;
    },
    staleTime: 30000,
    gcTime: 2 * 60 * 1000,
    enabled: liveFilterActive, // Only fetch when live filter is active
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 30000,
  });

  console.log(`📊 [MyLeftBasket] Rendering for date: ${selectedDate}
  - Live filter active: ${liveFilterActive}
  - Time filter active: ${timeFilterActive}
  - Total fixtures: ${fixtures?.length || 0}
  - Live fixtures: ${sharedLiveFixtures?.length || 0}`);

  return (
    <>
      <Card className="bg-white/95 backdrop-blur-sm border-gray-200/50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {getTodayMatchPageDisplayName()}
            </h2>
            
            <div className="flex items-center gap-2">
              {/* Live button */}
              <button 
                onClick={() => {
                  setLiveFilterActive(!liveFilterActive);
                  setTimeFilterActive(false); // Reset time filter when live filter is activated
                }}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit transition-all duration-200 ${
                  liveFilterActive 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-300 text-black hover:bg-gray-400'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Live
              </button>

              {/* Spacer to maintain layout */}
              <div className="flex items-center gap-2"></div>

              {/* By time button */}
              <button 
                onClick={() => {
                  setTimeFilterActive(!timeFilterActive);
                  setLiveFilterActive(false); // Reset live filter when time filter is activated
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
        </CardHeader>
      </Card>

      {liveFilterActive ? (
        <LiveMatchForAllCountry />
      ) : (
        <>
          <TodayPopularFootballLeaguesNew 
            selectedDate={selectedDate} 
            timeFilterActive={timeFilterActive}
            showTop20={timeFilterActive}
            onMatchCardClick={onMatchCardClick}
          />
          <TodaysMatchesByCountryNew 
            selectedDate={selectedDate}
            onMatchCardClick={onMatchCardClick}
          />
        </>
      )}
    </>
  );
};

export default MyLeftBasket;
