import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import TeamLogo from './TeamLogo';
import { 
  formatTimeInUserTimezone, 
  convertToUserTimezone, 
  getUserTimezone,
  getValidDate,
  isToday,
  isTomorrow,
  isYesterday
} from '@/lib/dateUtils';

interface MatchesByCountryProps {
  selectedDate: string;
}

const MatchesByCountry: React.FC<MatchesByCountryProps> = ({ selectedDate }) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());



  const { data: fixtures = [] } = useQuery({
    queryKey: ['all-fixtures-by-date', selectedDate],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}?all=true`);
      return await response.json();
    }
  });

  // Auto-expand countries that have finished matches today
  useEffect(() => {
    if (fixtures.length > 0) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const isToday = selectedDate === today;

      if (isToday) {
        // For today, auto-expand countries that have finished matches
        const countriesWithFinishedMatches = new Set<string>();

        fixtures.forEach((fixture: any) => {
          const status = fixture.fixture.status.short;
          if (['FT', 'AET', 'PEN'].includes(status)) {
            countriesWithFinishedMatches.add(fixture.league.country);
          }
        });

        setExpandedCountries(countriesWithFinishedMatches);
      } else {
        // For other dates, keep collapsed
        setExpandedCountries(new Set());
      }
    }
  }, [fixtures, selectedDate]);

  // Enhanced country flag mapping
  const getCountryFlag = (country: string, leagueFlag?: string) => {
    // Use league flag if available
    if (leagueFlag) return leagueFlag;

    // Special handling for World/International competitions
    if (country === 'World' || country === 'International') {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/FIFA_Logo_%282010%29.svg/24px-FIFA_Logo_%282010%29.svg.png'; // FIFA logo for world competitions
    }

    // Country code mapping for better flag display
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

    const countryCode = countryCodeMap[country] || 
      country.substring(0, 2).toUpperCase();

    return `https://flagsapi.com/${countryCode}/flat/24.png`;
  };

  // Group fixtures by country
  const fixturesByCountry = fixtures.reduce((acc: any, fixture: any) => {
    const country = fixture.league.country;
    if (!acc[country]) {
      acc[country] = {
        country,
        flag: getCountryFlag(country, fixture.league.flag),
        leagues: {}
      };
    }

    const leagueId = fixture.league.id;
    if (!acc[country].leagues[leagueId]) {
      acc[country].leagues[leagueId] = {
        league: fixture.league,
        matches: []
      };
    }

    acc[country].leagues[leagueId].matches.push(fixture);
    return acc;
  }, {});

  // Sort countries alphabetically
  const sortedCountries = Object.values(fixturesByCountry).sort((a: any, b: any) => 
    a.country.localeCompare(b.country)
  );

  const toggleCountry = (country: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(country)) {
      newExpanded.delete(country);
    } else {
      newExpanded.add(country);
    }
    setExpandedCountries(newExpanded);
  };

  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;

    // Explicitly check for ended match statuses
    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      return status; // Return the actual status code (FT, AET, etc.)
    } 
    // Check for live match statuses
    else if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return status === 'HT' ? 'HT' : 'LIVE';
    } 
    // For upcoming matches, just show "Scheduled"
    else {
      const matchDate = new Date(fixture.fixture.date);
      const now = new Date();

      // If match time has passed but status is still 'NS', it might be delayed
      if (matchDate < now && status === 'NS') {
        return 'Delayed';
      }

      return 'Scheduled';
    }
  };

  const getStatusColor = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const matchDate = new Date(fixture.fixture.date);
    const now = new Date();

    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      return 'bg-gray-100 text-gray-700 font-semibold';
    } else if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return 'bg-green-100 text-green-700 font-semibold';
    } else if (matchDate < now && status === 'NS') {
      // Delayed match styling
      return 'bg-orange-100 text-orange-700';
    }
    return 'bg-blue-100 text-blue-700';
  };

  if (!fixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <h3 className="text-sm font-semibold">
          {selectedDate === format(new Date(), 'yyyy-MM-dd') 
            ? "Today's Latest Football Results By Country" 
            : `Football Match By Country - ${format(new Date(selectedDate), 'MMM d, yyyy')}`
          }
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {sortedCountries.map((countryData: any) => {
            const isExpanded = expandedCountries.has(countryData.country);
            const totalMatches = Object.values(countryData.leagues).reduce(
              (sum: number, league: any) => sum + league.matches.length, 0
            );

            return (
              <div key={countryData.country} className="border-b border-gray-100 last:border-b-0">
                {/* Country Header - Simple list style */}
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
                        // For World/International, try a globe emoji as fallback
                        if (countryData.country === 'World' || countryData.country === 'International') {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                        } else {
                          (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900">{countryData.country}</span>
                    <span className="text-xs text-gray-500">({totalMatches})</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    {Object.values(countryData.leagues).map((leagueData: any) => (
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
                        </div>

                        {/* Matches - Exact 365scores style */}
                        <div className="space-y-1 mt-3">
                          {leagueData.matches
                            .sort((a: any, b: any) => {
                              // Sort finished matches first, then by date
                              const aFinished = ['FT', 'AET', 'PEN'].includes(a.fixture.status.short);
                              const bFinished = ['FT', 'AET', 'PEN'].includes(b.fixture.status.short);

                              if (aFinished && !bFinished) return -1;
                              if (!aFinished && bFinished) return 1;

                              // If both finished or both not finished, sort by date (most recent first for finished)
                              const aDate = new Date(a.fixture.date).getTime();
                              const bDate = new Date(b.fixture.date).getTime();

                              return aFinished ? bDate - aDate : aDate - bDate;
                            })
                            .map((match: any, index: number) => (
                            <div 
                              key={match.fixture.id} 
                              className="bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer relative border-b border-gray-100 last:border-b-0"
                              style={{ marginBottom: '5px' }}
                            >
                              <div className="flex items-center px-3 py-2">
                                {/* Home Team Name - Far Left */}
                                <div className="text-right text-sm text-gray-900 min-w-0 flex-1 pr-2">
                                  {match.teams.home.name}
                                </div>

                                {/* Home Team Logo */}
                                <div className="flex-shrink-0 mx-1">
                                  <img
                                    src={match.teams.home.logo || '/assets/fallback-logo.png'}
                                    alt={match.teams.home.name}
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      // Try different fallback options
                                      if (target.src.includes('fallback-logo.png')) {
                                        // If even fallback failed, use a data URL
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Im04IDEyaDhtLTQtNGwwIDh6IiBmaWxsPSIjMzM3M2RjIi8+Cjwvc3ZnPgo=';
                                      } else {
                                        target.src = '/assets/fallback-logo.png';
                                      }
                                    }}
                                  />
                                </div>

                                {/* Score - Center */}
                                <div className="flex flex-col items-center justify-center px-4 flex-shrink-0">
                                  {(() => {
                                    const matchDate = new Date(match.fixture.date);
                                    const now = new Date();
                                    const matchPassedHours = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
                                    const hasScore = match.goals.home !== null || match.goals.away !== null;

                                    // If match was more than 2 hours ago OR has score data, show score regardless of status
                                    if (matchPassedHours > 2 || hasScore || ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(match.fixture.status.short)) {
                                      return (
                                        <>
                                          {/* Finished matches - show final score */}
                                          <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <span>{match.goals.home !== null ? match.goals.home : 0}</span>
                                            <span className="text-gray-400">-</span>
                                            <span>{match.goals.away !== null ? match.goals.away : 0}</span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {match.fixture.status.short === 'FT' ? 'Full Time' : 
                                             match.fixture.status.short === 'AET' ? 'After Extra Time' :
                                             match.fixture.status.short === 'PEN' ? 'Penalties' : 
                                             matchPassedHours > 2 ? 'Finished' : 'Completed'}
                                          </div>
                                        </>
                                      );
                                    }

                                    // Live matches
                                    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(match.fixture.status.short)) {
                                      return (
                                        <>
                                          <div className="text-lg font-bold text-green-600 flex items-center gap-2">
                                            <span>{match.goals.home !== null ? match.goals.home : 0}</span>
                                            <span className="text-gray-400">-</span>
                                            <span>{match.goals.away !== null ? match.goals.away : 0}</span>
                                          </div>
                                          <div className="text-xs text-green-600 font-semibold mt-1">
                                            {match.fixture.status.short === 'HT' ? 'Half Time' : 
                                             match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : 'LIVE'}
                                          </div>
                                        </>
                                      );
                                    }

                                    // Truly upcoming matches
                                    if (match.fixture.status.short === 'NS' || match.fixture.status.short === 'TBD') {
                                      return (
                                        <div className="text-sm font-medium text-blue-600">
                                          {format(matchDate, 'HH:mm')}
                                        </div>
                                      );
                                    }

                                    // Fallback for any other status
                                    return (
                                      <div className="text-sm font-medium text-orange-600">
                                        {match.fixture.status.long || match.fixture.status.short}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Away Team Logo */}
                                <div className="flex-shrink-0 mx-1">
                                  <img
                                    src={match.teams.away.logo || '/assets/fallback-logo.png'}
                                    alt={match.teams.away.name}
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      // Try different fallback options
                                      if (target.src.includes('fallback-logo.png')) {
                                        // If even fallback failed, use a data URL
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Im04IDEyaDhtLTQtNGwwIDh6IiBmaWxsPSIjMzM3M2RjIi8+Cjwvc3ZnPgo=';
                                      } else {
                                        target.src = '/assets/fallback-logo.png';
                                      }
                                    }}
                                  />
                                </div>

                                {/* Away Team Name - Far Right */}
                                <div className="text-left text-sm text-gray-900 min-w-0 flex-1 pl-2">
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

export default MatchesByCountry;