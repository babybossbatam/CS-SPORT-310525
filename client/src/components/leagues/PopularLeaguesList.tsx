import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RootState, userActions } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import LazyImage from '@/components/common/LazyImage';


// Current popular leagues list - matches HomeTopScorersList
export const CURRENT_POPULAR_LEAGUES = [
  { id: 39, name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png', country: 'England' },
  { id: 140, name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png', country: 'Spain' },
  { id: 135, name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy' },
  { id: 78, name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png', country: 'Germany' },
  { id: 61, name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png', country: 'France' },
  { id: 2, name: 'UEFA Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe' },
  { id: 3, name: 'UEFA Europa League', logo: 'https://media.api-sports.io/football/leagues/3.png', country: 'Europe' },
  { id: 848, name: 'UEFA Conference League', logo: 'https://media.api-sports.io/football/leagues/848.png', country: 'Europe' },
  { id: 5, name: 'UEFA Nations League', logo: 'https://media.api-sports.io/football/leagues/5.png', country: 'Europe' },
  // World/International Competitions
  { id: 1, name: 'World Cup', logo: 'https://media.api-sports.io/football/leagues/1.png', country: 'World' },
  { id: 4, name: 'Euro Championship', logo: 'https://media.api-sports.io/football/leagues/4.png', country: 'World' },
  { id: 15, name: 'FIFA Club World Cup', logo: 'https://media.api-sports.io/football/leagues/15.png', country: 'World' },
  { id: 38, name: 'UEFA U21 Championship', logo: 'https://media.api-sports.io/football/leagues/38.png', country: 'World' },
  { id: 9, name: 'Copa America', logo: 'https://media.api-sports.io/football/leagues/9.png', country: 'World' },
  { id: 22, name: 'CONCACAF Gold Cup', logo: 'https://media.api-sports.io/football/leagues/22.png', country: 'World' },
  { id: 7, name: 'Asian Cup', logo: 'https://media.api-sports.io/football/leagues/7.png', country: 'World' },
  // Domestic Cups
  { id: 137, name: 'Coppa Italia', logo: 'https://media.api-sports.io/football/leagues/137.png', country: 'Italy' },
  { id: 45, name: 'FA Cup', logo: 'https://media.api-sports.io/football/leagues/45.png', country: 'England' },
  { id: 143, name: 'Copa del Rey', logo: 'https://media.api-sports.io/football/leagues/143.png', country: 'Spain' },
  { id: 81, name: 'DFB Pokal', logo: 'https://media.api-sports.io/football/leagues/81.png', country: 'Germany' },
  { id: 307, name: 'Saudi Pro League', logo: 'https://media.api-sports.io/football/leagues/307.png', country: 'Saudi Arabia' },
  { id: 233, name: 'Egyptian Premier League', logo: 'https://media.api-sports.io/football/leagues/233.png', country: 'Egypt' },
];

const PopularLeaguesList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const [leagueData, setLeagueData] = useState(CURRENT_POPULAR_LEAGUES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Use the current popular leagues list directly
    setLeagueData(CURRENT_POPULAR_LEAGUES);
    setIsLoading(false);
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
          <h3 className="text-sm font-semibold mb-2">Popular Leagues</h3>
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
          <h3 className="text-sm font-semibold mb-2">Popular Leagues</h3>
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
                  src={`/api/league-logo/${league.id}`}
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

export default PopularLeaguesList;