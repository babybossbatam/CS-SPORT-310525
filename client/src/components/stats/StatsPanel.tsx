
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, statsActions } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';
import { ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const POPULAR_LEAGUES = [
  { id: 135, name: 'Serie A', logo: 'https://media-4.api-sports.io/football/leagues/135.png' },
  { id: 140, name: 'LaLiga', logo: 'https://media-4.api-sports.io/football/leagues/140.png' },
  { id: 61, name: 'Coppa Italia', logo: 'https://media-4.api-sports.io/football/leagues/61.png' },
  { id: 2, name: 'UCL', logo: 'https://media-4.api-sports.io/football/leagues/2.png' }
];

const StatsPanel = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].id);
  
  const { topScorers, loading, error } = useSelector((state: RootState) => state.stats);
  
  useEffect(() => {
    const fetchTopScorers = async () => {
      if (topScorers[selectedLeague.toString()] && topScorers[selectedLeague.toString()].length > 0) {
        return;
      }
      
      try {
        dispatch(statsActions.setLoadingStats(true));
        const currentYear = new Date().getFullYear();
        
        const response = await apiRequest(
          'GET', 
          `/api/leagues/${selectedLeague}/topscorers?season=${currentYear}`
        );
        const data = await response.json();
        
        dispatch(statsActions.setTopScorers({ 
          leagueId: selectedLeague.toString(),
          players: data 
        }));
      } catch (error) {
        console.error(`Error fetching top scorers for league ${selectedLeague}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to load top scorers',
          variant: 'destructive',
        });
        dispatch(statsActions.setStatsError('Failed to load top scorers'));
      } finally {
        dispatch(statsActions.setLoadingStats(false));
      }
    };
    
    fetchTopScorers();
  }, [selectedLeague, dispatch, toast, topScorers]);
  
  const selectedLeagueTopScorers = topScorers[selectedLeague.toString()] || [];
  
  return (
    <div>
      <h3 className="text-center font-medium mb-4">Goals</h3>
      <div className="pb-2">
        <Tabs 
          value={selectedLeague.toString()} 
          onValueChange={(value) => setSelectedLeague(parseInt(value))}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 gap-2">
            {POPULAR_LEAGUES.map((league) => (
              <TabsTrigger
                key={league.id}
                value={league.id.toString()}
                className="flex items-center gap-2 px-2 py-1"
              >
                <img 
                  src={league.logo} 
                  alt={league.name} 
                  className="h-4 w-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16?text=L';
                  }}
                />
                <span className="text-xs truncate">{league.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 space-y-4">
        {loading && !selectedLeagueTopScorers.length ? (
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))
        ) : (
          selectedLeagueTopScorers.slice(0, 3).map((playerStat, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/player/${playerStat.player.id}`)}
            >
              <div className="flex items-center space-x-3">
                <img 
                  src={playerStat.player.photo} 
                  alt={playerStat.player.name} 
                  className="h-10 w-10 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Player';
                  }}
                />
                <div>
                  <div className="font-medium text-sm">{playerStat.player.name}</div>
                  <div className="text-xs text-neutral-500">
                    <span>{playerStat.statistics[0].games.position}</span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    <span>{playerStat.statistics[0].team.name}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{playerStat.statistics[0].goals.total}</div>
                <div className="text-xs text-neutral-500">Goals</div>
              </div>
            </div>
          ))
        )}

        <div className="text-center">
          <button 
            className="text-sm text-[#3182CE] flex items-center justify-center mx-auto hover:underline"
            onClick={() => navigate(`/league/${selectedLeague}/stats`)}
          >
            <span>{POPULAR_LEAGUES.find(l => l.id === selectedLeague)?.name || 'League'} Stats</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
