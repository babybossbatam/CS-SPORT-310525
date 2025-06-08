import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { isNationalTeam } from "../../lib/teamLogoSources";
import LazyImage from "../common/LazyImage";
import UnifiedMatchCards from "./UnifiedMatchCards";
import TodayPopularFootballLeaguesNew from "./TodayPopularFootballLeaguesNew";
import LiveMatchByTime from "./LiveMatchByTime";
import "../../styles/MyLogoPositioning.css";

interface TodayMatchByTimeProps {
  selectedDate: string;
  refreshInterval?: number;
  isTimeFilterActive?: boolean;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  refreshInterval = 30000,
  isTimeFilterActive = false,
  liveFilterActive = false,
  timeFilterActive = false,
}) => {
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [liveFixtures, setLiveFixtures] = useState<any[]>([]);
  const [popularLeagueFixtures, setPopularLeagueFixtures] = useState<any[]>([]);

  const toggleStarMatch = (fixtureId: number) => {
    const newStarred = new Set(starredMatches);
    if (newStarred.has(fixtureId)) {
      newStarred.delete(fixtureId);
    } else {
      newStarred.add(fixtureId);
    }
    setStarredMatches(newStarred);
  };

  // Fetch live fixtures
  const { data: liveFixturesData = [], isLoading: liveLoading } = useQuery({
    queryKey: ["live-fixtures-all-countries"],
    queryFn: async () => {
      console.log("Fetching live fixtures for all countries");
      const response = await apiRequest("GET", "/api/fixtures/live");
      const data = await response.json();
      console.log(`Received ${data.length} live fixtures`);
      return data;
    },
    staleTime: 30000,
    gcTime: 2 * 60 * 1000,
    enabled: enableFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: refreshInterval,
  });

  // Fetch popular league fixtures for the selected date
  const { data: popularFixtures = [], isLoading: popularLoading } = useQuery({
    queryKey: ["popular-fixtures-by-date", selectedDate],
    queryFn: async () => {
      console.log(`Fetching popular fixtures for date: ${selectedDate}`);
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();
      console.log(`Received ${data?.length || 0} fixtures for ${selectedDate}`);
      return data;
    },
    enabled: !!selectedDate && enableFetching,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Process live fixtures
  const processedLiveFixtures = useMemo(() => {
    return liveFixturesData.filter((fixture) => {
      const status = fixture.fixture.status.short;
      return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
    });
  }, [liveFixturesData]);

  // Process popular league fixtures using smart time filtering
  const processedPopularFixtures = useMemo(() => {
    if (!popularFixtures?.length) return [];

    return popularFixtures.filter((fixture) => {
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z",
        );

        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = format(tomorrow, "yyyy-MM-dd");
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = format(yesterday, "yyyy-MM-dd");

        const shouldInclude = (() => {
          if (selectedDate === tomorrowString && smartResult.label === "tomorrow") return true;
          if (selectedDate === todayString && smartResult.label === "today") return true;
          if (selectedDate === yesterdayString && smartResult.label === "yesterday") return true;

          if (
            selectedDate !== todayString &&
            selectedDate !== tomorrowString &&
            selectedDate !== yesterdayString
          ) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange) return true;
          }

          return false;
        })();

        return shouldInclude;
      }
      return false;
    });
  }, [popularFixtures, selectedDate]);

  // Calculate summary stats from combined data
  const summaryStats = useMemo(() => {
    const allMatches = [...processedLiveFixtures, ...processedPopularFixtures];

    // Remove duplicates based on fixture ID
    const uniqueMatches = allMatches.filter((match, index, arr) => 
      arr.findIndex(m => m.fixture.id === match.fixture.id) === index
    );

    const totalMatches = uniqueMatches.length;
    const liveCount = uniqueMatches.filter((f) =>
      ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(f.fixture.status.short)
    ).length;
    const upcomingCount = uniqueMatches.filter((f) =>
      ["NS", "TBD"].includes(f.fixture.status.short)
    ).length;
    const finishedCount = uniqueMatches.filter((f) =>
      ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(f.fixture.status.short)
    ).length;

    // Get top leagues and countries
    const leagueCounts = uniqueMatches.reduce((acc: any, f) => {
      const leagueName = f.league?.name;
      if (leagueName) {
        acc[leagueName] = (acc[leagueName] || 0) + 1;
      }
      return acc;
    }, {});

    const countryCounts = uniqueMatches.reduce((acc: any, f) => {
      const country = f.league?.country;
      if (country) {
        acc[country] = (acc[country] || 0) + 1;
      }
      return acc;
    }, {});

    const topLeagues = Object.entries(leagueCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name]) => name);

    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name]) => name);

    return {
      totalMatches,
      liveCount,
      upcomingCount,
      finishedCount,
      topLeagues,
      topCountries,
    };
  }, [processedLiveFixtures, processedPopularFixtures]);

  const isLoading = liveLoading || popularLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-3 w-44" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!processedLiveFixtures.length && !processedPopularFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Summary Stats Card */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {summaryStats.totalMatches}
              </div>
              <div className="text-sm text-gray-600">Total Matches</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {summaryStats.liveCount}
              </div>
              <div className="text-sm text-gray-600">Live Now</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {summaryStats.upcomingCount}
              </div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {summaryStats.finishedCount}
              </div>
              <div className="text-sm text-gray-600">Finished</div>
            </div>
          </div>

          {summaryStats.topLeagues.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Top Leagues:</div>
                  <div className="text-gray-600">
                    {summaryStats.topLeagues.map((league, index) => (
                      <span key={league}>
                        • {safeSubstring(league, 0)}
                        {index < summaryStats.topLeagues.length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Top Countries:</div>
                  <div className="text-gray-600">
                    {summaryStats.topCountries.map((country, index) => (
                      <span key={country}>
                        • {safeSubstring(country, 0)}
                        {index < summaryStats.topCountries.length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Match Cards combining live and popular league data */}
      <UnifiedMatchCards
        liveMatches={processedLiveFixtures}
        popularLeagueMatches={processedPopularFixtures}
        title={
          liveFilterActive && timeFilterActive
            ? "Live & Popular Matches"
            : liveFilterActive
            ? "Live Matches"
            : timeFilterActive
            ? "All Matches by Time"
            : "Today's Matches"
        }
        showStars={true}
        maxMatches={timeFilterActive ? 50 : undefined}
      />
    </>
  );
};

export default TodayMatchByTime;