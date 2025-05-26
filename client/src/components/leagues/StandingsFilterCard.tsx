import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import {
  formatTimeInUserTimezone,
  convertToUserTimezone,
} from "@/lib/dateUtils";
import TimeDebugger from "@/components/debug/TimeDebugger";

const POPULAR_LEAGUES = [
  {
    id: 2,
    name: "Champions League",
    country: "Europe",
    logo: "https://media.api-sports.io/football/leagues/2.png",
  },
  {
    id: 39,
    name: "Premier League",
    country: "England",
    logo: "https://media.api-sports.io/football/leagues/39.png",
  },
  {
    id: 140,
    name: "La Liga",
    country: "Spain",
    logo: "https://media.api-sports.io/football/leagues/140.png",
  },
  {
    id: 135,
    name: "Serie A",
    country: "Italy",
    logo: "https://media.api-sports.io/football/leagues/135.png",
  },
  {
    id: 78,
    name: "Bundesliga",
    country: "Germany",
    logo: "https://media.api-sports.io/football/leagues/78.png",
  },
  {
    id: 3,
    name: "Europa League",
    country: "Europe",
    logo: "https://media.api-sports.io/football/leagues/3.png",
  },
];

// Mock formatTimeInUTC function for demonstration, replace with actual implementation
const formatTimeInUTC = (date: string, formatStr: string) => {
  const utcDate = new Date(date);
  return format(utcDate, formatStr, { timeZone: "UTC" });
};

