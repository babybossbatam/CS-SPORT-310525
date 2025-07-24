
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

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
      name: string;
      city: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
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

interface MyNewLeague2Props {
  selectedDate: string;
  onMatchCardClick?: (fixture: any) => void;
}

const MyNewLeague2: React.FC<MyNewLeague2Props> = ({
  selectedDate,
  onMatchCardClick,
}) => {
  const [, navigate] = useLocation();
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<number>>(new Set());

  // League IDs without any filtering - removed duplicates
  const leagueIds = [38, 15, 2, 10, 11, 848, 71, 3, 5, 531, 22, 72, 73, 75, 76, 233, 667, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 886, 130, 128, 493, 239, 265, 237, 235, 743];

  // Fetch fixtures for all leagues
  const { data: allFixtures, isLoading, error } = useQuery({
    queryKey: ['myNewLeague2', 'allFixtures'],
    queryFn: async () => {
      console.log(`🎯 [MyNewLeague2] Fetching fixtures for ${leagueIds.length} leagues:`, leagueIds);
      
      const promises = leagueIds.map(async (leagueId) => {
        try {
          const response = await fetch(`/api/leagues/${leagueId}/fixtures`);
          if (!response.ok) {
            console.log(`❌ [MyNewLeague2] Failed to fetch league ${leagueId}: ${response.status} ${response.statusText}`);
            return { leagueId, fixtures: [], error: `HTTP ${response.status}` };
          }
          const data = await response.json();
          const fixtures = data.response || data || [];
          console.log(`✅ [MyNewLeague2] League ${leagueId}: ${fixtures.length} fixtures`);
          return { leagueId, fixtures, error: null };
        } catch (error) {
          console.error(`❌ [MyNewLeague2] Error fetching league ${leagueId}:`, error);
          return { leagueId, fixtures: [], error: error.message };
        }
      });
      
      const results = await Promise.all(promises);
      const allFixtures = results.flatMap(result => result.fixtures);
      
      // Log detailed results
      console.log(`🔄 [MyNewLeague2] Fetch results:`, {
        totalLeagues: results.length,
        successfulFetches: results.filter(r => r.fixtures.length > 0).length,
        totalFixtures: allFixtures.length,
        leagueBreakdown: results.map(r => ({ 
          league: r.leagueId, 
          fixtures: r.fixtures.length, 
          error: r.error 
        }))
      });
      
      return allFixtures;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Group fixtures by league without any filtering
  const fixturesByLeague = useMemo(() => {
    console.log(`🔍 [MyNewLeague2] Processing fixtures:`, {
      allFixturesLength: allFixtures?.length || 0,
      sampleFixtures: allFixtures?.slice(0, 3)?.map(f => ({
        id: f?.fixture?.id,
        league: f?.league?.name,
        teams: `${f?.teams?.home?.name} vs ${f?.teams?.away?.name}`
      }))
    });

    if (!allFixtures?.length) {
      console.log(`❌ [MyNewLeague2] No fixtures available`);
      return {};
    }

    const grouped: { [key: number]: { league: any; fixtures: FixtureData[] } } = {};

    allFixtures.forEach((fixture: FixtureData, index) => {
      // Validate fixture structure
      if (!fixture || !fixture.league || !fixture.teams) {
        console.warn(`⚠️ [MyNewLeague2] Invalid fixture at index ${index}:`, fixture);
        return;
      }

      const leagueId = fixture.league.id;
      
      if (!grouped[leagueId]) {
        grouped[leagueId] = {
          league: fixture.league,
          fixtures: []
        };
      }
      
      grouped[leagueId].fixtures.push(fixture);
    });

    // Sort fixtures by date within each league
    Object.values(grouped).forEach(group => {
      group.fixtures.sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
    });

    const groupedKeys = Object.keys(grouped);
    console.log(`✅ [MyNewLeague2] Grouped fixtures:`, {
      leagueCount: groupedKeys.length,
      leagueIds: groupedKeys,
      totalFixtures: Object.values(grouped).reduce((sum, group) => sum + group.fixtures.length, 0),
      leagueDetails: Object.entries(grouped).map(([id, data]) => ({
        id: Number(id),
        name: data.league.name,
        fixtures: data.fixtures.length
      }))
    });

    return grouped;
  }, [allFixtures]);

  const toggleLeagueCollapse = (leagueId: number) => {
    setCollapsedLeagues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leagueId)) {
        newSet.delete(leagueId);
      } else {
        newSet.add(leagueId);
      }
      return newSet;
    });
  };

  const handleMatchClick = (fixtureId: number) => {
    navigate(`/match/${fixtureId}`);
  };

  const formatMatchTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const getStatusDisplay = (status: string, elapsed?: number) => {
    switch (status) {
      case 'NS': return 'Not Started';
      case 'FT': return 'Full Time';
      case 'HT': return 'Half Time';
      case '1H': return `${elapsed || 0}'`;
      case '2H': return `${elapsed || 0}'`;
      case 'LIVE': return 'LIVE';
      case 'PEN': return 'Penalties';
      case 'AET': return 'Extra Time';
      case 'CANC': return 'Cancelled';
      case 'SUSP': return 'Suspended';
      case 'AWD': return 'Awarded';
      case 'WO': return 'Walkover';
      case 'ABD': return 'Abandoned';
      default: return status;
    }
  };

  const isLiveMatch = (status: string) => {
    return ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P', 'INT'].includes(status);
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <div>Loading fixtures for {leagueIds.length} leagues...</div>
            <div className="text-xs mt-2">This may take a moment</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            <div>Error loading leagues</div>
            <div className="text-xs mt-2">{error.message}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const leagueEntries = Object.entries(fixturesByLeague);

  if (leagueEntries.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <div>No matches found</div>
            <div className="text-xs mt-2">
              Searched {leagueIds.length} leagues: {leagueIds.join(', ')}
            </div>
            <div className="text-xs mt-1">
              Raw fixtures count: {allFixtures?.length || 0}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {leagueEntries.map(([leagueId, { league, fixtures }]) => {
        const isCollapsed = collapsedLeagues.has(Number(leagueId));
        const displayFixtures = isCollapsed ? fixtures.slice(0, 3) : fixtures;

        return (
          <Card key={leagueId} className="mb-4">
            <CardContent className="p-0">
              {/* League Header */}
              <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img
                    src={league.logo || '/assets/fallback-logo.svg'}
                    alt={league.name}
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/assets/fallback-logo.svg';
                    }}
                  />
                  <span className="font-medium text-sm">{league.name}</span>
                  <span className="text-xs text-gray-500">({league.country})</span>
                </div>
                
                {fixtures.length > 3 && (
                  <button
                    onClick={() => toggleLeagueCollapse(Number(leagueId))}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <span>{isCollapsed ? 'Show All' : 'Show Less'}</span>
                    {isCollapsed ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>

              {/* Fixtures */}
              <div className="divide-y divide-gray-100">
                <AnimatePresence>
                  {displayFixtures.map((fixture) => (
                    <motion.div
                      key={fixture.fixture.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        handleMatchClick(fixture.fixture.id);
                        onMatchCardClick?.(fixture);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        {/* Teams */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            {/* Home Team */}
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <img
                                src={fixture.teams.home.logo || '/assets/fallback-logo.svg'}
                                alt={fixture.teams.home.name}
                                className="w-4 h-4 object-contain flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/assets/fallback-logo.svg';
                                }}
                              />
                              <span className="text-sm truncate">{fixture.teams.home.name}</span>
                            </div>

                            {/* Score */}
                            <div className="mx-4 text-center">
                              {fixture.goals.home !== null && fixture.goals.away !== null ? (
                                <div className="font-bold text-sm">
                                  {fixture.goals.home} - {fixture.goals.away}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">vs</div>
                              )}
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center space-x-2 flex-1 min-w-0 justify-end">
                              <span className="text-sm truncate">{fixture.teams.away.name}</span>
                              <img
                                src={fixture.teams.away.logo || '/assets/fallback-logo.svg'}
                                alt={fixture.teams.away.name}
                                className="w-4 h-4 object-contain flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/assets/fallback-logo.svg';
                                }}
                              />
                            </div>
                          </div>

                          {/* Match Info */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3" />
                              <span>{formatMatchTime(fixture.fixture.date)}</span>
                            </div>
                            
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              isLiveMatch(fixture.fixture.status.short)
                                ? 'bg-red-100 text-red-800'
                                : fixture.fixture.status.short === 'FT'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {getStatusDisplay(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Show more indicator */}
              {isCollapsed && fixtures.length > 3 && (
                <div className="p-2 text-center text-xs text-gray-500 border-t">
                  +{fixtures.length - 3} more matches
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MyNewLeague2;
