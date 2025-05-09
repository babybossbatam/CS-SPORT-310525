import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Activity, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMatchDateFn, isLiveMatch } from '@/lib/utils';
import { getTeamColor } from '@/lib/colorExtractor';
import { useLocation } from 'wouter';

// League IDs we care about (only show matches from these leagues)
const FEATURED_LEAGUE_IDS = [
  2,    // UEFA Champions League
  3,    // UEFA Europa League
  39,   // Premier League (England)
  78,   // Bundesliga (Germany)
  135,  // Serie A (Italy)
];

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

const UpcomingMatchesScoreboard = () => {
  const [, navigate] = useLocation();
  const [upcomingMatches, setUpcomingMatches] = useState<FixtureResponse[]>([]);
  
  // Get tomorrow's date for upcoming fixtures
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');
  
  // Fetch upcoming fixtures for tomorrow
  const { data: tomorrowFixtures, isLoading: isTomorrowLoading } = useQuery<FixtureResponse[]>({
    queryKey: [`/api/fixtures/date/${tomorrowFormatted}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch live fixtures
  const { data: liveFixtures, isLoading: isLiveLoading } = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 30000, // 30 seconds
  });
  
  // Process the fixtures when data is available
  useEffect(() => {
    if (!tomorrowFixtures && !liveFixtures) return;
    
    // Combine live and upcoming fixtures
    const allFixtures = [
      ...(liveFixtures || []),
      ...(tomorrowFixtures || [])
    ];
    
    // Filter to include ONLY matches from our featured leagues
    const featuredLeagueFixtures = allFixtures.filter(match => 
      FEATURED_LEAGUE_IDS.includes(match.league.id)
    );
    
    // Sort by date and prioritize live matches
    const sortedFixtures = featuredLeagueFixtures.sort((a, b) => {
      // Prioritize live matches
      const aIsLive = isLiveMatch(a.fixture.status.short);
      const bIsLive = isLiveMatch(b.fixture.status.short);
      
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Then sort by timestamp
      return a.fixture.timestamp - b.fixture.timestamp;
    });
    
    // Take top 10 matches
    setUpcomingMatches(sortedFixtures.slice(0, 10));
  }, [tomorrowFixtures, liveFixtures]);
  
  // Loading state
  if (isTomorrowLoading || isLiveLoading) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              <span className="font-semibold">Upcoming Matches</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            <Skeleton className="h-16 w-full mb-3" />
            <Skeleton className="h-16 w-full mb-3" />
            <Skeleton className="h-16 w-full mb-3" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (!upcomingMatches || upcomingMatches.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              <span className="font-semibold">Upcoming Matches</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="bg-gray-50 text-gray-800 p-3 rounded-md border border-gray-200 text-sm">
              <p className="font-medium">No upcoming matches are scheduled at this time.</p>
              <p className="mt-1 text-xs text-gray-600">Check back later for match updates.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            <span className="font-semibold">Upcoming Matches</span>
          </div>
          <button 
            onClick={() => navigate('/scoreboard')}
            className="flex items-center text-xs bg-gray-900 hover:bg-black px-2 py-1 rounded transition-colors"
          >
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {upcomingMatches.map((match) => (
            <div 
              key={match.fixture.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/match/${match.fixture.id}`)}
            >
              {/* Match header with League and date */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <img 
                    src={match.league.logo} 
                    alt={match.league.name} 
                    className="h-5 w-5 mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
                    }}
                  />
                  <span className="text-xs font-medium truncate max-w-[160px]">{match.league.name}</span>
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  <span>{formatMatchDateFn(match.fixture.date)}</span>
                  <span className="mx-1">•</span>
                  <Clock className="h-3 w-3 mr-1 text-gray-400" />
                  <span>{format(parseISO(match.fixture.date), 'HH:mm')}</span>
                </div>
              </div>
              
              {/* Live indicator */}
              {isLiveMatch(match.fixture.status.short) && (
                <div className="flex items-center justify-center mb-2">
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium flex items-center">
                    <span className="h-1.5 w-1.5 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                    LIVE {match.fixture.status.elapsed && `(${match.fixture.status.elapsed}')`}
                  </span>
                </div>
              )}
              
              {/* Teams and score */}
              <div className="flex items-center justify-between mt-2">
                {/* Home team */}
                <div className="flex items-center space-x-2 w-[42%]">
                  <div className="relative">
                    {/* Shadow effect */}
                    <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[2px] transform translate-y-0.5"></div>
                    <img 
                      src={match.teams.home.logo} 
                      alt={match.teams.home.name} 
                      className="h-10 w-10 relative z-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=T';
                      }}
                    />
                  </div>
                  <span className="font-medium text-sm truncate">{match.teams.home.name}</span>
                </div>
                
                {/* Score */}
                <div className="w-[16%] flex items-center justify-center px-3 rounded">
                  {isLiveMatch(match.fixture.status.short) ? (
                    <div className="bg-gray-100 px-3 py-1 rounded min-w-[60px] text-center">
                      <span className="font-bold text-gray-900">
                        {match.goals.home ?? 0} - {match.goals.away ?? 0}
                      </span>
                    </div>
                  ) : match.fixture.status.short === 'FT' ? (
                    <div className="bg-gray-100 px-3 py-1 rounded min-w-[60px] text-center">
                      <span className="font-bold text-gray-900">
                        {match.goals.home ?? 0} - {match.goals.away ?? 0}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 font-semibold">vs</span>
                  )}
                </div>
                
                {/* Away team */}
                <div className="flex items-center justify-end space-x-2 w-[42%]">
                  <span className="font-medium text-sm truncate">{match.teams.away.name}</span>
                  <div className="relative">
                    {/* Shadow effect */}
                    <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[2px] transform translate-y-0.5"></div>
                    <img 
                      src={match.teams.away.logo} 
                      alt={match.teams.away.name} 
                      className="h-10 w-10 relative z-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=T';
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Status indicator bar - colored based on home/away team */}
              <div className="h-1 w-full mt-2 rounded-full overflow-hidden flex">
                <div 
                  className="w-[60%] h-full rounded-l-full" 
                  style={{ backgroundColor: getTeamColor(match.teams.home.name, true) }}
                ></div>
                <div 
                  className="w-[40%] h-full rounded-r-full" 
                  style={{ backgroundColor: getTeamColor(match.teams.away.name, true) }}
                ></div>
              </div>
              
              {/* Venue info */}
              {match.fixture.venue.name && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {match.fixture.venue.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMatchesScoreboard;