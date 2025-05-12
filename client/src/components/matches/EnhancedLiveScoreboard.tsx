import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getTeamColor } from '@/lib/colorUtils';
import { isLiveMatch } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchScoreboard from './MatchScoreboard';

// Define types
export interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

export interface Fixture {
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

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

export interface Score {
  halftime: { home: number | null; away: number | null; };
  fulltime: { home: number | null; away: number | null; };
  extratime: { home: number | null; away: number | null; };
  penalty: { home: number | null; away: number | null; };
}

export interface FixtureResponse {
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

interface EnhancedLiveScoreboardProps {
  showFeaturedMatch?: boolean;
  showFilters?: boolean;
  maxMatches?: number;
}

export function EnhancedLiveScoreboard({ 
  showFeaturedMatch = true,
  showFilters = true,
  maxMatches = 10
}: EnhancedLiveScoreboardProps) {
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
  // Ordered according to user request: Europe, England, Spain, Italy, Brazil, Germany
  const popularLeagues = [
    { id: "all", name: "All Leagues" },
    { id: "europe", name: "Europe" },
    { id: "39", name: "England" },
    { id: "140", name: "Spain" },
    { id: "135", name: "Italy" },
    { id: "71", name: "Brazil" },
    { id: "78", name: "Germany" },
  ];
  
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
      
      // Then sort by popular leagues (Europe, England, Spain, Italy, Brazil, Germany)
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
    <>
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
        <MatchScoreboard 
          match={featuredMatch}
          featured={true}
          homeTeamColor={getTeamColor(featuredMatch.teams.home.name)}
          awayTeamColor={getTeamColor(featuredMatch.teams.away.name)}
          onClick={() => navigate(`/matches/${featuredMatch.fixture.id}`)}
        />
      )}
      
      {/* Match list */}
      <div className="space-y-4">
        {filteredMatches.map((match) => (
          <MatchScoreboard
            key={match.fixture.id}
            match={match}
            compact={true}
            homeTeamColor={getTeamColor(match.teams.home.name)}
            awayTeamColor={getTeamColor(match.teams.away.name)}
            onClick={() => navigate(`/matches/${match.fixture.id}`)}
          />
        ))}
      </div>
    </>
  );
}

export default EnhancedLiveScoreboard;