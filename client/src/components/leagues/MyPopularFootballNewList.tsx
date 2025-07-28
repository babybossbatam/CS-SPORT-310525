import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RootState, userActions } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import LazyImage from '@/components/common/LazyImage';

interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
  popularity?: number;
}

const MyPopularFootballNewList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const [leagueData, setLeagueData] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPopularLeagues = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 [MyPopularFootballNewList] Fetching popular leagues from API...');

        const response = await apiRequest('GET', '/api/leagues/popular');
        const leagues = await response.json();

        console.log('✅ [MyPopularFootballNewList] Fetched leagues:', leagues.length);

        // Transform API response to match our League interface
        const transformedLeagues = leagues.map((league: any) => ({
          id: league.league?.id || league.id,
          name: league.league?.name || league.name,
          logo: league.league?.logo || league.logo,
          country: league.country?.name || league.league?.country || league.country,
          popularity: 100 - (leagues.indexOf(league) * 2) // Generate popularity scores
        }));

        setLeagueData(transformedLeagues);
      } catch (error) {
        console.error('❌ [MyPopularFootballNewList] Error fetching popular leagues:', error);
        // Fallback to minimal popular leagues if API fails
        setLeagueData([
          { id: 39, name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png', country: 'England', popularity: 95 },
          { id: 140, name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png', country: 'Spain', popularity: 90 },
          { id: 135, name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy', popularity: 85 },
          { id: 78, name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png', country: 'Germany', popularity: 83 },
          { id: 2, name: 'UEFA Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe', popularity: 92 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularLeagues();
  }, []);

  const toggleFavorite = (leagueId: number) => {
    if (!user.isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to save favorites',
      });
      navigate('/auth');
      return;
    }

    const leagueIdStr = leagueId.toString();
    const isFavorite = user.preferences.favoriteLeagues.includes(leagueIdStr);

    if (isFavorite) {
      dispatch(userActions.removeFavoriteLeague(leagueIdStr));
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: user.preferences.favoriteLeagues.filter(id => id !== leagueIdStr)
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteLeague(leagueIdStr));
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: [...user.preferences.favoriteLeagues, leagueIdStr]
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2">My Popular Football New List</h3>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center py-1.5 px-2 animate-pulse">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2">My Popular Football New List</h3>
          <div className="space-y-2">
            {leagueData.map((league) => {
              const isFavorite = user.preferences.favoriteLeagues.includes(league.id.toString());

              return (
                <div
                  key={league.id}
                  className="flex items-center py-1.5 px-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  onClick={() => navigate(`/league/${league.id}`)}
                >
                  <LazyImage
                    src={league.logo || `/api/league-logo/${league.id}`}
                    alt={league.name}
                    title={league.name}
                    className="w-5 h-5 object-contain"
                    loading="lazy"
                    onError={() => {
                      console.log(`🚨 League logo failed for: ${league.name} (ID: ${league.id})`);
                    }}
                    onLoad={() => {
                      console.log(`✅ League logo loaded for: ${league.name} (ID: ${league.id})`);
                    }}
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm">{league.name}</div>
                    <span className="text-xs text-gray-500 truncate">
                      {league.country}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(league.id);
                    }}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Star
                      className={`h-4 w-4 ${isFavorite ? 'text-blue-500 fill-current' : ''}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyPopularFootballNewList;