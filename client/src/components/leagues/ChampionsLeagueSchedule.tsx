import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Star, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMatchDateFn, isLiveMatch } from '@/lib/utils';
import { getTeamColor } from '@/lib/colorExtractor';
import { useLocation } from 'wouter';

// Define the types we need
interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

interface Goals {
  home: number | null;
  away: number | null;
}

interface Fixture {
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
}

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

interface FixtureResponse {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: Goals;
  score: {
    halftime: Goals;
    fulltime: Goals;
    extratime: Goals;
    penalty: Goals;
  };
}

const ChampionsLeagueSchedule = () => {
  const [, navigate] = useLocation();
  const [visibleFixtures, setVisibleFixtures] = useState<FixtureResponse[]>([]);
  
  // Champions League ID is 2
  const leagueId = 2;
  const currentYear = new Date().getFullYear();
  
  // Get Champions League info
  const { data: leagueInfo } = useQuery({
    queryKey: [`/api/leagues/${leagueId}`],
    staleTime: 60 * 60 * 1000, // 1 hour
  });
  
  // Get the league fixtures with current season from league info
  const { data: allFixtures, isLoading, error } = useQuery<FixtureResponse[]>({
    queryKey: [`/api/leagues/${leagueId}/fixtures`],
    enabled: !!leagueInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Group fixtures by matchday or round when data is available
  useEffect(() => {
    if (!allFixtures) return;
    
    // Filter fixtures by most recent/upcoming
    const fixtures = [...allFixtures];
    
    // Sort fixtures by date (oldest first for upcoming, newest first for past)
    const now = new Date();
    const upcomingFixtures = fixtures
      .filter(f => new Date(f.fixture.date) > now)
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
    
    const pastFixtures = fixtures
      .filter(f => new Date(f.fixture.date) <= now && f.fixture.status.short === 'FT')
      .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());
    
    // Only show past/finished matches as requested by user
    // Take a maximum of 4 past fixtures
    const selectedPastFixtures = pastFixtures.slice(0, 4);
    
    // Only show finished matches as requested by user
    const visibleFixtures = [...selectedPastFixtures];
    
    // Fix the Barcelona vs Inter Milan score to 3-4 as requested
    visibleFixtures.forEach(fixture => {
      if ((fixture.teams.home.name === "Barcelona" && fixture.teams.away.name === "Inter") || 
          (fixture.teams.home.name === "Inter" && fixture.teams.away.name === "Barcelona")) {
        if (fixture.teams.home.name === "Barcelona") {
          fixture.goals.home = 3;
          fixture.goals.away = 4;
        } else {
          fixture.goals.home = 4;
          fixture.goals.away = 3;
        }
      }
    });
    
    // Sort by date
    visibleFixtures.sort((a, b) => {
      // First, prioritize live matches
      const aIsLive = isLiveMatch(a.fixture.status.short);
      const bIsLive = isLiveMatch(b.fixture.status.short);
      
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Then upcoming matches
      const aDate = new Date(a.fixture.date);
      const bDate = new Date(b.fixture.date);
      
      if (aDate > now && bDate <= now) return -1;
      if (aDate <= now && bDate > now) return 1;
      
      // For upcoming matches, sort by date (closest first)
      if (aDate > now && bDate > now) {
        return aDate.getTime() - bDate.getTime();
      }
      
      // For past matches, sort by date (most recent first)
      return bDate.getTime() - aDate.getTime();
    });
    
    setVisibleFixtures(visibleFixtures);
  }, [allFixtures]);
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader className="bg-gradient-to-r from-indigo-700 to-indigo-500 text-white p-3">
          <div className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            <span className="font-semibold">UEFA Champions League</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="mb-4">
        <CardHeader className="bg-gradient-to-r from-indigo-700 to-indigo-500 text-white p-3">
          <div className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            <span className="font-semibold">UEFA Champions League</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="bg-indigo-50 text-indigo-800 p-3 rounded-md border border-indigo-100 text-sm">
              <p className="font-medium">We're having trouble connecting to the Champions League API.</p>
              <p className="mt-1 text-xs text-indigo-600">This data will be available soon.</p>
            </div>
            
            {/* Fallback image */}
            <div className="flex justify-center mt-4">
              <div className="relative w-32 h-32 opacity-50">
                <img 
                  src="https://media.api-sports.io/football/leagues/2.png"
                  alt="UEFA Champions League" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=Champions+League';
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (!visibleFixtures || visibleFixtures.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader className="bg-gradient-to-r from-indigo-700 to-indigo-500 text-white p-3">
          <div className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            <span className="font-semibold">UEFA Champions League</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md border border-yellow-100 text-sm">
              <p className="font-medium">No Champions League fixtures are currently available.</p>
              <p className="mt-1 text-xs text-yellow-600">Fixtures will be listed here when matches are scheduled.</p>
            </div>
            
            {/* Fallback image */}
            <div className="flex justify-center mt-4">
              <div className="relative w-24 h-24 opacity-60">
                <img 
                  src="https://media.api-sports.io/football/leagues/2.png"
                  alt="UEFA Champions League" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Champions+League';
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-indigo-600" />
            <span className="font-semibold text-indigo-800">UEFA Champions League</span>
          </div>
          <button 
            onClick={() => navigate(`/league/${leagueId}`)}
            className="flex items-center text-xs bg-indigo-800 hover:bg-indigo-900 text-white px-2 py-1 rounded transition-colors"
          >
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {visibleFixtures.map((fixture) => (
            <div 
              key={fixture.fixture.id} 
              className="p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/match/${fixture.fixture.id}`)}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatMatchDateFn(fixture.fixture.date)}</span>
                  <span className="mx-1">•</span>
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{format(parseISO(fixture.fixture.date), 'HH:mm')}</span>
                </div>
                <div className="text-xs font-medium">
                  {fixture.league.round}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                {/* Home team */}
                <div className="flex items-center space-x-2 w-2/5">
                  <img 
                    src={fixture.teams.home.logo} 
                    alt={fixture.teams.home.name} 
                    className="h-6 w-6"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                    }}
                  />
                  <span className="font-medium text-sm truncate">{fixture.teams.home.name}</span>
                </div>
                
                {/* Score */}
                <div className="flex items-center justify-center px-3 py-1 rounded min-w-[60px] text-center">
                  {isLiveMatch(fixture.fixture.status.short) ? (
                    <div className="flex items-center">
                      <span className="font-bold text-sm mr-1">
                        {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
                      </span>
                      <span className="text-xs text-red-500 animate-pulse font-semibold flex items-center">
                        <span className="h-1.5 w-1.5 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                        LIVE
                      </span>
                    </div>
                  ) : (fixture.fixture.status.short === 'FT' || fixture.fixture.status.short === 'AET' || fixture.fixture.status.short === 'PEN') ? (
                    <span className="font-bold text-sm">
                      {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
                      {fixture.fixture.status.short === 'AET' && (
                        <span className="text-xs bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded ml-1 font-medium">AET</span>
                      )}
                      {fixture.fixture.status.short === 'PEN' && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded ml-1 font-medium">PEN</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 font-medium">vs</span>
                  )}
                </div>
                
                {/* Away team */}
                <div className="flex items-center justify-end space-x-2 w-2/5">
                  <span className="font-medium text-sm truncate">{fixture.teams.away.name}</span>
                  <img 
                    src={fixture.teams.away.logo} 
                    alt={fixture.teams.away.name} 
                    className="h-6 w-6"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                    }}
                  />
                </div>
              </div>
              
              {/* Status indicator bar - colored based on home/away team */}
              <div className="h-1 w-full mt-2 rounded-full overflow-hidden flex">
                <div 
                  className="w-1/2 h-full" 
                  style={{ backgroundColor: getTeamColor(fixture.teams.home.name, true) }}
                ></div>
                <div 
                  className="w-1/2 h-full" 
                  style={{ backgroundColor: getTeamColor(fixture.teams.away.name, true) }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChampionsLeagueSchedule;