import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { format, parseISO } from 'date-fns';
import { BarChart2, LineChart, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { FixtureResponse } from '../../../../server/types';

// Same league list as TodayMatches and UpcomingMatchesScoreboard
const POPULAR_LEAGUES = [
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  135, // Serie A (Italy)
];

const FeaturedMatch = () => {
  const [, navigate] = useLocation();
  const [featuredMatch, setFeaturedMatch] = useState<FixtureResponse | null>(null);
  
  // Get fixture data using React Query
  const { data: championsLeagueFixtures = [], isLoading: isChampionsLeagueLoading } = useQuery({
    queryKey: ['/api/champions-league/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/champions-league/fixtures');
      return response.json();
    }
  });
  
  const { data: europaLeagueFixtures = [], isLoading: isEuropaLeagueLoading } = useQuery({
    queryKey: ['/api/europa-league/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/europa-league/fixtures');
      return response.json();
    }
  });
  
  const { data: serieAFixtures = [], isLoading: isSerieALoading } = useQuery({
    queryKey: ['/api/leagues/135/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/leagues/135/fixtures');
      return response.json();
    }
  });
  
  useEffect(() => {
    // Combine all fixtures
    const allFixtures = [...championsLeagueFixtures, ...europaLeagueFixtures, ...serieAFixtures];
    
    // Get the current time in seconds (unix timestamp)
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Calculate today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 1000;
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).getTime() / 1000;
    
    // Create an array of unique fixtures
    const uniqueFixtures = allFixtures
      // Remove duplicates by fixture ID
      .filter((fixture, index, self) => 
        index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
      )
      // Filter to only include popular leagues
      .filter(fixture => POPULAR_LEAGUES.includes(fixture.league.id));
    
    // Get today's matches with priority to matches that are in-play or finished
    const todaysMatches = uniqueFixtures
      .filter(fixture => 
        fixture.fixture.timestamp >= startOfDay && 
        fixture.fixture.timestamp <= endOfDay
      )
      // Sort with priority to in-play and then finished matches
      .sort((a, b) => {
        // In-play matches first
        if (a.fixture.status.short === 'IN_PLAY' && b.fixture.status.short !== 'IN_PLAY') return -1;
        if (a.fixture.status.short !== 'IN_PLAY' && b.fixture.status.short === 'IN_PLAY') return 1;
        
        // Then finished matches
        if (a.fixture.status.short === 'FT' && b.fixture.status.short !== 'FT') return -1;
        if (a.fixture.status.short !== 'FT' && b.fixture.status.short === 'FT') return 1;
        
        // Then by time
        return a.fixture.timestamp - b.fixture.timestamp;
      });
    
    // Get upcoming matches (not today)
    const upcomingMatches = uniqueFixtures
      .filter(fixture => 
        // Not started yet
        (fixture.fixture.status.short === 'NS' || fixture.fixture.status.short === 'TBD') &&
        // After today
        fixture.fixture.timestamp > endOfDay
      );
    
    // Combine and sort all matches prioritizing today's matches first, then upcoming
    const filteredFixtures = [
      ...todaysMatches,
      ...upcomingMatches
    ]
    // Sort by timestamp (nearest first)
    .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
    
    // Set the first match as featured
    if (filteredFixtures.length > 0) {
      setFeaturedMatch(filteredFixtures[0]);
    }
  }, [championsLeagueFixtures, europaLeagueFixtures, serieAFixtures]);
  
  // Format date for match display (Today, Tomorrow, or date)
  const formatMatchDate = (dateString: string): string => {
    const date = parseISO(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return format(date, 'E, MMM d');
    }
  };
  
  if (isChampionsLeagueLoading || isEuropaLeagueLoading || isSerieALoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="bg-gray-200 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-28" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-6 w-32 mx-auto mb-6" />
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="flex flex-col items-center w-1/3">
              <Skeleton className="h-16 w-16 rounded-full mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-col items-center w-1/3">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex flex-col items-center w-1/3">
              <Skeleton className="h-16 w-16 rounded-full mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!featuredMatch) {
    return null;
  }
  
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <CardHeader className="bg-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <Trophy className="h-4 w-4 text-neutral-500 mr-2" />
          <span className="text-sm font-medium">{featuredMatch.league.name} - {featuredMatch.league.round}</span>
        </div>
        <Badge variant="secondary" className="bg-neutral-300 text-xs font-medium py-1 px-2 rounded">
          Featured Match
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold text-center mb-6">
          {formatMatchDate(featuredMatch.fixture.date)}
        </h2>
        
        <div className="flex justify-center items-center space-x-4 mb-4">
          {/* Home Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="h-16 w-16 mb-2 flex items-center justify-center">
              <img 
                src={featuredMatch.teams.home.logo} 
                alt={featuredMatch.teams.home.name} 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <span className="font-semibold text-center">{featuredMatch.teams.home.name}</span>
          </div>
          
          {/* VS or Score */}
          <div className="flex flex-col items-center w-1/3">
            {/* Show score if match is in progress or finished */}
            {(featuredMatch.fixture.status.short === 'FT' || 
              featuredMatch.fixture.status.short === 'AET' || 
              featuredMatch.fixture.status.short === 'PEN' || 
              featuredMatch.fixture.status.short === 'IN_PLAY' || 
              featuredMatch.fixture.status.short === 'HT') ? (
              <div className="text-3xl font-bold text-neutral-500 mb-2">
                {featuredMatch.goals.home} - {featuredMatch.goals.away}
                {featuredMatch.fixture.status.short === 'AET' && 
                  <span className="text-xs ml-2 text-blue-600">AET</span>}
                {featuredMatch.fixture.status.short === 'PEN' && 
                  <span className="text-xs ml-2 text-blue-600">PEN</span>}
                {featuredMatch.fixture.status.short === 'IN_PLAY' && 
                  <span className="text-xs ml-2 text-red-600">LIVE</span>}
                {featuredMatch.fixture.status.short === 'HT' && 
                  <span className="text-xs ml-2 text-orange-600">HT</span>}
              </div>
            ) : (
              <div className="text-3xl font-bold text-neutral-500 mb-2">VS</div>
            )}
            <div className="text-sm text-neutral-500">
              {formatDateTime(featuredMatch.fixture.date)}
              {featuredMatch.fixture.venue.name && ` | ${featuredMatch.fixture.venue.name}`}
            </div>
          </div>
          
          {/* Away Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="h-16 w-16 mb-2 flex items-center justify-center">
              <img 
                src={featuredMatch.teams.away.logo} 
                alt={featuredMatch.teams.away.name} 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <span className="font-semibold text-center">{featuredMatch.teams.away.name}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={() => navigate(`/match/${featuredMatch.fixture.id}/h2h`)}
          >
            <BarChart2 className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">H2H</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={() => navigate(`/match/${featuredMatch.fixture.id}/stats`)}
          >
            <LineChart className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Stats</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={() => navigate(`/league/${featuredMatch.league.id}/bracket`)}
          >
            <Trophy className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Bracket</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedMatch;
