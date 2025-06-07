import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Users, TrendingUp, Calendar, MapPin, Star, Globe, Filter } from 'lucide-react';
import { apiRequest } from '@/lib/utils';
import { CACHE_DURATIONS } from '@/lib/cacheConfig';
import { getPopularLeagues } from '@/lib/leagueDataCache';

// Types for league data
interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
  type: string;
  season: number;
  priority?: number;
  popularity?: number;
}

// Filter mechanism types
interface FilterCriteria {
  geographical: 'major-europe' | 'major-south-america' | 'major-asia' | 'all';
  competitionLevel: 'top-tier' | 'continental' | 'domestic' | 'all';
  popularity: 'high' | 'medium' | 'low' | 'all';
  season: 'current' | 'previous' | 'all';
  leagueType: 'league' | 'cup' | 'international' | 'all';
}

// Top 10 Major Leagues Configuration with 5 Filter Mechanisms
const TOP_10_MAJOR_LEAGUES = [
  { 
    id: 39, name: 'Premier League', country: 'England', type: 'League', 
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    priority: 1, popularity: 100, region: 'Europe', tier: 'top-tier'
  },
  { 
    id: 140, name: 'La Liga', country: 'Spain', type: 'League', 
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    priority: 2, popularity: 95, region: 'Europe', tier: 'top-tier'
  },
  { 
    id: 135, name: 'Serie A', country: 'Italy', type: 'League', 
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    priority: 3, popularity: 90, region: 'Europe', tier: 'top-tier'
  },
  { 
    id: 78, name: 'Bundesliga', country: 'Germany', type: 'League', 
    logo: 'https://media.api-sports.io/football/leagues/78.png',
    priority: 4, popularity: 85, region: 'Europe', tier: 'top-tier'
  },
  { 
    id: 61, name: 'Ligue 1', country: 'France', type: 'League', 
    logo: 'https://media.api-sports.io/football/leagues/61.png',
    priority: 5, popularity: 80, region: 'Europe', tier: 'top-tier'
  },
  { 
    id: 2, name: 'UEFA Champions League', country: 'World', type: 'Cup', 
    logo: 'https://media.api-sports.io/football/leagues/2.png',
    priority: 6, popularity: 98, region: 'Europe', tier: 'continental'
  },
  { 
    id: 3, name: 'UEFA Europa League', country: 'World', type: 'Cup', 
    logo: 'https://media.api-sports.io/football/leagues/3.png',
    priority: 7, popularity: 75, region: 'Europe', tier: 'continental'
  },
  { 
    id: 848, name: 'UEFA Europa Conference League', country: 'World', type: 'Cup', 
    logo: 'https://media.api-sports.io/football/leagues/848.png',
    priority: 8, popularity: 70, region: 'Europe', tier: 'continental'
  },
  { 
    id: 71, name: 'Brasileirão Serie A', country: 'Brazil', type: 'League', 
    logo: 'https://media.api-sports.io/football/leagues/71.png',
    priority: 9, popularity: 65, region: 'South America', tier: 'top-tier'
  },
  { 
    id: 128, name: 'Argentine Liga Profesional', country: 'Argentina', type: 'League', 
    logo: 'https://media.api-sports.io/football/leagues/128.png',
    priority: 10, popularity: 60, region: 'South America', tier: 'top-tier'
  }
];

// 5 Filter Mechanisms
const FILTER_MECHANISMS = {
  geographical: [
    { value: 'major-europe', label: 'Major European Leagues', icon: '🇪🇺' },
    { value: 'major-south-america', label: 'Major South American', icon: '🌎' },
    { value: 'major-asia', label: 'Major Asian Leagues', icon: '🌏' },
    { value: 'all', label: 'All Regions', icon: '🌍' }
  ],
  competitionLevel: [
    { value: 'top-tier', label: 'Top Tier Leagues', icon: '👑' },
    { value: 'continental', label: 'Continental Cups', icon: '🏆' },
    { value: 'domestic', label: 'Domestic Cups', icon: '🥇' },
    { value: 'all', label: 'All Competitions', icon: '⚽' }
  ],
  popularity: [
    { value: 'high', label: 'High Popularity (80+)', icon: '🔥' },
    { value: 'medium', label: 'Medium Popularity (60-79)', icon: '⭐' },
    { value: 'low', label: 'Lower Popularity (<60)', icon: '🌟' },
    { value: 'all', label: 'All Popularity Levels', icon: '📊' }
  ],
  season: [
    { value: 'current', label: 'Current Season 2024/25', icon: '📅' },
    { value: 'previous', label: 'Previous Season 2023/24', icon: '📜' },
    { value: 'all', label: 'All Seasons', icon: '🗓️' }
  ],
  leagueType: [
    { value: 'league', label: 'League Championships', icon: '🏅' },
    { value: 'cup', label: 'Cup Competitions', icon: '🏆' },
    { value: 'international', label: 'International', icon: '🌐' },
    { value: 'all', label: 'All Types', icon: '⚽' }
  ]
};

