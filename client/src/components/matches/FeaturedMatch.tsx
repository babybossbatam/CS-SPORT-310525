import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FeatureMatchCard from './FeatureMatchCard';
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
  140, // La Liga (Spain)
  78,  // Bundesliga (Germany)
  61,  // Ligue 1 (France)
];

const FeaturedMatch = () => {
  const [, navigate] = useLocation();
  const [featuredMatch, setFeaturedMatch] = useState<FixtureResponse | null>(null);
  // Removed highlights state
  
  // Get fixture data using React Query with our enhanced query client
  const { data: championsLeagueFixtures = [], isLoading: isChampionsLeagueLoading, error: championsLeagueError } = useQuery({
    queryKey: ['/api/champions-league/fixtures'],
    retry: 1,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Disable refetching on window focus to avoid unnecessary API calls
    refetchOnReconnect: false // Disable refetching on reconnect to avoid unnecessary API calls
  });
  
  const { data: europaLeagueFixtures = [], isLoading: isEuropaLeagueLoading, error: europaLeagueError } = useQuery({
    queryKey: ['/api/europa-league/fixtures'],
    retry: 1,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Disable refetching on window focus to avoid unnecessary API calls
    refetchOnReconnect: false // Disable refetching on reconnect to avoid unnecessary API calls
  });
  
  const { data: serieAFixtures = [], isLoading: isSerieALoading, error: serieAError } = useQuery({
    queryKey: ['/api/leagues/135/fixtures'],
    retry: 1,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Disable refetching on window focus to avoid unnecessary API calls
    refetchOnReconnect: false // Disable refetching on reconnect to avoid unnecessary API calls
  });
  
  const { data: premierLeagueFixtures = [], isLoading: isPremierLeagueLoading, error: premierLeagueError } = useQuery({
    queryKey: ['/api/leagues/39/fixtures'],
    retry: 1,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Disable refetching on window focus to avoid unnecessary API calls
    refetchOnReconnect: false // Disable refetching on reconnect to avoid unnecessary API calls
  });
  
  // Log any API errors
  useEffect(() => {
    if (championsLeagueError) console.error('Champions League API error:', championsLeagueError);
    if (europaLeagueError) console.error('Europa League API error:', europaLeagueError);
    if (serieAError) console.error('Serie A API error:', serieAError);
    if (premierLeagueError) console.error('Premier League API error:', premierLeagueError);
  }, [championsLeagueError, europaLeagueError, serieAError, premierLeagueError]);
  
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
    const processSource = (fixtures: unknown, sourceName: string) => {
      if (!fixtures || !Array.isArray(fixtures)) return;
      (fixtures as FixtureResponse[]).forEach(fixture => {
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
  const formatMatchDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Date TBD';
    
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) return 'Date TBD';
      
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
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date TBD';
    }
  };
  
  if (isChampionsLeagueLoading || isEuropaLeagueLoading || isSerieALoading || isPremierLeagueLoading) {
    return (
      <Card className="mt-2 mb-6">
        <CardHeader className="bg-gray-200 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-28" />
        </CardHeader>
        <div className="p-4">
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
        </div>
      </Card>
    );
  }
  
  if (!featuredMatch) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
        <div className="p-6 text-center">
          <p className="text-gray-500">No featured matches available at this time.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <FeatureMatchCard
      match={featuredMatch}
      leagueName={featuredMatch?.league?.name || 'Unknown League'}
      leagueLogo={featuredMatch?.league?.logo || null}
      matchDate={formatMatchDate(featuredMatch?.fixture?.date)}
    />
  );
};

export default FeaturedMatch;
