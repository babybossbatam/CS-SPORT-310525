
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
    <div className="space-y-4">
      <Tabs defaultValue={selectedLeague.toString()} onValueChange={(value) => setSelectedLeague(Number(value))}>
        <TabsList className="mb-4">
          {POPULAR_LEAGUES.map((league) => (
            <TabsTrigger key={league.id} value={league.id.toString()} className="flex items-center gap-2">
              <img 
                src={league.logo} 
                alt={league.name} 
                className="w-4 h-4"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/16?text=L';
                }}
              />
              {league.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {error && (
        <div className="text-center text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && selectedLeagueTopScorers.length > 0 && (
        <div className="space-y-4">
          {selectedLeagueTopScorers.slice(0, 3).map((player: any) => (
            <Card key={player.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <img 
                        src={player.photo} 
                        alt={player.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/48?text=P';
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-sm text-gray-500">{player.team.name}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{player.goals || 0}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
