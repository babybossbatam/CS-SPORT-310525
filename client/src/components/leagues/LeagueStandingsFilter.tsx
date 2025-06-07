
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/utils';
import { useLeagueStandings } from '@/lib/MyStandingsCachedNew';
import { getPopularLeagues } from '@/lib/leagueDataCache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Users, TrendingUp, Calendar, MapPin, Star, Globe, Filter, AlertCircle } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { CACHE_DURATIONS } from '@/lib/cacheConfig';

interface LeagueData {
  id: number;
  name: string;
  logo: string;
  country: string;
  flag: string;
  season: number;
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
  description: string;
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
}

const LeagueStandingsFilter = () => {
  const [selectedLeague, setSelectedLeague] = useState<LeagueData | null>(null);
  const [filteredLeagues, setFilteredLeagues] = useState<LeagueData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [filterByCountry, setFilterByCountry] = useState('all');
  const [filterByType, setFilterByType] = useState('all');

  // Get popular leagues from cache
  const popularLeagues = getPopularLeagues();

  // Fetch leagues with React Query
  const { data: leaguesData, isLoading, error } = useQuery({
    queryKey: ['leagues'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/leagues');
        
        if (!response.ok) {
          if (response.status === 0) {
            console.warn('Network connectivity issue, using cached popular leagues');
            return popularLeagues.length > 0 ? popularLeagues : [];
          }
          throw new Error(`Failed to fetch leagues: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.warn('Error fetching leagues, using fallback data:', error);
        return popularLeagues.length > 0 ? popularLeagues : [];
      }
    },
    staleTime: CACHE_DURATIONS.LEAGUES,
    gcTime: CACHE_DURATIONS.LEAGUES * 2,
    retry: false,
    enabled: true,
    throwOnError: false
  });

  // Get standings for selected league
  const { data: standings, isLoading: standingsLoading } = useLeagueStandings(
    selectedLeague?.id || 0,
    selectedLeague?.season || 2024
  );

  // Apply filters to leagues
  useEffect(() => {
    if (!leaguesData) return;

    let filtered = [...leaguesData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(league => 
        league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        league.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Country filter
    if (filterByCountry !== 'all') {
      filtered = filtered.filter(league => league.country === filterByCountry);
    }

    // Type filter (international vs domestic)
    if (filterByType === 'international') {
      filtered = filtered.filter(league => 
        league.country === 'World' || 
        league.country === 'Europe' ||
        league.name.toLowerCase().includes('champions') ||
        league.name.toLowerCase().includes('europa') ||
        league.name.toLowerCase().includes('conference') ||
        league.name.toLowerCase().includes('nations')
      );
    } else if (filterByType === 'domestic') {
      filtered = filtered.filter(league => 
        league.country !== 'World' && 
        league.country !== 'Europe' &&
        !league.name.toLowerCase().includes('champions') &&
        !league.name.toLowerCase().includes('europa') &&
        !league.name.toLowerCase().includes('conference') &&
        !league.name.toLowerCase().includes('nations')
      );
    }

    // Sort leagues
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'country') {
      filtered.sort((a, b) => a.country.localeCompare(b.country));
    } else if (sortBy === 'popularity') {
      // Sort by popularity (popular leagues first)
      filtered.sort((a, b) => {
        const aIsPopular = popularLeagues.some(pl => pl.id === a.id);
        const bIsPopular = popularLeagues.some(pl => pl.id === b.id);
        if (aIsPopular && !bIsPopular) return -1;
        if (!aIsPopular && bIsPopular) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    setFilteredLeagues(filtered);

    // Auto-select first league if none selected
    if (!selectedLeague && filtered.length > 0) {
      setSelectedLeague(filtered[0]);
    }
  }, [leaguesData, searchTerm, filterByCountry, filterByType, sortBy, popularLeagues, selectedLeague]);

  // Get unique countries for filter
  const countries = [...new Set(leaguesData?.map(league => league.country) || [])].sort();

  return (
    <ErrorBoundary>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            League Standings Filter - Popular Leagues Integration
            <Badge variant="outline" className="ml-2">
              {filteredLeagues.length} leagues
            </Badge>
            {error && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Offline Mode
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Search Leagues
              </label>
              <input
                type="text"
                placeholder="Search by name or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Filter by Country
              </label>
              <Select value={filterByCountry} onValueChange={setFilterByCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Filter className="h-4 w-4" />
                League Type
              </label>
              <Select value={filterByType} onValueChange={setFilterByType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="domestic">Domestic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* League Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              Select League for Standings
            </h3>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {filteredLeagues.map((league) => {
                  const isPopular = popularLeagues.some(pl => pl.id === league.id);
                  const isSelected = selectedLeague?.id === league.id;
                  
                  return (
                    <Button
                      key={league.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-3 justify-start text-left ${isPopular ? 'border-yellow-300 bg-yellow-50' : ''}`}
                      onClick={() => setSelectedLeague(league)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <img
                          src={league.logo}
                          alt={league.name}
                          className="h-8 w-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/fallback-logo.png';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{league.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            {league.country}
                            {isPopular && <Star className="h-3 w-3 text-yellow-500" />}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* League Standings */}
          {selectedLeague && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <img
                    src={selectedLeague.logo}
                    alt={selectedLeague.name}
                    className="h-6 w-6 object-contain"
                  />
                  {selectedLeague.name} Standings
                </h3>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {selectedLeague.season || 2024}
                </Badge>
              </div>

              {standingsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : standings?.league?.standings?.[0] ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Pos</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">P</TableHead>
                      <TableHead className="text-center">W</TableHead>
                      <TableHead className="text-center">D</TableHead>
                      <TableHead className="text-center">L</TableHead>
                      <TableHead className="text-center">GF</TableHead>
                      <TableHead className="text-center">GA</TableHead>
                      <TableHead className="text-center">GD</TableHead>
                      <TableHead className="text-center">Pts</TableHead>
                      <TableHead className="text-center">Form</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.league.standings[0].slice(0, 20).map((standing: Standing) => (
                      <TableRow key={standing.team.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-center">
                          <span
                            className={`inline-block w-6 h-6 rounded text-white text-xs leading-6 ${
                              standing.rank <= 4 ? 'bg-green-500' :
                              standing.rank <= 6 ? 'bg-blue-500' :
                              standing.rank >= standings.league.standings[0].length - 2 ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}
                          >
                            {standing.rank}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img
                              src={standing.team.logo}
                              alt={standing.team.name}
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/fallback-logo.png';
                              }}
                            />
                            <span className="font-medium">{standing.team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{standing.all.played}</TableCell>
                        <TableCell className="text-center">{standing.all.win}</TableCell>
                        <TableCell className="text-center">{standing.all.draw}</TableCell>
                        <TableCell className="text-center">{standing.all.lose}</TableCell>
                        <TableCell className="text-center">{standing.all.goals.for}</TableCell>
                        <TableCell className="text-center">{standing.all.goals.against}</TableCell>
                        <TableCell className="text-center">
                          <span className={standing.goalsDiff >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {standing.goalsDiff > 0 ? '+' : ''}{standing.goalsDiff}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold">{standing.points}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            {standing.form?.split('').slice(-5).map((result, i) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${
                                  result === 'W' ? 'bg-green-500' :
                                  result === 'D' ? 'bg-gray-500' :
                                  'bg-red-500'
                                }`}
                              >
                                {result}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>No standings data available for this league</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default LeagueStandingsFilter;
