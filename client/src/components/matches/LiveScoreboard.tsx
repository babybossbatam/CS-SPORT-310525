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
          
          {/* Match content */}
          <div className="p-4">
            {/* Create background with two different colors */}
            <div className="relative mb-6 rounded-lg overflow-hidden h-48">
              {/* Home team background */}
              <div 
                className="absolute left-0 top-0 w-1/2 h-full" 
                style={{ 
                  background: getTeamColor(featuredMatch.teams.home.name)
                }}
              ></div>
              
              {/* Away team background - use opposing color */}
              <div 
                className="absolute right-0 top-0 w-1/2 h-full" 
                style={{ 
                  background: getOpposingTeamColor(
                    featuredMatch.teams.home.name, 
                    featuredMatch.teams.away.name
                  )
                }}
              ></div>
              
              {/* Match content overlay */}
              <div className="relative z-10 flex items-center h-full">
                {/* Home team */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                  <div className="relative">
                    <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[3px] transform translate-y-0.5"></div>
                    <img 
                      src={featuredMatch.teams.home.logo} 
                      alt={featuredMatch.teams.home.name}
                      className="h-24 w-24 relative z-10 drop-shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Team';
                      }}
                    />
                  </div>
                  <h3 className="font-bold mt-2 text-center text-white drop-shadow-md" style={{ 
                    fontSize: featuredMatch.teams.home.name.length > 15 ? '0.9rem' : '1.1rem',
                    maxWidth: '130px' 
                  }}>
                    {featuredMatch.teams.home.name}
                  </h3>
                </div>
                
                {/* Score overlay centered absolutely */}
                <div className="z-30 flex flex-col items-center justify-center bg-white shadow-lg rounded-full h-20 w-20">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold">{featuredMatch.goals.home ?? 0}</span>
                    <span className="text-sm font-bold text-gray-400">VS</span>
                    <span className="text-2xl font-bold">{featuredMatch.goals.away ?? 0}</span>
                  </div>
                  
                  {/* Show match time or status */}
                  <span className="text-xs font-semibold">
                    {isLiveMatch(featuredMatch.fixture.status.short) 
                      ? `${featuredMatch.fixture.status.elapsed}'` 
                      : formatMatchTime(featuredMatch.fixture)}
                  </span>
                </div>
                
                {/* Away team */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                  <div className="relative">
                    <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[3px] transform translate-y-0.5"></div>
                    <img 
                      src={featuredMatch.teams.away.logo} 
                      alt={featuredMatch.teams.away.name}
                      className="h-24 w-24 relative z-10 drop-shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Team';
                      }}
                    />
                  </div>
                  <h3 className="font-bold mt-2 text-center text-white drop-shadow-md" style={{ 
                    fontSize: featuredMatch.teams.away.name.length > 15 ? '0.9rem' : '1.1rem',
                    maxWidth: '130px' 
                  }}>
                    {featuredMatch.teams.away.name}
                  </h3>
                </div>
              </div>
            </div>
            
            {/* Match info footer */}
            <div className="text-center text-sm text-gray-500 mb-2">
              {featuredMatch.fixture.venue.name && featuredMatch.fixture.venue.city ? (
                <p>{featuredMatch.fixture.venue.name}, {featuredMatch.fixture.venue.city}</p>
              ) : (
                <p>{featuredMatch.fixture.venue.name || 'Venue TBA'}</p>
              )}
            </div>
            
            {/* Action button */}
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate(`/match/${featuredMatch.fixture.id.toString()}`)}
            >
              Match Details
            </Button>
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