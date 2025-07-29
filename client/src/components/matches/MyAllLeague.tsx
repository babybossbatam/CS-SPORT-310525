
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { apiRequest } from '@/lib/queryClient';
import MyWorldTeamLogo from '@/components/common/MyWorldTeamLogo';
import MyCountryGroupFlag from '@/components/common/MyCountryGroupFlag';
import '../styles/TodaysMatchByCountryNew.css';

interface Fixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
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
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

interface CountryGroup {
  country: string;
  matches: Fixture[];
  totalMatches: number;
  isExpanded: boolean;
}

interface MyAllLeagueProps {
  selectedDate: string;
}

const MyAllLeague: React.FC<MyAllLeagueProps> = ({ selectedDate }) => {
  const [countryGroups, setCountryGroups] = useState<CountryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fixtures data
  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiRequest('GET', `/api/fixtures/date/${selectedDate}`);
        const fixtures: Fixture[] = await response.json();

        // Group fixtures by country
        const groupedByCountry = fixtures.reduce((acc, fixture) => {
          const country = fixture.league.country;
          if (!acc[country]) {
            acc[country] = [];
          }
          acc[country].push(fixture);
          return acc;
        }, {} as Record<string, Fixture[]>);

        // Convert to array and sort by match count
        const countryGroupsArray = Object.entries(groupedByCountry)
          .map(([country, matches]) => ({
            country,
            matches,
            totalMatches: matches.length,
            isExpanded: false,
          }))
          .sort((a, b) => b.totalMatches - a.totalMatches);

        setCountryGroups(countryGroupsArray);
      } catch (err) {
        console.error('Error fetching fixtures:', err);
        setError('Failed to load fixtures');
      } finally {
        setLoading(false);
      }
    };

    fetchFixtures();
  }, [selectedDate]);

  const toggleCountryExpansion = useCallback((country: string) => {
    setCountryGroups(prev => 
      prev.map(group => 
        group.country === country 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  }, []);

  const formatMatchTime = (fixture: Fixture) => {
    const status = fixture.fixture.status.short;
    const elapsed = fixture.fixture.status.elapsed;

    switch (status) {
      case 'NS':
        return new Date(fixture.fixture.date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      case '1H':
      case '2H':
        return `${elapsed}'`;
      case 'HT':
        return 'HT';
      case 'FT':
        return 'FT';
      case 'PST':
        return 'PST';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case '1H':
      case '2H':
        return 'status-live-elapsed';
      case 'HT':
        return 'status-halftime';
      case 'FT':
        return 'status-ended';
      case 'PST':
        return 'status-postponed';
      default:
        return 'status-upcoming';
    }
  };

  if (loading) {
    return (
      <div className="country-matches-container">
        <div className="p-4 text-center">Loading matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="country-matches-container">
        <div className="p-4 text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="country-matches-container">
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-4">Today's Football Matches by Country</h3>
        
        {countryGroups.map((group) => (
          <div key={group.country} className="mb-2">
            {/* Country Header */}
            <button
              onClick={() => toggleCountryExpansion(group.country)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-stone-200"
            >
              <div className="flex items-center gap-3">
                <MyCountryGroupFlag 
                  teamName={group.country}
                  size="24px"
                  className="country-group-flag-header"
                />
                <span className="font-medium text-gray-900 text-sm">
                  {group.country}
                </span>
                <span className="text-xs text-gray-500">
                  ({group.totalMatches})
                </span>
              </div>
              {group.isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {/* Matches List */}
            {group.isExpanded && (
              <div className="bg-white">
                {group.matches.slice(0, 10).map((fixture) => (
                  <div
                    key={fixture.fixture.id}
                    className="match-card-container"
                  >
                    <div className="match-three-grid-container">
                      {/* Match Status */}
                      <div className="match-status-top">
                        <div className={`match-status-label ${getStatusClass(fixture.fixture.status.short)}`}>
                          {formatMatchTime(fixture)}
                        </div>
                      </div>

                      {/* Main Match Content */}
                      <div className="match-content-container">
                        {/* Home Team */}
                        <div className="home-team-name">
                          {fixture.teams.home.name}
                        </div>

                        {/* Home Team Logo */}
                        <div className="home-team-logo-container">
                          <MyWorldTeamLogo
                            team={{
                              id: fixture.teams.home.id,
                              name: fixture.teams.home.name
                            }}
                            size={34}
                            className="team-logo"
                          />
                        </div>

                        {/* Score/Time */}
                        <div className="match-score-container">
                          {fixture.fixture.status.short === 'NS' ? (
                            <div className="match-time-display">
                              VS
                            </div>
                          ) : (
                            <div className="match-score-display">
                              <span className="score-number">
                                {fixture.goals.home ?? 0}
                              </span>
                              <span className="score-separator">-</span>
                              <span className="score-number">
                                {fixture.goals.away ?? 0}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Away Team Logo */}
                        <div className="away-team-logo-container">
                          <MyWorldTeamLogo
                            team={{
                              id: fixture.teams.away.id,
                              name: fixture.teams.away.name
                            }}
                            size={34}
                            className="team-logo"
                          />
                        </div>

                        {/* Away Team */}
                        <div className="away-team-name">
                          {fixture.teams.away.name}
                        </div>
                      </div>

                      {/* Penalty Results (if applicable) */}
                      {fixture.score.penalty.home !== null && fixture.score.penalty.away !== null && (
                        <div className="match-penalty-bottom">
                          <div className="penalty-result-display">
                            <div className="penalty-text">
                              Penalties: {fixture.score.penalty.home} - {fixture.score.penalty.away}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {group.matches.length > 10 && (
                  <div className="p-2 text-center text-xs text-gray-500">
                    ... and {group.matches.length - 10} more matches
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyAllLeague;
