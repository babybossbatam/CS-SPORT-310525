import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, fixturesActions } from '@/lib/store';
import { BarChart2, LineChart, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const FeaturedMatch = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const loading = useSelector((state: RootState) => state.fixtures.loading);
  const upcomingFixtures = useSelector((state: RootState) => state.fixtures.upcoming);
  const featuredMatch = upcomingFixtures.length > 0 ? upcomingFixtures[0] : null;
  
  useEffect(() => {
    const fetchUpcomingFixtures = async () => {
      try {
        dispatch(fixturesActions.setLoadingFixtures(true));
        
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const response = await apiRequest('GET', `/api/fixtures/date/${tomorrowStr}`);
        const data = await response.json();
        
        // Sort matches by league importance (Champions League first)
        const sortedData = [...data].sort((a, b) => {
          // Prioritize Champions League matches
          if (a.league.id === 2) return -1;
          if (b.league.id === 2) return 1;
          return 0;
        });
        
        dispatch(fixturesActions.setUpcomingFixtures(sortedData));
      } catch (error) {
        console.error('Error fetching upcoming fixtures:', error);
        toast({
          title: 'Error',
          description: 'Failed to load upcoming matches',
          variant: 'destructive',
        });
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };
    
    fetchUpcomingFixtures();
  }, [dispatch, toast]);
  
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="bg-gray-200 px-4 py-2 flex justify-between items-center">
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
  
  if (!featuredMatch) {
    return null;
  }
  
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <CardHeader className="bg-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <Trophy className="h-4 w-4 text-neutral-500 mr-2" />
          <span className="text-sm font-medium">{featuredMatch.league.name} - {featuredMatch.league.round}</span>
        </div>
        <Badge variant="secondary" className="bg-neutral-300 text-xs font-medium py-1 px-2 rounded">
          Featured Match
        </Badge>
      </CardHeader>
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold text-center mb-6">
          {
            new Date(featuredMatch.fixture.date).toDateString() === new Date().toDateString()
              ? 'Today'
              : new Date(featuredMatch.fixture.date).toDateString() === new Date(new Date().setDate(new Date().getDate() + 1)).toDateString()
                ? 'Tomorrow'
                : new Date(featuredMatch.fixture.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          }
        </h2>
        
        <div className="flex justify-center items-center space-x-4 mb-4">
          {/* Home Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="h-16 w-16 mb-2 flex items-center justify-center">
              <img 
                src={featuredMatch.teams.home.logo} 
                alt={featuredMatch.teams.home.name} 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <span className="font-semibold text-center">{featuredMatch.teams.home.name}</span>
          </div>
          
          {/* VS */}
          <div className="flex flex-col items-center w-1/3">
            <div className="text-3xl font-bold text-neutral-500 mb-2">VS</div>
            <div className="text-sm text-neutral-500">
              {formatDateTime(featuredMatch.fixture.date)}
              {featuredMatch.fixture.venue.name && ` | ${featuredMatch.fixture.venue.name}`}
            </div>
          </div>
          
          {/* Away Team */}
          <div className="flex flex-col items-center w-1/3">
            <div className="h-16 w-16 mb-2 flex items-center justify-center">
              <img 
                src={featuredMatch.teams.away.logo} 
                alt={featuredMatch.teams.away.name} 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            <span className="font-semibold text-center">{featuredMatch.teams.away.name}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={() => navigate(`/match/${featuredMatch.fixture.id}/h2h`)}
          >
            <BarChart2 className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">H2H</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={() => navigate(`/match/${featuredMatch.fixture.id}/stats`)}
          >
            <LineChart className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Stats</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:text-[#3182CE]"
            onClick={() => navigate(`/league/${featuredMatch.league.id}/bracket`)}
          >
            <Trophy className="text-neutral-500 mb-1 h-5 w-5" />
            <span className="text-xs text-neutral-500">Bracket</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedMatch;
