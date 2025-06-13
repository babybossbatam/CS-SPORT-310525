
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

  // Major competitions mapping with their league IDs (All World Leagues)
  const MAJOR_COMPETITIONS = {
    "Euro Championship": [4],
    "Confederations Cup": [21],
    "World Cup": [1],
    "Asian Games": [803],
    "Caribbean Cup": [804],
    "UEFA Champions League": [2],
    "Asian Cup": [7],
    "FIFA Club World Cup": [15],
    "Olympics Men": [480],
    "CECAFA Senior Challenge Cup": [535],
    "SAFF Championship": [28],
    "UEFA Europa League": [3],
    "World Cup - Qualification Intercontinental Play-offs": [37],
    "AFC Challenge Cup": [807],
    "African Nations Championship": [19],
    "AFF Championship": [24],
    "CONCACAF Gold Cup": [22],
    "EAFF E-1 Football Championship": [23],
    "OFC Champions League": [27],
    "Africa Cup of Nations": [6],
    "Copa America": [9],
    "UEFA Super Cup": [531],
    "CONCACAF Champions League": [16],
    "AFC Champions League": [17],
    "Gulf Cup of Nations": [25],
    "International Champions Cup": [26],
    "Copa Centroamericana": [805],
    "OFC Nations Cup": [806],
    "China Cup": [766],
    "Friendlies": [10],
    "UEFA Youth League": [14],
    "AFC Cup": [18],
    "CAF Confederation Cup": [20],
    "UEFA U21 Championship": [38],
    "World Cup - U20": [490],
    "UEFA Nations League": [5],
    "CONCACAF Nations League - Qualification": [808],
    "World Cup - Qualification CONCACAF": [31],
    "World Cup - Qualification Europe": [32],
    "World Cup - Qualification Oceania": [33],
    "World Cup - Qualification South America": [34],
    "World Cup - Qualification Africa": [29],
    "World Cup - Qualification Asia": [30],
    "UEFA U19 Championship": [493],
    "CONCACAF U20": [537],
    "Asian Cup - Qualification": [35],
    "CAF Super Cup": [533],
    "CONCACAF Caribbean Club Shield": [534],
    "CONMEBOL Sudamericana": [11],
    "CAF Champions League": [12],
    "CONMEBOL Libertadores": [13],
    "Arab Club Champions Cup": [768],
    "Premier League Asia Trophy": [769],
    "Pacific Games": [770],
    "Leagues Cup": [772],
    "Sudamericano U20": [773],
    "World Cup - U17": [587],
    "CONCACAF League": [767],
    "COSAFA U20 Championship": [771],
    "Baltic Cup": [849],
    "AFC U23 Asian Cup": [532],
    "CONCACAF Nations League": [536],
    "Africa Cup of Nations U20": [538],
    "CONMEBOL Libertadores U20": [540],
    "CONMEBOL Recopa": [541],
    "Olympics Men - Qualification Concacaf": [881],
    "Campeones Cup": [885],
    "Friendlies Clubs": [667],
    "UEFA Europa Conference League": [848],
    "CONCACAF Caribbean Club Championship": [856],
    "CONCACAF Gold Cup - Qualification": [858],
    "COSAFA Cup": [859],
    "Arab Cup": [860],
    "Youth Viareggio Cup": [910],
    "CECAFA Club Cup": [869],
    "U20 Elite League": [890],
    "Algarve Cup": [902],
    "The Atlantic Cup": [903],
    "Africa Cup of Nations - Qualification": [36],
    "CONMEBOL Libertadores Femenina": [949],
    "South American Youth Games": [951],
    "AFC U23 Asian Cup - Qualification": [952],
    "Africa U23 Cup of Nations - Qualification": [953],
    "UEFA U17 Championship - Qualification": [886],
    "UEFA U19 Championship - Qualification": [893],
    "Tipsport Malta Cup": [900],
    "SheBelieves Cup": [904],
    "CAC Games": [1016],
    "AFF U23 Championship": [908],
    "Southeast Asian Games": [911],
    "CONMEBOL - UEFA Finalissima": [913],
    "Tournoi Maurice Revello": [914],
    "Kirin Cup": [916],
    "Mediterranean Games": [919],
    "UEFA U17 Championship": [921],
    "Copa America Femenina": [926],
    "AFF U19 Championship": [928],
    "Arab Championship - U20": [934],
    "Emirates Cup": [937],
    "COTIF Tournament": [940],
    "Islamic Solidarity Games": [941],
    "King's Cup": [1038],
    "Premier League International Cup": [1039],
    "African Football League": [1043],
    "Pan American Games": [1045],
    "All Africa Games": [1072],
    "Euro Championship - Qualification": [960],
    "CONCACAF U17": [963],
    "AFC U20 Asian Cup": [965],
    "CONMEBOL - U17": [970],
    "CAF Cup of Nations - U17": [973],
    "CAFA Nations Cup": [1008],
    "AFC U17 Asian Cup": [1012],
    "CAF U23 Cup of Nations": [1015],
    "UEFA - CONMEBOL - Club Challenge": [1024],
    "Concacaf Central American Cup": [1028],
    "UEFA U21 Championship - Qualification": [850],
    "AFC U20 Asian Cup - Qualification": [1153],
    "CECAFA U20 Championship": [1159],
    "AFC U17 Asian Cup - Qualification": [1161],
    "AGCFF Gulf Champions League": [1162],
    "African Nations Championship - Qualification": [1163],
    "CONMEBOL - Pre-Olympic Tournament": [1060],
    "CONCACAF U20 - Qualification": [1066],
    "WAFF Championship U23": [1077],
    "CONMEBOL - U17 Femenino": [1081],
    "CONMEBOL U20 Femenino": [1085],
    "UAE-Qatar - Super Shield": [1089],
    "Olympics - Intercontinental Play-offs": [1105],
    "OFC U19 Championship": [1122],
    "Qatar-UAE Super Cup": [1123],
    "ASEAN Club Championship": [1129],
    "AFC Challenge League": [1132],
    "CONCACAF W Champions Cup": [1136],
    "FIFA Intercontinental Cup": [1168],
    "EAFF E-1 Football Championship - Qualification": [1169],
    "FIFA Club World Cup - Play-In": [1186],
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
