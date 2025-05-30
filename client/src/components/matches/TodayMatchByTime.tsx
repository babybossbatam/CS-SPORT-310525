
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, isValid, differenceInHours } from 'date-fns';
import { safeSubstring } from '@/lib/dateUtilsUpdated';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';
import { isToday, isYesterday, isTomorrow } from '@/lib/dateUtilsUpdated';
import { getCountryFlagWithFallback } from '@/lib/flagUtils';

interface TodayMatchByTimeProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({ 
  selectedDate, 
  timeFilterActive = false,
  liveFilterActive = false
}) => {
  const [enableFetching, setEnableFetching] = useState(true);

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

  // Fetch all fixtures for the selected date
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['all-fixtures-by-date', selectedDate],
    queryFn: async () => {
      console.log(`Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();

      console.log(`Received ${data.length} fixtures for ${selectedDate}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    enabled: !!selectedDate && enableFetching,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Use only the main fixtures data
  const allFixtures = fixtures;

  // Collect all matches from all leagues and add league info
  const allMatches = allFixtures.map((fixture: any) => ({
    ...fixture,
    leagueInfo: {
      name: fixture.league?.name || 'Unknown League',
      country: fixture.league?.country || 'Unknown Country',
      logo: fixture.league?.logo || '/assets/fallback-logo.svg'
    }
  })).filter((fixture: any) => {
    // Validate fixture structure
    if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
      return false;
    }

    // Apply exclusion filters
    const leagueName = fixture.league.name || '';
    const homeTeamName = fixture.teams?.home?.name || '';
    const awayTeamName = fixture.teams?.away?.name || '';

    // Skip exclusion filter for Egypt matches
    if (fixture.league.country?.toLowerCase() !== 'egypt') {
      if (shouldExcludeFixture(leagueName, homeTeamName, awayTeamName)) {
        return false;
      }
    }

    return true;
  });

  // Filter for live matches only when both filters are active
  const filteredMatches = liveFilterActive && timeFilterActive 
    ? allMatches.filter((match: any) => {
        const status = match.fixture.status.short;
        return ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status);
      })
    : allMatches;

  // Sort all matches by priority: Live → Upcoming → Finished
  const sortedMatches = filteredMatches.sort((a: any, b: any) => {
    const aStatus = a.fixture.status.short;
    const bStatus = b.fixture.status.short;
    const aDate = parseISO(a.fixture.date);
    const bDate = parseISO(b.fixture.date);

    // Ensure valid dates
    if (!isValid(aDate) || !isValid(bDate)) {
      return 0;
    }

    const aTime = aDate.getTime();
    const bTime = bDate.getTime();

    // Check if matches are live
    const aIsLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(aStatus);
    const bIsLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(bStatus);

    // Live matches first
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    // If both live, sort by status priority
    if (aIsLive && bIsLive) {
      const statusOrder: { [key: string]: number } = {
        'LIVE': 1, '1H': 2, '2H': 3, 'HT': 4, 'ET': 5, 'BT': 6, 'P': 7, 'INT': 8
      };
      const aOrder = statusOrder[aStatus] || 99;
      const bOrder = statusOrder[bStatus] || 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }

    // Check if matches are finished
    const aIsFinished = ['FT', 'AET', 'PEN'].includes(aStatus);
    const bIsFinished = ['FT', 'AET', 'PEN'].includes(bStatus);

    // Upcoming matches before finished matches
    if (!aIsFinished && bIsFinished) return -1;
    if (aIsFinished && !bIsFinished) return 1;

    // Within same category, sort by time
    return aTime - bTime;
  });

  // Get header title based on button states and selected date
  const getHeaderTitle = () => {
    // Check for different button states first
    if (liveFilterActive && timeFilterActive) {
      return "Popular Football Live Score";
    } else if (!liveFilterActive && timeFilterActive) {
      return "All Matches by Time";
    }
    
    // Default behavior based on selected date
    const selectedDateObj = new Date(selectedDate);

    if (isToday(selectedDateObj)) {
      return "Today's Matches by Time";
    } else if (isYesterday(selectedDateObj)) {
      return "Yesterday's Matches by Time";
    } else if (isTomorrow(selectedDateObj)) {
      return "Tomorrow's Matches by Time";
    } else {
      return `Football Matches - ${format(selectedDateObj, 'MMM d, yyyy')}`;
    }
  };

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
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

  if (!allFixtures.length) {
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
      {/* Main Header */}
      <h3 className="text-base font-bold text-gray-800 mt-4 mb-0 bg-white border border-gray-200 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          {liveFilterActive && timeFilterActive ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Popular Football Live Score
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-blue-500" />
              All Matches by Time
            </>
          )}
        </div>
      </h3>

      {/* Single consolidated card with all matches sorted by time */}
      <Card className="mt-4 overflow-hidden">
        {/* Header showing total matches */}
        <div className="flex items-start gap-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <Clock className="w-6 h-6 text-blue-500 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-semibold text-base text-gray-800">
              All Matches - Sorted by Time
            </span>
            <span className="text-xs text-gray-600">
              {sortedMatches.length} matches found
            </span>
          </div>
          {liveFilterActive && timeFilterActive && (
            <div className="flex gap-1 ml-auto">
              <span className="relative flex h-3 w-3 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          )}
        </div>

        {/* All Matches */}
        <CardContent className="p-0">
          <div className="space-y-0">
            {sortedMatches.map((match: any) => (
              <div
                key={match.fixture.id}
                className="bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center px-3 py-2">
                  {/* Home Team */}
                  <div className="text-right text-sm text-gray-900 min-w-0 flex-1 pr-2 truncate">
                    {match.teams.home.name}
                  </div>

                  <div className="flex-shrink-0 mx-1">
                    <img
                      src={match.teams.home.logo || '/assets/fallback-logo.png'}
                      alt={match.teams.home.name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/assets/fallback-logo.png') {
                          target.src = '/assets/fallback-logo.png';
                        }
                      }}
                    />
                  </div>

                  {/* Score/Time Center */}
                  <div className="flex flex-col items-center justify-center px-4 flex-shrink-0" style={{ marginTop: '-14px' }}>
                    <div className="text-xs font-semibold mb-0.5">
                      {match.fixture.status.short === 'FT' ? (
                        <span className="text-gray-600">Ended</span>
                      ) : match.fixture.status.short === 'HT' ? (
                        <span className="text-red-600 animate-pulse">HT</span>
                      ) : ['LIVE', '1H', '2H', 'ET', 'BT', 'P', 'INT'].includes(match.fixture.status.short) ? (
                        <span className="text-red-600 animate-pulse">{match.fixture.status.elapsed || 0}'</span>
                      ) : (
                        <span className="text-gray-600">
                          {format(parseISO(match.fixture.date), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold flex items-center gap-2">
                      <span className="text-black">
                        {match.goals?.home ?? 0}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className="text-black">
                        {match.goals?.away ?? 0}
                      </span>
                    </div>
                    {/* League info below score */}
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      <div className="flex items-center gap-1">
                        <img
                          src={getCountryFlagWithFallback(match.leagueInfo.country, match.leagueInfo.logo)}
                          alt={match.leagueInfo.country}
                          className="w-3 h-2 object-cover rounded-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/assets/fallback-logo.svg';
                          }}
                        />
                        {match.leagueInfo.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 mx-1">
                    <img
                      src={match.teams.away.logo || '/assets/fallback-logo.png'}
                      alt={match.teams.away.name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/assets/fallback-logo.png') {
                          target.src = '/assets/fallback-logo.png';
                        }
                      }}
                    />
                  </div>

                  {/* Away Team */}
                  <div className="text-left text-sm text-gray-900 min-w-0 flex-1 pl-2 truncate">
                    {match.teams.away.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TodayMatchByTime;
