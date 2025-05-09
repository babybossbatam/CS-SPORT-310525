import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { format, parseISO } from 'date-fns';
import { BarChart2, LineChart, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, isLiveMatch } from '@/lib/utils';
import { getTeamColor, getOpposingTeamColor } from '@/lib/colorExtractor';
import { useQuery } from '@tanstack/react-query';
import { FixtureResponse } from '../../../../server/types';

// Exact same IDs as UpcomingMatchesScoreboard
const FEATURED_LEAGUE_IDS = [
  135, // Serie A (Italy)
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  39,  // Premier League (England)
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
  
  const { data: premierLeagueFixtures = [], isLoading: isPremierLeagueLoading } = useQuery({
    queryKey: ['/api/leagues/39/fixtures'],
    queryFn: async () => {
      const response = await fetch('/api/leagues/39/fixtures');
      return response.json();
    }
  });
  
  useEffect(() => {
    // Combine all fixtures
    const allFixtures = [...championsLeagueFixtures, ...europaLeagueFixtures, ...serieAFixtures, ...premierLeagueFixtures];
    
    // Create a map to track unique fixture IDs and detect duplicates
    const fixtureIdMap = new Map<number, FixtureResponse>();
    
    // Process each data source, only adding new unique fixtures
    const processSource = (fixtures: FixtureResponse[] | undefined, sourceName: string) => {
      if (!fixtures) return;
      fixtures.forEach(fixture => {
        if (!fixtureIdMap.has(fixture.fixture.id)) {
          fixtureIdMap.set(fixture.fixture.id, fixture);
        }
      });
    };
    
    // Process sources
    processSource(championsLeagueFixtures, "Champions League");
    processSource(europaLeagueFixtures, "Europa League");
    processSource(serieAFixtures, "Serie A");
    processSource(premierLeagueFixtures, "Premier League");
    
    // Convert map back to array
    const uniqueFixtures = Array.from(fixtureIdMap.values());
    
    // Get the current time in seconds (unix timestamp)
    const currentTime = Math.floor(Date.now() / 1000);
    const eightHoursInSeconds = 8 * 60 * 60; // 8 hours in seconds
    
    // Apply the exact same filtering logic as UpcomingMatchesScoreboard
    const scoreBoardMatches = uniqueFixtures.filter(match => {
      // Only include matches from our featured leagues
      if (!FEATURED_LEAGUE_IDS.includes(match.league.id)) {
        return false;
      }
      
      // Get time difference from current time
      const timeDiff = currentTime - match.fixture.timestamp;
      
      // Case 1: Today's finished matches that aren't more than 8 hours old
      if (
        (match.fixture.status.short === 'FT' || 
         match.fixture.status.short === 'AET' || 
         match.fixture.status.short === 'PEN') && 
        timeDiff >= 0 && 
        timeDiff <= eightHoursInSeconds
      ) {
        return true;
      }
      
      // Case 2: Upcoming matches (not yet started)
      if (
        (match.fixture.status.short === 'NS' || 
         match.fixture.status.short === 'TBD') && 
        match.fixture.timestamp > currentTime
      ) {
        return true;
      }
      
      // Case 3: Live matches
      if (isLiveMatch(match.fixture.status.short)) {
        return true;
      }
      
      // Exclude all other matches
      return false;
    });
    
    // Apply the same sorting logic as UpcomingMatchesScoreboard
    const sortedFixtures = scoreBoardMatches.sort((a, b) => {
      // First sort by match status: Live > Upcoming > Finished
      const aIsLive = isLiveMatch(a.fixture.status.short);
      const bIsLive = isLiveMatch(b.fixture.status.short);
      
      // Check if matches are finished
      const aIsFinished = ['FT', 'AET', 'PEN'].includes(a.fixture.status.short);
      const bIsFinished = ['FT', 'AET', 'PEN'].includes(b.fixture.status.short);
      
      // Live matches get highest priority
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Then upcoming matches (sort by nearest timestamp)
      if (!aIsFinished && !aIsLive && bIsFinished) return -1;
      if (aIsFinished && !bIsFinished && !bIsLive) return 1;
      
      // For upcoming matches, sort by nearest time first
      const aTimeUntilMatch = a.fixture.timestamp - currentTime;
      const bTimeUntilMatch = b.fixture.timestamp - currentTime;
      
      if (!aIsFinished && !bIsFinished) {
        return aTimeUntilMatch - bTimeUntilMatch; // Nearest match first
      }
      
      // For finished matches, sort by most recent first
      if (aIsFinished && bIsFinished) {
        return b.fixture.timestamp - a.fixture.timestamp; // Most recent first
      }
      
      // Finally sort by timestamp for matches with the same priority
      return a.fixture.timestamp - b.fixture.timestamp;
    });
    
    // Set the first match as featured
    if (sortedFixtures.length > 0) {
      setFeaturedMatch(sortedFixtures[0]);
    }
  }, [championsLeagueFixtures, europaLeagueFixtures, serieAFixtures, premierLeagueFixtures]);
  
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
  
  if (isChampionsLeagueLoading || isEuropaLeagueLoading || isSerieALoading || isPremierLeagueLoading) {
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
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Trophy className="h-4 w-4 text-neutral-500 mr-2" />
            <span className="text-sm font-medium">{featuredMatch.league.name} - {featuredMatch.league.round}</span>
          </div>
          <Badge variant="secondary" className="bg-neutral-300 text-xs font-medium py-1 px-2 rounded">
            Featured Match
          </Badge>
        </div>
        <div className="text-xl font-semibold text-center mb-6">
          {formatMatchDate(featuredMatch.fixture.date)}
        </div>
        
        {/* Teams with improved match bar in the middle */}
        <div className="flex justify-center items-center space-x-4 mb-6 relative">
          {/* Home Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="h-20 w-20 mb-2 flex items-center justify-center relative group">
              {/* Enhanced shadow effect at 50% size with better visual depth */}
              <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[3px] transform translate-y-0.5"></div>
              <img 
                src={featuredMatch.teams.home.logo} 
                alt={featuredMatch.teams.home.name} 
                className="h-full w-full object-contain relative z-10 drop-shadow-lg transform transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <span className="font-bold text-lg text-center text-white uppercase tracking-wider truncate max-w-[130px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{featuredMatch.teams.home.name}</span>
          </div>
          
          {/* Match Bar - Full gradient from HOME logo through VS to AWAY logo */}
          <div className="absolute left-0 right-0 h-12 -z-10 top-1/2 transform -translate-y-1/2 overflow-hidden rounded-md shadow-lg">
            {/* Single gradient background from home team color to away team color */}
            <div 
              className="w-full h-full" 
              style={{ 
                background: `linear-gradient(90deg, ${getTeamColor(featuredMatch.teams.home.name, true)} 0%, ${getTeamColor(featuredMatch.teams.home.name, true)} 49%, ${getOpposingTeamColor(featuredMatch.teams.home.name, featuredMatch.teams.away.name)} 51%, ${getOpposingTeamColor(featuredMatch.teams.home.name, featuredMatch.teams.away.name)} 100%)`,
                boxShadow: 'inset 0 0 5px rgba(0,0,0,0.3)'
              }}
            ></div>
          </div>
          
          {/* VS or Score section */}
          <div className="flex flex-col items-center w-1/3 z-10">
            {/* Show score if match is in progress or finished */}
            {(featuredMatch.fixture.status.short === 'FT' || 
              featuredMatch.fixture.status.short === 'AET' || 
              featuredMatch.fixture.status.short === 'PEN' || 
              featuredMatch.fixture.status.short === 'IN_PLAY' || 
              featuredMatch.fixture.status.short === 'HT') ? (
              <div className="text-3xl font-bold bg-white py-1 px-4 rounded-full shadow-sm mb-2">
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
              <div className="text-5xl font-bold text-white py-1 px-5 mb-2 z-20 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">VS</div>
            )}
            <div className="text-sm text-white bg-gray-800/70 px-2 py-1 rounded-full">
              {formatDateTime(featuredMatch.fixture.date)}
            </div>
          </div>
          
          {/* Away Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="h-20 w-20 mb-2 flex items-center justify-center relative group">
              {/* Enhanced shadow effect at 50% size with better visual depth */}
              <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[3px] transform translate-y-0.5"></div>
              <img 
                src={featuredMatch.teams.away.logo} 
                alt={featuredMatch.teams.away.name} 
                className="h-full w-full object-contain relative z-10 drop-shadow-lg transform transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <span className="font-bold text-lg text-center text-white uppercase tracking-wider truncate max-w-[130px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{featuredMatch.teams.away.name}</span>
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
