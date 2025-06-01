import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RootState, userActions } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { homePageUtils } from '@/lib/homePageCache';

const PopularLeaguesList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);

  // Use cached popular leagues data
  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ['home-popular-leagues'],
    queryFn: () => homePageUtils.getPopularLeagues(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Show only top 5 leagues
  const displayLeagues = leagues.slice(0, 5);

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
            {Array.from({ length: 6 }).map((_, i) => (
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
    <Card className="w-full bg-white shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-2">Popular Leagues</h3>
        <div className="space-y-2">
          {displayLeagues.map((league, index) => {
            const isFavorite = league.id ? user.preferences.favoriteLeagues.includes(league.id.toString()) : false;

            return (
              <div
                key={league.id}
                className="flex items-center py-1.5 px-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                onClick={() => navigate(`/league/${league.id}`)}
              >
                <img
                  src={league.logo}
                  alt={league.name}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                  }}
                />
                <div className="ml-3 flex-1">
                  <div className="text-sm">
                    {typeof league.name === 'string' 
                      ? league.name 
                      : (typeof league.name === 'object' && league.name?.name) 
                        ? String(league.name.name)
                        : 'Unknown League'
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {typeof league.country === 'string' 
                      ? league.country 
                      : (typeof league.country === 'object' && league.country?.name) 
                        ? String(league.country.name)
                        : 'Unknown Country'
                    }
                  </div>
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
  );
};

export default PopularLeaguesList;