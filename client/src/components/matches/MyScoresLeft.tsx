import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Filter, Activity } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import TodayPopularFootballLeaguesNew from "./TodayPopularFootballLeaguesNew";
import TodaysMatchesByCountryNew from "./TodaysMatchesByCountryNew";
import LiveMatchForAllCountry from "./LiveMatchForAllCountry";
import LiveMatchByTime from "./LiveMatchByTime";
import TodayMatchByTime from "./TodayMatchByTime";
import MyNewPopularLeague from "./MyNewPopularLeague";
import EnhancementLeague from "./EnhancementLeague";
import MyNewLeague from "./MyNewLeague";
import MyScoresTab from "./MyScoresTab";
import MyScoresCard from "./MyScoresCard";
import MySelectionCard from "./MySelectionCard";
import TeamSelectionModal from "../modals/TeamSelectionModal";
import { useCachedQuery } from "@/lib/cachingHelper";

import { format, parseISO, addDays, subDays } from "date-fns";
import {
  formatYYYYMMDD,
  getCurrentUTCDateString,
} from "@/lib/dateUtilsUpdated";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import {
  shouldExcludeFromPopularLeagues,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";
import { Button } from "../ui/button";

interface MyScoresLeftProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
  onMatchCardClick?: (fixture: any) => void;
}

