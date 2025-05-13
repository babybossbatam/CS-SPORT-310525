
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
    </>
  );
};

export default StatsPanel;
