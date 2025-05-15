import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Clock, Calendar, Star, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getTeamGradient, getTeamColor, getOpposingTeamColor, getEnhancedHomeTeamGradient } from '@/lib/colorUtils';
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
    refetchInterval: 1800000, // Refresh every 30 minutes
  });

  // Fetch today's matches if no live matches are available
  const { data: todayMatches } = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/date', format(new Date(), 'yyyy-MM-dd')],
    staleTime: 300000, // 5 minutes
    enabled: !liveMatches || liveMatches.length === 0,
  });

  const popularLeagues = [
    { id: "all", name: "All Leagues" },
    { id: "2", name: "Champions League" },
    { id: "3", name: "Europa League" },
    { id: "39", name: "Premier League" },
    { id: "140", name: "La Liga" },
    { id: "135", name: "Serie A" },
    { id: "78", name: "Bundesliga" }
  ];

  useEffect(() => {
    if (!liveMatches && !todayMatches) return;

    const matches = liveMatches || todayMatches || [];
    const filtered = selectedLeague === "all" 
      ? matches 
      : matches.filter(match => match.league.id.toString() === selectedLeague);

    setFilteredMatches(filtered.slice(0, maxMatches));
  }, [liveMatches, todayMatches, selectedLeague, maxMatches]);

  // Popular teams for featuring - Top 3 teams from popular leagues
  const popularTeams = {
    // Premier League (England)
    '39': ['Manchester City', 'Arsenal', 'Liverpool'],
    // La Liga (Spain)
    '140': ['Real Madrid', 'Barcelona', 'Atletico Madrid'],
    // Serie A (Italy)
    '135': ['Inter', 'Milan', 'Juventus'],
    // Bundesliga (Germany)
    '78': ['Bayern', 'Dortmund', 'Leipzig'],
    // Ligue 1 (France)
    '61': ['PSG', 'Marseille', 'Lyon']
  };

  // Get upcoming matches by date
  const sortedByDate = [...filteredMatches].sort((a, b) => 
    new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );

  // Find a featured match with top 3 teams from popular leagues and nearest date
  const featuredMatch = sortedByDate.find(match => {
    const homeTeam = match.teams.home.name;
    const awayTeam = match.teams.away.name;

    // Check if either team is in the top 3 of their league
    return Object.values(popularTeams).some(leagueTeams => 
      leagueTeams.some(team => 
        homeTeam.includes(team) || awayTeam.includes(team)
      )
    );
  }) || (sortedByDate.length > 0 ? sortedByDate[0] : null);

  const handleLeagueSelect = (leagueId: string) => {
    setSelectedLeague(leagueId);
  };

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
    <div className="space-y-4">
      {showFilters && (
        <PopularLeagueFilter
          selectedLeague={selectedLeague}
          onSelectLeague={handleLeagueSelect}
        />
      )}
      {showFeaturedMatch && featuredMatch && (
        <div className="rounded-xl overflow-hidden shadow-lg bg-white border border-gray-100">
          {/* Featured badge - gray background */}
          <div className="absolute top-0 right-0 bg-gray-700 text-white text-xs px-3 py-1 rounded-bl-md z-20 font-semibold">
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
                    // Try the livescore URL
                    (e.target as HTMLImageElement).src = `https://static.livescore.com/i/competition/${featuredMatch.league.id}.png`;

                    // Add a second error handler for complete fallback
                    (e.target as HTMLImageElement).onerror = () => {
                      (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/competition/default.png';
                      (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                    };
                  }}
                />
                <span className="font-medium text-sm">{featuredMatch.league.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {isLiveMatch(featuredMatch.fixture.status.short) ? (
                  <Badge variant="destructive" className="animate-pulse flex gap-1">
                    <Activity className="h-3 w-3" />
                    {/* LIVE text removed as requested */}
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
                  // Try the livescore URL
                  (e.target as HTMLImageElement).src = `https://static.livescore.com/i/competition/${featuredMatch.league.id}.png`;

                  // Add a second error handler for complete fallback
                  (e.target as HTMLImageElement).onerror = () => {
                    (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/competition/default.png';
                    (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                  };
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

            {/* Match presentation - Updated design to match 365scores */}
            <div className="relative mb-6">
              {/* Featured tag */}
              <div className="absolute top-0 right-0 bg-gray-700 text-white text-xs px-2 py-1 z-10">
                Featured Match
              </div>

              {/* League logo and countdown */}
              <div className="flex flex-col items-center justify-center py-2">
                <img 
                  src={featuredMatch.league.logo} 
                  alt={featuredMatch.league.name}
                  className="h-8 w-8 object-contain mb-2"
                  onError={(e) => {
                    // Try the livescore URL
                    (e.target as HTMLImageElement).src = `https://static.livescore.com/i/competition/${featuredMatch.league.id}.png`;

                    // Add a second error handler for complete fallback
                    (e.target as HTMLImageElement).onerror = () => {
                      (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/competition/default.png';
                      (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                    };
                  }}
                />
                <div className="text-3xl font-bold text-center mb-3">
                  {isLiveMatch(featuredMatch.fixture.status.short) 
                    ? 'LIVE NOW' 
                    : '3 Days'}
                </div>
              </div>

              {/* Main match container with team bar colors */}
              <div className="w-full overflow-hidden relative">
                {/* Team logos */}
                <div className="flex justify-between items-center px-8 mb-2">
                  <div className="flex flex-col items-center">
                    <img 
                      src={featuredMatch.teams.home.logo} 
                      alt={featuredMatch.teams.home.name}
                      className="h-16 w-16 object-contain"
                      onError={(e) => {
                        // Try the livescore URL
                        (e.target as HTMLImageElement).src = `https://static.livescore.com/i/team/${featuredMatch.teams.home.id}.png`;

                        // Add a second error handler for complete fallback
                        (e.target as HTMLImageElement).onerror = () => {
                          (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/team/default.png';
                          (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                        };
                      }}
                    />
                  </div>

                  <div 
                    className="text-3xl font-bold text-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 rounded-full w-12 h-12 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(90deg, ${getTeamColor(featuredMatch.teams.home.name)} 50%, rgba(0, 0, 0, 0.5) 50%)`,
                      color: 'white',
                      textShadow: '0px 0px 3px rgba(0, 0, 0, 0.7)'
                    }}
                  >VS</div>

                  <div className="flex flex-col items-center">
                    <img 
                      src={featuredMatch.teams.away.logo} 
                      alt={featuredMatch.teams.away.name}
                      className="h-16 w-16 object-contain"
                      onError={(e) => {
                        // Try the livescore URL
                        (e.target as HTMLImageElement).src = `https://static.livescore.com/i/team/${featuredMatch.teams.away.id}.png`;

                        // Add a second error handler for complete fallback
                        (e.target as HTMLImageElement).onerror = () => {
                          (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/team/default.png';
                          (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                        };
                      }}
                    />
                  </div>
                </div>

                {/* Team names with colored bars */}
                <div className="flex h-12 w-full overflow-hidden relative">
                  {/* Home team color bar - extended 10% more to the left with 10% enhanced intensity */}
                  <div 
                    className="w-[60%] flex items-center justify-start px-4 text-white h-full" 
                    style={{ 
                      background: getTeamColor(featuredMatch.teams.home.name) /* Home team color */
                    }}
                  >
                    <span className="font-bold uppercase text-sm md:text-base tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {featuredMatch.teams.home.name}
                    </span>
                  </div>

                  {/* Away team color bar - reduced to 40% width due to home team extension */}
                  <div 
                    className="w-[40%] flex items-center justify-end px-4 text-white h-full"
                    style={{ 
                      background: getOpposingTeamColor(featuredMatch.teams.home.name, featuredMatch.teams.away.name) 
                    }}>
                    <span className="font-bold uppercase text-sm md:text-base tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {featuredMatch.teams.away.name}
                    </span>
                  </div>
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

      {/* Match list - heading removed */}
      <div className="space-y-2">
        {/* Today's Matches heading removed */}

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
                    // Try the livescore URL
                    (e.target as HTMLImageElement).src = `https://static.livescore.com/i/competition/${match.league.id}.png`;

                    // Add a second error handler for complete fallback
                    (e.target as HTMLImageElement).onerror = () => {
                      (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/competition/default.png';
                      (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                    };
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
                      // Try the livescore URL
                      (e.target as HTMLImageElement).src = `https://static.livescore.com/i/team/${match.teams.home.id}.png`;

                      // Add a second error handler for complete fallback
                      (e.target as HTMLImageElement).onerror = () => {
                        (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/team/default.png';
                        (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                      };
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
                      // Try the livescore URL
                      (e.target as HTMLImageElement).src = `https://static.livescore.com/i/team/${match.teams.away.id}.png`;

                      // Add a second error handler for complete fallback
                      (e.target as HTMLImageElement).onerror = () => {
                        (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/team/default.png';
                        (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                      };
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

interface PopularLeagueFilterProps {
  selectedLeague: string;
  onSelectLeague: (leagueId: string) => void;
}

function PopularLeagueFilter({
  selectedLeague,
  onSelectLeague,
}: PopularLeagueFilterProps) {
  const popularLeagues = [
    { id: "all", name: "All Leagues" },
    { id: "2", name: "Champions League" },
    { id: "3", name: "Europa League" },
    { id: "39", name: "Premier League" },
    { id: "140", name: "La Liga" },
    { id: "135", name: "Serie A" },
    { id: "78", name: "Bundesliga" }
  ];

  return (
    <div className="overflow-x-auto pb-2">
      <Tabs defaultValue={selectedLeague} className="w-full" onValueChange={onSelectLeague}>
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
  );
}