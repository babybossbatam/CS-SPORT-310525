import { useEffect, memo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, leaguesActions, fixturesActions, userActions } from '@/lib/store';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Star, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getMatchStatusText } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Type guard to check if an object is a league response
function isValidLeagueResponse(object: any): boolean {
  return (
    typeof object === 'object' &&
    object !== null &&
    'league' in object &&
    'country' in object &&
    'seasons' in object &&
    typeof object.league === 'object' &&
    typeof object.country === 'object'
  );
}

interface LeagueMatchCardProps {
  leagueId: number;
}

const LeagueMatchCard = ({ leagueId }: LeagueMatchCardProps) => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  const user = useSelector((state: RootState) => state.user);
  const leagues = useSelector((state: RootState) => state.leagues);
  const fixtures = useSelector((state: RootState) => state.fixtures);
  
  const league = leagues.list.find(l => l.league.id === leagueId);
  const fixturesByLeague = fixtures.byLeague[leagueId.toString()] || [];
  const loading = leagues.loading || fixtures.loading;
  
  const isFavorite = user.preferences.favoriteLeagues.includes(leagueId.toString());
  
  // Fetch league data - memoized to prevent unnecessary re-renders
  const fetchLeagueData = useCallback(async () => {
    // If league is already in state, don't fetch again
    if (league) return;
    
    // Check if we're already loading leagues
    if (leagues.loading) return;
    
    try {
      dispatch(leaguesActions.setLoadingLeagues(true));
      
      // Check if the data is in the React Query cache
      const cachedData = queryClient.getQueryData([`/api/leagues/${leagueId}`]);
      if (cachedData && isValidLeagueResponse(cachedData)) {
        // Only add to store if it's not already there
        if (!leagues.list.some(l => l.league?.id === leagueId)) {
          dispatch(leaguesActions.setLeagues([...leagues.list, cachedData as any]));
        }
        return;
      }
      
      const response = await apiRequest('GET', `/api/leagues/${leagueId}`);
      const data = await response.json();
      
      if (data) {
        dispatch(leaguesActions.setLeagues([...leagues.list, data]));
        // Store in React Query cache
        queryClient.setQueryData([`/api/leagues/${leagueId}`], data);
      }
    } catch (error) {
      console.error(`Error fetching league ${leagueId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to load league information',
        variant: 'destructive',
      });
    } finally {
      dispatch(leaguesActions.setLoadingLeagues(false));
    }
  }, [leagueId, league, leagues.loading, leagues.list, dispatch, toast]);
  
  // Fetch league fixtures - memoized to prevent unnecessary re-renders
  const fetchLeagueFixtures = useCallback(async () => {
    // If fixtures for this league are already in state, don't fetch again
    if (fixturesByLeague.length > 0) return;
    
    // Check if we're already loading fixtures
    if (fixtures.loading) return;
    
    try {
      dispatch(fixturesActions.setLoadingFixtures(true));
      
      // Get current season
      const currentYear = new Date().getFullYear();
      
      // Check if the data is in the React Query cache
      const cachedData = queryClient.getQueryData([`/api/leagues/${leagueId}/fixtures`]);
      if (cachedData && Array.isArray(cachedData)) {
        const recentFixtures = [...cachedData]
          .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
          .slice(0, 5);
        
        dispatch(fixturesActions.setFixturesByLeague({ 
          leagueId: leagueId.toString(),
          fixtures: recentFixtures 
        }));
        return;
      }
      
      const response = await apiRequest(
        'GET', 
        `/api/leagues/${leagueId}/fixtures?season=${currentYear}`
      );
      const data = await response.json();
      
      // Store in React Query cache
      queryClient.setQueryData([`/api/leagues/${leagueId}/fixtures`], data);
      
      // Get the most recent fixtures (limit to 5)
      const recentFixtures = [...data]
        .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
        .slice(0, 5);
      
      dispatch(fixturesActions.setFixturesByLeague({ 
        leagueId: leagueId.toString(),
        fixtures: recentFixtures 
      }));
    } catch (error) {
      console.error(`Error fetching fixtures for league ${leagueId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to load league matches',
        variant: 'destructive',
      });
    } finally {
      dispatch(fixturesActions.setLoadingFixtures(false));
    }
  }, [leagueId, fixturesByLeague.length, fixtures.loading, dispatch, toast]);
  
  // Run effects
  useEffect(() => {
    // Use a single request to fetch both data and fixtures
    const fetchData = async () => {
      await fetchLeagueData();
      await fetchLeagueFixtures();
    };
    
    fetchData();
  }, [fetchLeagueData, fetchLeagueFixtures]);
  
  // Toggle favorite status
  const toggleFavorite = () => {
    if (!user.isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to save favorites',
      });
      navigate('/login');
      return;
    }
    
    if (isFavorite) {
      dispatch(userActions.removeFavoriteLeague(leagueId.toString()));
      
      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: user.preferences.favoriteLeagues.filter(id => id !== leagueId.toString())
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteLeague(leagueId.toString()));
      
      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: [...user.preferences.favoriteLeagues, leagueId.toString()]
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    }
  };
  
  if (loading && !league) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-4">
        <CardHeader className="p-3 border-b border-neutral-200 flex items-center">
          <Skeleton className="h-4 w-4 mr-2 rounded-full" />
          <div className="flex items-center">
            <Skeleton className="h-6 w-6 mr-2 rounded" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardHeader>
        {[1, 2, 3].map((i) => (
          <CardContent key={i} className="p-3 border-b border-neutral-200">
            <div className="flex items-center text-sm mb-1">
              <Skeleton className="h-3 w-16 mr-2" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 w-5/12">
                <div className="text-right w-full">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="flex items-center justify-center w-2/12">
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex items-center space-x-3 w-5/12">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="w-full">
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        ))}
      </Card>
    );
  }
  
  if (!league || fixturesByLeague.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-white rounded-lg shadow-md mb-4">
      <CardHeader className="p-3 border-b border-neutral-200 flex items-center">
        <button 
          onClick={toggleFavorite}
          className="text-neutral-400 hover:text-yellow-400 mr-2"
        >
          <Star 
            className={`h-4 w-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} 
          />
        </button>
        <div className="flex items-center">
          <img 
            src={league.league.logo} 
            alt={league.league.name} 
            className="h-6 w-6 mr-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=League';
            }}
          />
          <div>
            <div className="text-sm font-medium">{league.league.name}</div>
            <div className="text-xs text-neutral-500">{league.country.name}</div>
          </div>
        </div>
      </CardHeader>
      
      {fixturesByLeague.slice(0, 3).map((fixture) => (
        <CardContent 
          key={fixture.fixture.id} 
          className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
          onClick={() => navigate(`/match/${fixture.fixture.id}`)}
        >
          <div className="flex items-center text-sm mb-1">
            <span className="text-xs text-neutral-500 mr-2">
              {getMatchStatusText(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 w-5/12">
              <div className="text-right w-full">
                <span className="font-medium">{fixture.teams.home.name}</span>
              </div>
              <img 
                src={fixture.teams.home.logo} 
                alt={fixture.teams.home.name} 
                className="h-8 w-8"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                }}
              />
            </div>
            <div className="flex items-center justify-center w-2/12">
              <span className="font-bold text-lg">
                {fixture.goals.home !== null ? fixture.goals.home : '-'} - {fixture.goals.away !== null ? fixture.goals.away : '-'}
              </span>
            </div>
            <div className="flex items-center space-x-3 w-5/12">
              <img 
                src={fixture.teams.away.logo} 
                alt={fixture.teams.away.name} 
                className="h-8 w-8"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                }}
              />
              <div className="w-full">
                <span className="font-medium">{fixture.teams.away.name}</span>
              </div>
            </div>
          </div>
          
          {fixture.score.penalty.home !== null && fixture.score.penalty.away !== null && (
            <div className="text-xs text-neutral-500 text-center mt-1">
              Penalties: {fixture.score.penalty.home} - {fixture.score.penalty.away}
            </div>
          )}
          
          {fixture.score.extratime.home !== null && fixture.score.extratime.away !== null && (
            <div className="text-xs text-neutral-500 text-center mt-1">
              After Extra Time
            </div>
          )}
        </CardContent>
      ))}
      
      <CardFooter className="p-3 text-sm text-neutral-600 flex justify-center">
        <button 
          className="flex items-center hover:text-[#3182CE]"
          onClick={() => navigate(`/league/${leagueId}`)}
        >
          <span>{league.league.name} Matches</span>
          <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </CardFooter>
    </Card>
  );
};

export default LeagueMatchCard;