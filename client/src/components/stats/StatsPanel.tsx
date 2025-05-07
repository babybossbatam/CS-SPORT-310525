import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, statsActions } from '@/lib/store';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';
import { ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const POPULAR_LEAGUES = [
  { id: 2, name: 'UCL', logo: 'https://media-4.api-sports.io/football/leagues/2.png' },
  { id: 39, name: 'EPL', logo: 'https://media-4.api-sports.io/football/leagues/39.png' },
  { id: 140, name: 'LaLiga', logo: 'https://media-4.api-sports.io/football/leagues/140.png' },
  { id: 135, name: 'Serie A', logo: 'https://media-4.api-sports.io/football/leagues/135.png' }
];

const StatsPanel = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].id);
  
  const { topScorers, loading, error } = useSelector((state: RootState) => state.stats);
  
  // Fetch top scorers for the selected league
  useEffect(() => {
    const fetchTopScorers = async () => {
      // If already in state, don't fetch again
      if (topScorers[selectedLeague.toString()] && topScorers[selectedLeague.toString()].length > 0) {
        return;
      }
      
      try {
        dispatch(statsActions.setLoadingStats(true));
        
        // Get current season
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
  
  const handleLeagueSelect = (leagueId: number) => {
    setSelectedLeague(leagueId);
  };
  
  const selectedLeagueTopScorers = topScorers[selectedLeague.toString()] || [];
  
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6">
      <CardHeader className="p-4 border-b border-neutral-200">
        <h3 className="text-center font-medium">Goals</h3>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Stats Tabs */}
        <div className="flex overflow-x-auto py-2 space-x-4 border-b border-neutral-200">
          {POPULAR_LEAGUES.map((league) => (
            <button
              key={league.id}
              className={`flex items-center px-3 py-2 text-xs whitespace-nowrap rounded-full ${
                selectedLeague === league.id 
                  ? 'bg-gray-200 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handleLeagueSelect(league.id)}
            >
              <img 
                src={league.logo} 
                alt={league.name} 
                className="h-5 w-5 mr-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=League';
                }}
              />
              <span>{league.name}</span>
            </button>
          ))}
        </div>

        {/* Player Stats */}
        {loading && !selectedLeagueTopScorers.length ? (
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-center">
                <Skeleton className="h-5 w-5 mx-auto mb-1" />
                <Skeleton className="h-3 w-10 mx-auto" />
              </div>
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
                  <div className="text-xs text-neutral-500">{playerStat.statistics[0].games.position}</div>
                  <div className="text-xs text-neutral-500">{playerStat.statistics[0].team.name}</div>
                </div>
              </div>
              <div className="font-bold text-center">
                <div>{playerStat.statistics[0].goals.total}</div>
                <div className="text-xs text-neutral-500">Goals</div>
              </div>
            </div>
          ))
        )}

        <div className="text-center">
          <button 
            className="text-sm text-[#3182CE] flex items-center justify-center hover:underline"
            onClick={() => navigate(`/league/${selectedLeague}/stats`)}
          >
            <span>{POPULAR_LEAGUES.find(l => l.id === selectedLeague)?.name || 'League'} Stats</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsPanel;
