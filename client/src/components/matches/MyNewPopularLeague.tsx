
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star } from "lucide-react";
import { useCachedQuery } from "@/lib/cachingHelper";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import {
  shouldExcludeFromPopularLeagues,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";

interface MyNewPopularLeagueProps {
  selectedDate: string;
}

const MyNewPopularLeague: React.FC<MyNewPopularLeagueProps> = ({
  selectedDate,
}) => {
  const [starredCompetitions, setStarredCompetitions] = useState<Set<number>>(
    new Set(),
  );

  // Major competitions mapping with their league IDs
  const MAJOR_COMPETITIONS = {
    "Euro Championship": [4], // European Championship
    "World Cup": [1], // FIFA World Cup
    "UEFA Champions League": [2],
    "FIFA Club World Cup": [15],
    "Olympics Men": [28], // Olympics Football Tournament
    "UEFA Europa League": [3],
    "Africa Cup of Nations": [6], // Africa Cup of Nations
    "Copa America": [9], // Copa America
    "CONCACAF Champions League": [26], // CONCACAF Champions League
    "AFC Champions League": [19], // AFC Champions League
    "Friendlies": [10], // International Friendlies
    "UEFA Nations League": [5],
    "CONMEBOL Sudamericana": [13], // Copa Sudamericana
    "CAF Champions League": [12], // CAF Champions League
    "CONMEBOL Libertadores": [11], // Copa Libertadores
    "UEFA Europa Conference League": [848],
  };

  // Smart cache duration based on date type
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  const cacheMaxAge = isFuture
    ? 4 * 60 * 60 * 1000
    : isToday
      ? 2 * 60 * 60 * 1000
      : 30 * 60 * 1000;

  // Fetch all fixtures for the selected date
  const {
    data: fixtures = [],
    isLoading,
    isFetching,
  } = useCachedQuery(
    ["major-competitions-fixtures", selectedDate],
    async () => {
      console.log(
        `🔄 [MyNewPopularLeague] Fetching data for date: ${selectedDate}`,
      );
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();
      console.log(
        `✅ [MyNewPopularLeague] Received ${data?.length || 0} fixtures for ${selectedDate}`,
      );
      return data;
    },
    {
      enabled: !!selectedDate,
      maxAge: cacheMaxAge,
      backgroundRefresh: false,
      staleTime: cacheMaxAge,
      gcTime: cacheMaxAge * 2,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  // Filter and group fixtures by major competitions
  const majorCompetitionsData = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(
      `🔍 [MyNewPopularLeague] Processing ${fixtures.length} fixtures for major competitions`,
    );

    const competitionsWithMatches: Array<{
      name: string;
      icon: string;
      matchCount: number;
      matches: any[];
      leagueIds: number[];
    }> = [];

    // Process each major competition
    Object.entries(MAJOR_COMPETITIONS).forEach(([competitionName, leagueIds]) => {
      const competitionMatches = fixtures.filter((fixture) => {
        // Check if fixture belongs to this competition
        const belongsToCompetition = leagueIds.includes(fixture.league?.id);
        
        if (!belongsToCompetition) return false;

        // Apply smart time filtering
        if (fixture.fixture.date && fixture.fixture.status?.short) {
          const smartResult = MySmartTimeFilter.getSmartTimeLabel(
            fixture.fixture.date,
            fixture.fixture.status.short,
            selectedDate + "T12:00:00Z",
          );

          const shouldInclude = (() => {
            const today = format(new Date(), "yyyy-MM-dd");
            const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd");
            const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd");

            if (selectedDate === tomorrow && smartResult.label === "tomorrow") return true;
            if (selectedDate === today && smartResult.label === "today") return true;
            if (selectedDate === yesterday && smartResult.label === "yesterday") return true;

            // Custom dates
            if (
              selectedDate !== today &&
              selectedDate !== tomorrow &&
              selectedDate !== yesterday
            ) {
              if (smartResult.label === "custom" && smartResult.isWithinTimeRange) return true;
            }

            return false;
          })();

          return shouldInclude;
        }

        return true;
      });

      if (competitionMatches.length > 0) {
        competitionsWithMatches.push({
          name: competitionName,
          icon: "🏆",
          matchCount: competitionMatches.length,
          matches: competitionMatches,
          leagueIds,
        });
      }
    });

    // Sort by match count (descending) and then by name
    competitionsWithMatches.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return a.name.localeCompare(b.name);
    });

    console.log(
      `🏆 [MyNewPopularLeague] Found ${competitionsWithMatches.length} major competitions with matches`,
    );

    return competitionsWithMatches;
  }, [fixtures, selectedDate]);

  const toggleStarCompetition = (competitionName: string) => {
    const competitionHash = competitionName.replace(/\s+/g, "").toLowerCase().hashCode();
    setStarredCompetitions((prev) => {
      const newStarred = new Set(prev);
      if (newStarred.has(competitionHash)) {
        newStarred.delete(competitionHash);
      } else {
        newStarred.add(competitionHash);
      }
      return newStarred;
    });
  };

  // Add hashCode method to String prototype for simple hashing
  declare global {
    interface String {
      hashCode(): number;
    }
  }

  String.prototype.hashCode = function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
      const char = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  const showLoading = (isLoading && !fixtures?.length) || (isFetching && !fixtures?.length);

  if (showLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
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

  if (!majorCompetitionsData.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No major competitions available for this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        🔥 Major Competitions
      </CardHeader>

      {/* Competition Cards */}
      {majorCompetitionsData.map((competition, index) => {
        const competitionHash = competition.name.replace(/\s+/g, "").toLowerCase().hashCode();
        const isStarred = starredCompetitions.has(competitionHash);

        return (
          <Card
            key={`${competition.name}-${index}`}
            className="border bg-card text-card-foreground shadow-md overflow-hidden mb-2"
          >
            <CardContent className="flex items-center gap-2 p-3 bg-white border-b border-gray-200">
              {/* Star Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStarCompetition(competition.name);
                }}
                className="transition-colors"
                title={`${isStarred ? "Remove from" : "Add to"} favorites`}
              >
                <Star
                  className={`h-5 w-5 transition-all ${
                    isStarred
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              </button>

              {/* Competition Icon */}
              <span className="text-xl">{competition.icon}</span>

              {/* Competition Details */}
              <div className="flex flex-col flex-1">
                <span
                  className="font-semibold text-gray-800"
                  style={{
                    fontFamily:
                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "13.3px",
                  }}
                >
                  {competition.name}
                </span>
                <span
                  className="text-gray-600"
                  style={{
                    fontFamily:
                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "11px",
                  }}
                >
                  {competition.matchCount} match{competition.matchCount !== 1 ? "es" : ""}
                </span>
              </div>

              {/* Match Count Badge */}
              <div className="flex gap-1">
                <span
                  className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium"
                  style={{ fontSize: "calc(0.75rem * 0.85)" }}
                >
                  {competition.matchCount}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};

export default MyNewPopularLeague;
