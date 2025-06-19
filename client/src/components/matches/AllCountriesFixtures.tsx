
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getCountryFlagWithFallbackSync } from '@/lib/flagUtils';
import { formatMatchTime } from '@/lib/dateUtilsUpdated';

interface AllCountriesFixturesProps {
  selectedDate: string;
  onMatchCardClick?: (fixture: any) => void;
}

interface CountryGroup {
  country: string;
  flag: string;
  matches: any[];
  totalCount: number;
  liveCount: number;
}

const AllCountriesFixtures: React.FC<AllCountriesFixturesProps> = ({
  selectedDate,
  onMatchCardClick
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // Fetch all fixtures for the selected date
  const { data: allFixtures = [], isLoading } = useQuery({
    queryKey: ["all-countries-fixtures", selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/all-countries-fixtures/date/${selectedDate}`);
      return await response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!selectedDate,
  });

  // Group fixtures by country
  const countryGroups = useMemo(() => {
    if (!allFixtures || allFixtures.length === 0) return [];

    const countryMap = new Map<string, CountryGroup>();

    allFixtures.forEach((fixture: any) => {
      if (!fixture?.league?.country || !fixture?.teams) return;

      const country = fixture.league.country;
      
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          flag: getCountryFlagWithFallbackSync(country),
          matches: [],
          totalCount: 0,
          liveCount: 0
        });
      }

      const group = countryMap.get(country)!;
      group.matches.push(fixture);
      group.totalCount++;

      // Count live matches
      const isLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(
        fixture.fixture?.status?.short
      );
      if (isLive) {
        group.liveCount++;
      }
    });

    // Sort countries: live matches first, then by total count, then alphabetically
    return Array.from(countryMap.values()).sort((a, b) => {
      if (a.liveCount !== b.liveCount) {
        return b.liveCount - a.liveCount;
      }
      if (a.totalCount !== b.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return a.country.localeCompare(b.country);
    });
  }, [allFixtures]);

  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(country)) {
        newSet.delete(country);
      } else {
        newSet.add(country);
      }
      return newSet;
    });
  };

  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture?.status?.short;
    const elapsed = fixture.fixture?.status?.elapsed;

    switch (status) {
      case 'NS':
        return formatMatchTime(fixture.fixture.date);
      case 'LIVE':
      case '1H':
      case '2H':
        return elapsed ? `${elapsed}'` : 'LIVE';
      case 'HT':
        return 'HT';
      case 'FT':
        return 'FT';
      case 'ET':
        return 'ET';
      case 'P':
        return 'PEN';
      default:
        return status || 'TBD';
    }
  };

  const handleMatchClick = (fixture: any) => {
    onMatchCardClick?.(fixture);
  };

  if (isLoading) {
    return (
      <Card className="shadow-md w-full">
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Today's Football Matches by Country</h2>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-gray-500">
            Loading matches by country...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (countryGroups.length === 0) {
    return (
      <Card className="shadow-md w-full">
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Today's Football Matches by Country</h2>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-gray-500">
            No matches found for {selectedDate}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md w-full">
      <CardHeader className="pb-3">
        <h2 className="text-lg font-semibold">Today's Football Matches by Country</h2>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {countryGroups.map((group) => {
            const isExpanded = expandedCountries.has(group.country);
            
            return (
              <div key={group.country} className="border-b border-gray-100 last:border-b-0">
                {/* Country Header */}
                <button
                  onClick={() => toggleCountry(group.country)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Country Flag */}
                    <img
                      src={group.flag}
                      alt={`${group.country} flag`}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/fallback-logo.svg';
                      }}
                    />
                    
                    {/* Country Name and Count */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{group.country}</span>
                      <span className="text-sm text-gray-500">({group.totalCount})</span>
                      {group.liveCount > 0 && (
                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                          {group.liveCount} LIVE
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Expand/Collapse Icon */}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {/* Matches List */}
                {isExpanded && (
                  <div className="bg-gray-50 px-4 py-2">
                    <div className="space-y-2">
                      {group.matches.map((fixture) => {
                        const isLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(
                          fixture.fixture?.status?.short
                        );
                        
                        return (
                          <div
                            key={fixture.fixture.id}
                            onClick={() => handleMatchClick(fixture)}
                            className="bg-white rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition-colors border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              {/* Teams */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <img
                                    src={fixture.teams.home.logo}
                                    alt={fixture.teams.home.name}
                                    className="w-4 h-4"
                                    onError={(e) => {
                                      e.currentTarget.src = '/assets/fallback-logo.svg';
                                    }}
                                  />
                                  <span className="text-sm font-medium">{fixture.teams.home.name}</span>
                                  {fixture.goals?.home !== null && (
                                    <span className="text-sm font-bold">{fixture.goals.home}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <img
                                    src={fixture.teams.away.logo}
                                    alt={fixture.teams.away.name}
                                    className="w-4 h-4"
                                    onError={(e) => {
                                      e.currentTarget.src = '/assets/fallback-logo.svg';
                                    }}
                                  />
                                  <span className="text-sm font-medium">{fixture.teams.away.name}</span>
                                  {fixture.goals?.away !== null && (
                                    <span className="text-sm font-bold">{fixture.goals.away}</span>
                                  )}
                                </div>
                              </div>

                              {/* Status and League */}
                              <div className="text-right">
                                <div className={`text-xs font-medium mb-1 ${
                                  isLive ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {getMatchStatus(fixture)}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[100px]">
                                  {fixture.league.name}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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

export default AllCountriesFixtures;
