
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { ChevronDown, ChevronUp, Trophy, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam, getTeamLogoSources } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import {
  shouldExcludeFromPopularLeagues,
  isRestrictedUSLeague,
} from "../../lib/MyPopularLeagueExclusion";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import { format, parseISO } from "date-fns";

interface MyBasketLeagueProps {
  selectedDate: string;
  timeFilterActive: boolean;
  showTop10?: boolean;
  liveFilterActive: boolean;
  onMatchCardClick?: (fixture: any) => void;
  useUTCOnly?: boolean;
}

export const MyBasketLeague: React.FC<MyBasketLeagueProps> = ({
  selectedDate,
  timeFilterActive = false,
  showTop10 = false,
  liveFilterActive = false,
  onMatchCardClick,
  useUTCOnly = true,
}) => {
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(new Set());

  // Popular leagues configuration
  const popularLeagueIds = [
    39, 40, 61, 78, 135, 140, 2, 3, 5, 10, 11, 848, 886, 71, 38, 15, 22, 531,
    72, 73, 75, 76, 253, 233, 667, 850, 893, 921, 130, 128, 493, 239, 265,
    237, 235, 743, 940, 908, 1169, 23, 1077,
  ];

  // Fetch fixtures for multiple popular leagues
  const leagueQueries = useQuery({
    queryKey: ["popular-leagues-fixtures", selectedDate, popularLeagueIds],
    queryFn: async () => {
      console.log(`🔄 [MyBasketLeague] Fetching fixtures for ${popularLeagueIds.length} popular leagues`);
      
      const promises = popularLeagueIds.map(async (leagueId) => {
        try {
          const response = await apiRequest("GET", `/api/leagues/${leagueId}/fixtures`);
          const fixtures = await response.json();
          
          // Filter fixtures for the selected date
          const filteredFixtures = fixtures.filter((fixture: any) => {
            if (!fixture?.fixture?.date) return false;
            
            try {
              const fixtureDate = new Date(fixture.fixture.date);
              const fixtureDateString = format(fixtureDate, "yyyy-MM-dd");
              return fixtureDateString === selectedDate;
            } catch (error) {
              return false;
            }
          });

          return {
            leagueId,
            fixtures: filteredFixtures,
            leagueInfo: filteredFixtures[0]?.league || null,
          };
        } catch (error) {
          console.error(`Error fetching league ${leagueId}:`, error);
          return { leagueId, fixtures: [], leagueInfo: null };
        }
      });

      const results = await Promise.all(promises);
      return results.filter(result => result.fixtures.length > 0);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: leagueData = [], isLoading } = leagueQueries;

  // Process and filter leagues
  const processedLeagues = useMemo(() => {
    if (!leagueData || leagueData.length === 0) return [];

    return leagueData
      .filter((league) => {
        // Apply exclusion filters
        if (!league.leagueInfo) return false;
        
        const shouldExclude = shouldExcludeFromPopularLeagues(
          league.leagueInfo.name,
          league.leagueInfo.country
        );
        
        const isRestricted = isRestrictedUSLeague(
          league.leagueInfo.name,
          league.leagueInfo.country
        );

        return !shouldExclude && !isRestricted;
      })
      .sort((a, b) => {
        // Sort by number of fixtures (more fixtures first)
        return b.fixtures.length - a.fixtures.length;
      })
      .slice(0, showTop10 ? 10 : undefined); // Limit to top 10 if requested
  }, [leagueData, showTop10]);

  const toggleLeague = (leagueId: number) => {
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(leagueId)) {
      newExpanded.delete(leagueId);
    } else {
      newExpanded.add(leagueId);
    }
    setExpandedLeagues(newExpanded);
  };

  // Auto-expand leagues with live matches or many fixtures
  useEffect(() => {
    const leaguesToExpand = new Set<number>();

    processedLeagues.forEach((league) => {
      const hasLiveMatches = league.fixtures.some((fixture: any) =>
        fixture.fixture?.status?.short === "1H" ||
        fixture.fixture?.status?.short === "2H" ||
        fixture.fixture?.status?.short === "HT"
      );

      // Expand if has live matches or is a major league with few fixtures
      if (hasLiveMatches || league.fixtures.length <= 4) {
        leaguesToExpand.add(league.leagueId);
      }
    });

    setExpandedLeagues(leaguesToExpand);
  }, [processedLeagues]);

  const handleMatchCardClick = (fixture: any) => {
    console.log('🏆 [MyBasketLeague] Match card clicked:', {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      country: fixture.league?.country,
      status: fixture.fixture?.status?.short,
      source: 'MyBasketLeague'
    });
    onMatchCardClick?.(fixture);
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading popular leagues...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (processedLeagues.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No league matches found</h3>
            <p className="text-sm">No matches available for the selected date in popular leagues.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {processedLeagues.map((league) => {
        const isExpanded = expandedLeagues.has(league.leagueId);
        const liveMatchCount = league.fixtures.filter((fixture: any) =>
          fixture.fixture?.status?.short === "1H" ||
          fixture.fixture?.status?.short === "2H" ||
          fixture.fixture?.status?.short === "HT"
        ).length;

        return (
          <Card key={league.leagueId} className="shadow-md">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 py-3"
              onClick={() => toggleLeague(league.leagueId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <MyCircularFlag
                      countryName={league.leagueInfo.country}
                      size={20}
                      className="flex-shrink-0"
                    />
                    <LazyImage
                      src={league.leagueInfo.logo}
                      alt={league.leagueInfo.name}
                      className="w-5 h-5 object-contain flex-shrink-0"
                      fallbackSrc="/assets/fallback-logo.png"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-sm text-gray-900 truncate block">
                      {league.leagueInfo.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate block">
                      {league.leagueInfo.country}
                    </span>
                  </div>
                  {liveMatchCount > 0 && (
                    <div className="flex items-center gap-1 ml-2">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </div>
                      <span className="text-xs text-red-600 font-medium">
                        {liveMatchCount} LIVE
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{league.fixtures.length} matches</span>
                  <div className={`transform transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}>
                    ▼
                  </div>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {league.fixtures.map((fixture: any) => (
                    <div
                      key={fixture.fixture.id}
                      className="match-card-container group"
                      onClick={() => handleMatchCardClick(fixture)}
                    >
                      <LazyMatchItem
                        match={fixture}
                        showLeagueName={false} // Already shown in header
                        showCountryFlag={false} // Already shown in header
                        isLive={
                          fixture.fixture?.status?.short === "1H" ||
                          fixture.fixture?.status?.short === "2H" ||
                          fixture.fixture?.status?.short === "HT"
                        }
                        onMatchClick={() => handleMatchCardClick(fixture)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default MyBasketLeague;
