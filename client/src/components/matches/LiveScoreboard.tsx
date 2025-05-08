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
            
            {/* Match presentation - Clean design following reference image */}
            <div className="relative mb-6">
              {/* Main match container */}
              <div className="w-full overflow-hidden rounded-lg shadow-md">
                {/* Match date */}
                <div className="bg-gray-100 text-center py-1 text-xs text-gray-600 font-medium border-b border-gray-200">
                  TOMORROW
                </div>
                
                {/* Team bars */}
                <div className="flex h-14 w-full overflow-hidden">
                  {/* Home team color bar */}
                  <div 
                    className="w-1/2 flex items-center justify-end px-4 text-white h-full"
                    style={{ background: getTeamColor(featuredMatch.teams.home.name) }}
                  >
                    <span className="font-bold uppercase px-3 drop-shadow-sm text-sm md:text-base">
                      {featuredMatch.teams.home.name}
                    </span>
                  </div>
                  
                  {/* Away team color bar */}
                  <div 
                    className="w-1/2 flex items-center px-4 text-white h-full"
                    style={{ background: getOpposingTeamColor(featuredMatch.teams.home.name, featuredMatch.teams.away.name) }}
                  >
                    <span className="font-bold uppercase px-3 drop-shadow-sm text-sm md:text-base">
                      {featuredMatch.teams.away.name}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* VS badge in the middle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full h-8 w-8 flex items-center justify-center shadow-md z-20">
                <span className="text-sm font-bold">VS</span>
              </div>
              
              {/* Team logos */}
              <div className="absolute top-1/3 left-0 w-full flex justify-between px-6">
                <div className="bg-white rounded-full p-0.5 shadow-md transform -translate-y-1/2">
                  <img 
                    src={featuredMatch.teams.home.logo} 
                    alt={featuredMatch.teams.home.name}
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                    }}
                  />
                </div>
                
                <div className="bg-white rounded-full p-0.5 shadow-md transform -translate-y-1/2">
                  <img 
                    src={featuredMatch.teams.away.logo} 
                    alt={featuredMatch.teams.away.name}
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                    }}
                  />
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
              
              {/* Teams info row */}
              <div className="flex-1 grid grid-cols-9 gap-1">
                {/* Home team */}
                <div className="col-span-4 flex items-center justify-end space-x-2">
                  <span className="font-medium text-sm text-right truncate">{match.teams.home.name}</span>
                  <img 
                    src={match.teams.home.logo} 
                    alt={match.teams.home.name}
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
                    }}
                  />
                </div>
                
                {/* Score */}
                <div className="flex items-center justify-center">
                  <div className="bg-gray-100 px-2 py-1 rounded-sm text-sm font-bold">
                    {isLiveMatch(match.fixture.status.short) ? (
                      <span className="text-red-500">{match.goals.home ?? 0} - {match.goals.away ?? 0}</span>
                    ) : (
                      <span>{match.goals.home ?? 0} - {match.goals.away ?? 0}</span>
                    )}
                  </div>
                </div>
                
                {/* Away team */}
                <div className="col-span-4 flex items-center justify-start space-x-2">
                  <img 
                    src={match.teams.away.logo} 
                    alt={match.teams.away.name}
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
                    }}
                  />
                  <span className="font-medium text-sm truncate">{match.teams.away.name}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}