
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RootState, userActions } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Import the popular leagues data from the existing component
import { CURRENT_POPULAR_LEAGUES } from './PopularLeaguesList';

const MyPopularFootballNewList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const [leagueData, setLeagueData] = useState(CURRENT_POPULAR_LEAGUES);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedLogos, setCachedLogos] = useState(new Map<number, string>());

  useEffect(() => {
    // Sort leagues by popularity score (highest first)
    const sortedLeagues = [...CURRENT_POPULAR_LEAGUES].sort((a, b) => b.popularity - a.popularity);
    setLeagueData(sortedLeagues);
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
          <h3 className="text-sm font-semibold mb-2">My Popular Football Leagues</h3>
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
          <h3 className="text-sm font-semibold mb-2">My Popular Football Leagues</h3>
          <div className="space-y-2">
            {leagueData.map((league) => {
              const isFavorite = user.preferences.favoriteLeagues.includes(league.id.toString());

              return (
                <div
                  key={league.id}
                  className="flex items-center py-1.5 px-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  onClick={() => navigate(`/league/${league.id}`)}
                >
                  <img
                    src={cachedLogos.get(league.id) || `/api/league-logo/${league.id}`}
                    alt={league.name}
                    title={league.name}
                    className="w-5 h-5 object-contain"
                    loading="lazy"
                    onLoad={() => {
                      // Don't cache or log success for fallback images
                      const imageSrc = cachedLogos.get(league.id) || `/api/league-logo/${league.id}`;
                      const isFallbackImage =
                        imageSrc.includes("/assets/fallback-logo.svg") ||
                        imageSrc.includes("fallback") ||
                        imageSrc.includes("placeholder");

                      if (isFallbackImage) {
                        console.log(
                          `⚠️ [MyPopularFootballNewList] Fallback image loaded, not caching: ${imageSrc}`,
                        );
                        return;
                      }

                      // Enhanced league logo success logging (only for real logos)
                      const isLeagueLogo =
                        imageSrc.includes("/api/league-logo/") ||
                        imageSrc.includes("media.api-sports.io/football/leagues/") ||
                        imageSrc.includes("imagecache.365scores.com");

                      if (isLeagueLogo) {
                        // Extract league ID and source for better tracking
                        let leagueId = "unknown";
                        let source = "unknown";

                        const apiMatch = imageSrc.match(/\/api\/league-logo\/(?:square\/)?(\d+)/);
                        const mediaMatch = imageSrc.match(
                          /media\.api-sports\.io\/football\/leagues\/(\d+)/,
                        );
                        const scoresMatch = imageSrc.match(/Competitions\/(\d+)/);

                        if (apiMatch) {
                          leagueId = apiMatch[1];
                          source = imageSrc.includes("/square/") ? "api-square" : "api-proxy";
                        } else if (mediaMatch) {
                          leagueId = mediaMatch[1];
                          source = "api-sports-direct";
                        } else if (scoresMatch) {
                          leagueId = scoresMatch[1];
                          source = "365scores";
                        }

                        console.log(
                          `🏆 [MyPopularFootballNewList] League logo loaded successfully (REAL LOGO):`,
                          {
                            alt: league.name,
                            leagueId,
                            source,
                            imageSrc,
                            component: "MyPopularFootballNewList",
                          },
                        );
                      }

                      // Only cache real, non-fallback images
                      console.log(
                        `💾 [MyPopularFootballNewList] Real logo loaded and ready for caching: ${imageSrc}`,
                      );
                    }}
                    onError={(e) => {
                      // Safety check to prevent cascading errors
                      try {
                        const target = e.target as HTMLImageElement;
                        const imageSrc = target.src;

                        // Enhanced league logo handling like MyNewLeague2
                        const isLeagueLogo =
                          imageSrc.includes("/api/league-logo/") ||
                          imageSrc.includes("media.api-sports.io/football/leagues/") ||
                          imageSrc.includes("imagecache.365scores.com");

                        if (isLeagueLogo) {
                          // Extract league ID for better debugging
                          let leagueId = "unknown";
                          const apiMatch = imageSrc.match(
                            /\/api\/league-logo\/(?:square\/)?(\d+)/,
                          );
                          const mediaMatch = imageSrc.match(
                            /media\.api-sports\.io\/football\/leagues\/(\d+)/,
                          );
                          const scoresMatch = imageSrc.match(/Competitions\/(\d+)/);

                          if (apiMatch) leagueId = apiMatch[1];
                          else if (mediaMatch) leagueId = mediaMatch[1];
                          else if (scoresMatch) leagueId = scoresMatch[1];

                          console.log(
                            `🏆 [MyPopularFootballNewList] League logo error detected for: ${league.name} (ID: ${leagueId})`,
                            {
                              imageSrc,
                              leagueId,
                            },
                          );

                          // Try server proxy endpoint first
                          const cacheBuster = `?t=${Date.now()}`;
                          const fallbackUrl = `/api/league-logo/${leagueId}${cacheBuster}`;
                          console.log(
                            `🔄 [MyPopularFootballNewList] Trying league logo server proxy: ${fallbackUrl}`,
                          );
                          target.src = fallbackUrl;
                          return;
                        }

                        // Final fallback
                        console.warn(
                          `🚫 [MyPopularFootballNewList] All retries failed for: ${imageSrc}, using fallback`,
                        );
                        target.src = "/assets/fallback-logo.svg";
                      } catch (error) {
                        console.warn("⚠️ [MyPopularFootballNewList] Error in handleError function:", error);
                        const target = e.target as HTMLImageElement;
                        target.src = "/assets/fallback-logo.svg";
                      }
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
