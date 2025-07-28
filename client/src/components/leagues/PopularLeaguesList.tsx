import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "wouter";
import { Star, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LazyImage from "@/components/common/LazyImage";
import { usePopularLeagues } from "@/hooks/usePopularLeagues";

const PopularLeaguesList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const { leagues, isLoading, error, refetch } = usePopularLeagues();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleFavorite = (leagueId: number) => {
    if (!user.isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to save favorites",
      });
      navigate("/auth");
      return;
    }

    const leagueIdStr = leagueId.toString();
    const isFavorite = user.preferences.favoriteLeagues.includes(leagueIdStr);

    if (isFavorite) {
      dispatch(userActions.removeFavoriteLeague(leagueIdStr));
      if (user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteLeagues: user.preferences.favoriteLeagues.filter(
            (id) => id !== leagueIdStr,
          ),
        }).catch((err) => {
          console.error("Failed to update preferences:", err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteLeague(leagueIdStr));
      if (user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteLeagues: [...user.preferences.favoriteLeagues, leagueIdStr],
        }).catch((err) => {
          console.error("Failed to update preferences:", err);
        });
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Success",
        description: "Popular leagues updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh popular leagues",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Popular Leagues</h3>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center py-1.5 px-2 animate-pulse"
              >
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

  // Error state
  if (error && leagues.length === 0) {
    return (
      <Card className="w-full bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Popular Leagues</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">Failed to load leagues</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Retrying...' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Popular Leagues</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
              title="Refresh leagues"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {error && leagues.length > 0 && (
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              Using cached data. Last update failed.
            </div>
          )}

          <div className="space-y-2">
            {leagues.map((league) => {
              const isFavorite = user.preferences.favoriteLeagues.includes(
                league.id.toString(),
              );

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
                      console.log(
                        `🚨 League logo failed for: ${league.name} (ID: ${league.id})`,
                      );
                    }}
                    onLoad={() => {
                      console.log(
                        `✅ League logo loaded for: ${league.name} (ID: ${league.id})`,
                      );
                    }}
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm">{league.name}</div>
                    <span className="text-xs text-gray-500 truncate">
                      {league.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {league.popularity && (
                      <span className="text-xs text-gray-400">
                        {league.popularity}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(league.id);
                      }}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Star
                        className={`h-4 w-4 ${isFavorite ? "text-blue-500 fill-current" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {leagues.length === 0 && !isLoading && (
            <div className="text-center py-4 text-sm text-gray-500">
              No leagues available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PopularLeaguesList;