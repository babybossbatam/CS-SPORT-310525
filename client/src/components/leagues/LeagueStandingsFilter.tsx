import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getPopularLeagues, LeagueData } from '@/lib/leagueDataCache';
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

  useEffect(() => {
    const loadLeagues = async () => {
      try {
        setLeaguesLoading(true);
        const leagues = await getPopularLeagues();

        // Process leagues to ensure we have proper names and logos
        const processedLeagues = leagues.map((league) => ({
          ...league,
          // Ensure we have a proper name, fallback to a meaningful default
          name: league.name || `${league.country} League`
        }));

        setPopularLeagues(processedLeagues);

        // Set default selection to first league with valid ID
        if (processedLeagues.length > 0) {
          const firstValidLeague = processedLeagues.find(league => league && league.id && league.name);
          if (firstValidLeague) {
            setSelectedLeague(firstValidLeague.id.toString());
            setSelectedLeagueName(firstValidLeague.name);
          }
        }
      } catch (error) {
        console.error('Failed to load league data:', error);

        // Fallback to popular leagues if network fails
        const fallbackLeagues = [
          { id: 39, name: 'Premier League', logo: '', country: 'England' },
          { id: 140, name: 'La Liga', logo: '', country: 'Spain' },
          { id: 135, name: 'Serie A', logo: '', country: 'Italy' },
          { id: 78, name: 'Bundesliga', logo: '', country: 'Germany' },
          { id: 61, name: 'Ligue 1', logo: '', country: 'France' },
        ];

        setPopularLeagues(fallbackLeagues);

        // Set default to Premier League
        setSelectedLeague('39');
        setSelectedLeagueName('Premier League');
      } finally {
        setLeaguesLoading(false);
      }
    };

    loadLeagues();
  }, []);

  // Get today's date string for daily caching
  const todayDateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  console.log('LeagueStandingsFilter Debug:', {
    selectedLeague,
  });

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

  const isLoading = fixturesLoading || leaguesLoading;

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
            {popularLeagues.filter(league => league && league.id && league.name && league.logo).map((league) => (
              <SelectItem key={league.id} value={league.id.toString()}>
                <div className="flex items-center gap-2">
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="h-5 w-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                    }}
                  />
                  {league.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="relative">
          

          <div className="text-center py-8 text-gray-500">
            <p>Standings feature has been removed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueStandingsFilter;