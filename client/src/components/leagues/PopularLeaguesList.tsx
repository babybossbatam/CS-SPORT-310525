import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RootState, userActions } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { enhancedLogoManager } from '@/lib/enhancedLogoManager';
import LazyImage from '@/components/common/LazyImage';


// Popular leagues list with popularity scores for sorting
export const CURRENT_POPULAR_LEAGUES = [
  { id: 39, name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png', country: 'England', popularity: 95 },
  { id: 2, name: 'UEFA Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe', popularity: 92 },
  { id: 140, name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png', country: 'Spain', popularity: 90 },
  { id: 490, name: 'World Cup', logo: 'https://media.api-sports.io/football/leagues/490.png', country: 'World', popularity: 88 },
  { id: 135, name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy', popularity: 85 },
  { id: 78, name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png', country: 'Germany', popularity: 83 },
  { id: 4, name: 'Euro Championship', logo: 'https://media.api-sports.io/football/leagues/4.png', country: 'World', popularity: 82 },
  { id: 61, name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png', country: 'France', popularity: 78 },
  { id: 3, name: 'UEFA Europa League', logo: 'https://media.api-sports.io/football/leagues/3.png', country: 'Europe', popularity: 75 },
  { id: 15, name: 'FIFA Club World Cup', logo: 'https://media.api-sports.io/football/leagues/15.png', country: 'World', popularity: 72 },
  { id: 9, name: 'Copa America', logo: 'https://media.api-sports.io/football/leagues/9.png', country: 'World', popularity: 70 },
  { id: 848, name: 'UEFA Conference League', logo: 'https://media.api-sports.io/football/leagues/848.png', country: 'Europe', popularity: 68 },
  { id: 45, name: 'FA Cup', logo: 'https://media.api-sports.io/football/leagues/45.png', country: 'England', popularity: 65 },
  { id: 5, name: 'UEFA Nations League', logo: 'https://media.api-sports.io/football/leagues/5.png', country: 'Europe', popularity: 63 },
  { id: 143, name: 'Copa del Rey', logo: 'https://media.api-sports.io/football/leagues/143.png', country: 'Spain', popularity: 60 },
  { id: 137, name: 'Coppa Italia', logo: 'https://media.api-sports.io/football/leagues/137.png', country: 'Italy', popularity: 58 },
  { id: 81, name: 'DFB Pokal', logo: 'https://media.api-sports.io/football/leagues/81.png', country: 'Germany', popularity: 55 },
  { id: 22, name: 'CONCACAF Gold Cup', logo: 'https://media.api-sports.io/football/leagues/22.png', country: 'World', popularity: 52 },
  { id: 307, name: 'Saudi Pro League', logo: 'https://media.api-sports.io/football/leagues/307.png', country: 'Saudi Arabia', popularity: 50 },
  { id: 850, name: 'UEFA U21 Championship', logo: 'https://media.api-sports.io/football/leagues/850.png', country: 'World', popularity: 48 },
  { id: 7, name: 'Asian Cup', logo: 'https://media.api-sports.io/football/leagues/7.png', country: 'World', popularity: 45 },
  { id: 233, name: 'Egyptian Premier League', logo: 'https://media.api-sports.io/football/leagues/233.png', country: 'Egypt', popularity: 42 },
];

const PopularLeaguesList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const [leagueData, setLeagueData] = useState(CURRENT_POPULAR_LEAGUES);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedLogos, setCachedLogos] = useState(new Map());

  // Function to get cached league logo
  const getCachedLeagueLogo = async (leagueId: number, leagueName?: string) => {
    try {
      const logoResponse = await enhancedLogoManager.getLeagueLogo('PopularLeaguesList', {
        type: 'league',
        shape: 'normal',
        leagueId: leagueId,
        leagueName: leagueName
      });

      console.log(`🏆 [PopularLeaguesList] Cached logo for ${leagueName} (${leagueId}):`, {
        url: logoResponse.url,
        cached: logoResponse.cached,
        fallbackUsed: logoResponse.fallbackUsed,
        loadTime: logoResponse.loadTime + 'ms'
      });

      return logoResponse.url;
    } catch (error) {
      console.warn(`❌ [PopularLeaguesList] Failed to get cached logo for league ${leagueId}:`, error);
      return `/api/league-logo/${leagueId}`;
    }
  };

  // Load cached logos for all leagues
  const loadCachedLogos = async (leagueList: { id: number; name: string; }[]) => {
    const logoMap = new Map<number, string>();

    console.log(`🔄 [PopularLeaguesList] Loading cached logos for ${leagueList.length} leagues...`);

    for (const league of leagueList) {
      const logoUrl = await getCachedLeagueLogo(league.id, league.name);
      logoMap.set(league.id, logoUrl);
    }

    console.log(`✅ [PopularLeaguesList] Loaded ${logoMap.size} cached league logos`);
    setCachedLogos(logoMap);
  };

  useEffect(() => {
    // Sort leagues by popularity score (highest first)
    const sortedLeagues = [...CURRENT_POPULAR_LEAGUES].sort((a, b) => b.popularity - a.popularity);
    setLeagueData(sortedLeagues);
    loadCachedLogos(sortedLeagues);
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
                        `⚠️ [PopularLeaguesList] Fallback image loaded, not caching: ${imageSrc}`,
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
                        `🏆 [PopularLeaguesList] League logo loaded successfully (REAL LOGO):`,
                        {
                          alt: league.name,
                          leagueId,
                          source,
                          imageSrc,
                          component: "PopularLeaguesList",
                        },
                      );
                    }

                    // Only cache real, non-fallback images
                    console.log(
                      `💾 [PopularLeaguesList] Real logo loaded and ready for caching: ${imageSrc}`,
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
                          `🏆 [PopularLeaguesList] League logo error detected for: ${league.name} (ID: ${leagueId})`,
                          {
                            imageSrc,
                            leagueId,
                          },
                        );

                        // Try server proxy endpoint first
                        const cacheBuster = `?t=${Date.now()}`;
                        const fallbackUrl = `/api/league-logo/${leagueId}${cacheBuster}`;
                        console.log(
                          `🔄 [PopularLeaguesList] Trying league logo server proxy: ${fallbackUrl}`,
                        );
                        target.src = fallbackUrl;
                        return;
                      }

                      // Final fallback
                      console.warn(
                        `🚫 [PopularLeaguesList] All retries failed for: ${imageSrc}, using fallback`,
                      );
                      target.src = "/assets/fallback-logo.svg";
                    } catch (error) {
                      console.warn("⚠️ [PopularLeaguesList] Error in handleError function:", error);
                      const target = e.target as HTMLImageElement;
                      target.src = "/assets/fallback-logo.svg";
                    }
                  }}
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