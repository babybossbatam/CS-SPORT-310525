import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, isToday, isYesterday, isTomorrow, differenceInHours, parseISO, isValid, isSameDay } from 'date-fns';

interface TodayPopularFootballLeaguesProps {
  selectedDate: string;
}

const TodayPopularFootballLeagues: React.FC<TodayPopularFootballLeaguesProps> = ({ selectedDate }) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [enableFetching, setEnableFetching] = useState(true);

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78, 61]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1

  // Popular teams for match prioritization
  const POPULAR_TEAMS = [
    // Premier League
    33, 40, 42, 50, 47, 49, // Manchester United, Liverpool, Arsenal, Manchester City, Tottenham, Chelsea
    // La Liga
    529, 541, 530, 548, 727, // Barcelona, Real Madrid, Atletico Madrid, Real Sociedad, Athletic Bilbao
    // Serie A
    489, 492, 496, 500, 502, 505, // AC Milan, Napoli, Juventus, Inter, Fiorentina, Lazio
    // Bundesliga
    157, 165, 168, 173, 192, // Bayern Munich, Borussia Dortmund, Bayer Leverkusen, RB Leipzig, Eintracht Frankfurt
    // Champions League popular teams
    85, 81, 212, 548, // Paris Saint Germain, AS Monaco, Real Sociedad, Real Sociedad
  ];

  // Fetch all fixtures for the selected date with aggressive caching
  const { data: fixtures = [], isLoading, hasData: hasCachedFixtures } = useQuery({
    queryKey: ['all-fixtures-by-date', selectedDate],
    queryFn: async () => {
      console.log(`Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();
      console.log(`Received ${data.length} fixtures for ${selectedDate}`);
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - longer cache time
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection time
    enabled: !!selectedDate && enableFetching,
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnReconnect: false, // Don't refetch on network reconnection
  });

  // Fetch popular league fixtures with even more aggressive caching
  const { data: popularFixtures = [], isLoading: isLoadingPopular, hasData: hasCachedPopular } = useQuery({
    queryKey: ['popular-fixtures', selectedDate],
    queryFn: async () => {
      const allData = [];
      const today = new Date();
      const selectedDateObj = new Date(selectedDate);

      // Determine date range based on selected date
      let startDate = selectedDate;
      let endDate = selectedDate;

      if (isToday(selectedDateObj)) {
        // For today, also get yesterday and tomorrow for context
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        startDate = format(yesterday, 'yyyy-MM-dd');
        endDate = format(tomorrow, 'yyyy-MM-dd');
      }

      console.log(`Fetching popular league fixtures from ${startDate} to ${endDate}`);

      // Fetch data for each popular league
      for (const leagueId of POPULAR_LEAGUES) {
        try {
          const response = await apiRequest('GET', `/api/leagues/${leagueId}/fixtures`);
          const leagueFixtures = await response.json();

          // Filter fixtures for the selected date
          const matchesFromSelectedDate = leagueFixtures.filter(match => {
            try {
              if (!match || !match.fixture || !match.fixture.date) return false;
              
              const fixtureDate = parseISO(match.fixture.date);
              if (!isValid(fixtureDate)) return false;

              // Convert to local date string for comparison (using UTC to avoid timezone issues)
              const fixtureLocalDateString = format(fixtureDate, 'yyyy-MM-dd');

              return fixtureLocalDateString === selectedDate;
            } catch (error) {
              console.error('Error filtering match by date:', error, match);
              return false;
            }
          });

          allData.push(...matchesFromSelectedDate);
        } catch (error) {
          console.error(`Error fetching fixtures for league ${leagueId}:`, error);
        }
      }

      console.log(`Fetched ${allData.length} popular league fixtures for date ${selectedDate}`);
      
      // Debug: Log matches by league
      const matchesByLeague = allData.reduce((acc, match) => {
        const leagueId = match.league?.id;
        const leagueName = match.league?.name;
        if (leagueId) {
          if (!acc[leagueId]) {
            acc[leagueId] = { name: leagueName, count: 0 };
          }
          acc[leagueId].count++;
        }
        return acc;
      }, {});
      
      console.log('Matches by league for', selectedDate, ':', matchesByLeague);
      
      return allData;
    },
    enabled: POPULAR_LEAGUES.length > 0 && !!selectedDate && enableFetching,
    staleTime: 60 * 60 * 1000, // 1 hour - very long cache time for popular fixtures
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection time
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnReconnect: false, // Don't refetch on network reconnection
    retry: 1, // Reduce retry attempts
  });

  // Start with all countries collapsed by default
  useEffect(() => {
    // Reset to collapsed state when selected date changes
    setExpandedCountries(new Set());
  }, [selectedDate]);

  // Enhanced country flag mapping
  const getCountryFlag = (country: string, leagueFlag?: string) => {
    if (leagueFlag) return leagueFlag;

    // Add null/undefined check for country
    if (!country || typeof country !== 'string' || country.trim() === '') {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/FIFA_Logo_%282010%29.svg/24px-FIFA_Logo_%282010%29.svg.png';
    }

    const cleanCountry = country.trim();

    if (cleanCountry === 'World' || cleanCountry === 'International') {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/FIFA_Logo_%282010%29.svg/24px-FIFA_Logo_%282010%29.svg.png';
    }

    const countryCodeMap: { [key: string]: string } = {
      'England': 'GB-ENG',
      'Scotland': 'GB-SCT',
      'Wales': 'GB-WLS',
      'Northern Ireland': 'GB-NIR',
      'United States': 'US',
      'South Korea': 'KR',
      'Czech Republic': 'CZ',
      'United Arab Emirates': 'AE',
      'Bosnia & Herzegovina': 'BA',
      'North Macedonia': 'MK',
      'Trinidad & Tobago': 'TT',
      'Ivory Coast': 'CI',
      'Cape Verde': 'CV',
      'Democratic Republic of Congo': 'CD',
      'Curacao': 'CW',
      'Faroe Islands': 'FO'
    };

    const countryCode = countryCodeMap[cleanCountry] || (cleanCountry.length >= 2 ? cleanCountry.substring(0, 2).toUpperCase() : 'XX');
    return `https://flagsapi.com/${countryCode}/flat/24.png`;
  };

  // Combine and deduplicate fixtures
  const allFixtures = [...fixtures, ...popularFixtures]
    .filter((fixture, index, self) => 
      index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
    );

  // Group fixtures by country and league
  const fixturesByCountry = allFixtures.reduce((acc: any, fixture: any) => {
    // Add comprehensive null checks
    if (!fixture || !fixture.league) {
      return acc;
    }

    const country = fixture.league.country || 'Unknown';
    const leagueId = fixture.league.id;
    
    // Skip if no valid league ID
    if (!leagueId) {
      return acc;
    }

    if (!acc[country]) {
      acc[country] = {
        country,
        flag: getCountryFlag(country, fixture.league.flag),
        leagues: {},
        hasPopularLeague: false
      };
    }

    // Update hasPopularLeague if this league is popular
    if (POPULAR_LEAGUES.includes(leagueId)) {
      acc[country].hasPopularLeague = true;
    }

    if (!acc[country].leagues[leagueId]) {
      acc[country].leagues[leagueId] = {
        league: fixture.league,
        matches: [],
        isPopular: POPULAR_LEAGUES.includes(leagueId)
      };
    }

    acc[country].leagues[leagueId].matches.push(fixture);
    return acc;
  }, {});

  // Filter to show only popular countries plus Saudi Arabia, Brazil, and Argentina
  const filteredCountries = Object.values(fixturesByCountry).filter((countryData: any) => {
    // Add comprehensive null checks
    if (!countryData || typeof countryData !== 'object') {
      return false;
    }

    // Always include countries with popular leagues
    if (countryData.hasPopularLeague) return true;

    // Include specific countries and regions
    const includedCountries = ['Saudi-Arabia', 'Brazil', 'Argentina', 'Italy', 'Spain', 'Germany', 'England', 'France'];

    // Add null check for country before string operations
    if (!countryData.country || typeof countryData.country !== 'string' || countryData.country.trim() === '') {
      return false;
    }

    const countryName = countryData.country.trim().toLowerCase();

    // Include if it's one of the specified countries (case-insensitive check)
    return includedCountries.some(country => 
      countryName.includes(country.toLowerCase()) ||
      country.toLowerCase().includes(countryName)
    );
  });

  // Sort countries - popular leagues first, then alphabetical
  const sortedCountries = filteredCountries.sort((a: any, b: any) => {
    if (a.hasPopularLeague && !b.hasPopularLeague) return -1;
    if (!a.hasPopularLeague && b.hasPopularLeague) return 1;

    // Add null checks for country comparison
    const countryA = a.country || '';
    const countryB = b.country || '';
    return countryA.localeCompare(countryB);
  });

  const toggleCountry = (country: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(country)) {
      newExpanded.delete(country);
    } else {
      newExpanded.add(country);
    }
    setExpandedCountries(newExpanded);
  };

  // Enhanced match status logic
  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = differenceInHours(now, fixtureDate);

    // Finished matches
    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      if (hoursAgo <= 2) return 'Just Finished';
      if (hoursAgo <= 24) return 'Recent';
      return status;
    }

    // Live matches
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return status === 'HT' ? 'Half Time' : 'LIVE';
    }

    // Upcoming matches
    if (fixtureDate < now && status === 'NS') {
      return 'Delayed';
    }

    return 'Scheduled';
  };

  const getStatusColor = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = differenceInHours(now, fixtureDate);

    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      if (hoursAgo <= 2) return 'bg-green-100 text-green-700 font-semibold';
      return 'bg-gray-100 text-gray-700 font-semibold';
    }

    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return 'bg-red-100 text-red-700 font-semibold animate-pulse';
    }

    if (fixtureDate < now && status === 'NS') {
      return 'bg-orange-100 text-orange-700';
    }

    return 'bg-blue-100 text-blue-700';
  };

  // Get header title based on selected date
  const getHeaderTitle = () => {
    const selectedDateObj = new Date(selectedDate);

    if (isToday(selectedDateObj)) {
      return "Today's Popular Football Leagues";
    } else if (isYesterday(selectedDateObj)) {
      return "Yesterday's Popular Football Leagues";
    } else if (isTomorrow(selectedDateObj)) {
      return "Tomorrow's Popular Football Leagues";
    } else {
      return `Popular Football Leagues - ${format(selectedDateObj, 'MMM d, yyyy')}`;
    }
  };

  // Use cached data if available, even during loading
  const cachedFixtures = hasCachedFixtures || [];
  const cachedPopularFixtures = hasCachedPopular || [];
  const combinedCachedData = [...cachedFixtures, ...cachedPopularFixtures].filter((fixture, index, self) => 
    index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
  );

  // Show loading only if no cached data exists and we're actually loading
  if ((isLoading || isLoadingPopular) && combinedCachedData.length === 0) {
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-24" />
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

  // Utility function to get current UTC date string
  function getCurrentUTCDateString() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format the time for display
  const formatMatchTime = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return '--:--';
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting match time:', error);
      return '--:--';
    }
  };

  const isMatchLive = (status: string | null | undefined, dateString: string | null | undefined) => {
    if (!status || !dateString) return false;

    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];

    // Check if status indicates live match
    if (liveStatuses.some(liveStatus => status.includes(liveStatus))) {
      return true;
    }

    // For "NS" (Not Started) status, check if match time is within reasonable live window
    if (status === 'NS') {
      try {
        const matchTime = new Date(dateString);
        const now = new Date();
        const diffInMinutes = (now.getTime() - matchTime.getTime()) / (1000 * 60);

        // Consider it live if it's within 15 minutes of start time
        return diffInMinutes >= 0 && diffInMinutes <= 15;
      } catch (error) {
        console.error('Error checking live match status:', error);
        return false;
      }
    }

    return false;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <h3 className="text-sm font-semibold">
          {getHeaderTitle()}
        </h3>

      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {sortedCountries.map((countryData: any) => {
            const totalMatches = Object.values(countryData.leagues).reduce(
              (sum: number, league: any) => sum + league.matches.length, 0
            );

            // Count live and recent matches for badge
            const liveMatches = Object.values(countryData.leagues).reduce((count: number, league: any) => {
              return count + league.matches.filter((match: any) => 
                ['LIVE', '1H', 'HT', '2H', 'ET'].includes(match.fixture.status.short)
              ).length;
            }, 0);

            const recentMatches = Object.values(countryData.leagues).reduce((count: number, league: any) => {
              return count + league.matches.filter((match: any) => {
                const status = match.fixture.status.short;
                const fixtureDate = parseISO(match.fixture.date);
                if (!isValid(fixtureDate)) return false;
                const localFixtureDate = new Date(fixtureDate.getTime());
                const hoursAgo = differenceInHours(new Date(), localFixtureDate);
                return ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status) && hoursAgo <= 3;
              }).length;
            }, 0);

            return (
              <div key={countryData.country} className="border-b border-gray-100 last:border-b-0">
                <div className="bg-gray-50">
                  {/* Sort leagues - popular first */}
                  {Object.values(countryData.leagues)
                    .sort((a: any, b: any) => {
                      if (a.isPopular && !b.isPopular) return -1;
                      if (!a.isPopular && b.isPopular) return 1;
                      return a.league.name.localeCompare(b.league.name);
                    })
                    .map((leagueData: any) => (
                      <div key={leagueData.league.id} className="p-3 border-b border-gray-200 last:border-b-0">
                        {/* League Header */}
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                          <img
                            src={leagueData.league.logo}
                            alt={leagueData.league.name}
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-800">
                              {leagueData.league.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {leagueData.league.country}
                            </span>
                          </div>
                          {leagueData.isPopular && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>

                        {/* Matches */}
                        <div className="space-y-1 mt-3">
                          {leagueData.matches
                            .sort((a: any, b: any) => {
                              const aStatus = a.fixture.status.short;
                              const bStatus = b.fixture.status.short;
                              const aDate = parseISO(a.fixture.date);
                              const bDate = parseISO(b.fixture.date);

                              // Ensure valid dates
                              if (!isValid(aDate) || !isValid(bDate)) {
                                return 0;
                              }

                              const now = new Date();
                              const aTime = aDate.getTime();
                              const bTime = bDate.getTime();

                              // Check if matches involve popular teams
                              const aHasPopularTeam = POPULAR_TEAMS.includes(a.teams.home.id) || POPULAR_TEAMS.includes(a.teams.away.id);
                              const bHasPopularTeam = POPULAR_TEAMS.includes(b.teams.home.id) || POPULAR_TEAMS.includes(b.teams.away.id);

                              // Prioritize popular team matches first
                              if (aHasPopularTeam && !bHasPopularTeam) return -1;
                              if (!aHasPopularTeam && bHasPopularTeam) return 1;

                              // Define status categories
                              const aLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(aStatus);
                              const bLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(bStatus);

                              const aFinished = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(aStatus);
                              const bFinished = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(bStatus);

                              const aUpcoming = aStatus === 'NS' && !aLive && !aFinished;
                              const bUpcoming = bStatus === 'NS' && !bLive && !bFinished;

                              // Assign priority scores (lower = higher priority)
                              let aPriority = 0;
                              let bPriority = 0;

                              if (aLive) aPriority = 1;
                              else if (aUpcoming) aPriority = 2;
                              else if (aFinished) aPriority = 3;
                              else aPriority = 4;

                              if (bLive) bPriority = 1;
                              else if (bUpcoming) bPriority = 2;
                              else if (bFinished) bPriority = 3;
                              else bPriority = 4;

                              // Second sort by match status priority
                              if (aPriority !== bPriority) {
                                return aPriority - bPriority;
                              }

                              // If same priority, sort by time within category
                              if (aLive && bLive) {
                                // For live matches, show earliest start time first
                                return aTime - bTime;
                              }

                              if (aUpcoming && bUpcoming) {
                                // For upcoming matches, show earliest start time first
                                return aTime - bTime;
                              }

                              if (aFinished && bFinished) {
                                // For finished matches, show most recent first
                                return bTime - aTime;
                              }

                              // Default time-based sorting
                              return aTime - bTime;
                            })
                            .map((match: any) => (
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
                                      console.log(`Failed to load home team logo: ${target.src} for ${match.teams.home.name}`);
                                      if (target.src !== '/assets/fallback-logo.png') {
                                        target.src = '/assets/fallback-logo.png';
                                      }
                                    }}
                                  />
                                </div>

                                {/* Score/Time Center */}
                                <div className="flex flex-col items-center justify-center px-4 flex-shrink-0">
                                  {(() => {
                                    const status = match.fixture.status.short;
                                    const fixtureDate = parseISO(match.fixture.date);

                                    // Live matches
                                    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
                                      return (
                                        <>
                                          <div className="text-xs text-red-600 font-semibold mb-1 animate-pulse">
                                            LIVE
                                          </div>
                                          <div className="text-lg font-bold text-red-600 flex items-center gap-2">
                                            <span>{match.goals.home ?? 0}</span>
                                            <span className="text-gray-400">-</span>
                                            <span>{match.goals.away ?? 0}</span>
                                          </div>
                                          <div className="text-xs text-red-600 font-semibold mt-1 animate-pulse">
                                            {status === 'HT' ? 'HT' : `${match.fixture.status.elapsed || 0}'`}
                                          </div>
                                        </>
                                      );
                                    }

                                    // All finished match statuses
                                    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
                                      // Check if we have actual numerical scores
                                      const homeScore = match.goals.home;
                                      const awayScore = match.goals.away;
                                      const hasValidScores = (homeScore !== null && homeScore !== undefined) && 
                                                            (awayScore !== null && awayScore !== undefined) &&
                                                            !isNaN(Number(homeScore)) && !isNaN(Number(awayScore));

                                      if (hasValidScores) {
                                        return (
                                          <>
                                            <div className="text-xs text-gray-600 font-semibold mb-1">
                                              {status === 'FT' ? 'ENDED' : 
                                               status === 'AET' ? 'AFTER EXTRA TIME' :
                                               status === 'PEN' ? 'PENALTIES' :
                                               status === 'AWD' ? 'AWARDED' :
                                               status === 'WO' ? 'WALKOVER' :
                                               status === 'ABD' ? 'ABANDONED' :
                                               status === 'CANC' ? 'CANCELLED' :
                                               status === 'SUSP' ? 'SUSPENDED' : status}
                                            </div>
                                            <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                              <span>{homeScore}</span>
                                              <span className="text-gray-400">-</span>
                                              <span>{awayScore}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                              {status === 'FT' ? 'FT' : 
                                               status === 'AET' ? 'AET' :
                                               status === 'PEN' ? 'PEN' :
                                               status === 'AWD' ? 'Awarded' :
                                               status === 'WO' ? 'Walkover' :
                                               status === 'ABD' ? 'Abandoned' :
                                               status === 'CANC' ? 'Cancelled' :
                                               status === 'SUSP' ? 'Suspended' : status}
                                            </div>
                                          </>
                                        );
                                      } else {
                                        // Match is finished but no valid score data
                                        const statusText = status === 'FT' ? 'No Score Available' : 
                                                         status === 'AET' ? 'AET - No Score' :
                                                         status === 'PEN' ? 'PEN - No Score' :
                                                         status === 'AWD' ? 'Awarded' :
                                                         status === 'WO' ? 'Walkover' :
                                                         status === 'ABD' ? 'Abandoned' :
                                                         status === 'CANC' ? 'Cancelled' :
                                                         status === 'SUSP' ? 'Suspended' : 'No Score';

                                        return (
                                          <>
                                            <div className="text-sm font-medium text-orange-600 px-2 py-1 bg-orange-100 rounded text-center">
                                              {statusText}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                              {format(fixtureDate, 'HH:mm')}
                                            </div>
                                          </>
                                        );
                                      }
                                    }

                                    // Postponed or delayed matches
                                    if (['PST', 'CANC', 'ABD', 'SUSP', 'AWD', 'WO'].includes(status)) {
                                      const statusText = status === 'PST' ? 'Postponed' :
                                                        status === 'CANC' ? 'Cancelled' :
                                                        status === 'ABD' ? 'Abandoned' :
                                                        status === 'SUSP' ? 'Suspended' :
                                                        status === 'AWD' ? 'Awarded' :
                                                        status === 'WO' ? 'Walkover' : status;

                                      return (
                                        <>
                                          <div className="text-sm font-medium text-red-600 px-2 py-1 bg-red-100 rounded text-center">
                                            {statusText}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {format(fixtureDate, 'HH:mm')}
                                          </div>
                                        </>
                                      );
                                    }

                                    // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                                    return (
                                      <>
                                        <div className="text-sm font-medium text-black">
                                          {status === 'TBD' ? 'TBD' : format(fixtureDate, 'HH:mm')}
                                        </div>
                                        {status === 'TBD' && (
                                          <div className="text-xs text-gray-500 mt-1">Time TBD</div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                <div className="flex-shrink-0 mx-1">
                                  <img
                                    src={match.teams.away.logo || '/assets/fallback-logo.png'}
                                    alt={match.teams.away.name}
                                    className="w-12 h-12 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      console.log(`Failed to load away team logo: ${target.src} for ${match.teams.away.name}`);
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
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayPopularFootballLeagues;