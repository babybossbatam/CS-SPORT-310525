
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
            // Fetch league info
            const leagueResponse = await apiRequest("GET", `/api/leagues/${leagueId}`);
            const leagueData = await leagueResponse.json();
            
            if (!primaryLeagueInfo) {
              primaryLeagueInfo = leagueData;
            }

            // Fetch fixtures for the league
            const fixturesResponse = await apiRequest("GET", `/api/leagues/${leagueId}/fixtures`);
            const fixturesData = await fixturesResponse.json();
            
            if (Array.isArray(fixturesData)) {
              allFixtures.push(...fixturesData);
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
    
    if (status === 'FT') {
      return <Badge variant="secondary" className="text-xs">FT</Badge>;
    }
    
    if (status === 'NS') {
      return <Badge variant="outline" className="text-xs">Upcoming</Badge>;
    }
    
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    // Subtract 3 days to show earlier dates (21, 22, 23 instead of 23, 24, 25)
    const adjustedDate = new Date(date.getTime() - (3 * 24 * 60 * 60 * 1000));
    return adjustedDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group matches by status
  const liveMatches = fixtures.filter(f => 
    ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(f.fixture.status.short)
  );
  
  const upcomingMatches = fixtures.filter(f => 
    f.fixture.status.short === 'NS' && new Date(f.fixture.date) > new Date()
  ).sort((a, b) => 
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  ).slice(0, 5);
  
  const recentMatches = fixtures.filter(f => 
    f.fixture.status.short === 'FT'
  ).sort((a, b) => 
    new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
  ).slice(0, 3);

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

  const allMatches = [...liveMatches, ...upcomingMatches, ...recentMatches];

  if (allMatches.length === 0) {
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
    <Card className="mb-4">
      <CardHeader className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {leagueInfo?.league?.logo ? (
              <img
                src={leagueInfo.league.logo}
                alt={leagueInfo.league.name}
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                }}
              />
            ) : (
              <Trophy className="h-5 w-5 text-blue-600" />
            )}
            <span className="font-medium">
              {leagueInfo?.league?.name || "My New League"}
            </span>
          </div>
          <div className="flex gap-1">
            {liveMatches.length > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                {liveMatches.length} Live
              </Badge>
            )}
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              {allMatches.length} Total
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="space-y-0">
          {allMatches.map((fixture) => (
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
};

export default MyNewLeague;
