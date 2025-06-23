import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Trophy, Clock, Calendar, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MyNewLeagueProps {
  selectedDate: string;
  timeFilterActive: boolean;
  showTop10: boolean;
  liveFilterActive: boolean;
  onMatchCardClick: (fixture: any) => void;
  useUTCOnly?: boolean;
}

interface FixtureData {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed?: number;
    };
    venue?: {
      name: string;
    };
  };
  teams: {
    home: {
      name: string;
      logo?: string;
    };
    away: {
      name: string;
      logo?: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  league: {
    id: number;
    name: string;
    logo?: string;
    country: string;
  };
}

interface LeagueData {
  league: {
    id: number;
    name: string;
    type: string;
    logo?: string;
  };
  country: {
    name: string;
  };
}

const MyNewLeague: React.FC<MyNewLeagueProps> = ({
  selectedDate,
  timeFilterActive,
  showTop10,
  liveFilterActive,
  onMatchCardClick,
  useUTCOnly = true,
}) => {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [leagueInfo, setLeagueInfo] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Using league ID 38 and 15 as specified in checkSpecificLeagueMatches.ts
  const leagueIds = [38, 15];

  useEffect(() => {
    const fetchLeagueData = async () => {
      setLoading(true);
      setError(null);

      try {
        const allFixtures: FixtureData[] = [];
        let primaryLeagueInfo: LeagueData | null = null;

        for (const leagueId of leagueIds) {
          try {
            console.log(`MyNewLeague - Fetching data for league ${leagueId}`);

            // Fetch league info
            const leagueResponse = await apiRequest("GET", `/api/leagues/${leagueId}`);
            const leagueData = await leagueResponse.json();
            console.log(`MyNewLeague - League ${leagueId} info:`, leagueData);

            if (!primaryLeagueInfo) {
              primaryLeagueInfo = leagueData;
            }

            // Fetch fixtures for the league
            const fixturesResponse = await apiRequest("GET", `/api/leagues/${leagueId}/fixtures`);
            const fixturesData = await fixturesResponse.json();
            console.log(`MyNewLeague - League ${leagueId} fixtures count:`, fixturesData?.length || 0);

            if (Array.isArray(fixturesData)) {
              // Filter for Club World Cup matches specifically
              const filteredFixtures = fixturesData.filter(fixture => {
                const isClubWorldCup = fixture.league?.name?.toLowerCase().includes('club world cup') ||
                                     fixture.league?.name?.toLowerCase().includes('fifa club world cup');
                const isRelevantMatch = fixture.teams?.home?.name === 'Juventus' || 
                                       fixture.teams?.away?.name === 'Juventus' ||
                                       fixture.teams?.home?.name === 'Wydad AC' || 
                                       fixture.teams?.away?.name === 'Wydad AC';

                console.log(`MyNewLeague - Fixture ${fixture.fixture.id}:`, {
                  teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
                  league: fixture.league?.name,
                  status: fixture.fixture?.status?.short,
                  isClubWorldCup,
                  isRelevantMatch
                });

                return true; // Show all matches for now to debug
              });

              allFixtures.push(...filteredFixtures);
            }
          } catch (leagueError) {
            console.warn(`Failed to fetch data for league ${leagueId}:`, leagueError);
          }
        }

        setLeagueInfo(primaryLeagueInfo);
        setFixtures(allFixtures);
      } catch (err) {
        console.error('Error fetching league data:', err);
        setError('Failed to load league data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, []);

  const getMatchStatusBadge = (status: string, elapsed?: number) => {
    const liveStatuses = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'];

    if (liveStatuses.includes(status)) {
      return (
        <Badge variant="destructive" className="text-xs animate-pulse">
          {status === 'LIVE' ? 'LIVE' : status}
          {elapsed && ` ${elapsed}'`}
        </Badge>
      );
    }

    if (['FT', 'AET', 'PEN'].includes(status)) {
      return <Badge variant="secondary" className="text-xs">Ended</Badge>;
    }

    if (status === 'NS') {
      return null; // Don't show any badge for upcoming matches
    }

    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Debug logging
  console.log('MyNewLeague - All fixtures:', fixtures.length);
  fixtures.forEach(f => {
    console.log('Fixture:', {
      id: f.fixture.id,
      teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
      status: f.fixture.status.short,
      league: f.league.name,
      date: f.fixture.date
    });
  });

  // Filter matches for the selected date
  const selectedDateFixtures = fixtures.filter(f => {
    const matchDate = new Date(f.fixture.date);
    const fixtureDate = matchDate.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    return fixtureDate === selectedDate;
  });

  // Group matches by league ID
  const matchesByLeague = selectedDateFixtures.reduce((acc, fixture) => {
    const leagueId = fixture.league.id;
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: fixture.league,
        matches: []
      };
    }
    acc[leagueId].matches.push(fixture);
    return acc;
  }, {} as Record<number, { league: any; matches: FixtureData[] }>);

  // Sort matches within each league by status and date
  Object.values(matchesByLeague).forEach(leagueGroup => {
    leagueGroup.matches.sort((a, b) => {
      // First sort by status priority (live > upcoming > finished)
      const statusPriority = (status: string) => {
        if (['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(status)) return 1;
        if (status === 'NS') return 2;
        return 3;
      };
      
      const aPriority = statusPriority(a.fixture.status.short);
      const bPriority = statusPriority(b.fixture.status.short);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then sort by date
      return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
    });
  });

  const totalMatches = Object.values(matchesByLeague).reduce((sum, group) => sum + group.matches.length, 0);

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-600" />
              <span className="font-medium">My New League</span>
            </div>
            <Badge className="bg-blue-100 text-blue-700 text-xs">Loading...</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="text-center py-4 text-gray-500">Loading matches...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4">
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-red-600" />
              <span className="font-medium">My New League</span>
            </div>
            <Badge variant="destructive" className="text-xs">Error</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="text-center py-4 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (totalMatches === 0) {
    return (
      <Card className="mb-4">
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gray-500" />
              <span className="font-medium">My New League</span>
            </div>
            <Badge variant="outline" className="text-xs">No Matches</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="text-center py-4 text-gray-500">No matches available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.values(matchesByLeague).map((leagueGroup) => {
        const liveMatchesCount = leagueGroup.matches.filter(f => 
          ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(f.fixture.status.short)
        ).length;

        return (
          <Card key={leagueGroup.league.id} className="mb-4">
            <CardHeader className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {leagueGroup.league.logo ? (
                    <img
                      src={leagueGroup.league.logo}
                      alt={leagueGroup.league.name}
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                      }}
                    />
                  ) : (
                    <Trophy className="h-5 w-5 text-blue-600" />
                  )}
                  <span className="font-medium">{leagueGroup.league.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {leagueGroup.league.country}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {liveMatchesCount > 0 && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      {liveMatchesCount} Live
                    </Badge>
                  )}
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    {leagueGroup.matches.length} Match{leagueGroup.matches.length !== 1 ? 'es' : ''}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="space-y-0">
                {leagueGroup.matches.map((fixture) => (
                  <div
                    key={fixture.fixture.id}
                    onClick={() => onMatchCardClick(fixture)}
                    className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium">
                            {fixture.teams.home.name} vs {fixture.teams.away.name}
                          </div>
                          {getMatchStatusBadge(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatMatchTime(fixture.fixture.date)}
                          </div>
                          {fixture.fixture.venue?.name && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {fixture.fixture.venue.name}
                            </div>
                          )}
                        </div>
                      </div>

                      {(fixture.goals.home !== null && fixture.goals.away !== null) && (
                        <div className="text-lg font-bold text-gray-900 ml-4">
                          {fixture.goals.home} - {fixture.goals.away}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MyNewLeague;