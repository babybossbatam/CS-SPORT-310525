import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "wouter";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LazyImage from "@/components/common/LazyImage";

// Popular leagues list with popularity scores for sorting
export const CURRENT_POPULAR_LEAGUES = [
  {
    id: 39,
    name: "Premier League",
    logo: "https://media.api-sports.io/football/leagues/39.png",
    country: "England",
    popularity: 95,
  },
  {
    id: 2,
    name: "UEFA Champions League",
    logo: "https://media.api-sports.io/football/leagues/2.png",
    country: "Europe",
    popularity: 92,
  },
  {
    id: 140,
    name: "La Liga",
    logo: "https://media.api-sports.io/football/leagues/140.png",
    country: "Spain",
    popularity: 90,
  },
  {
    id: 37,
    name: "World Cup",
    logo: "https://media.api-sports.io/football/leagues/37.png",
    country: "World",
    popularity: 88,
  },
  {
    id: 135,
    name: "Serie A",
    logo: "https://media.api-sports.io/football/leagues/135.png",
    country: "Italy",
    popularity: 85,
  },
  {
    id: 78,
    name: "Bundesliga",
    logo: "https://media.api-sports.io/football/leagues/78.png",
    country: "Germany",
    popularity: 83,
  },
  {
    id: 4,
    name: "Euro Championship",
    logo: "https://media.api-sports.io/football/leagues/4.png",
    country: "World",
    popularity: 82,
  },
  {
    id: 61,
    name: "Ligue 1",
    logo: "https://media.api-sports.io/football/leagues/61.png",
    country: "France",
    popularity: 78,
  },
  {
    id: 3,
    name: "UEFA Europa League",
    logo: "https://media.api-sports.io/football/leagues/3.png",
    country: "Europe",
    popularity: 75,
  },
  {
    id: 15,
    name: "FIFA Club World Cup",
    logo: "https://media.api-sports.io/football/leagues/15.png",
    country: "World",
    popularity: 72,
  },
  {
    id: 9,
    name: "Copa America",
    logo: "https://media.api-sports.io/football/leagues/9.png",
    country: "World",
    popularity: 70,
  },
  {
    id: 848,
    name: "UEFA Conference League",
    logo: "https://media.api-sports.io/football/leagues/848.png",
    country: "Europe",
    popularity: 68,
  },
  {
    id: 45,
    name: "FA Cup",
    logo: "https://media.api-sports.io/football/leagues/45.png",
    country: "England",
    popularity: 65,
  },
  {
    id: 5,
    name: "UEFA Nations League",
    logo: "https://media.api-sports.io/football/leagues/5.png",
    country: "Europe",
    popularity: 63,
  },
  {
    id: 143,
    name: "Copa del Rey",
    logo: "https://media.api-sports.io/football/leagues/143.png",
    country: "Spain",
    popularity: 60,
  },
  {
    id: 137,
    name: "Coppa Italia",
    logo: "https://media.api-sports.io/football/leagues/137.png",
    country: "Italy",
    popularity: 58,
  },
  {
    id: 81,
    name: "DFB Pokal",
    logo: "https://media.api-sports.io/football/leagues/81.png",
    country: "Germany",
    popularity: 55,
  },
  {
    id: 22,
    name: "CONCACAF Gold Cup",
    logo: "https://media.api-sports.io/football/leagues/22.png",
    country: "World",
    popularity: 52,
  },
  {
    id: 307,
    name: "Saudi Pro League",
    logo: "https://media.api-sports.io/football/leagues/307.png",
    country: "Saudi Arabia",
    popularity: 50,
  },
  {
    id: 850,
    name: "UEFA U21 Championship",
    logo: "https://media.api-sports.io/football/leagues/850.png",
    country: "World",
    popularity: 48,
  },
  {
    id: 7,
    name: "Asian Cup",
    logo: "https://media.api-sports.io/football/leagues/7.png",
    country: "World",
    popularity: 45,
  },
  {
    id: 233,
    name: "Egyptian Premier League",
    logo: "https://media.api-sports.io/football/leagues/233.png",
    country: "Egypt",
    popularity: 42,
  },
  {
    id: 550,
    name: "Super Cup",
    logo: "https://media.api-sports.io/football/leagues/550.png",
    country: "Portugal",
    popularity: 40,
  },
  ];

