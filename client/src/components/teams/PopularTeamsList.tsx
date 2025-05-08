import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, userActions } from '@/lib/store';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Popular teams with their data
const popularTeams = [
  { id: 33, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png', country: 'England' },
  { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', country: 'England' },
  { id: 10, name: 'England', logo: 'https://media.api-sports.io/football/teams/10.png', country: 'England' },
  { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png', country: 'England' },
  { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png', country: 'England' },
  { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png', country: 'England' },
  { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', country: 'Spain' },
  { id: 529, name: 'FC Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', country: 'Spain' },
  { id: 47, name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png', country: 'England' },
  { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png', country: 'Germany' }
];

const PopularTeamsList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const user = useSelector((state: RootState) => state.user);
  
  const toggleFavorite = (teamId: number) => {
    if (!user.isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to save favorites',
      });
      navigate('/auth');
      return;
    }
    
    const teamIdStr = teamId.toString();
    const isFavorite = user.preferences.favoriteTeams.includes(teamIdStr);
    
    if (isFavorite) {
      dispatch(userActions.removeFavoriteTeam(teamIdStr));
      
      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteTeams: user.preferences.favoriteTeams.filter(id => id !== teamIdStr)
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteTeam(teamIdStr));
      
      // Update on server
      if (user.id) {
        apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
          favoriteTeams: [...user.preferences.favoriteTeams, teamIdStr]
        }).catch(err => {
          console.error('Failed to update preferences:', err);
        });
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center p-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-200 mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
            <div className="w-4 h-4 bg-gray-100 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-0.5">
      {popularTeams.map((team) => {
        const isFavorite = user.preferences.favoriteTeams.includes(team.id.toString());
        
        return (
          <div 
            key={team.id}
            className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
            onClick={() => navigate(`/team/${team.id}`)}
          >
            <img 
              src={team.logo} 
              alt={team.name} 
              className="w-6 h-6 mr-3"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
              }}
            />
            
            <div className="flex-1">
              <div className="text-sm font-medium">{team.name}</div>
              <div className="text-xs text-neutral-500">{team.country}</div>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(team.id);
              }}
              className="text-neutral-400 hover:text-yellow-400"
            >
              <Star 
                className={`h-4 w-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} 
              />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PopularTeamsList;