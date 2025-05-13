import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, LineChart, Trophy } from 'lucide-react';
import MatchScoreboard from '@/components/matches/MatchScoreboard';
import { FixtureResponse } from '@/types/fixtures';
import { format, parseISO } from 'date-fns';

const FixedFeaturedMatch: React.FC = () => {
  const [, navigate] = useLocation();
  const [featuredMatch, setFeaturedMatch] = useState<FixtureResponse | null>(null);
  const [isError, setIsError] = useState(false);
  
  // Use multiple queries with safer handling
  const { data: championsLeagueFixtures = [], isLoading: isChampionsLeagueLoading, isError: isChampionsLeagueError } = useQuery({
    queryKey: ['/api/champions-league/fixtures'],
    retry: 1,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
    staleTime: 5 * 60 * 1000
  });
  
  const { data: europaLeagueFixtures = [], isLoading: isEuropaLeagueLoading, isError: isEuropaLeagueError } = useQuery({
    queryKey: ['/api/europa-league/fixtures'],
    retry: 1,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
    staleTime: 5 * 60 * 1000
  });
  
  const { data: serieAFixtures = [], isLoading: isSerieALoading, isError: isSerieAError } = useQuery({
    queryKey: ['/api/leagues/135/fixtures'],
    retry: 1,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
    staleTime: 5 * 60 * 1000
  });
  
  const { data: premierLeagueFixtures = [], isLoading: isPremierLeagueLoading, isError: isPremierLeagueError } = useQuery({
    queryKey: ['/api/leagues/39/fixtures'],
    retry: 1,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
    staleTime: 5 * 60 * 1000
  });
  
  const formatMatchDate = (dateString: string) => {
    try {
      // Handle date format with proper error handling
      const date = parseISO(dateString);
      return format(date, 'EEE, MMM d, yyyy · h:mm a');
    } catch (e) {
      return 'Date TBD';
    }
  };
  
  const isLoading = isChampionsLeagueLoading || isEuropaLeagueLoading || isSerieALoading || isPremierLeagueLoading;
  
  useEffect(() => {
    try {
      // Safely combine all fixtures
      const allFixtures = [
        ...(Array.isArray(championsLeagueFixtures) ? championsLeagueFixtures : []),
        ...(Array.isArray(europaLeagueFixtures) ? europaLeagueFixtures : []),
        ...(Array.isArray(serieAFixtures) ? serieAFixtures : []),
        ...(Array.isArray(premierLeagueFixtures) ? premierLeagueFixtures : [])
      ];
      
      // Get upcoming fixtures
      const upcomingFixtures = allFixtures.filter(fixture => {
        if (!fixture || !fixture.fixture || !fixture.fixture.status) {
          return false;
        }
        return ['NS', 'TBD', 'SCHEDULED'].includes(fixture.fixture.status.short);
      });
      
      // If we have upcoming fixtures, pick the first big match
      if (upcomingFixtures.length > 0) {
        // Sort by team significance (could be based on team rankings or league importance)
        const sortedFixtures = [...upcomingFixtures].sort((a, b) => {
          const aLeague = a.league?.id || 0;
          const bLeague = b.league?.id || 0;
          
          // Champions League (2) and Europa League (3) get priority
          if (aLeague === 2 && bLeague !== 2) return -1;
          if (bLeague === 2 && aLeague !== 2) return 1;
          if (aLeague === 3 && bLeague !== 3) return -1;
          if (bLeague === 3 && aLeague !== 3) return 1;
          
          // Then Serie A (135) and Premier League (39)
          if (aLeague === 39 && bLeague !== 39) return -1;
          if (bLeague === 39 && aLeague !== 39) return 1;
          if (aLeague === 135 && bLeague !== 135) return -1;
          if (bLeague === 135 && aLeague !== 135) return 1;
          
          return 0;
        });
        
        // Get the first match from the sorted list
        setFeaturedMatch(sortedFixtures[0]);
      } else {
        // Fallback to any fixture
        setFeaturedMatch(allFixtures.length > 0 ? allFixtures[0] : null);
      }
      
      setIsError(false);
    } catch (error) {
      console.error('Error setting featured match:', error);
      setIsError(true);
    }
  }, [championsLeagueFixtures, europaLeagueFixtures, serieAFixtures, premierLeagueFixtures]);
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <CardHeader className="bg-gray-200 px-4 py-2 flex justify-between items-center animate-pulse">
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
  
  // Error state
  if (isError) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-gray-500">Unable to load featured match data at this time.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-blue-500 text-sm hover:underline"
          >
            Refresh page
          </button>
        </div>
      </Card>
    );
  }
  
  // No match state
  if (!featuredMatch) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-gray-500">No featured matches available at this time.</p>
        </div>
      </Card>
    );
  }
  
  const handleMatchClick = () => {
    try {
      if (featuredMatch?.fixture?.id) {
        navigate(`/match/${featuredMatch.fixture.id}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  
  const handleH2HClick = () => {
    try {
      if (featuredMatch?.fixture?.id) {
        navigate(`/match/${featuredMatch.fixture.id}/h2h`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  
  const handleStatsClick = () => {
    try {
      if (featuredMatch?.fixture?.id) {
        navigate(`/match/${featuredMatch.fixture.id}/stats`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  
  const handleBracketClick = () => {
    try {
      if (featuredMatch?.league?.id) {
        navigate(`/league/${featuredMatch.league.id}/bracket`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  
  const leagueName = featuredMatch?.league?.name || 'Unknown League';
  const leagueLogo = featuredMatch?.league?.logo || null;
  const matchDate = featuredMatch?.fixture?.date ? formatMatchDate(featuredMatch.fixture.date) : 'Date TBD';
  
  // Render featured match
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20"
      >
        Featured Match
      </Badge>
    
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          {leagueLogo ? (
            <img 
              src={leagueLogo}
              alt={leagueName}
              className="w-5 h-5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
              }}
            />
          ) : (
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
          )}
          <span className="text-sm font-medium">{leagueName}</span>
        </div>
        
        <div className="text-lg font-semibold text-center mb-4">
          {matchDate}
        </div>
        
        {/* Using MatchScoreboard component for consistent UI */}
        <MatchScoreboard 
          match={featuredMatch}
          featured={true}
          homeTeamColor="#6f7c93" // Default Atalanta blue-gray color
          awayTeamColor="#8b0000" // Default AS Roma dark red color
          onClick={handleMatchClick}
        />
        
        <div className="grid grid-cols-4 gap-4 mt-4 text-center">
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={handleH2HClick}
          >
            <BarChart2 className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">H2H</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={handleStatsClick}
          >
            <LineChart className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Stats</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={handleBracketClick}
          >
            <Trophy className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Bracket</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FixedFeaturedMatch;