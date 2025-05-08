import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, userActions } from '@/lib/store';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Popular leagues with their data - only including requested leagues
const leagueData = [
  { id: 2, name: 'UEFA Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe' },
  { id: 39, name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png', country: 'England' },
  { id: 135, name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy' }
];

const PopularLeaguesList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const user = useSelector((state: RootState) => state.user);
  
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
      
      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: user.preferences.favoriteLeagues.filter(id => id !== leagueIdStr)
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteLeague(leagueIdStr));
      
      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteLeagues: [...user.preferences.favoriteLeagues, leagueIdStr]
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    }
  };
  
  return (
    <div className="space-y-1">
      {leagueData.map((league) => {
        const isFavorite = user.preferences.favoriteLeagues.includes(league.id.toString());
        
        return (
          <div 
            key={league.id}
            className="flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => navigate(`/league/${league.id}`)}
          >
            <img 
              src={league.logo} 
              alt={league.name} 
              className="w-5 h-5 mr-3"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
              }}
            />
            
            <div className="flex-1">
              <div className="text-sm font-medium">{league.name}</div>
              <div className="text-xs text-neutral-500">{league.country}</div>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(league.id);
              }}
              className="text-neutral-400 hover:text-blue-400"
            >
              <Star 
                className={`h-4 w-4 ${isFavorite ? 'text-blue-400 fill-blue-400' : ''}`} 
              />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PopularLeaguesList;