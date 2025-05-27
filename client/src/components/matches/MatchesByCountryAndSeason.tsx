
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
  const [selectedLeague, setSelectedLeague] = useState<string>('');

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
      if (selectedLeague) params.append('league', selectedLeague);
      
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
    setSelectedLeague(''); // Reset league when country changes
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
                  <SelectItem value="loading" disabled>Loading countries...</SelectItem>
                ) : (
                  countries.map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      <div className="flex items-center gap-2">
                        {country.flag && (
                          <img src={country.flag} alt={country.code} className="w-4 h-3 object-cover" />
                        )}
                        <span>{country.name}</span>
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
                  <SelectItem value="">All Leagues</SelectItem>
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
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onMatchClick?.(fixture.fixture.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Badge className={getStatusColor(fixture.fixture.status.short)}>
                          {formatMatchStatus(fixture.fixture.status.short)}
                        </Badge>
                        
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="flex items-center space-x-2">
                            {fixture.teams.home.logo && (
                              <img 
                                src={fixture.teams.home.logo} 
                                alt={fixture.teams.home.name}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                            <span className="font-medium">{fixture.teams.home.name}</span>
                          </div>
                          
                          <div className="text-center px-2">
                            <div className="font-bold">
                              {fixture.goals.home !== null && fixture.goals.away !== null 
                                ? `${fixture.goals.home} - ${fixture.goals.away}`
                                : 'vs'
                              }
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{fixture.teams.away.name}</span>
                            {fixture.teams.away.logo && (
                              <img 
                                src={fixture.teams.away.logo} 
                                alt={fixture.teams.away.name}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-gray-500 ml-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(fixture.fixture.date), 'MMM d, HH:mm')}
                        </div>
                        <div className="text-xs">{fixture.league.name}</div>
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
