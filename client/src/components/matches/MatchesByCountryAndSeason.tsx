
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Flag, Calendar, Trophy, Clock, MapPin } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface Country {
  name: string;
  code: string;
  flag: string;
  leagues: Array<{
    id: number;
    name: string;
    type: string;
    logo: string;
  }>;
  seasons: number[];
  leagueCount: number;
}

interface MatchesByCountryAndSeasonProps {
  onMatchClick?: (matchId: number) => void;
}

export const MatchesByCountryAndSeason: React.FC<MatchesByCountryAndSeasonProps> = ({ onMatchClick }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('2024');
  const [selectedLeague, setSelectedLeague] = useState<string>('__all_leagues__');

  // Get available countries
  const { data: countriesData, isLoading: countriesLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/countries');
      const data = await response.json();
      return data;
    }
  });

  // Get fixtures for selected country and season
  const { data: fixturesData, isLoading: fixturesLoading } = useQuery({
    queryKey: ['fixtures-country', selectedCountry, selectedSeason, selectedLeague],
    queryFn: async () => {
      if (!selectedCountry) return null;
      
      const params = new URLSearchParams();
      if (selectedSeason) params.append('season', selectedSeason);
      if (selectedLeague && selectedLeague !== '__all_leagues__') params.append('league', selectedLeague);
      
      const response = await apiRequest('GET', `/api/fixtures/country/${selectedCountry}?${params.toString()}`);
      const data = await response.json();
      return data;
    },
    enabled: !!selectedCountry
  });

  const countries: Country[] = countriesData?.countries || [];
  const selectedCountryData = countries.find(c => c.name === selectedCountry);
  const fixtures = fixturesData?.fixtures || [];

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedLeague('__all_leagues__'); // Reset league when country changes
  };

  const formatMatchStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'NS': 'Not Started',
      '1H': '1st Half',
      'HT': 'Half Time',
      '2H': '2nd Half',
      'FT': 'Full Time',
      'ET': 'Extra Time',
      'BT': 'Break Time',
      'P': 'Penalty',
      'SUSP': 'Suspended',
      'INT': 'Interrupted',
      'FIN': 'Finished',
      'LIVE': 'Live'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return 'bg-green-500 text-white';
    }
    if (['FT', 'FIN'].includes(status)) {
      return 'bg-gray-500 text-white';
    }
    return 'bg-blue-500 text-white';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Browse Matches by Country & Season
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Country Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Country</label>
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a country..." />
              </SelectTrigger>
              <SelectContent>
                {countriesLoading ? (
                  <SelectItem value="__loading__" disabled>Loading countries...</SelectItem>
                ) : (
                  countries.map((country) => (
                    <SelectItem key={country.name} value={country.name || 'unknown'}>
                      <div className="flex items-center gap-2">
                        {country.flag && (
                          <img src={country.flag} alt={country.code} className="w-4 h-3 object-cover" />
                        )}
                        <span>{country.name || 'Unknown Country'}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {country.leagueCount} leagues
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Season Selection */}
          {selectedCountryData && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Season</label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a season..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedCountryData.seasons.map((season) => (
                    <SelectItem key={season} value={season.toString()}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {season}/{season + 1}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* League Filter */}
          {selectedCountryData && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by League (Optional)</label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger>
                  <SelectValue placeholder="All leagues in country..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all_leagues__">All Leagues</SelectItem>
                  {selectedCountryData.leagues.map((league) => (
                    <SelectItem key={league.id} value={league.name}>
                      <div className="flex items-center gap-2">
                        {league.logo && (
                          <img src={league.logo} alt={league.name} className="w-4 h-4 object-contain" />
                        )}
                        <span>{league.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {league.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {selectedCountry && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Matches in {selectedCountry} ({selectedSeason}/{parseInt(selectedSeason) + 1})
              {selectedLeague && ` - ${selectedLeague}`}
            </CardTitle>
            {fixturesData && (
              <p className="text-sm text-gray-600">
                Found {fixtures.length} matches from {fixturesData.totalLeagues} leagues
              </p>
            )}
          </CardHeader>
          <CardContent>
            {fixturesLoading ? (
              <div className="text-center py-8">
                <p>Loading matches...</p>
              </div>
            ) : fixtures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No matches found for the selected criteria</p>
                <p className="text-sm">Try selecting a different season or country</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {fixtures.slice(0, 50).map((fixture: any) => (
                  <div
                    key={fixture.fixture.id}
                    className="bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => onMatchClick?.(fixture.fixture.id)}
                  >
                    <div className="flex items-center px-3 py-2">
                      {/* Home Team */}
                      <div className="text-right text-sm text-gray-900 min-w-0 flex-1 pr-2 truncate">
                        {fixture.teams.home.name}
                      </div>

                      <div className="flex-shrink-0 mx-1">
                        <img
                          src={fixture.teams.home.logo || '/assets/fallback-logo.svg'}
                          alt={fixture.teams.home.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== '/assets/fallback-logo.svg') {
                              target.src = '/assets/fallback-logo.svg';
                            }
                          }}
                        />
                      </div>

                      {/* Score/Time Center */}
                      <div className="flex flex-col items-center justify-center px-4 flex-shrink-0">
                        {(() => {
                          const status = fixture.fixture.status.short;
                          const fixtureDate = new Date(fixture.fixture.date);

                          // Live matches
                          if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
                            return (
                              <>
                                <div className="text-xs text-red-600 font-semibold mb-1 animate-pulse">
                                  LIVE
                                </div>
                                <div className="text-lg font-bold text-red-600 flex items-center gap-2">
                                  <span>{fixture.goals.home ?? 0}</span>
                                  <span className="text-gray-400">-</span>
                                  <span>{fixture.goals.away ?? 0}</span>
                                </div>
                                <div className="text-xs text-red-600 font-semibold mt-1 animate-pulse">
                                  {status === 'HT' ? 'HT' : `${fixture.fixture.status.elapsed || 0}'`}
                                </div>
                              </>
                            );
                          }

                          // All finished match statuses
                          if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
                            const homeScore = fixture.goals.home;
                            const awayScore = fixture.goals.away;
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
                          src={fixture.teams.away.logo || '/assets/fallback-logo.svg'}
                          alt={fixture.teams.away.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== '/assets/fallback-logo.svg') {
                              target.src = '/assets/fallback-logo.svg';
                            }
                          }}
                        />
                      </div>

                      {/* Away Team */}
                      <div className="text-left text-sm text-gray-900 min-w-0 flex-1 pl-2 truncate">
                        {fixture.teams.away.name}
                      </div>

                      {/* League info - positioned to the right */}
                      <div className="text-right text-xs text-gray-500 ml-4 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(fixture.fixture.date), 'MMM d, HH:mm')}
                        </div>
                        <div className="mt-1">{fixture.league.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchesByCountryAndSeason;