export const MyScoresLeft = ({
  fixtures,
  onMatchClick,
  onMatchCardClick,
}: MyScoresLeftProps) => {
  const [timeFilterActive, setTimeFilterActive] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getCurrentUTCDateString());
  const [selectedTab, setSelectedTab] = useState("my-scores");
  const [selectedTeams, setSelectedTeams] = useState<any[]>([]);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Handle button state changes when date changes
  useEffect(() => {
    const today = getCurrentUTCDateString();
    if (liveFilterActive && timeFilterActive && selectedDate !== today) {
      // If both filters are active and date changes from today, activate time filter and deactivate live
      setLiveFilterActive(false);
      setTimeFilterActive(false);
    } else if (liveFilterActive && selectedDate !== today) {
      // If only live filter is active but date is not today, switch to time filter
      setLiveFilterActive(false);
      setTimeFilterActive(false);
    }
  }, [selectedDate, liveFilterActive, timeFilterActive]);

  // Date navigation handlers
  const goToPreviousDay = () => {
    const newDate = format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd");
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd");
    setSelectedDate(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const selectedDateString = formatYYYYMMDD(date);
      setSelectedDate(selectedDateString);
      setIsCalendarOpen(false);
    }
  };

  const goToToday = () => {
    const today = getCurrentUTCDateString();
    setSelectedDate(today);
    setIsCalendarOpen(false);
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

  console.log(`📊 [MyScoresLeft] Rendering for date: ${selectedDate}`);

  const handleMatchCardClick = (fixture: any) => {
    console.log("🎯 [MyScoresLeft] Match card clicked:", {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      source: "MyScoresLeft",
    });
    onMatchCardClick?.(fixture);
  };

  const handleLiveMatchClick = (fixture: any) => {
    console.log(
      "🔴 [MyScoresLeft] LIVE Match card clicked from LiveMatchForAllCountry:",
      {
        fixtureId: fixture.fixture?.id,
        teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
        league: fixture.league?.name,
        country: fixture.league?.country,
        status: fixture.fixture?.status?.short,
        source: "LiveMatchForAllCountry",
      },
    );
    onMatchCardClick?.(fixture);
  };

  const handleTeamSelectionComplete = (teams: any[]) => {
    setSelectedTeams(teams);
    setShowTeamSelection(false);
  };

  const handleRemoveTeam = (teamId: string | number) => {
    setSelectedTeams(prev => prev.filter(team => team.id !== teamId));
  };

  return (
    <>
      <Card className="shadow-md w-full mb-4">


        {/* Functioning Tabs section similar to MyScoresTab */}
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="bg-transparent border-b border-gray-200 rounded-none h-auto p-0 w-full flex">
            <button
              onClick={() => setSelectedTab("my-scores")}
              className={`border-b-2 rounded-none font-medium flex-1 py-2 text-center transition-colors duration-200 ${
                selectedTab === "my-scores"
                  ? "border-blue-300 text-blue-400"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              My Scores
            </button>
            <button
              onClick={() => setSelectedTab("my-selections")}
              className={`border-b-2 rounded-none font-medium flex-1 py-4 text-center transition-colors duration-200 ${
                selectedTab === "my-selections"
                  ? "border-blue-300 text-blue-400"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              My Selections
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-4 mt-[20px] text-[110.25%] h-9">
          {/* Live button */}
          <button
            onClick={() => {
              if (!liveFilterActive) {
                // Activating live filter
                setLiveFilterActive(true);
                const today = getCurrentUTCDateString();
                setSelectedDate(today);
                // If time filter is active, keep it active for combined state
                // Otherwise reset it
                if (!timeFilterActive) {
                  setTimeFilterActive(false);
                }
              } else {
                // Deactivating live filter
                setLiveFilterActive(false);
                // Only activate time filter if it was already active (combined state)
                // Otherwise return to default view
                if (!timeFilterActive) {
                  // Return to default view (TodayPopularFootballLeaguesNew)
                  setTimeFilterActive(false);
                } else {
                  // Keep time filter active if it was already active
                  setTimeFilterActive(true);
                }
              }
            }}
            className={`flex items-center justify-center gap-1 px-0.5 py-0.5 rounded-full text-xs font-medium w-fit transition-colors duration-200 ${
              liveFilterActive
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-300 text-black hover:bg-gray-400"
            }`}
            style={{ minWidth: "calc(2rem + 15px)" }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${liveFilterActive ? "bg-white" : "bg-red-400"} opacity-75`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${liveFilterActive ? "bg-white" : "bg-red-500"}`}
              ></span>
            </span>
            Live
          </button>

          {/* Spacer to maintain layout */}
          <div className="flex items-center gap-2"></div>

          {/* By time button with navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousDay}
              className="p-1.5 hover:bg-gray-100 rounded-full flex items-center"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => {
                // Check if Live is active but no live matches exist - disable functionality
                if (
                  liveFilterActive &&
                  (!sharedLiveFixtures || sharedLiveFixtures.length === 0)
                ) {
                  return; // Do nothing if Live is active but no live matches
                }

                if (!timeFilterActive) {
                  // Activating by time filter
                  setTimeFilterActive(true);
                  // If live filter is active, keep it active for combined state
                  // Otherwise reset it
                  if (!liveFilterActive) {
                    setLiveFilterActive(false);
                  }
                } else {
                  // Deactivating by time filter
                  setTimeFilterActive(false);
                  // Only activate live if it wasn't already active
                  if (!liveFilterActive) {
                    // Return to default view (TodayPopularFootballLeaguesNew)
                    setLiveFilterActive(false);
                  } else {
                    // Keep live active if it was already active
                    const today = getCurrentUTCDateString();
                    setSelectedDate(today);
                  }
                }
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit transition-all duration-200 ${
                // Disable button appearance when Live is active but no live matches
                liveFilterActive &&
                (!sharedLiveFixtures || sharedLiveFixtures.length === 0)
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : timeFilterActive
                    ? "bg-blue-400 text-white hover:bg-blue-500"
                    : "bg-gray-300 text-black hover:bg-gray-400"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              By time
            </button>

            <button
              onClick={goToNextDay}
              className="p-1.5 hover:bg-gray-100 rounded-full flex items-center"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Team Selection Modal */}
      <TeamSelectionModal
        open={showTeamSelection}
        onOpenChange={setShowTeamSelection}
        onTeamSelectionComplete={handleTeamSelectionComplete}
      />



      {/* Conditional rendering based on selected tab */}
      {selectedTab === "my-selections" ? (
        selectedTeams.length > 0 ? (
          <MySelectionCard 
            selectedTeams={selectedTeams}
            onRemoveTeam={handleRemoveTeam}
            onShowTeamSelection={() => setShowTeamSelection(true)}
          />
        ) : (
          <>
            <Card className="mx-auto">
              <CardContent>
                <span>My Teams and Leagues</span>
                  
               
              </CardContent>
            </Card>

            <div className=" relative mt-16">
              <img
                src="/assets/matchdetaillogo/favorite icon.svg"
                alt="Favorite"
                width="80"
                height="80"
                className="mx-auto"
              />
            </div>
            <p className="mb-2  mt-4 text-sm text-center text-gray-600 mx-auto max-w-xs">
              Select Teams and Competitions to follow them here
            </p>

            <Button
              onClick={() => setShowTeamSelection(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-24 py-3 rounded-full text-sm font-medium mx-auto block"
            >
              Browse
            </Button>
          </>
        )
      ) : (
        <MyScoresCard 
          selectedTab={selectedTab} 
          onTabChange={setSelectedTab}
          selectedTeams={selectedTeams}
          onShowTeamSelection={() => setShowTeamSelection(true)}
        />
      )}

      {liveFilterActive && timeFilterActive ? (
        // Combined state: Show live matches grouped by time
        <LiveMatchByTime
          liveFilterActive={liveFilterActive}
          timeFilterActive={timeFilterActive}
          liveFixtures={sharedLiveFixtures}
          setLiveFilterActive={setLiveFilterActive}
        />
      ) : liveFilterActive && !timeFilterActive ? (
        // Live only - show LiveMatchForAllCountry
        <LiveMatchForAllCountry
          liveFilterActive={liveFilterActive}
          timeFilterActive={timeFilterActive}
          liveFixtures={sharedLiveFixtures}
          setLiveFilterActive={setLiveFilterActive}
          onMatchCardClick={handleMatchCardClick}
        />
      ) : timeFilterActive && !liveFilterActive ? (
        // Time only - show new TodayMatchByTime component
        <TodayMatchByTime
          selectedDate={selectedDate}
          timeFilterActive={timeFilterActive}
          liveFilterActive={liveFilterActive}
        />
      ) : (
        // Neither filter active - show default view
        <>
          <MyNewLeague
            selectedDate={selectedDate}
            timeFilterActive={false}
            showTop10={false}
            liveFilterActive={liveFilterActive}
            onMatchCardClick={handleMatchCardClick}
            useUTCOnly={true}
          />
        </>
      )}
    </>
  );
};

export default MyScoresLeft;