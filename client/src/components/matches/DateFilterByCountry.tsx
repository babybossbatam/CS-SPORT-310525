import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import { format, parseISO, isValid } from 'date-fns';
import { Clock, Star, MapPin } from 'lucide-react';
import { getCurrentUTCDateString, isDateStringToday, isDateStringYesterday, isDateStringTomorrow } from '@/lib/dateUtilsUpdated';
import { getCountryFlagWithFallbackSync } from '@/lib/flagUtils';

interface DateFilterByCountryProps {
  selectedDate: string;
  onMatchClick?: (matchId: number) => void;
}

interface FixtureData {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
    };
    venue?: {
      name?: string;
      city?: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

interface CountryGroup {
  country: string;
  flag: string;
  matches: FixtureData[];
  liveCount: number;
  totalCount: number;
}

export const DateFilterByCountry: React.FC<DateFilterByCountryProps> = ({ 
  selectedDate, 
  onMatchClick 
}) => {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteTeams, setFavoriteTeams] = useState<Set<number>>(new Set());

  // Fetch fixtures for the selected date
  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/fixtures/date/${selectedDate}?all=true`);
        if (!response.ok) {
          throw new Error(`Failed to fetch fixtures: ${response.statusText}`);
        }

        const data = await response.json();
        setFixtures(data || []);
      } catch (err) {
        console.error('Error fetching fixtures:', err);
        setError(err instanceof Error ? err.message : 'Failed to load fixtures');
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate) {
      fetchFixtures();
    }
  }, [selectedDate]);

  // Group fixtures by country
  const groupedByCountry = useMemo(() => {
    if (!fixtures.length) return [];

    const countryGroups = new Map<string, CountryGroup>();

    fixtures.forEach(fixture => {
      const country = fixture.league.country || 'Unknown';

      if (!countryGroups.has(country)) {
        countryGroups.set(country, {
          country,
          flag: getCountryFlagWithFallbackSync(country),
          matches: [],
          liveCount: 0,
          totalCount: 0
        });
      }

      const group = countryGroups.get(country)!;
      group.matches.push(fixture);
      group.totalCount++;

      // Count live matches
      const isLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(
        fixture.fixture.status.short
      );
      if (isLive) {
        group.liveCount++;
      }
    });

    // Sort countries by live matches first, then by total matches
    return Array.from(countryGroups.values()).sort((a, b) => {
      if (a.liveCount !== b.liveCount) {
        return b.liveCount - a.liveCount;
      }
      return b.totalCount - a.totalCount;
    });
  }, [fixtures]);

  // Get display name for the selected date
  const getDateDisplayName = () => {
    if (isDateStringToday(selectedDate)) return "Today's Matches";
    if (isDateStringYesterday(selectedDate)) return "Yesterday's Matches";
    if (isDateStringTomorrow(selectedDate)) return "Tomorrow's Matches";

    try {
      const date = parseISO(selectedDate);
      return isValid(date) ? format(date, 'EEE, do MMM') + ' Matches' : selectedDate;
    } catch {
      return selectedDate;
    }
  };

  // Format match time
  const formatMatchTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'HH:mm') : '--:--';
    } catch {
      return '--:--';
    }
  };

  // Get match status display
  const getMatchStatus = (fixture: FixtureData) => {
    const status = fixture.fixture.status.short;
    const elapsed = fixture.fixture.status.elapsed;

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
      case 'PEN':
        return 'PEN';
      default:
        return status;
    }
  };

  // Toggle favorite team
  const toggleFavorite = (teamId: number) => {
    setFavoriteTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading matches...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </Card>
    );
  }

  if (!groupedByCountry.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No matches found for {getDateDisplayName().toLowerCase()}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {getDateDisplayName()} by Country
        </h2>

        <div className="space-y-6">
          {groupedByCountry.map((countryGroup) => (
            <div key={countryGroup.country} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={countryGroup.flag} 
                  alt={`${countryGroup.country} flag`}
                  className="w-6 h-4 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/fallback-logo.svg';
                  }}
                />
                <h3 className="font-medium text-lg">
                  {countryGroup.country}
                </h3>
                <span className="text-sm text-gray-500">
                  ({countryGroup.totalCount})
                </span>
                {countryGroup.liveCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {countryGroup.liveCount} LIVE
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {countryGroup.matches.map((match) => (
                  <div 
                    key={match.fixture.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => onMatchClick?.(match.fixture.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <img 
                          src={match.teams.home.logo} 
                          alt={match.teams.home.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/fallback-logo.svg';
                          }}
                        />
                        <span className="text-sm font-medium min-w-0 truncate">
                          {match.teams.home.name}
                        </span>
                      </div>

                      <div className="text-center min-w-[60px]">
                        {match.goals.home !== null && match.goals.away !== null ? (
                          <span className="text-sm font-bold">
                            {match.goals.home} - {match.goals.away}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">vs</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium min-w-0 truncate">
                          {match.teams.away.name}
                        </span>
                        <img 
                          src={match.teams.away.logo} 
                          alt={match.teams.away.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/fallback-logo.svg';
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-gray-500 min-w-[50px] text-center">
                        {getMatchStatus(match)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(match.teams.home.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Star 
                          className={`h-3 w-3 ${
                            favoriteTeams.has(match.teams.home.id) 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DateFilterByCountry;