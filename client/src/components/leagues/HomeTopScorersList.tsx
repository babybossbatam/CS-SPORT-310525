import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCachedQuery } from '@/lib/cachingHelper';
import { useLocation } from 'wouter';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Add CSS to hide scrollbars
const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Comprehensive leagues for top scorers - matches LeagueStandingsFilter dropdown
const POPULAR_LEAGUES = [
  { id: 2, name: 'Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 3, name: 'Europa League', logo: 'https://media.api-sports.io/football/leagues/3.png' },
  { id: 848, name: 'Conference League', logo: 'https://media.api-sports.io/football/leagues/848.png' },
  { id: 5, name: 'Nations League', logo: 'https://media.api-sports.io/football/leagues/5.png' },
  { id: 15, name: 'Club World Cup', logo: 'https://media.api-sports.io/football/leagues/15.png' },
  { id: 32, name: 'WC Qual Europe', logo: 'https://media.api-sports.io/football/leagues/32.png' },
  { id: 33, name: 'WC Qual Oceania', logo: 'https://media.api-sports.io/football/leagues/33.png' },
  { id: 34, name: 'WC Qual S.America', logo: 'https://media.api-sports.io/football/leagues/34.png' },
  { id: 35, name: 'Asian Cup Qual', logo: 'https://media.api-sports.io/football/leagues/35.png' },
  { id: 36, name: 'AFCON Qual', logo: 'https://media.api-sports.io/football/leagues/36.png' },
  { id: 37, name: 'WC Intercontinental', logo: 'https://media.api-sports.io/football/leagues/37.png' },
  { id: 39, name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 140, name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 135, name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 78, name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 61, name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png' },
  { id: 45, name: 'FA Cup', logo: 'https://media.api-sports.io/football/leagues/45.png' },
  { id: 48, name: 'League Cup', logo: 'https://media.api-sports.io/football/leagues/48.png' },
];

interface Player {
  id: number;
  name: string;
  photo: string;
}

interface PlayerStatistics {
  player: Player;
  statistics: {
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number;
      position: string;
    };
    goals: {
      total: number;
    };
  }[];
}

const HomeTopScorersList = () => {
  const [, navigate] = useLocation();
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].id);

  const { data: topScorers, isLoading } = useQuery({
    queryKey: [`/api/leagues/${selectedLeague}/topscorers`],
    staleTime: 30 * 60 * 1000,
    select: (data: PlayerStatistics[]) => {
      return data.sort((a, b) => {
        const goalsA = a.statistics[0]?.goals?.total || 0;
        const goalsB = b.statistics[0]?.goals?.total || 0;
        return goalsB - goalsA;
      });
    }
  });

  const getCurrentLeagueIndex = () => {
    return POPULAR_LEAGUES.findIndex(league => league.id === selectedLeague);
  };

  const getCurrentLeague = () => {
    return POPULAR_LEAGUES.find(league => league.id === selectedLeague);
  };

  const goToPreviousLeague = () => {
    const currentIndex = getCurrentLeagueIndex();
    if (currentIndex > 0) {
      setSelectedLeague(POPULAR_LEAGUES[currentIndex - 1].id);
    }
  };

  const goToNextLeague = () => {
    const currentIndex = getCurrentLeagueIndex();
    if (currentIndex < POPULAR_LEAGUES.length - 1) {
      setSelectedLeague(POPULAR_LEAGUES[currentIndex + 1].id);
    }
  };

  const getLeagueDisplayName = (leagueId: number) => {
    const league = POPULAR_LEAGUES.find(l => l.id === leagueId);
    return league?.name || 'League';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
        </div>

        {/* Title skeleton */}
        <div className="p-4 border-b border-gray-100">
          <div className="h-5 w-16 bg-gray-200 animate-pulse rounded" />
        </div>

        {/* Players skeleton */}
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="text-right">
                <div className="h-6 w-6 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-8 bg-gray-200 animate-pulse rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentLeague = getCurrentLeague();
  const currentIndex = getCurrentLeagueIndex();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyle }} />
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header with navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <button 
            onClick={goToPreviousLeague}
            disabled={currentIndex === 0}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            {currentLeague && (
              <>
                <img 
                  src={currentLeague.logo} 
                  alt={currentLeague.name} 
                  className="w-4 h-4 object-contain" 
                />
                <span className="text-sm font-medium text-gray-700">
                  {currentLeague.name}
                </span>
              </>
            )}
          </div>

          <button 
            onClick={goToNextLeague}
            disabled={currentIndex === POPULAR_LEAGUES.length - 1}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              currentIndex === POPULAR_LEAGUES.length - 1 ? 'opacity-40 cursor-not-allowed' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Goals title */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Goals</h3>
        </div>

        {/* Players list */}
        <div className="p-4">
          <div className="space-y-3">
            {topScorers?.slice(0, 3).map((scorer, index) => {
              const playerStats = scorer.statistics[0];
              const goals = playerStats?.goals?.total || 0;
              
              // Try to get more specific position information
              const rawPosition = scorer.player.position || playerStats?.games?.position || '';
              
              // Map generic positions to more specific ones based on player data
              const getSpecificPosition = (pos: string) => {
                if (!pos) return '';
                
                // Convert common generic positions to more specific ones
                const positionMap: { [key: string]: string } = {
                  'Attacker': 'Forward',
                  'Midfielder': 'Midfielder',
                  'Defender': 'Defender',
                  'Goalkeeper': 'Goalkeeper'
                };
                
                // If it's already specific, return as is
                if (pos.includes('Left') || pos.includes('Right') || pos.includes('Central') || pos.includes('Centre')) {
                  return pos;
                }
                
                // Otherwise use the mapped version or original
                return positionMap[pos] || pos;
              };
              
              const position = getSpecificPosition(rawPosition);
              const country = playerStats?.team?.name || playerStats?.league?.country || '';

              // Debug logging to see what position data is available
              if (index === 0) {
                console.log('🔍 Player position data:', {
                  playerName: scorer.player.name,
                  playerPosition: scorer.player.position,
                  gamesPosition: playerStats?.games?.position,
                  finalPosition: position,
                  fullPlayerData: scorer.player,
                  fullStatsData: playerStats
                });
              }

              return (
                <div key={scorer.player.id} className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-full overflow-hidden border border-gray-200">
                    <AvatarImage 
                      src={scorer.player.photo} 
                      alt={scorer.player.name}
                      className="object-cover object-center scale-110" 
                    />
                    <AvatarFallback className="text-xs">
                      {scorer.player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                        {scorer.player.name}
                      </h4>
                      {position && (
                        <span className="text-xs text-gray-500 font-medium">
                          {position.charAt(0).toUpperCase() + position.slice(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {country}
                    </p>
                  </div>

                  <div className="text-center flex-shrink-0">
                    <div className="text-lg font-bold text-gray-900">
                      {goals}
                    </div>
                    <div className="text-xs text-gray-500">
                      Goals
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats link */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button 
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium group"
              onClick={() => navigate(`/league/${selectedLeague}/stats`)}
            >
              <span className="hover:underline transition-all duration-200">{getLeagueDisplayName(selectedLeague)} Stats</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeTopScorersList;