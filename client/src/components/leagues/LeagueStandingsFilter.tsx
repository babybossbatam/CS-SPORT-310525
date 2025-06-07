import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { usePopularLeagueStandings, useLeagueStandings } from '@/lib/MyStandingsCachedNew';
import { format, parseISO } from 'date-fns';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface LeagueData {
  id: number;
  name: string;
  logo: string;
  country?: string;
  priority?: number;
  type?: string;
}

interface Standing {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  form: string;
  description?: string; // Added description property
}

const LeagueStandingsFilter = () => {
  const [popularLeagues, setPopularLeagues] = useState<LeagueData[]>([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedLeagueName, setSelectedLeagueName] = useState('');
  const [leaguesLoading, setLeaguesLoading] = useState(true);

  // 5 Filtering Mechanisms for Popular Leagues
  const TIER_1_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga
  const TIER_2_LEAGUES = [61, 848, 15]; // Ligue 1, Conference League, FIFA Club World Cup
  const TIER_3_LEAGUES = [45, 48, 143, 137, 81]; // FA Cup, EFL Cup, Copa del Rey, Coppa Italia, DFB Pokal

  const PRIORITY_COUNTRIES = ['Europe', 'England', 'Spain', 'Italy', 'Germany', 'France'];
  const MAJOR_LEAGUE_TYPES = ['League', 'Cup'];

  const filterAndPrioritizeLeagues = (leagues: any[]): LeagueData[] => {
    // Filter 1: Priority League IDs
    const priorityFilter = (league: any) => {
      const leagueId = league.league?.id || league.id;
      return TIER_1_LEAGUES.includes(leagueId) || 
             TIER_2_LEAGUES.includes(leagueId) || 
             TIER_3_LEAGUES.includes(leagueId);
    };

    // Filter 2: Priority Countries
    const countryFilter = (league: any) => {
      const country = league.country?.name || league.league?.country || league.country;
      return PRIORITY_COUNTRIES.includes(country);
    };

    // Filter 3: Major League Types
    const typeFilter = (league: any) => {
      const type = league.league?.type || league.type;
      return MAJOR_LEAGUE_TYPES.includes(type);
    };

    // Filter 4: Exclude Youth/Reserve/Amateur leagues
    const qualityFilter = (league: any) => {
      const name = (league.league?.name || league.name || '').toLowerCase();
      const excludeTerms = ['youth', 'reserve', 'amateur', 'u20', 'u21', 'u23', 'women', 'academy'];
      return !excludeTerms.some(term => name.includes(term));
    };

    // Filter 5: Minimum popularity threshold (well-known leagues)
    const popularityFilter = (league: any) => {
      const name = (league.league?.name || league.name || '').toLowerCase();
      const popularTerms = ['premier', 'champions', 'europa', 'liga', 'serie', 'bundesliga', 'ligue', 'cup', 'world'];
      return popularTerms.some(term => name.includes(term));
    };

    // Apply all 5 filters
    const filtered = leagues.filter(league => 
      priorityFilter(league) && 
      countryFilter(league) && 
      typeFilter(league) && 
      qualityFilter(league) && 
      popularityFilter(league)
    );

    // Transform and prioritize
    const transformed = filtered.map(league => {
      const leagueData = league.league || league;
      const leagueId = leagueData.id || league.id;
      
      // Assign priority based on tier
      let priority = 999;
      if (TIER_1_LEAGUES.includes(leagueId)) priority = 1;
      else if (TIER_2_LEAGUES.includes(leagueId)) priority = 2;
      else if (TIER_3_LEAGUES.includes(leagueId)) priority = 3;

      return {
        id: leagueId,
        name: leagueData.name || `League ${leagueId}`,
        logo: leagueData.logo || `https://media.api-sports.io/football/leagues/${leagueId}.png`,
        country: league.country?.name || leagueData.country || 'Unknown',
        priority,
        type: leagueData.type || 'League'
      };
    });

    // Sort by priority and return top 10
    return transformed
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
      .slice(0, 10);
  };

  const getPopularLeagues = async () => {
    const response = await fetch('/api/leagues/popular');
    if (!response.ok) {
      throw new Error('Failed to fetch leagues');
    }
    return response.json();
  };

  const loadLeagues = async () => {
    try {
      setLeaguesLoading(true);
      const rawLeagues = await getPopularLeagues();
      
      // Apply 5 filtering mechanisms and get top 10 popular major leagues
      const filteredLeagues = filterAndPrioritizeLeagues(rawLeagues);
      setPopularLeagues(filteredLeagues);

      console.log('Top 10 Popular Major Leagues:', filteredLeagues);

      // Set default selection to first league with valid ID
      if (filteredLeagues.length > 0) {
        const firstValidLeague = filteredLeagues[0];
        setSelectedLeague(firstValidLeague.id.toString());
        setSelectedLeagueName(firstValidLeague.name);
      }
    } catch (error) {
      console.error('Failed to load league data:', error);
    } finally {
      setLeaguesLoading(false);
    }
  };

  useEffect(() => {
    loadLeagues();
  }, []);

  // Get today's date string for daily caching
  const todayDateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { data: standings, isLoading: standingsLoading } = useLeagueStandings(
    selectedLeague && selectedLeague !== '' ? parseInt(selectedLeague) : 0
  );

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['fixtures', selectedLeague, todayDateKey],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/leagues/${selectedLeague}/fixtures`);
      return response.json();
    },
    enabled: !!selectedLeague && selectedLeague !== '', // Only run when we have a valid league ID
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - keeps data fresh for the whole day
    gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection
    refetchOnMount: false, // Don't refetch on mount if data exists for today
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  const isLoading = standingsLoading || fixturesLoading || leaguesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Select 
          value={selectedLeague} 
          onValueChange={(value) => {
            setSelectedLeague(value);
            const league = popularLeagues.find(l => l && l.id && l.name && l.id.toString() === value);
            if (league && league.name) {
              setSelectedLeagueName(league.name);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <img
                  src={popularLeagues.find(l => l && l.id && l.id.toString() === selectedLeague)?.logo}
                  alt={selectedLeagueName}
                  className="h-5 w-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                  }}
                />
                {selectedLeagueName}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {popularLeagues.map((league) => (
              <SelectItem key={league.id} value={league.id.toString()}>
                <div className="flex items-center gap-3">
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{league.name}</span>
                    <span className="text-xs text-gray-500">{league.country}</span>
                  </div>
                  {league.priority <= 2 && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Popular
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead className="w-[40px] text-center">#</TableHead>
                  <TableHead className="pl-4">Team</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">F:A</TableHead>
                  <TableHead className="text-center">+/-</TableHead>
                  <TableHead className="text-center">PTS</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">D</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">Form</TableHead>
                  <TableHead className="text-center">Next</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {standings?.slice(0, 7).map((standing: Standing) => {
                const stats = standing.all;
                return (
                  <TableRow key={standing.team.id} className="border-b border-gray-100">
                      <TableCell className="font-medium text-[0.9em] text-center">{standing.rank}</TableCell>
                      <TableCell className="flex flex-col font-normal pl-4">
                        <div className="flex items-center">
                          <img
                            src={standing.team.logo}
                            alt={standing.team.name}
                            className="mr-2 h-5 w-5 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                            }}
                          />
                          <span className="text-[0.9em]">{standing.team.name}</span>
                          {standing.rank === 1 && <span className="ml-2">👑</span>}
                        </div>
                        {standing.description && (
                          <span className="text-[0.75em] text-yellow-500">
                            {standing.rank === 1 ? 'Won title • CAF Champions League' : standing.description}
                          </span>
                        )}
                      </TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.played}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.goals.for}:{stats.goals.against}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{standing.goalsDiff}</TableCell>
                    <TableCell className="text-center font-bold text-[0.9em]">{standing.points}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.win}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.draw}</TableCell>
                    <TableCell className="text-center text-[0.9em]">{stats.lose}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {standing.form?.split('').map((result, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              result === 'W' ? 'bg-green-500' :
                              result === 'D' ? 'bg-gray-500' :
                              'bg-red-500'
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 relative group">
                      <div className="flex items-center justify-center gap-2">
                        {standings?.find(opponent => 
                          opponent.team.id !== standing.team.id && 
                          opponent.rank > standing.rank
                        ) && (
                          <>
                            <img 
                              src={standings.find(opponent => 
                                opponent.team.id !== standing.team.id && 
                                opponent.rank > standing.rank
                              )?.team.logo} 
                              alt={`Next opponent: ${standings.find(opponent => 
                                opponent.team.id !== standing.team.id && 
                                opponent.rank > standing.rank
                              )?.team.name}`}
                              className="w-4 h-4 hover:scale-110 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                              }}
                            />
                            <div className="absolute opacity-0 group-hover:opacity-100 bg-white shadow-lg rounded-md p-2 z-50 right-8 top-1/2 transform -translate-y-1/2 whitespace-nowrap transition-opacity duration-200">
                              <div className="text-xs">
                                <span className="font-medium">{standing.team.name}</span>
                                <span className="mx-2">vs</span>
                                <span className="font-medium">
                                  {standings.find(opponent => 
                                    opponent.team.id !== standing.team.id && 
                                    opponent.rank > standing.rank
                                  )?.team.name}
                                </span>
                                <div className="text-gray-500 mt-1">
                                  {(() => {
                                    const nextMatch = fixtures?.find(f => 
                                      (f.teams.home.id === standing.team.id || f.teams.away.id === standing.team.id) &&
                                      new Date(f.fixture.date) > new Date()
                                    );
                                    return nextMatch ? format(parseISO(nextMatch.fixture.date), 'dd/MM/yyyy') : 'No upcoming matches';
                                  })()}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueStandingsFilter;