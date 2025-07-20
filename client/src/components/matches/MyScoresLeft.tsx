
import React, { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { setSelectedDate } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, subDays, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Zap, TrendingUp, Users } from "lucide-react";
import TodaysMatchesByCountryNew from "./TodaysMatchesByCountryNew";
import LiveMatchForAllCountry from "./LiveMatchForAllCountry";
import TodayMatchByTime from "./TodayMatchByTime";
import MyNewPopularLeague from "./MyNewPopularLeague";
import BrandedLoading from "@/components/common/BrandedLoading";
import { apiRequest } from "@/lib/enhancedApiWrapper";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";

interface MyScoresLeftProps {
  fixtures?: any[];
  onMatchClick?: (matchId: number) => void;
  onMatchCardClick?: (fixture: any) => void;
  className?: string;
}

const MyScoresLeft: React.FC<MyScoresLeftProps> = ({
  fixtures = [],
  onMatchClick,
  onMatchCardClick,
  className = "",
}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [timeFilterActive, setTimeFilterActive] = useState(false);

  // Dedicated date display function for MyScoresLeft
  const getMyScoresLeftDisplayName = () => {
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

  console.log(`📊 [MyScoresLeft] Rendering for date: ${selectedDate}
    - Active filter: ${activeFilter}
    - Live filter: ${liveFilterActive}
    - Time filter: ${timeFilterActive}
    - Available fixtures: ${fixtures.length}
    - Live fixtures available: ${sharedLiveFixtures.length}`);

  const handleMatchCardClick = (fixture: any) => {
    console.log('🎯 [MyScoresLeft] Match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      source: 'MyScoresLeft'
    });
    onMatchCardClick?.(fixture);
  };

  const handleLiveMatchClick = (fixture: any) => {
    console.log('🔴 [MyScoresLeft] LIVE Match card clicked from LiveMatchForAllCountry:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      status: fixture.fixture?.status?.short,
      source: 'LiveMatchForAllCountry'
    });
    onMatchCardClick?.(fixture);
  };

  return (
    <>
      <Card className={`w-full shadow-lg ${className}`}>
        <CardHeader className="pb-4 space-y-0">
          <div className="flex flex-col space-y-3">
            {/* Header Title */}
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                {getMyScoresLeftDisplayName()}
              </CardTitle>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={liveFilterActive ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log('🔴 [MyScoresLeft] Live filter toggled:', !liveFilterActive);
                  setLiveFilterActive(!liveFilterActive);
                  setTimeFilterActive(false);
                  setActiveFilter(liveFilterActive ? "all" : "live");
                }}
                className="flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                Live
                {liveFilterActive && (
                  <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                    {sharedLiveFixtures.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant={timeFilterActive ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log('⏰ [MyScoresLeft] Time filter toggled:', !timeFilterActive);
                  setTimeFilterActive(!timeFilterActive);
                  setLiveFilterActive(false);
                  setActiveFilter(timeFilterActive ? "all" : "time");
                }}
                className="flex items-center gap-1"
              >
                <Clock className="h-3 w-3" />
                By time
              </Button>

              <Button
                variant={
                  !liveFilterActive && !timeFilterActive ? "default" : "outline"
                }
                size="sm"
                onClick={() => {
                  console.log('🏆 [MyScoresLeft] Popular leagues filter activated');
                  setLiveFilterActive(false);
                  setTimeFilterActive(false);
                  setActiveFilter("popular");
                }}
                className="flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Popular Football Leagues
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Content based on active filter */}
          {liveFilterActive ? (
            <div className="space-y-4">
              {isLoadingLive ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : sharedLiveFixtures.length > 0 ? (
                <LiveMatchForAllCountry
                  selectedDate={selectedDate}
                  liveFilterActive={liveFilterActive}
                  onMatchCardClick={handleLiveMatchClick}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No live matches at the moment</p>
                </div>
              )}
            </div>
          ) : timeFilterActive ? (
            <TodayMatchByTime
              selectedDate={selectedDate}
              timeFilterActive={timeFilterActive}
              liveFilterActive={false}
              onMatchCardClick={handleMatchCardClick}
            />
          ) : (
            <div className="space-y-4">
              {/* Popular Football Leagues */}
              <MyNewPopularLeague
                selectedDate={selectedDate}
                onMatchCardClick={handleMatchCardClick}
              />
              
              {/* Today's Matches by Country */}
              <TodaysMatchesByCountryNew
                selectedDate={selectedDate}
                liveFilterActive={false}
                timeFilterActive={false}
                onMatchCardClick={handleMatchCardClick}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default MyScoresLeft;
