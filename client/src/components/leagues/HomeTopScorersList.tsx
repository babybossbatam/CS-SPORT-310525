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

// Popular leagues list - matches PopularLeaguesList component
const POPULAR_LEAGUES = [
  { id: 39, name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png', country: 'England' },
  { id: 140, name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png', country: 'Spain' },
  { id: 135, name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy' },
  { id: 78, name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png', country: 'Germany' },
  { id: 61, name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png', country: 'France' },
  { id: 2, name: 'UEFA Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe' },
  { id: 3, name: 'UEFA Europa League', logo: 'https://media.api-sports.io/football/leagues/3.png', country: 'Europe' },
  { id: 848, name: 'UEFA Europa Conference League', logo: 'https://media.api-sports.io/football/leagues/848.png', country: 'Europe' },
  { id: 5, name: 'UEFA Nations League', logo: 'https://media.api-sports.io/football/leagues/5.png', country: 'Europe' },
  // World/International Competitions
  { id: 1, name: 'World Cup', logo: 'https://media.api-sports.io/football/leagues/1.png', country: 'World' },
  { id: 4, name: 'Euro Championship', logo: 'https://media.api-sports.io/football/leagues/4.png', country: 'World' },
  { id: 15, name: 'FIFA Club World Cup', logo: 'https://media.api-sports.io/football/leagues/15.png', country: 'World' },
  { id: 16, name: 'CONCACAF Gold Cup', logo: 'https://media.api-sports.io/football/leagues/16.png', country: 'World' },
  { id: 9, name: 'Copa America', logo: 'https://media.api-sports.io/football/leagues/9.png', country: 'World' },
  { id: 13, name: 'Africa Cup of Nations', logo: 'https://media.api-sports.io/football/leagues/13.png', country: 'World' },
  { id: 21, name: 'Asian Cup', logo: 'https://media.api-sports.io/football/leagues/21.png', country: 'World' },
  // World Cup Qualifications
  { id: 32, name: 'World Cup - Qualification Europe', logo: 'https://media.api-sports.io/football/leagues/32.png', country: 'World' },
  { id: 33, name: 'World Cup - Qualification Oceania', logo: 'https://media.api-sports.io/football/leagues/33.png', country: 'World' },
  { id: 34, name: 'World Cup - Qualification South America', logo: 'https://media.api-sports.io/football/leagues/34.png', country: 'World' },
  { id: 35, name: 'Asian Cup - Qualification', logo: 'https://media.api-sports.io/football/leagues/35.png', country: 'World' },
  { id: 36, name: 'Africa Cup of Nations - Qualification', logo: 'https://media.api-sports.io/football/leagues/36.png', country: 'World' },
  { id: 37, name: 'World Cup - Intercontinental Play-offs', logo: 'https://media.api-sports.io/football/leagues/37.png', country: 'World' },
  { id: 38, name: 'World Cup - Qualification CONCACAF', logo: 'https://media.api-sports.io/football/leagues/38.png', country: 'World' },
  // Additional Popular Leagues
  { id: 45, name: 'FA Cup', logo: 'https://media.api-sports.io/football/leagues/45.png', country: 'England' },
  { id: 48, name: 'EFL Cup', logo: 'https://media.api-sports.io/football/leagues/48.png', country: 'England' },
  { id: 143, name: 'Copa del Rey', logo: 'https://media.api-sports.io/football/leagues/143.png', country: 'Spain' },
  { id: 137, name: 'Coppa Italia', logo: 'https://media.api-sports.io/football/leagues/137.png', country: 'Italy' },
  { id: 81, name: 'DFB Pokal', logo: 'https://media.api-sports.io/football/leagues/81.png', country: 'Germany' },
  { id: 66, name: 'Coupe de France', logo: 'https://media.api-sports.io/football/leagues/66.png', country: 'France' },
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
  const [availableLeagues, setAvailableLeagues] = useState<typeof POPULAR_LEAGUES>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);

  // Query to check which leagues have data
  const { data: leagueDataMap, isLoading: isLoadingLeagues } = useCachedQuery(
    ['leagues-with-top-scorers-data'],
    async () => {
      const dataMap = new Map<number, PlayerStatistics[]>();

      console.log('🔍 [HomeTopScorers] Starting league data availability check with more inclusive filtering');

      // Check each league for data with retry logic
      for (const league of POPULAR_LEAGUES) {
        let retries = 2; // Reduced retries
        while (retries > 0) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort('Request timeout'), 8000); // Reduced timeout
            
            const response = await fetch(`/api/leagues/${league.id}/topscorers`, {
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=1800' // 30 minutes browser cache for fresher data
              }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data: PlayerStatistics[] = await response.json();
              if (data && data.length > 0) {
                // More inclusive filtering - accept data from current and previous season
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth() + 1; // 1-12
                
                // Determine current season based on typical football calendar
                let currentSeason;
                if (currentMonth >= 8) {
                  currentSeason = currentYear; // Aug-Dec: use current year
                } else {
                  currentSeason = currentYear - 1; // Jan-July: use previous year
                }
                
                const acceptableData = data.filter(scorer => {
                  const seasonYear = scorer.statistics[0]?.league?.season;
                  if (!seasonYear) return true; // Include data without season info
                  
                  // Accept current season and previous season data
                  const isRecentSeason = seasonYear >= (currentSeason - 1);
                  
                  // Exclude very old data (more than 2 years old)
                  const isVeryOldSeason = seasonYear < (currentYear - 2);
                  
                  return isRecentSeason && !isVeryOldSeason;
                });
                
                if (acceptableData.length > 0) {
                  dataMap.set(league.id, acceptableData);
                  console.log(`✅ [HomeTopScorers] League ${league.id} (${league.name}) has ${acceptableData.length} top scorers (filtered from ${data.length})`);
                } else {
                  // Still include the league even if no recent data, but with empty array
                  dataMap.set(league.id, []);
                  console.log(`📭 [HomeTopScorers] League ${league.id} (${league.name}) included with no recent data`);
                }
              } else {
                // Include league even if no data available
                dataMap.set(league.id, []);
                console.log(`📭 [HomeTopScorers] League ${league.id} (${league.name}) included with no top scorers`);
              }
              break; // Success, exit retry loop
            } else if (response.status >= 500) {
              // Server error, retry
              retries--;
              if (retries > 0) {
                console.warn(`🔄 [HomeTopScorers] Retrying league ${league.id} due to server error`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                // Include league even after failed retries
                dataMap.set(league.id, []);
              }
            } else {
              // Client error (4xx), still include the league
              console.warn(`❌ [HomeTopScorers] League ${league.id} returned ${response.status}, but including anyway`);
              dataMap.set(league.id, []);
              break;
            }
          } catch (error) {
            retries--;
            console.warn(`⚠️ [HomeTopScorers] Failed to check league ${league.id} (${2-retries}/2):`, error);
            if (retries === 0) {
              // Include league even after all retries failed
              dataMap.set(league.id, []);
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }

      console.log(`📊 [HomeTopScorers] Completed check for ${POPULAR_LEAGUES.length} leagues, included ${dataMap.size} leagues`);
      return dataMap;
    },
    {
      maxAge: 30 * 60 * 1000, // 30 minutes cache for fresher data
      backgroundRefresh: true, // Enable background refresh for latest data
      retry: 1, // Reduced React Query retries
      retryDelay: 2000
    }
  );

  // Update available leagues when data is loaded
  useEffect(() => {
    if (leagueDataMap) {
      // Now include all leagues since we're storing them all in the map
      const leagues = POPULAR_LEAGUES.filter(league => leagueDataMap.has(league.id));
      setAvailableLeagues(leagues);

      // Set initial selected league if not set
      if (!selectedLeague && leagues.length > 0) {
        // Prefer FIFA Club World Cup (ID 15) if available
        const preferredLeague = leagues.find(league => league.id === 15);
        setSelectedLeague(preferredLeague ? preferredLeague.id : leagues[0].id);
      }
    }
  }, [leagueDataMap, selectedLeague]);

  const { data: topScorers, isLoading } = useCachedQuery(
    [`top-scorers-league-${selectedLeague}`],
    async () => {
      if (!selectedLeague) return [];

      console.log(`🎯 [HomeTopScorers] Fetching top scorers for selected league ${selectedLeague}`);
      
      const response = await fetch(`/api/leagues/${selectedLeague}/topscorers`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=1800' // 30 minutes for fresher data
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch top scorers for league ${selectedLeague}`);
      }
      
      const data: PlayerStatistics[] = await response.json();
      
      // Filter out data older than 1 month and sort by goals
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const freshData = data.filter(scorer => {
        const seasonYear = scorer.statistics[0]?.league?.season;
        if (!seasonYear) return false;
        
        // For ongoing seasons, check if the season is current or recent
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12
        
        // Determine current season based on typical football calendar
        // Most leagues run from August (8) to May (5) of next year
        let currentSeason;
        if (currentMonth >= 8) {
          currentSeason = currentYear; // Aug-Dec: use current year
        } else {
          currentSeason = currentYear - 1; // Jan-July: use previous year
        }
        
        // Only show data from current season
        const isCurrentSeason = seasonYear === currentSeason;
        
        // Additionally, for extra safety, check if it's a very old season
        const isVeryOldSeason = seasonYear < currentYear - 1;
        
        return isCurrentSeason && !isVeryOldSeason;
      });
      
      return freshData.sort((a, b) => {
        const goalsA = a.statistics[0]?.goals?.total || 0;
        const goalsB = b.statistics[0]?.goals?.total || 0;
        return goalsB - goalsA;
      });
    },
    {
      enabled: !!selectedLeague,
      maxAge: 30 * 60 * 1000, // 30 minutes cache for fresher data
      backgroundRefresh: true, // Enable background refresh
      retry: 1
    }
  );

  const getCurrentLeagueIndex = () => {
    return availableLeagues.findIndex(league => league.id === selectedLeague);
  };

  const getCurrentLeague = () => {
    return availableLeagues.find(league => league.id === selectedLeague);
  };

  const goToPreviousLeague = () => {
    const currentIndex = getCurrentLeagueIndex();
    if (currentIndex > 0) {
      setSelectedLeague(availableLeagues[currentIndex - 1].id);
    } else {
      // If at first league, go to last league
      setSelectedLeague(availableLeagues[availableLeagues.length - 1].id);
    }
  };

  const goToNextLeague = () => {
    const currentIndex = getCurrentLeagueIndex();
    if (currentIndex < availableLeagues.length - 1) {
      setSelectedLeague(availableLeagues[currentIndex + 1].id);
    } else {
      // If at last league, go to first league
      setSelectedLeague(availableLeagues[0].id);
    }
  };

  const getLeagueDisplayName = (leagueId: number) => {
    const league = availableLeagues.find(l => l.id === leagueId);
    return league?.name || 'League';
  };

  if (isLoadingLeagues || isLoading || !selectedLeague) {
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
            className="p-1 rounded hover:bg-gray-200 transition-colors opacity-70 hover:opacity-100"
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
            className="p-1 rounded hover:bg-gray-200 transition-colors opacity-70 hover:opacity-100"
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
          {topScorers && topScorers.length > 0 ? (
            <div className="space-y-3">
              {topScorers.slice(0, 3).map((scorer, index) => {
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
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No top scorer data available</p>
              <p className="text-xs text-gray-400 mt-1">for {getCurrentLeague()?.name}</p>
            </div>
          )}

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