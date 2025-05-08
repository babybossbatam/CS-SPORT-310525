import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Clock, Calendar, Star, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getTeamGradient, getTeamColor, getContrastTextColor, getOpposingTeamColor } from '@/lib/colorExtractor';
import { isLiveMatch } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define types
interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
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

interface Score {
  halftime: { home: number | null; away: number | null; };
  fulltime: { home: number | null; away: number | null; };
  extratime: { home: number | null; away: number | null; };
  penalty: { home: number | null; away: number | null; };
}

interface FixtureResponse {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: Score;
}

interface LiveScoreboardProps {
  showFeaturedMatch?: boolean;
  showFilters?: boolean;
  maxMatches?: number;
}

export function LiveScoreboard({ 
  showFeaturedMatch = true,
  showFilters = true,
  maxMatches = 10
}: LiveScoreboardProps) {
  const [, navigate] = useLocation();
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [filteredMatches, setFilteredMatches] = useState<FixtureResponse[]>([]);
  
  // Fetch live matches
  const { data: liveMatches, isLoading, error } = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
  
  // Fetch today's matches if no live matches are available
  const { data: todayMatches } = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/date', format(new Date(), 'yyyy-MM-dd')],
    staleTime: 300000, // 5 minutes
    enabled: !liveMatches || liveMatches.length === 0,
  });
  
  // Popular leagues
  const popularLeagues = [
    { id: "all", name: "All Leagues" },
    { id: "europe", name: "Europe" },
    { id: "39", name: "England" },
    { id: "140", name: "Spain" },
    { id: "135", name: "Italy" },
    { id: "71", name: "Brazil" },
    { id: "78", name: "Germany" },
  ];
  
  // Format time
  const formatMatchTime = (fixture: Fixture) => {
    if (isLiveMatch(fixture.status.short)) {
      return `${fixture.status.elapsed}'`;
    } else if (fixture.status.short === 'FT') {
      return 'FT';
    } else if (fixture.status.short === 'HT') {
      return 'HT';
    } else {
      return format(new Date(fixture.date), 'HH:mm');
    }
  };
  
  // Filter matches by league
  useEffect(() => {
    if (!liveMatches && !todayMatches) {
      setFilteredMatches([]);
      return;
    }
    
    const allMatches = liveMatches?.length ? liveMatches : todayMatches || [];
    
    // Sort by live status first, then by priority leagues, then by time
    const sortedMatches = [...allMatches].sort((a, b) => {
      // Live matches first
      const aIsLive = isLiveMatch(a.fixture.status.short);
      const bIsLive = isLiveMatch(b.fixture.status.short);
      
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Then sort by popular leagues
      const aLeagueIsPriority = [39, 140, 135, 71, 78].includes(a.league.id);
      const bLeagueIsPriority = [39, 140, 135, 71, 78].includes(b.league.id);
      
      if (aLeagueIsPriority && !bLeagueIsPriority) return -1;
      if (!aLeagueIsPriority && bLeagueIsPriority) return 1;
      
      // Then sort by time
      if (aIsLive && bIsLive) {
        return (b.fixture.status.elapsed || 0) - (a.fixture.status.elapsed || 0);
      }
      
      // Sort by match time
      return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
    });
    
    // Apply league filter
    let filtered = sortedMatches;
    if (selectedLeague !== "all") {
      if (selectedLeague === "europe") {
        // European leagues include England (39), Spain (140), Italy (135), Germany (78), France (61), etc.
        const europeanLeagueIds = [2, 39, 140, 135, 78, 61, 144, 88, 94];
        filtered = sortedMatches.filter(match => europeanLeagueIds.includes(match.league.id));
      } else {
        filtered = sortedMatches.filter(match => match.league.id.toString() === selectedLeague);
      }
    }
    
    // Limit to max matches
    setFilteredMatches(filtered.slice(0, maxMatches));
  }, [liveMatches, todayMatches, selectedLeague, maxMatches]);
  
  // Popular teams for featuring
  const popularTeams = [
    'Manchester United', 'Liverpool', 'Manchester City', 'Arsenal', 
    'Chelsea', 'Real Madrid', 'Barcelona', 'Tottenham', 'Bayern'
  ];
  
  // Find a featured match with popular teams
  const featuredMatch = filteredMatches.find(match => {
    const homeTeam = match.teams.home.name;
    const awayTeam = match.teams.away.name;
    return popularTeams.some(team => 
      homeTeam.includes(team) || awayTeam.includes(team)
    );
  }) || (filteredMatches.length > 0 ? filteredMatches[0] : null);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Unable to load match data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!filteredMatches.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No matches available</h3>
            <p className="text-gray-500">There are no live or upcoming matches at the moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* League filter tabs */}
      {showFilters && (
        <div className="overflow-x-auto pb-2">
          <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedLeague}>
            <TabsList className="inline-flex w-auto bg-white border rounded-md shadow-sm p-1">
              {popularLeagues.map((league) => (
                <TabsTrigger
                  key={league.id}
                  value={league.id}
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 transition-all"
                >
                  {league.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}
      
      {/* Featured match */}
      {showFeaturedMatch && featuredMatch && (
        <div className="rounded-xl overflow-hidden shadow-lg bg-white border border-gray-100">
          {/* Featured badge */}
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-md z-20 font-semibold">
            FEATURED MATCH
          </div>
          
          {/* League and status header */}
          <div className="bg-gray-50 p-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={featuredMatch.league.logo} 
                  alt={featuredMatch.league.name}
                  className="w-6 h-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=League';
                  }}
                />
                <span className="font-medium text-sm">{featuredMatch.league.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {isLiveMatch(featuredMatch.fixture.status.short) ? (
                  <Badge variant="destructive" className="animate-pulse flex gap-1">
                    <Activity className="h-3 w-3" />
                    <span>LIVE • {featuredMatch.fixture.status.elapsed}'</span>
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {formatMatchTime(featuredMatch.fixture)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Match content - New design based on the image */}
          <div className="p-4">
            {/* League logo and match countdown */}
            <div className="flex justify-center items-center mb-4 relative">
              <img 
                src={featuredMatch.league.logo} 
                alt={featuredMatch.league.name}
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=League';
                }}
              />
              
              {/* Match countdown */}
              <div className="text-center mx-4">
                <div className="text-2xl font-bold">
                  {isLiveMatch(featuredMatch.fixture.status.short) 
                    ? 'LIVE NOW' 
                    : '3 Days'}
                </div>
              </div>
            </div>
            
            {/* Team bar */}
            <div className="relative mb-4">
              <div className="grid grid-cols-2 overflow-hidden rounded-md">
                {/* Home team section */}
                <div 
                  className="flex items-center justify-end p-4 text-white"
                  style={{ 
                    background: getTeamColor(featuredMatch.teams.home.name)
                  }}
                >
                  <div className="font-bold text-lg uppercase text-right mr-2">
                    {featuredMatch.teams.home.name}
                  </div>
                  <img 
                    src={featuredMatch.teams.home.logo} 
                    alt={featuredMatch.teams.home.name}
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                    }}
                  />
                </div>
                
                {/* Away team section */}
                <div 
                  className="flex items-center p-4 text-white"
                  style={{ 
                    background: getOpposingTeamColor(featuredMatch.teams.home.name, featuredMatch.teams.away.name)
                  }}
                >
                  <img 
                    src={featuredMatch.teams.away.logo} 
                    alt={featuredMatch.teams.away.name}
                    className="h-12 w-12 object-contain mr-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                    }}
                  />
                  <div className="font-bold text-lg uppercase">
                    {featuredMatch.teams.away.name}
                  </div>
                </div>
                
                {/* VS text overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="text-2xl font-bold text-white drop-shadow-lg">VS</div>
                </div>
                
                {/* Featured Match badge */}
                <div className="absolute top-0 right-0 bg-gray-600 text-white text-xs px-2 py-1 z-20">
                  Featured Match
                </div>
              </div>
            </div>
            
            {/* Match date and venue */}
            <div className="text-center text-sm text-gray-600 mb-4">
              {format(new Date(featuredMatch.fixture.date), 'EEEE, do MMM')} | {format(new Date(featuredMatch.fixture.date), 'HH:mm')} | {featuredMatch.fixture.venue.name || 'Venue TBA'}
            </div>
            
            {/* Match navigation tabs */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              <div className="flex flex-col items-center p-2 text-blue-600 border-b-2 border-blue-600">
                <div className="h-5 w-5 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <span className="text-xs">Match Page</span>
              </div>
              <div className="flex flex-col items-center p-2 text-gray-500">
                <div className="h-5 w-5 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="8" y1="16" x2="16" y2="16"></line>
                    <line x1="8" y1="8" x2="16" y2="8"></line>
                  </svg>
                </div>
                <span className="text-xs">Lineups</span>
              </div>
              <div className="flex flex-col items-center p-2 text-gray-500">
                <div className="h-5 w-5 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <span className="text-xs">Stats</span>
              </div>
              <div className="flex flex-col items-center p-2 text-gray-500">
                <div className="h-5 w-5 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </div>
                <span className="text-xs">Standings</span>
              </div>
            </div>
            
            {/* Navigation dots */}
            <div className="flex justify-center items-center gap-1 mt-2">
              <div className="h-1 w-1 rounded-full bg-blue-600"></div>
              <div className="h-1 w-1 rounded-full bg-gray-300"></div>
              <div className="h-1 w-1 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Match list */}
      <div className="space-y-2">
        <h3 className="font-bold text-xl mb-3">
          {liveMatches?.length ? 'Live Matches' : "Today's Matches"}
        </h3>
        
        {filteredMatches.slice(showFeaturedMatch ? 1 : 0).map((match) => (
          <div 
            key={match.fixture.id}
            className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/match/${match.fixture.id.toString()}`)}
          >
            {/* Match time and status */}
            <div className="w-16 text-center">
              {isLiveMatch(match.fixture.status.short) ? (
                <div className="flex flex-col items-center">
                  <span className="font-bold text-red-500">{match.fixture.status.elapsed}'</span>
                  <span className="text-xs bg-red-100 text-red-600 px-1 rounded">LIVE</span>
                </div>
              ) : (
                <span className="font-semibold text-gray-700">{formatMatchTime(match.fixture)}</span>
              )}
            </div>
            
            {/* Match bar with team details */}
            <div className="flex-1 flex items-center">
              {/* League badge */}
              <div className="mx-2 flex-shrink-0">
                <img 
                  src={match.league.logo} 
                  alt={match.league.name}
                  className="w-5 h-5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
                  }}
                />
              </div>
              
              {/* Main match content with colored bar */}
              <div className="flex-1 relative overflow-hidden">
                <div className="flex h-10 rounded-md overflow-hidden shadow-sm">
                  {/* Home team section - use solid color */}
                  <div 
                    className="w-1/2 relative" 
                    style={{ 
                      background: getTeamColor(match.teams.home.name)
                    }}
                  >
                    <div className="flex items-center justify-end h-full pl-3 pr-1">
                      <span className="text-white font-semibold truncate text-right" style={{
                        fontSize: match.teams.home.name.length > 15 ? '0.75rem' : '0.875rem'
                      }}>
                        {match.teams.home.name}
                      </span>
                    </div>
                  </div>
                  
                  {/* Away team section - use opposing color */}
                  <div 
                    className="w-1/2 relative"
                    style={{ 
                      background: getOpposingTeamColor(match.teams.home.name, match.teams.away.name)
                    }}
                  >
                    <div className="flex items-center h-full pl-1 pr-3">
                      <span className="text-white font-semibold truncate text-left" style={{
                        fontSize: match.teams.away.name.length > 15 ? '0.75rem' : '0.875rem'
                      }}>
                        {match.teams.away.name}
                      </span>
                    </div>
                  </div>
                  
                  {/* Score overlay in the center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white px-3 py-1 rounded-full shadow-md">
                      <span className="text-sm font-bold">
                        {match.goals.home ?? 0} <span className="text-xs text-gray-500">VS</span> {match.goals.away ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}