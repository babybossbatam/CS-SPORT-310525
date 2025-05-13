import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { format, parseISO } from 'date-fns';
import { BarChart2, LineChart, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, isLiveMatch } from '@/lib/utils';
import { getTeamColor, getOpposingTeamColor } from '@/lib/colorUtils';
import { useQuery } from '@tanstack/react-query';
import { FixtureResponse } from '../../../../server/types';
import MatchScoreboard from '@/components/matches/MatchScoreboard';

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
  // Removed highlights state
  
  // Get fixture data using React Query with default queryFn
  const { data: championsLeagueFixtures = [], isLoading: isChampionsLeagueLoading } = useQuery({
    queryKey: ['/api/champions-league/fixtures']
  });
  
  const { data: europaLeagueFixtures = [], isLoading: isEuropaLeagueLoading } = useQuery({
    queryKey: ['/api/europa-league/fixtures']
  });
  
  const { data: serieAFixtures = [], isLoading: isSerieALoading } = useQuery({
    queryKey: ['/api/leagues/135/fixtures']
  });
  
  const { data: premierLeagueFixtures = [], isLoading: isPremierLeagueLoading } = useQuery({
    queryKey: ['/api/leagues/39/fixtures']
  });
  
  useEffect(() => {
    // Combine all fixtures - making sure each source is an array
    const allFixtures = [
      ...(Array.isArray(championsLeagueFixtures) ? championsLeagueFixtures : []), 
      ...(Array.isArray(europaLeagueFixtures) ? europaLeagueFixtures : []), 
      ...(Array.isArray(serieAFixtures) ? serieAFixtures : []), 
      ...(Array.isArray(premierLeagueFixtures) ? premierLeagueFixtures : [])
    ];
    
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
  
  // Format date for match display showing Tomorrow, 2 More Days, etc.
  const formatFeaturedMatchDate = (dateString: string): string => {
    const date = parseISO(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset hours to compare just the dates
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      // Calculate days difference
      const diffTime = Math.abs(date.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} More Days`;
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
    <>
      
      <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
        <Badge 
          variant="secondary" 
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20"
        >
          Featured Match
        </Badge>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <img 
            src={featuredMatch.league.logo}
            alt={featuredMatch.league.name}
            className="w-5 h-5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
            }}
          />
          <span className="text-sm font-medium">{featuredMatch.league.name}</span>
        </div>
        
        <div className="text-lg font-semibold text-center mb-4">
          {formatFeaturedMatchDate(featuredMatch.fixture.date)}
        </div>
        
        {/* Using MatchScoreboard component for consistent UI */}
        <MatchScoreboard 
          match={featuredMatch}
          featured={true}
          homeTeamColor="#6f7c93" // Default Atalanta blue-gray color
          awayTeamColor="#8b0000" // Default AS Roma dark red color
          onClick={() => {
            // Use try-catch to prevent potential errors
            try {
              navigate(`/match/${featuredMatch.fixture.id}`);
            } catch (error) {
              console.error("Navigation error:", error);
            }
          }}
        />
        
        <div className="grid grid-cols-4 gap-4 mt-4 text-center">
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
          >
            <BarChart2 className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">H2H</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
          >
            <LineChart className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Stats</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
          >
            <Trophy className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Bracket</span>
          </div>
          {/* Removed highlights button */}
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default FeaturedMatch;