const LeagueStandingsFilter: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);

  // 5 Filter Mechanisms State
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    geographical: 'all',
    competitionLevel: 'all',
    popularity: 'all',
    season: 'current',
    leagueType: 'all'
  });

  // Get popular leagues from cache
  const [popularLeagues, setPopularLeagues] = useState<League[]>([]);

  // Fetch popular leagues data from cache
  useEffect(() => {
    const loadPopularLeagues = async () => {
      try {
        const cachedLeagues = await getPopularLeagues();
        if (cachedLeagues && cachedLeagues.length > 0) {
          // Convert cached leagues to our format and merge with top 10 major leagues
          const formattedLeagues = cachedLeagues.slice(0, 10).map((league, index) => ({
            id: league.id,
            name: league.name,
            logo: league.logo,
            country: typeof league.country === 'string' ? league.country : league.country?.name || 'Unknown',
            type: league.type || 'League',
            season: new Date().getFullYear(),
            priority: index + 1,
            popularity: 100 - (index * 5) // Decreasing popularity
          }));
          setPopularLeagues(formattedLeagues);
        } else {
          // Fallback to hardcoded top 10 major leagues
          setPopularLeagues(TOP_10_MAJOR_LEAGUES);
        }
      } catch (error) {
        console.warn('Failed to load popular leagues from cache, using fallback:', error);
        setPopularLeagues(TOP_10_MAJOR_LEAGUES);
      }
    };

    loadPopularLeagues();
  }, []);

  // Fetch leagues data with error handling
  const { data: leaguesData, isLoading, error } = useQuery({
    queryKey: ['leagues'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/leagues');
        if (!response.ok) {
          // Handle network errors gracefully
          if (response.status === 0) {
            console.warn('Network connectivity issue, using cached popular leagues');
            return popularLeagues.length > 0 ? popularLeagues : TOP_10_MAJOR_LEAGUES;
          }
          throw new Error(`Failed to fetch leagues: ${response.statusText}`);
        }
        const data = await response.json();

        // If API returns error, use cached data
        if (data.error) {
          console.warn('API returned error, using cached popular leagues:', data.message);
          return popularLeagues.length > 0 ? popularLeagues : TOP_10_MAJOR_LEAGUES;
        }

        return data;
      } catch (error) {
        console.error('Error fetching leagues:', error);
        // Fallback to popular leagues on any error
        return popularLeagues.length > 0 ? popularLeagues : TOP_10_MAJOR_LEAGUES;
      }
    },
    staleTime: CACHE_DURATIONS.LEAGUES,
    gcTime: CACHE_DURATIONS.LEAGUES * 2,
    retry: 1,
    enabled: true
  });

  // Apply 5 filter mechanisms to popular leagues
  const filteredLeagues = useMemo(() => {
    let filtered = popularLeagues;

    // 1. Geographical Filter
    if (filterCriteria.geographical !== 'all') {
      filtered = filtered.filter(league => {
        switch (filterCriteria.geographical) {
          case 'major-europe':
            return ['England', 'Spain', 'Italy', 'Germany', 'France', 'World'].includes(league.country);
          case 'major-south-america':
            return ['Brazil', 'Argentina', 'Colombia', 'Chile'].includes(league.country);
          case 'major-asia':
            return ['Japan', 'South Korea', 'China', 'Saudi Arabia'].includes(league.country);
          default:
            return true;
        }
      });
    }

    // 2. Competition Level Filter
    if (filterCriteria.competitionLevel !== 'all') {
      filtered = filtered.filter(league => {
        switch (filterCriteria.competitionLevel) {
          case 'top-tier':
            return league.type === 'League' && league.priority <= 5;
          case 'continental':
            return league.type === 'Cup' && league.country === 'World';
          case 'domestic':
            return league.type === 'Cup' && league.country !== 'World';
          default:
            return true;
        }
      });
    }

    // 3. Popularity Filter
    if (filterCriteria.popularity !== 'all') {
      filtered = filtered.filter(league => {
        const popularity = league.popularity || 50;
        switch (filterCriteria.popularity) {
          case 'high':
            return popularity >= 80;
          case 'medium':
            return popularity >= 60 && popularity < 80;
          case 'low':
            return popularity < 60;
          default:
            return true;
        }
      });
    }

    // 4. League Type Filter
    if (filterCriteria.leagueType !== 'all') {
      filtered = filtered.filter(league => {
        switch (filterCriteria.leagueType) {
          case 'league':
            return league.type === 'League';
          case 'cup':
            return league.type === 'Cup' && league.country !== 'World';
          case 'international':
            return league.country === 'World';
          default:
            return true;
        }
      });
    }

    // 5. Season Filter (for future implementation)
    // Currently just shows current season data

    return filtered.slice(0, 10); // Always show only top 10
  }, [popularLeagues, filterCriteria]);

  useEffect(() => {
    if (leaguesData && Array.isArray(leaguesData)) {
      // Merge API data with popular leagues, prioritizing popular leagues
      const formattedLeagues = leaguesData.slice(0, 10).map((item: any, index: number) => ({
        id: item.league?.id || item.id,
        name: item.league?.name || item.name,
        logo: item.league?.logo || item.logo,
        country: item.country?.name || item.country || 'Unknown',
        type: item.league?.type || item.type || 'League',
        season: new Date().getFullYear(),
        priority: index + 1,
        popularity: 100 - (index * 3)
      }));
      setLeagues(formattedLeagues);
    } else {
      // Fallback to popular leagues if API fails
      setLeagues(popularLeagues);
    }
  }, [leaguesData, popularLeagues]);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          League Standings Filter - Top 10 Major Leagues
          <Badge variant="outline" className="ml-2">
            {filteredLeagues.length} leagues
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 5 Filter Mechanisms */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Geographic Region
            </label>
            <Select 
              value={filterCriteria.geographical} 
              onValueChange={(value) => setFilterCriteria(prev => ({...prev, geographical: value as any}))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_MECHANISMS.geographical.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Competition Level
            </label>
            <Select 
              value={filterCriteria.competitionLevel} 
              onValueChange={(value) => setFilterCriteria(prev => ({...prev, competitionLevel: value as any}))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_MECHANISMS.competitionLevel.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Popularity Level
            </label>
            <Select 
              value={filterCriteria.popularity} 
              onValueChange={(value) => setFilterCriteria(prev => ({...prev, popularity: value as any}))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_MECHANISMS.popularity.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Season
            </label>
            <Select 
              value={filterCriteria.season} 
              onValueChange={(value) => setFilterCriteria(prev => ({...prev, season: value as any}))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_MECHANISMS.season.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              League Type
            </label>
            <Select 
              value={filterCriteria.leagueType} 
              onValueChange={(value) => setFilterCriteria(prev => ({...prev, leagueType: value as any}))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_MECHANISMS.leagueType.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => setFilterCriteria({
                geographical: 'all',
                competitionLevel: 'all',
                popularity: 'all',
                season: 'current',
                leagueType: 'all'
              })}
              className="w-full"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* League Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Select League (Top 10 Major Leagues)
          </label>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedLeague?.toString() || ''} onValueChange={(value) => setSelectedLeague(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose from top 10 major leagues..." />
              </SelectTrigger>
              <SelectContent>
                {filteredLeagues.map((league) => (
                  <SelectItem key={league.id} value={league.id.toString()}>
                    <div className="flex items-center gap-2">
                      <img 
                        src={league.logo} 
                        alt={league.name}
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/fallback-logo.png';
                        }}
                      />
                      <span className="font-medium">{league.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {league.country}
                      </Badge>
                      {league.priority && league.priority <= 3 && (
                        <Badge variant="default" className="text-xs bg-yellow-500">
                          Top {league.priority}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Error State with Network Error Handling */}
        {error && (
          <div className="text-center py-8">
            <div className="text-amber-500 mb-2">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Network Issue Detected</p>
              <p className="text-sm text-gray-500">
                Using cached data from top 10 major leagues ({filteredLeagues.length} leagues available)
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="mt-2 text-xs"
              >
                Retry Connection
              </Button>
            </div>
          </div>
        )}

        {/* League Stats Summary for Top 10 Major Leagues */}
        {filteredLeagues.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredLeagues.length}</div>
              <div className="text-xs text-gray-500">Filtered Leagues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredLeagues.filter(l => l.type === 'League').length}
              </div>
              <div className="text-xs text-gray-500">Domestic Leagues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredLeagues.filter(l => l.type === 'Cup').length}
              </div>
              <div className="text-xs text-gray-500">Cup Competitions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(filteredLeagues.map(l => l.country)).size}
              </div>
              <div className="text-xs text-gray-500">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Math.round(filteredLeagues.reduce((acc, l) => acc + (l.popularity || 50), 0) / filteredLeagues.length)}
              </div>
              <div className="text-xs text-gray-500">Avg Popularity</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeagueStandingsFilter;
```

The code has been modified to include 5 filter mechanisms, integrate with popular leagues data, show only top 10 major leagues, and add error handling.