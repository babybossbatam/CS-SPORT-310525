
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, isToday, isYesterday, isTomorrow, differenceInHours, parseISO } from 'date-fns';

interface TodayPopularFootballLeaguesProps {
  selectedDate: string;
}

const TodayPopularFootballLeagues: React.FC<TodayPopularFootballLeaguesProps> = ({ selectedDate }) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [enableFetching, setEnableFetching] = useState(true);

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

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

          // Filter fixtures within our date range
          const filteredFixtures = leagueFixtures.filter((fixture: any) => {
            const fixtureDate = format(new Date(fixture.fixture.date), 'yyyy-MM-dd');
            return fixtureDate >= startDate && fixtureDate <= endDate;
          });

          allData.push(...filteredFixtures);
        } catch (error) {
          console.error(`Error fetching fixtures for league ${leagueId}:`, error);
        }
      }

      console.log(`Fetched ${allData.length} popular league fixtures`);
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
    // Reset to collapsed state when data changes
    setExpandedCountries(new Set());
  }, [fixtures, popularFixtures, selectedDate]);

  // Enhanced country flag mapping
  const getCountryFlag = (country: string, leagueFlag?: string) => {
    if (leagueFlag) return leagueFlag;

    if (country === 'World' || country === 'International') {
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

    const countryCode = countryCodeMap[country] || country.substring(0, 2).toUpperCase();
    return `https://flagsapi.com/${countryCode}/flat/24.png`;
  };

  // Combine and deduplicate fixtures
  const allFixtures = [...fixtures, ...popularFixtures].filter((fixture, index, self) => 
    index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
  );

  // Group fixtures by country and league
  const fixturesByCountry = allFixtures.reduce((acc: any, fixture: any) => {
    const country = fixture.league.country;
    if (!acc[country]) {
      acc[country] = {
        country,
        flag: getCountryFlag(country, fixture.league.flag),
        leagues: {},
        hasPopularLeague: POPULAR_LEAGUES.includes(fixture.league.id)
      };
    }

    const leagueId = fixture.league.id;
    if (!acc[country].leagues[leagueId]) {
      acc[country].leagues[leagueId] = {
        league: fixture.league,
        matches: [],
        isPopular: POPULAR_LEAGUES.includes(fixture.league.id)
      };
    }

    acc[country].leagues[leagueId].matches.push(fixture);
    return acc;
  }, {});

  // Filter to show only popular countries plus Saudi Arabia, Brazil, and Argentina
  const filteredCountries = Object.values(fixturesByCountry).filter((countryData: any) => {
    // Always include countries with popular leagues
    if (countryData.hasPopularLeague) return true;
    
    // Include specific countries: Saudi Arabia, Brazil, and Argentina
    const includedCountries = ['Saudi Arabia', 'Brazil', 'Argentina'];
    
    // Include if it's one of the specified countries
    if (includedCountries.includes(countryData.country)) return true;
    
    return false;
  });

  // Sort countries - popular leagues first, then alphabetical
  const sortedCountries = filteredCountries.sort((a: any, b: any) => {
    if (a.hasPopularLeague && !b.hasPopularLeague) return -1;
    if (!a.hasPopularLeague && b.hasPopularLeague) return 1;
    return a.country.localeCompare(b.country);
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
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-4 w-4 animate-spin" />
            <p className="text-gray-500">Loading matches...</p>
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
    <Card>
      <CardHeader className="pb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {getHeaderTitle()}
        </h3>
        <p className="text-xs text-gray-500">
          {allFixtures.length} matches found • Popular leagues shown first
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {sortedCountries.map((countryData: any) => {
            const isExpanded = expandedCountries.has(countryData.country);
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
                const hoursAgo = differenceInHours(new Date(), new Date(match.fixture.date));
                return ['FT', 'AET', 'PEN'].includes(status) && hoursAgo <= 3;
              }).length;
            }, 0);

            return (
              <div key={countryData.country} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => toggleCountry(countryData.country)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={countryData.flag}
                      alt={countryData.country}
                      className="w-6 h-4 object-cover rounded-sm shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (countryData.country === 'World' || countryData.country === 'International') {
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                        } else {
                          target.src = '/assets/fallback-logo.svg';
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900">{countryData.country}</span>
                    <span className="text-xs text-gray-500">({totalMatches})</span>

                    {/* Live/Recent badges */}
                    {liveMatches > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold animate-pulse">
                        {liveMatches} LIVE
                      </span>
                    )}
                    {recentMatches > 0 && !liveMatches && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                        {recentMatches} Recent
                      </span>
                    )}

                    {countryData.hasPopularLeague && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                        Popular
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100">
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
                          <span className="font-medium text-sm text-gray-800">
                            {leagueData.league.name}
                          </span>
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
                              // Sort: Live > Recent Finished > Upcoming > Old Finished
                              const aStatus = a.fixture.status.short;
                              const bStatus = b.fixture.status.short;
                              const aDate = new Date(a.fixture.date).getTime();
                              const bDate = new Date(b.fixture.date).getTime();

                              const aLive = ['LIVE', '1H', 'HT', '2H', 'ET'].includes(aStatus);
                              const bLive = ['LIVE', '1H', 'HT', '2H', 'ET'].includes(bStatus);

                              if (aLive && !bLive) return -1;
                              if (!aLive && bLive) return 1;

                              const aFinished = ['FT', 'AET', 'PEN'].includes(aStatus);
                              const bFinished = ['FT', 'AET', 'PEN'].includes(bStatus);

                              if (aFinished && bFinished) return bDate - aDate; // Most recent first
                              if (aFinished && !bFinished) return -1;
                              if (!aFinished && bFinished) return 1;

                              return aDate - bDate; // Upcoming: earliest first
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
                                    src={match.teams.home.logo}
                                    alt={match.teams.home.name}
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                                    }}
                                  />
                                </div>

                                {/* Score/Time Center */}
                                <div className="flex flex-col items-center justify-center px-4 flex-shrink-0">
                                  {(() => {
                                    const status = match.fixture.status.short;
                                    const fixtureDate = new Date(match.fixture.date);
                                    const hasScore = match.goals.home !== null || match.goals.away !== null;

                                    // Live matches
                                    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
                                      return (
                                        <>
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

                                    // Finished matches
                                    if (['FT', 'AET', 'PEN'].includes(status) || hasScore) {
                                      return (
                                        <>
                                          <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <span>{match.goals.home ?? 0}</span>
                                            <span className="text-gray-400">-</span>
                                            <span>{match.goals.away ?? 0}</span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {status === 'FT' ? 'FT' : 
                                             status === 'AET' ? 'AET' :
                                             status === 'PEN' ? 'PEN' : 'Finished'}
                                          </div>
                                        </>
                                      );
                                    }

                                    // Upcoming matches
                                    return (
                                      <div className="text-sm font-medium text-blue-600">
                                        {format(fixtureDate, 'HH:mm')}
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="flex-shrink-0 mx-1">
                                  <img
                                    src={match.teams.away.logo}
                                    alt={match.teams.away.name}
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
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
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayPopularFootballLeagues;
