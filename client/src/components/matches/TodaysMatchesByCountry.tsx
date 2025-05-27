import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, isToday, isYesterday, isTomorrow, differenceInHours, parseISO, isValid } from 'date-fns';

interface TodaysMatchesByCountryProps {
  selectedDate: string;
}

const TodaysMatchesByCountry: React.FC<TodaysMatchesByCountryProps> = ({ selectedDate }) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [enableFetching, setEnableFetching] = useState(true);

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

  // Fetch all fixtures for the selected date with aggressive caching
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ['all-fixtures-by-date', selectedDate],
    queryFn: async () => {
      console.log(`Fetching fixtures for date: ${selectedDate}`);
      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();

      console.log(`Received ${data.length} fixtures for ${selectedDate} - no additional filtering applied`);
      // Trust the API to return correct fixtures for the date - don't double filter
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for fresher data
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    enabled: !!selectedDate && enableFetching,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Start with all countries collapsed by default
  useEffect(() => {
    // Reset to collapsed state when selected date changes
    setExpandedCountries(new Set());
  }, [selectedDate]);

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

  // Use only the main fixtures data
  const allFixtures = fixtures;

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

  // Sort countries alphabetically A-Z
  const sortedCountries = Object.values(fixturesByCountry).sort((a: any, b: any) => {
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
      return "Today's Football Matches by Country";
    } else if (isYesterday(selectedDateObj)) {
      return "Yesterday's Football Results by Country";
    } else if (isTomorrow(selectedDateObj)) {
      return "Tomorrow's Football Matches by Country";
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
    <Card>
      <CardHeader className="pb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {getHeaderTitle()}
        </h3>

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
                        <div className="flex items-center gap-2 mb-0 py-2 px-4 bg-gray-50 border-b border-gray-200">
                          <img
                            src={leagueData.league.logo}
                            alt={leagueData.league.name}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                            }}
                          />
                          <span className="font-medium text-sm text-gray-700">
                            {leagueData.league.name}
                          </span>
                          {leagueData.isPopular && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                              Popular
                            </span>
                          )}
                        </div>

                        {/* Matches */}
                        <div className="space-y-0 mt-3">
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
                              className="bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0 py-3 px-4"
                            >
                              <div className="flex items-center justify-between">
                                {/* Home Team - Left side */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <img
                                    src={match.teams.home.logo}
                                    alt={match.teams.home.name}
                                    className="w-5 h-5 object-contain flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                                    }}
                                  />
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {match.teams.home.name}
                                  </span>
                                </div>

                                {/* Score/Time Center */}
                                <div className="flex items-center justify-center gap-1 mx-4 flex-shrink-0">
                                  {(() => {
                                    const status = match.fixture.status.short;
                                    const fixtureDate = new Date(match.fixture.date);
                                    const hasScore = match.goals.home !== null || match.goals.away !== null;

                                    // Live matches
                                    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
                                      return (
                                        <div className="flex items-center gap-1">
                                          <span className="text-lg font-bold text-red-600">{match.goals.home ?? 0}</span>
                                          <span className="text-xs text-red-600 font-semibold animate-pulse">
                                            {status === 'HT' ? 'HT' : (match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : 'LIVE')}
                                          </span>
                                          <span className="text-lg font-bold text-red-600">{match.goals.away ?? 0}</span>
                                        </div>
                                      );
                                    }

                                    // Finished matches
                                    if (['FT', 'AET', 'PEN'].includes(status)) {
                                      const hasValidScore = match.goals.home !== null && match.goals.away !== null;

                                      if (hasValidScore) {
                                        return (
                                          <div className="flex items-center gap-1">
                                            <span className="text-lg font-bold text-gray-900">{match.goals.home}</span>
                                            <span className="text-xs text-gray-500 font-medium">
                                              {status === 'FT' ? 'FT' : status}
                                            </span>
                                            <span className="text-lg font-bold text-gray-900">{match.goals.away}</span>
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <span className="text-xs text-orange-600 font-medium px-2 py-1 bg-orange-100 rounded">
                                            {status === 'FT' ? 'Finished' : status}
                                          </span>
                                        );
                                      }
                                    }

                                    // Check for other finished statuses with score data
                                    if (hasScore) {
                                      return (
                                        <div className="flex items-center gap-1">
                                          <span className="text-lg font-bold text-gray-900">{match.goals.home ?? 0}</span>
                                          <span className="text-xs text-gray-500 font-medium">FT</span>
                                          <span className="text-lg font-bold text-gray-900">{match.goals.away ?? 0}</span>
                                        </div>
                                      );
                                    }

                                    // Upcoming matches
                                    return (
                                      <span className="text-sm font-semibold text-blue-600 px-2 py-1 bg-blue-50 rounded">
                                        {format(fixtureDate, 'HH:mm')}
                                      </span>
                                    );
                                  })()}
                                </div>

                                {/* Away Team - Right side */}
                                <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                                  <span className="text-sm font-medium text-gray-900 truncate text-right">
                                    {match.teams.away.name}
                                  </span>
                                  <img
                                    src={match.teams.away.logo}
                                    alt={match.teams.away.name}
                                    className="w-5 h-5 object-contain flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                                    }}
                                  />
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

export default TodaysMatchesByCountry;