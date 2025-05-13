import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, LineChart, Trophy } from 'lucide-react';
import MatchScoreboard from '@/components/matches/MatchScoreboard';
import { FixtureResponse } from '@/types/fixtures';
import { format, parseISO } from 'date-fns';

const SimpleFeaturedMatch: React.FC = () => {
  const [, navigate] = useLocation();
  const [featuredMatch, setFeaturedMatch] = useState<FixtureResponse | null>(null);
  const [isError, setIsError] = useState(false);
  
  // Simple fetch for Champions League fixtures with type annotation
  const championsLeagueQuery = useQuery<FixtureResponse[]>({
    queryKey: ['/api/champions-league/fixtures'],
    staleTime: 5 * 60 * 1000
  });
  
  // Simple fetch for Europa League fixtures with type annotation
  const europaLeagueQuery = useQuery<FixtureResponse[]>({
    queryKey: ['/api/europa-league/fixtures'],
    staleTime: 5 * 60 * 1000
  });
  
  // Simple fetch for Serie A fixtures with type annotation
  const serieAQuery = useQuery<FixtureResponse[]>({
    queryKey: ['/api/leagues/135/fixtures'],
    staleTime: 5 * 60 * 1000
  });
  
  // Simple fetch for Premier League fixtures with type annotation
  const premierLeagueQuery = useQuery<FixtureResponse[]>({
    queryKey: ['/api/leagues/39/fixtures'],
    staleTime: 5 * 60 * 1000
  });
  
  const formatMatchDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEE, MMM d, yyyy · h:mm a');
    } catch (e) {
      return 'Date TBD';
    }
  };
  
  const isLoading = 
    championsLeagueQuery.isLoading || 
    europaLeagueQuery.isLoading || 
    serieAQuery.isLoading || 
    premierLeagueQuery.isLoading;
    
  const hasError = 
    championsLeagueQuery.isError || 
    europaLeagueQuery.isError || 
    serieAQuery.isError || 
    premierLeagueQuery.isError;
  
  useEffect(() => {
    try {
      // Safely combine all fixtures
      const championsLeagueFixtures = Array.isArray(championsLeagueQuery.data) ? championsLeagueQuery.data : [];
      const europaLeagueFixtures = Array.isArray(europaLeagueQuery.data) ? europaLeagueQuery.data : [];
      const serieAFixtures = Array.isArray(serieAQuery.data) ? serieAQuery.data : [];
      const premierLeagueFixtures = Array.isArray(premierLeagueQuery.data) ? premierLeagueQuery.data : [];
      
      const allFixtures = [
        ...championsLeagueFixtures,
        ...europaLeagueFixtures,
        ...serieAFixtures,
        ...premierLeagueFixtures
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
        
        setFeaturedMatch(sortedFixtures[0]);
      } else {
        setFeaturedMatch(allFixtures.length > 0 ? allFixtures[0] : null);
      }
      
      setIsError(false);
    } catch (error) {
      console.error('Error setting featured match:', error);
      setIsError(true);
    }
  }, [
    championsLeagueQuery.data,
    europaLeagueQuery.data,
    serieAQuery.data,
    premierLeagueQuery.data
  ]);
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
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
  
  // Error state
  if (hasError || isError) {
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
  
  // Make sure we have league and fixture objects
  const league = featuredMatch.league || { id: 0, name: 'Unknown League', logo: null };
  const fixture = featuredMatch.fixture || { id: 0, date: '', status: { short: 'TBD' } };
  
  // Safely navigate functions
  const handleMatchClick = () => {
    if (fixture.id) {
      navigate(`/match/${fixture.id}`);
    }
  };
  
  const handleH2HClick = () => {
    if (fixture.id) {
      navigate(`/match/${fixture.id}/h2h`);
    }
  };
  
  const handleStatsClick = () => {
    if (fixture.id) {
      navigate(`/match/${fixture.id}/stats`);
    }
  };
  
  const handleBracketClick = () => {
    if (league.id) {
      navigate(`/league/${league.id}/bracket`);
    }
  };
  
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
          {league.logo ? (
            <img 
              src={league.logo}
              alt={league.name}
              className="w-5 h-5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
              }}
            />
          ) : (
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
          )}
          <span className="text-sm font-medium">{league.name}</span>
        </div>
        
        <div className="text-lg font-semibold text-center mb-4">
          {fixture.date ? formatMatchDate(fixture.date) : 'Date TBD'}
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

export default SimpleFeaturedMatch;