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
import CombinedLeagueCards from "./CombinedLeagueCards";
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

  // Fetch live fixtures only
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

  // Process live fixtures
  const processedLiveFixtures = useMemo(() => {
    return liveFixturesData.filter((fixture) => {
      const status = fixture.fixture.status.short;
      return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
    });
  }, [liveFixturesData]);

  // Calculate summary stats from live fixtures only (popular league stats will be shown in TodayPopularFootballLeaguesNew)
  const summaryStats = useMemo(() => {
    const liveCount = processedLiveFixtures.length;

    // Get top leagues and countries from live matches
    const leagueCounts = processedLiveFixtures.reduce((acc: any, f) => {
      const leagueName = f.league?.name;
      if (leagueName) {
        acc[leagueName] = (acc[leagueName] || 0) + 1;
      }
      return acc;
    }, {});

    const countryCounts = processedLiveFixtures.reduce((acc: any, f) => {
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
      liveCount,
      topLeagues,
      topCountries,
    };
  }, [processedLiveFixtures]);

  const isLoading = liveLoading;

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
            {[1, 2, 3].map((i) => (
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

  return (
    <>
      {/* Live Matches Summary - Only if there are live matches */}
      {summaryStats.liveCount > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-500" />
                <div className="text-lg font-semibold">Live Matches</div>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {summaryStats.liveCount}
              </div>
            </div>

            {summaryStats.topLeagues.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-700 mb-1">Live Leagues:</div>
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
                    <div className="font-semibold text-gray-700 mb-1">Live Countries:</div>
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
      )}

      {/* Use new CombinedLeagueCards component */}
      <CombinedLeagueCards
        selectedDate={selectedDate}
        timeFilterActive={timeFilterActive}
        showTop20={true}
        liveFilterActive={liveFilterActive}
      />
    </>
  );
};

export default TodayMatchByTime;