
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import TeamLogo from './TeamLogo';

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

  // Start with all countries collapsed by default
  useEffect(() => {
    if (fixtures.length > 0) {
      // Keep countries collapsed by default - don't auto-expand
      setExpandedCountries(new Set());
    }
  }, [fixtures]);

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
    if (status === 'FT' || status === 'AET' || status === 'PEN') {
      return 'Ended';
    } else if (status === 'LIVE' || status === '1H' || status === 'HT' || status === '2H') {
      return 'Live';
    } else if (status === 'NS') {
      return format(new Date(fixture.fixture.date), 'HH:mm');
    }
    return status;
  };

  const getStatusColor = (fixture: any) => {
    const status = fixture.fixture.status.short;
    if (status === 'FT' || status === 'AET' || status === 'PEN') {
      return 'text-gray-500';
    } else if (status === 'LIVE' || status === '1H' || status === 'HT' || status === '2H') {
      return 'text-green-600 font-semibold';
    }
    return 'text-gray-700';
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
            ? "Football Match By Country" 
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
                        <div className="flex items-center gap-2 mb-3">
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

                        {/* Matches */}
                        <div className="space-y-2">
                          {leagueData.matches.map((match: any) => (
                            <div key={match.fixture.id} className="bg-white rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between">
                                {/* Teams */}
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-sm font-medium truncate">
                                      {match.teams.home.name}
                                    </span>
                                    <TeamLogo
                                      src={match.teams.home.logo}
                                      alt={match.teams.home.name}
                                      size="sm"
                                    />
                                  </div>
                                </div>

                                {/* Score/Status */}
                                <div className="flex flex-col items-center mx-4">
                                  <div className={`text-xs ${getStatusColor(match)}`}>
                                    {getMatchStatus(match)}
                                  </div>
                                  {(match.goals.home !== null && match.goals.away !== null) && (
                                    <div className="text-lg font-bold text-gray-900">
                                      {match.goals.home} - {match.goals.away}
                                    </div>
                                  )}
                                </div>

                                {/* Away team */}
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                    <TeamLogo
                                      src={match.teams.away.logo}
                                      alt={match.teams.away.name}
                                      size="sm"
                                    />
                                    <span className="text-sm font-medium truncate">
                                      {match.teams.away.name}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* League Standings Link */}
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            {leagueData.league.name} Standings
                            <ChevronDown className="h-3 w-3" />
                          </button>
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
