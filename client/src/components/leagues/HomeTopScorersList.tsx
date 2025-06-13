import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCachedQuery } from '@/lib/cachingHelper';
import { useLocation } from 'wouter';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp } from 'lucide-react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const scrollToLeague = (leagueId: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Find the button for the selected league
    const leagueIndex = POPULAR_LEAGUES.findIndex(league => league.id === leagueId);
    if (leagueIndex === -1) return;

    const buttons = container.querySelectorAll('button');
    const targetButton = buttons[leagueIndex] as HTMLElement;

    if (!targetButton) return;

    // Get container and button dimensions
    const containerWidth = container.clientWidth;
    const buttonLeft = targetButton.offsetLeft;
    const buttonWidth = targetButton.offsetWidth;
    const buttonCenter = buttonLeft + (buttonWidth / 2);

    // Calculate the center position of the visible area
    const visibleCenter = containerWidth / 2;
    
    // Calculate the ideal scroll position to center the button
    const idealScrollLeft = buttonCenter - visibleCenter;

    // Clamp the scroll position to valid bounds
    const maxScrollLeft = container.scrollWidth - containerWidth;
    const finalScrollLeft = Math.max(0, Math.min(idealScrollLeft, maxScrollLeft));

    // Scroll smoothly to center the selected league
    container.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth'
    });
  };

  const scrollLeft = () => {
    const currentIndex = POPULAR_LEAGUES.findIndex(league => league.id === selectedLeague);
    if (currentIndex > 0) {
      const newLeagueId = POPULAR_LEAGUES[currentIndex - 1].id;
      setSelectedLeague(newLeagueId);
      setTimeout(() => scrollToLeague(newLeagueId), 50);
    }
  };

  const scrollRight = () => {
    const currentIndex = POPULAR_LEAGUES.findIndex(league => league.id === selectedLeague);
    if (currentIndex < POPULAR_LEAGUES.length - 1) {
      const newLeagueId = POPULAR_LEAGUES[currentIndex + 1].id;
      setSelectedLeague(newLeagueId);
      setTimeout(() => scrollToLeague(newLeagueId), 50);
    }
  };

  // Auto-center the selected league when component mounts or league changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToLeague(selectedLeague);
    }, 150); // Slightly longer delay to ensure DOM is fully ready

    return () => clearTimeout(timer);
  }, [selectedLeague]);

  // Also center on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToLeague(selectedLeague);
    }, 300); // Initial load delay

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-32 bg-gray-200 animate-pulse" />
              <div className="h-3 w-full bg-gray-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyle }} />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={scrollLeft}
            disabled={POPULAR_LEAGUES.findIndex(league => league.id === selectedLeague) === 0}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 z-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            ←
          </button>
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-hidden scrollbar-hide flex-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex items-center gap-2 w-max">
              {POPULAR_LEAGUES.map((league) => (
                <button
                  key={league.id}
                  onClick={() => {
                    const newLeagueId = league.id;
                    setSelectedLeague(newLeagueId);
                    setTimeout(() => scrollToLeague(newLeagueId), 50);
                  }}
                  className={`text-xs py-1 px-2 flex items-center gap-2 hover:bg-gray-100 rounded-lg whitespace-nowrap flex-shrink-0 transition-colors ${
                    selectedLeague === league.id ? 'bg-blue-100 text-blue-600' : 'bg-transparent'
                  }`}
                >
                  <img src={league.logo} alt={league.name} className="w-4 h-4 object-contain" />
                  {league.name}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={scrollRight}
            disabled={POPULAR_LEAGUES.findIndex(league => league.id === selectedLeague) === POPULAR_LEAGUES.length - 1}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 z-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            →
          </button>
        </div>

        <div>
          <CardContent className="p-0">
              <div className="relative overflow-x-auto">
                <div className="space-y-1">
                {topScorers?.slice(0, 3).map((scorer, index) => {
                  const playerStats = scorer.statistics[0];
                  const goals = playerStats?.goals?.total || 0;

                  return (
                    <div key={scorer.player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-1">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11 rounded-full overflow-hidden">
                          <AvatarImage 
                            src={scorer.player.photo} 
                            alt={scorer.player.name}
                            className="object-cover object-center scale-110" 
                          />
                          <AvatarFallback>{scorer.player.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-sm">
                            {scorer.player.name} 
                            <span className="font-normal text-gray-500 ml-1">{playerStats.games.position}</span>
                          </div>
                          <div className="text-sm text-gray-500">{playerStats.team.name}</div>
                        </div>
                      </div>
                      <div className="text-right px-2">
                        <div className="font-bold text-lg">{goals}</div>
                        <div className="text-xs text-gray-500">Goals</div>
                      </div>
                    </div>
                      );
                })}
              </div>
              </div>

              <div className="text-center pt-2">
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center mx-auto"
                  onClick={() => navigate(`/league/${selectedLeague}/stats`)}
                >
                  <div className="flex items-center justify-center">
                    {selectedLeague.toString() === '2' && 'Champions League Stats'}
                    {selectedLeague.toString() === '3' && 'Europa League Stats'}
                    {selectedLeague.toString() === '848' && 'Conference League Stats'}
                    {selectedLeague.toString() === '5' && 'Nations League Stats'}
                    {selectedLeague.toString() === '15' && 'Club World Cup Stats'}
                    {selectedLeague.toString() === '32' && 'WC Qualification Europe Stats'}
                    {selectedLeague.toString() === '33' && 'WC Qualification Oceania Stats'}
                    {selectedLeague.toString() === '34' && 'WC Qualification South America Stats'}
                    {selectedLeague.toString() === '35' && 'Asian Cup Qualification Stats'}
                    {selectedLeague.toString() === '36' && 'AFCON Qualification Stats'}
                    {selectedLeague.toString() === '37' && 'WC Intercontinental Play-offs Stats'}
                    {selectedLeague.toString() === '39' && 'Premier League Stats'}
                    {selectedLeague.toString() === '140' && 'La Liga Stats'}
                    {selectedLeague.toString() === '135' && 'Serie A Stats'}
                    {selectedLeague.toString() === '78' && 'Bundesliga Stats'}
                    {selectedLeague.toString() === '61' && 'Ligue 1 Stats'}
                    {selectedLeague.toString() === '45' && 'FA Cup Stats'}
                    {selectedLeague.toString() === '48' && 'League Cup Stats'}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </button>
              </div>
            </CardContent>
        </div>
      </div>
    </>
  );
};

export default HomeTopScorersList;