const PopularLeaguesList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const [leagueData, setLeagueData] = useState(CURRENT_POPULAR_LEAGUES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPopularLeagues = async () => {
      try {
        console.log(
          "🔄 [PopularLeaguesList] Fetching popular leagues from API...",
        );
        const response = await apiRequest("GET", "/api/leagues/popular");
        const leagues = await response.json();

        if (leagues && leagues.length > 0) {
          console.log(
            `✅ [PopularLeaguesList] Fetched ${leagues.length} popular leagues from API`,
          );

          // Transform API response to match our League interface
          const transformedLeagues = leagues
            .map((league: any) => ({
              id: league.league?.id || league.id,
              name: league.league?.name || league.name,
              logo: league.league?.logo || league.logo,
              country:
                league.country?.name ||
                league.league?.country ||
                league.country,
              popularity: 100 - leagues.indexOf(league) * 2, // Generate popularity scores
            }))
            .filter((league: any) => {
              const leagueName = league.name?.toLowerCase() || "";
              const country = league.country?.toLowerCase() || "";
              // Exclude Second League and Segunda División leagues
              // Exclude leagues from Finland, Iran, and Thailand
              // Exclude women's competitions
              // Exclude qualification tournaments
              // Exclude Reserve League and San Marino
              // Exclude Super Cup from San Marino specifically
              return (
                !leagueName.includes("second league") &&
                !leagueName.includes("segunda división") &&
                !leagueName.includes("segunda division") &&
                !leagueName.includes("women") &&
                !leagueName.includes("league cup") &&
                !leagueName.includes("oceania") &&
                !leagueName.includes("tipsport") &&
                !leagueName.includes("algarve") &&
                !leagueName.includes("atlantic cup") &&
                !leagueName.includes("intercontinental") &&
                !leagueName.includes("u17") &&
                !leagueName.includes("u18") &&
                !leagueName.includes("u19") &&
                !leagueName.includes("u20") &&
                !leagueName.includes("u21") &&
                !leagueName.includes("conmebol") &&
                !leagueName.includes("friendlies") &&
                !leagueName.includes("shebelieves") &&
                !leagueName.includes("coppa italia serie") &&
                !leagueName.includes("reserve league") &&
                !leagueName.includes("campeones") &&
                !leagueName.includes("africa cup") &&
                !leagueName.includes("olympics men") &&
                !leagueName.includes("asian cup") &&
                !(
                  leagueName.includes("super cup") &&
                  country.includes("san-marino")
                ) &&
                !country.includes("finland") &&
                !country.includes("iran") &&
                !country.includes("thailand") &&
                !country.includes("san marino")
              );
            });

          setLeagueData(transformedLeagues);
        } else {
          throw new Error("No leagues data received from API");
        }
      } catch (error) {
        console.error(
          "❌ [PopularLeaguesList] Error fetching popular leagues:",
          error,
        );
        // Fallback to hardcoded popular leagues if API fails
        const sortedLeagues = [...CURRENT_POPULAR_LEAGUES]
          .filter((league) => {
            const leagueName = league.name?.toLowerCase() || "";
            const country = league.country?.toLowerCase() || "";
            // Exclude Second League and Segunda División leagues
            // Exclude leagues from Finland, Iran, and Thailand
            // Exclude women's competitions
            // Exclude qualification tournaments
            // Exclude Reserve League and San Marino
            // Exclude Super Cup from San Marino specifically
            return (
              !leagueName.includes("second league") &&
              !leagueName.includes("segunda división") &&
              !leagueName.includes("segunda division") &&
              !leagueName.includes("women") &&
              !leagueName.includes("qualification") &&
              !leagueName.includes("reserve league") &&
              !(
                leagueName.includes("super cup") &&
                country.includes("san marino")
              ) &&
              !country.includes("finland") &&
              !country.includes("iran") &&
              !country.includes("thailand") &&
              !country.includes("san marino")
            );
          })
          .sort((a, b) => b.popularity - a.popularity);
        setLeagueData(sortedLeagues);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularLeagues();
  }, []);

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

  if (isLoading) {
    return (
      <Card className="w-full bg-white shadow-sm">
        <CardContent className="-mx-2">
          <h3 className="text-sm font-semibold py-1">Popular Leagues</h3>
          <div className="space-y- ">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center py-1.5  ">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4   w-3/4 mb-1"></div>
                  <div className="h-3  w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      <Card className="w-full bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2  pb-2">Popular Leagues</h3>
          <div className="space-y-1  py-0">
            {leagueData.slice(0, 20).map((league) => {
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
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PopularLeaguesList;
