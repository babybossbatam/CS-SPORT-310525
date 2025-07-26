import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Clock, Calendar } from "lucide-react";
import { parseISO, isValid, format } from "date-fns";
import { useCachedQuery } from "@/lib/cachingHelper";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { shouldExcludeFromPopularLeagues } from "@/lib/MyPopularLeagueExclusion";
import MyAvatarInfo from "./MyAvatarInfo";

interface TodayMatchByTimeProps {
  selectedDate: string;
  timeFilterActive: boolean;
  liveFilterActive: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive,
  liveFilterActive,
  onMatchCardClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch all league data (same as MyNewLeague2)
  const { data: leaguesData = [] } = useCachedQuery({
    queryKey: ["popular-leagues-fixtures", selectedDate],
    queryFn: async () => {
      const leagueIds = [
        38, 15, 2, 10, 11, 848, 886, 71, 3, 5, 531, 22, 72, 73, 75, 76, 233, 
        667, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493, 
        239, 265, 237, 235, 743
      ];

      const requests = leagueIds.map((leagueId) =>
        fetch(`/api/leagues/${leagueId}/fixtures`)
          .then((res) => res.json())
          .catch((error) => {
            console.error(`Error fetching league ${leagueId}:`, error);
            return [];
          })
      );

      const results = await Promise.all(requests);
      const leaguesWithData = [];

      results.forEach((fixtures, index) => {
        const leagueId = leagueIds[index];
        if (fixtures && fixtures.length > 0) {
          const firstFixture = fixtures[0];
          if (firstFixture?.league) {
            leaguesWithData.push({
              id: leagueId,
              name: firstFixture.league.name,
              country: firstFixture.league.country,
              logo: firstFixture.league.logo,
              fixtures: fixtures,
            });
          }
        }
      });

      return leaguesWithData;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Process and sort all matches by kick-off time
  const sortedMatches = useMemo(() => {
    if (!leaguesData || leaguesData.length === 0) return [];

    const allMatches: any[] = [];

    // Collect all matches from all leagues
    leaguesData.forEach((league: any) => {
      if (league.fixtures) {
        league.fixtures.forEach((fixture: any) => {
          // Filter by selected date
          const fixtureDate = fixture.fixture?.date;
          if (fixtureDate) {
            const matchDate = format(parseISO(fixtureDate), "yyyy-MM-dd");
            if (matchDate === selectedDate) {
              // Skip excluded leagues
              if (shouldExcludeFromPopularLeagues(fixture.league?.id, fixture.league?.country)) {
                return;
              }

              allMatches.push({
                ...fixture,
                leagueInfo: {
                  name: league.name,
                  country: league.country,
                  logo: league.logo,
                },
              });
            }
          }
        });
      }
    });

    // Sort matches by kick-off time (nearest to farthest)
    const sortedMatches = allMatches.sort((a, b) => {
      const aDate = parseISO(a.fixture.date);
      const bDate = parseISO(b.fixture.date);
      const now = new Date();

      if (!isValid(aDate) || !isValid(bDate)) return 0;

      const aTime = aDate.getTime();
      const bTime = bDate.getTime();
      const nowTime = now.getTime();

      // Get match statuses
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;

      // Live matches first
      const aIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
      const bIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      if (aIsLive && bIsLive) {
        const aElapsed = Number(a.fixture.status.elapsed) || 0;
        const bElapsed = Number(b.fixture.status.elapsed) || 0;
        return aElapsed - bElapsed;
      }

      // Upcoming matches - sort by proximity to current time (nearest first)
      const aUpcoming = aStatus === "NS" || aStatus === "TBD";
      const bUpcoming = bStatus === "NS" || bStatus === "TBD";

      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      if (aUpcoming && bUpcoming) {
        // For upcoming matches, sort by time from now (nearest first)
        const aDistance = Math.abs(aTime - nowTime);
        const bDistance = Math.abs(bTime - nowTime);
        return aDistance - bDistance;
      }

      // Finished matches - sort by most recent first
      const aFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(aStatus);
      const bFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(bStatus);

      if (aFinished && !bFinished) return -1;
      if (!aFinished && bFinished) return 1;

      if (aFinished && bFinished) {
        return bTime - aTime; // Most recent first
      }

      // Default sort by time
      return aTime - bTime;
    });

    return sortedMatches;
  }, [leaguesData, selectedDate]);

  // Group matches by time periods for better display
  const groupedMatches = useMemo(() => {
    const now = new Date();
    const groups = {
      live: [] as any[],
      next2Hours: [] as any[],
      next6Hours: [] as any[],
      today: [] as any[],
      finished: [] as any[],
    };

    sortedMatches.forEach((match) => {
      const matchDate = parseISO(match.fixture.date);
      const timeDiff = matchDate.getTime() - now.getTime();
      const hoursFromNow = timeDiff / (1000 * 60 * 60);
      const status = match.fixture.status.short;

      if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
        groups.live.push(match);
      } else if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
        groups.finished.push(match);
      } else if (hoursFromNow <= 2 && hoursFromNow >= 0) {
        groups.next2Hours.push(match);
      } else if (hoursFromNow <= 6 && hoursFromNow >= 0) {
        groups.next6Hours.push(match);
      } else {
        groups.today.push(match);
      }
    });

    return groups;
  }, [sortedMatches]);

  const formatMatchTime = (dateString: string) => {
    try {
      const utcDate = new Date(dateString);
      if (isNaN(utcDate.getTime())) return "--:--";
      return utcDate.toISOString().substring(11, 16);
    } catch (error) {
      console.error("Error formatting match time:", error);
      return "--:--";
    }
  };

  const renderMatchCard = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const isLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status);
    const isFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status);

    return (
      <div
        key={fixture.fixture.id}
        className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => onMatchCardClick?.(fixture)}
      >
        {/* Time/Status */}
        <div className="flex flex-col items-center min-w-[60px]">
          {isLive ? (
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-red-500 animate-pulse">LIVE</span>
              <span className="text-xs text-gray-500">{fixture.fixture.status.elapsed}'</span>
            </div>
          ) : isFinished ? (
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-gray-600">FT</span>
              <span className="text-xs text-gray-500">{formatMatchTime(fixture.fixture.date)}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">{formatMatchTime(fixture.fixture.date)}</span>
              <span className="text-xs text-gray-400">{status}</span>
            </div>
          )}
        </div>

        {/* Teams and Score */}
        <div className="flex-1 mx-3">
          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex items-center flex-1">
              <MyAvatarInfo
                playerId={fixture.teams?.home?.id}
                playerName={fixture.teams?.home?.name}
                size="w-6 h-6"
                fallbackSrc={fixture.teams?.home?.logo}
                alt={`${fixture.teams?.home?.name} logo`}
              />
              <span className="ml-2 text-sm font-medium truncate">
                {fixture.teams?.home?.name}
              </span>
            </div>

            {/* Score */}
            <div className="mx-4 flex items-center">
              {isLive || isFinished ? (
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold">{fixture.goals?.home ?? 0}</span>
                  <span className="text-sm text-gray-400">-</span>
                  <span className="text-sm font-bold">{fixture.goals?.away ?? 0}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">vs</span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center flex-1 justify-end">
              <span className="mr-2 text-sm font-medium truncate">
                {fixture.teams?.away?.name}
              </span>
              <MyAvatarInfo
                playerId={fixture.teams?.away?.id}
                playerName={fixture.teams?.away?.name}
                size="w-6 h-6"
                fallbackSrc={fixture.teams?.away?.logo}
                alt={`${fixture.teams?.away?.name} logo`}
              />
            </div>
          </div>

          {/* League Info */}
          <div className="flex items-center mt-1">
            <MyAvatarInfo
              playerId={fixture.leagueInfo?.name}
              playerName={fixture.leagueInfo?.name}
              size="w-4 h-4"
              fallbackSrc={fixture.leagueInfo?.logo}
              alt={`${fixture.leagueInfo?.name} logo`}
            />
            <span className="ml-1 text-xs text-gray-500 truncate">
              {fixture.leagueInfo?.name}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderMatchGroup = (title: string, matches: any[], icon: React.ReactNode) => {
    if (matches.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
          {icon}
          <span className="text-sm font-medium text-gray-700">{title}</span>
          <span className="text-xs text-gray-500">({matches.length})</span>
        </div>
        {matches.map(renderMatchCard)}
      </div>
    );
  };

  if (!timeFilterActive) return null;

  return (
    <Card className="mt-4 overflow-hidden">
      <CardHeader 
        className="cursor-pointer flex items-center justify-between p-3 bg-white border-b"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-gray-800">Matches by Time</span>
          <span className="text-sm text-gray-500">({sortedMatches.length} matches)</span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {sortedMatches.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No matches found for this date</p>
            </div>
          ) : (
            <div>
              {renderMatchGroup(
                "Live Now",
                groupedMatches.live,
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {renderMatchGroup(
                "Next 2 Hours",
                groupedMatches.next2Hours,
                <Clock className="h-3 w-3 text-blue-500" />
              )}
              {renderMatchGroup(
                "Next 6 Hours",
                groupedMatches.next6Hours,
                <Clock className="h-3 w-3 text-green-500" />
              )}
              {renderMatchGroup(
                "Rest of Today",
                groupedMatches.today,
                <Calendar className="h-3 w-3 text-gray-500" />
              )}
              {renderMatchGroup(
                "Finished",
                groupedMatches.finished,
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TodayMatchByTime;