const StandingsFilterCard = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  const { data: selectedDateMatches } = useQuery({
    queryKey: ["fixtures", selectedDate],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}`,
      );
      const data = await response.json();
      console.log(
        `Fetching matches for selected date: ${selectedDate}, got ${data?.length || 0} matches`,
      );
      return data || [];
    },
    enabled: !!selectedDate,
  });

  // Filter matches for popular leagues only and remove global duplicates
  const popularLeagueIds = POPULAR_LEAGUES.map((league) => league.id);
  const allPopularMatches =
    selectedDateMatches?.filter((match) => {
      // Ensure match belongs to popular league
      const isPopularLeague = popularLeagueIds.includes(match.league.id);

      // Ensure match date matches selected date
      const matchDate = new Date(match.fixture.date)
        .toISOString()
        .split("T")[0];
      const isCorrectDate = matchDate === selectedDate;

      if (isPopularLeague && !isCorrectDate) {
        console.warn(
          `Match ${match.teams.home.name} vs ${match.teams.away.name} has wrong date: ${matchDate}, expected: ${selectedDate}`,
        );
      }

      return isPopularLeague && isCorrectDate;
    }) || [];

  // Debug logging
  console.log("Total matches from API:", selectedDateMatches?.length || 0);
  console.log("Selected date:", selectedDate);
  console.log(
    "Popular league matches before deduplication:",
    allPopularMatches.length,
  );

  // Enhanced global deduplication - use multiple keys to ensure uniqueness
  const popularLeagueMatches = allPopularMatches.filter(
    (match, index, self) => {
      const matchKey = `${match.fixture.id}-${match.teams.home.id}-${match.teams.away.id}-${match.league.id}`;
      return (
        index ===
        self.findIndex((m) => {
          const mKey = `${m.fixture.id}-${m.teams.home.id}-${m.teams.away.id}-${m.league.id}`;
          return mKey === matchKey;
        })
      );
    },
  );

  console.log(
    "Popular league matches after deduplication:",
    popularLeagueMatches.length,
  );

  // Additional deduplication by team names and time
  const finalMatches = popularLeagueMatches.filter((match, index, self) => {
    const matchIdentifier = `${match.teams.home.name}_vs_${match.teams.away.name}_${match.fixture.date}_${match.league.id}`;
    return (
      index ===
      self.findIndex((m) => {
        const mIdentifier = `${m.teams.home.name}_vs_${m.teams.away.name}_${m.fixture.date}_${m.league.id}`;
        return mIdentifier === matchIdentifier;
      })
    );
  });

  console.log(
    "Final matches after enhanced deduplication:",
    finalMatches.length,
  );

  // Group matches by league using final deduplicated matches
  const matchesByLeague = POPULAR_LEAGUES.map((league) => {
    const leagueMatches = finalMatches.filter(
      (match) => match.league.id === league.id,
    );

    // Final deduplication at league level using fixture ID only
    const uniqueLeagueMatches = leagueMatches.filter(
      (match, index, self) =>
        index === self.findIndex((m) => m.fixture.id === match.fixture.id),
    );

    if (uniqueLeagueMatches.length > 0) {
      console.log(
        `League ${league.name} has ${uniqueLeagueMatches.length} matches:`,
        uniqueLeagueMatches.map(
          (m) =>
            `${m.teams.home.name} vs ${m.teams.away.name} (ID: ${m.fixture.id})`,
        ),
      );
    }

    return {
      ...league,
      matches: uniqueLeagueMatches,
    };
  }).filter((league) => league.matches.length > 0);

  return (
    <>
      <Card>
        <TimeDebugger sampleMatch={popularLeagueMatches[0]} />
        <CardContent className="p-4">
          {matchesByLeague.length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                Popular Football Leagues
              </h3>
              {matchesByLeague.map((league) => (
                <div key={league.id} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-5 w-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/fallback-logo.svg";
                      }}
                    />
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">
                        {league.name}
                      </h4>
                      <p className="text-xs text-gray-500">{league.country}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(() => {
                      const liveMatches = league.matches.filter(
                        (match) => match.fixture.status.short === "LIVE",
                      );
                      const finishedMatches = league.matches.filter((match) =>
                        ["FT", "AET", "PEN"].includes(
                          match.fixture.status.short,
                        ),
                      );
                      const upcomingMatches = league.matches.filter(
                        (match) => match.fixture.status.short === "NS",
                      );

                      // Debug logging for match categorization
                      console.log(`League ${league.name} match breakdown:`, {
                        total: league.matches.length,
                        live: liveMatches.length,
                        finished: finishedMatches.length,
                        upcoming: upcomingMatches.length,
                        allMatches: league.matches.map((m) => ({
                          teams: `${m.teams.home.name} vs ${m.teams.away.name}`,
                          status: m.fixture.status.short,
                          homeGoals: m.goals.home,
                          awayGoals: m.goals.away,
                        })),
                      });

                      return (
                        <>
                          {/* Live Matches */}
                          {liveMatches.map((match) => (
                            <div
                              key={match.fixture.id}
                              className="flex items-center justify-between p-2 bg-red-50 rounded text-sm"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <img
                                  src={match.teams.home.logo}
                                  alt={match.teams.home.name}
                                  className="h-4 w-4"
                                />
                                <span className="truncate">
                                  {match.teams.home.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 px-2">
                                <span className="font-bold text-lg">
                                  {match.goals.home ?? 0} -{" "}
                                  {match.goals.away ?? 0}
                                </span>
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-red-500 font-semibold">
                                    LIVE
                                  </span>
                                  <span className="text-xs text-red-500">
                                    {match.fixture.status.elapsed}'
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                <span className="truncate">
                                  {match.teams.away.name}
                                </span>
                                <img
                                  src={match.teams.away.logo}
                                  alt={match.teams.away.name}
                                  className="h-4 w-4"
                                />
                              </div>
                            </div>
                          ))}

                          {/* Finished Matches - Enhanced for all dates including today */}
                          {finishedMatches.map((match) => {
                            const matchDate = new Date(match.fixture.date);
                            const selectedDateObj = new Date(selectedDate);
                            const today = new Date();

                            // Set all times to midnight for proper date comparison
                            today.setHours(0, 0, 0, 0);
                            selectedDateObj.setHours(0, 0, 0, 0);
                            matchDate.setHours(0, 0, 0, 0);

                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);

                            const isToday =
                              selectedDateObj.getTime() === today.getTime();
                            const isYesterday =
                              selectedDateObj.getTime() === yesterday.getTime();
                            const isPastDate =
                              selectedDateObj.getTime() < today.getTime();

                            // Enhanced debugging for finished matches
                            console.log(
                              `🏆 FINISHED MATCH DEBUG: ${match.teams.home.name} vs ${match.teams.away.name}`,
                              {
                                homeGoals: match.goals.home,
                                awayGoals: match.goals.away,
                                homeGoalsType: typeof match.goals.home,
                                awayGoalsType: typeof match.goals.away,
                                homeGoalsNull: match.goals.home === null,
                                awayGoalsNull: match.goals.away === null,
                                status: match.fixture.status.short,
                                statusLong: match.fixture.status.long,
                                isToday,
                                isYesterday,
                                isPastDate,
                                selectedDate,
                                matchDate: match.fixture.date,
                                matchTimestamp: new Date(
                                  match.fixture.date,
                                ).getTime(),
                                currentTime: new Date().getTime(),
                                timeDiff:
                                  (new Date().getTime() -
                                    new Date(match.fixture.date).getTime()) /
                                  (1000 * 60 * 60),
                                fullMatchObject: match,
                              },
                            );

                            return (
                              <div
                                key={`finished-${match.fixture.id}`}
                                className={`flex items-center justify-between p-2 rounded text-sm ${
                                  isToday
                                    ? "bg-green-50 border border-green-200"
                                    : isYesterday
                                      ? "bg-orange-50 border border-orange-200"
                                      : isPastDate
                                        ? "bg-gray-50 border border-gray-200"
                                        : "bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <img
                                    src={match.teams.home.logo}
                                    alt={match.teams.home.name}
                                    className="h-4 w-4"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "/assets/fallback-logo.svg";
                                    }}
                                  />
                                  <span className="truncate">
                                    {match.teams.home.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 px-2">
                                  <span
                                    className={`font-bold text-lg ${
                                      isToday
                                        ? "text-green-700"
                                        : isYesterday
                                          ? "text-orange-700"
                                          : isPastDate
                                            ? "text-gray-700"
                                            : "text-gray-900"
                                    }`}
                                  >
                                    {match.goals.home !== null
                                      ? match.goals.home
                                      : 0}{" "}
                                    -{" "}
                                    {match.goals.away !== null
                                      ? match.goals.away
                                      : 0}
                                  </span>
                                  <div className="flex flex-col items-center">
                                    <span
                                      className={`text-xs font-semibold ${
                                        isToday
                                          ? "text-green-600"
                                          : isYesterday
                                            ? "text-orange-600"
                                            : "text-gray-500"
                                      }`}
                                    >
                                      {match.fixture.status.short === "FT"
                                        ? "FT"
                                        : match.fixture.status.short === "AET"
                                          ? "AET"
                                          : match.fixture.status.short === "PEN"
                                            ? "PEN"
                                            : isToday
                                              ? "FT"
                                              : isYesterday
                                                ? "Yesterday"
                                                : isPastDate
                                                  ? format(
                                                      parseISO(
                                                        match.fixture.date,
                                                      ),
                                                      "MMM d",
                                                    )
                                                  : "FT"}
                                    </span>
                                    {(isToday ||
                                      match.fixture.status.short !== "FT") && (
                                      <span className="text-xs text-green-500">
                                        {formatTimeInUTC(
                                          match.fixture.date,
                                          "HH:mm",
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  <span className="truncate">
                                    {match.teams.away.name}
                                  </span>
                                  <img
                                    src={match.teams.away.logo}
                                    alt={match.teams.away.name}
                                    className="h-4 w-4"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "/assets/fallback-logo.svg";
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}

                          {/* Upcoming Matches - Enhanced for future dates */}
                          {upcomingMatches.map((match) => {
                            const selectedDateObj = new Date(selectedDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const tomorrow = new Date(today);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const isTomorrow =
                              selectedDateObj.getTime() === tomorrow.getTime();
                            const isFutureDate = selectedDateObj > today;

                            return (
                              <div
                                key={`upcoming-${match.fixture.id}`}
                                className={`flex items-center justify-between p-2 rounded text-sm ${
                                  isTomorrow
                                    ? "bg-green-50 border border-green-200"
                                    : isFutureDate
                                      ? "bg-blue-50 border border-blue-100"
                                      : "bg-blue-50"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <img
                                    src={match.teams.home.logo}
                                    alt={match.teams.home.name}
                                    className="h-4 w-4"
                                  />
                                  <span className="truncate">
                                    {match.teams.home.name}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center px-2">
                                  <span
                                    className={`text-xs ${
                                      isTomorrow
                                        ? "text-green-700 font-semibold"
                                        : isFutureDate
                                          ? "text-blue-600 font-medium"
                                          : "text-blue-600"
                                    }`}
                                  >
                                    {formatTimeInUTC(
                                      match.fixture.date,
                                      "HH:mm",
                                    )}
                                  </span>
                                  {isTomorrow && (
                                    <span className="text-xs text-green-600 font-bold">
                                      Tomorrow
                                    </span>
                                  )}
                                  {isFutureDate && !isTomorrow && (
                                    <span className="text-xs text-blue-500">
                                      {format(
                                        parseISO(match.fixture.date),
                                        "MMM d",
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  <span className="truncate">
                                    {match.teams.away.name}
                                  </span>
                                  <img
                                    src={match.teams.away.logo}
                                    alt={match.teams.away.name}
                                    className="h-4 w-4"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              {selectedDate === format(new Date(), "yyyy-MM-dd")
                ? "No matches today"
                : "No matches from popular leagues on this date"}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default StandingsFilterCard;
