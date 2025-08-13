import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useLocation } from "wouter";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import { smartTeamTranslation } from "@/lib/smartTeamTranslation";
import { smartCountryTranslation } from "@/lib/countryNameMapping";
import { useTranslation } from "@/contexts/LanguageContext";

// Popular teams with their data - fallback data
const CURRENT_POPULAR_TEAMS = [
  {
    id: 33,
    name: "Manchester United",
    logo: "https://media.api-sports.io/football/teams/33.png",
    country: "England",
    popularity: 95,
  },
  {
    id: 40,
    name: "Liverpool",
    logo: "https://media.api-sports.io/football/teams/40.png",
    country: "England",
    popularity: 92,
  },
  {
    id: 50,
    name: "Manchester City",
    logo: "https://media.api-sports.io/football/teams/50.png",
    country: "England",
    popularity: 90,
  },
  {
    id: 541,
    name: "Real Madrid",
    logo: "https://media.api-sports.io/football/teams/541.png",
    country: "Spain",
    popularity: 88,
  },
  {
    id: 529,
    name: "FC Barcelona",
    logo: "https://media.api-sports.io/football/teams/529.png",
    country: "Spain",
    popularity: 85,
  },
  {
    id: 42,
    name: "Arsenal",
    logo: "https://media.api-sports.io/football/teams/42.png",
    country: "England",
    popularity: 83,
  },
  {
    id: 49,
    name: "Chelsea",
    logo: "https://media.api-sports.io/football/teams/49.png",
    country: "England",
    popularity: 80,
  },
  {
    id: 157,
    name: "Bayern Munich",
    logo: "https://media.api-sports.io/football/teams/157.png",
    country: "Germany",
    popularity: 78,
  },
  {
    id: 47,
    name: "Tottenham",
    logo: "https://media.api-sports.io/football/teams/47.png",
    country: "England",
    popularity: 75,
  },
  {
    id: 10,
    name: "England",
    logo: "https://media.api-sports.io/football/teams/10.png",
    country: "England",
    popularity: 70,
  },
  {
    id: 489,
    name: "AC Milan",
    logo: "https://media.api-sports.io/football/teams/489.png",
    country: "Italy",
    popularity: 68,
  },
  {
    id: 496,
    name: "Juventus",
    logo: "https://media.api-sports.io/football/teams/496.png",
    country: "Italy",
    popularity: 65,
  },
  {
    id: 165,
    name: "Borussia Dortmund",
    logo: "https://media.api-sports.io/football/teams/165.png",
    country: "Germany",
    popularity: 62,
  },
  {
    id: 85,
    name: "Paris Saint Germain",
    logo: "https://media.api-sports.io/football/teams/85.png",
    country: "France",
    popularity: 60,
  },
  {
    id: 548,
    name: "Real Sociedad",
    logo: "https://media.api-sports.io/football/teams/548.png",
    country: "Spain",
    popularity: 58,
  },
];

const PopularTeamsList = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { t, currentLanguage } = useTranslation();
  const user = useSelector((state: RootState) => state.user);
  const [teamData, setTeamData] = useState(CURRENT_POPULAR_TEAMS);
  const [isLoading, setIsLoading] = useState(true);

  // Translation function that prioritizes static mappings over learned ones
  const translateTeamName = (teamName: string): string => {
    // Clear any corrupted cache entries first
    smartTeamTranslation.forceRefreshTranslations([teamName], currentLanguage);

    // Use smart translation system
    return smartTeamTranslation.translateTeamName(teamName, currentLanguage);
  };

  const translateCountryName = (countryName: string): string => {
    return smartCountryTranslation.translateCountry(countryName, currentLanguage);
  };

  useEffect(() => {
    const initializeTranslations = async () => {
      // Initialize smart translation system
      await smartTeamTranslation.initializeTeamTranslations(currentLanguage);
      console.log("🔄 [PopularTeamsList] Translation system initialized");
    };

    const fetchPopularTeams = async () => {
      try {
        console.log("🔄 [PopularTeamsList] Fetching popular teams from API...");
        const response = await apiRequest("GET", "/api/teams/popular");

        // Check if response is ok and has proper content type
        if (!response.ok) {
          console.warn(`⚠️ [PopularTeamsList] API request failed: ${response.status} ${response.statusText}`);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn(
            "⚠️ [PopularTeamsList] API returned non-JSON response, using fallback data",
          );
          throw new Error("API returned HTML instead of JSON");
        }

        const teams = await response.json();

        if (teams && Array.isArray(teams) && teams.length > 0) {
          console.log(
            `✅ [PopularTeamsList] Fetched ${teams.length} popular teams from API`,
          );

          // Transform API response and learn from team data
          const transformedTeams = teams
            .map((team: any, index: number) => ({
              id: team.team?.id || team.id,
              name: team.team?.name || team.name,
              logo: team.team?.logo || team.logo,
              country: team.country?.name || team.team?.country || team.country,
              popularity: team.popularity || 100 - index * 2,
            }))
            .filter((team: any) => {
              if (!team.id || !team.name) return false;
              const teamName = team.name?.toLowerCase() || "";
              const country = team.country?.toLowerCase() || "";
              return (
                !teamName.includes("reserves") &&
                !teamName.includes("youth") &&
                !teamName.includes("u21") &&
                !teamName.includes("u19") &&
                !teamName.includes("u18")
              );
            });

          if (transformedTeams.length > 0) {
            // Learn from team data for future translations
            smartTeamTranslation.learnTeamsFromFixtures(
              transformedTeams.map((team) => ({
                teams: {
                  home: { name: team.name },
                  away: { name: team.name },
                },
                league: { country: team.country },
              })),
            );

            // Learn country names
            smartCountryTranslation.learnCountriesFromFixtures(
              transformedTeams.map((team) => ({
                league: { country: team.country },
              })),
            );

            setTeamData(transformedTeams);
            return;
          }
        }

        throw new Error("No valid teams data received from API");
      } catch (error) {
        console.warn(
          "⚠️ [PopularTeamsList] Failed to fetch popular teams, using fallback data:",
          error instanceof Error ? error.message : 'Unknown error',
        );
        console.log("🔄 [PopularTeamsList] Using fallback popular teams data");

        const sortedTeams = [...CURRENT_POPULAR_TEAMS]
          .filter((team) => {
            const teamName = team.name?.toLowerCase() || "";
            const country = team.country?.toLowerCase() || "";
            return (
              !teamName.includes("reserves") &&
              !teamName.includes("youth") &&
              !teamName.includes("u21") &&
              !teamName.includes("u19") &&
              !teamName.includes("u18")
            );
          })
          .sort((a, b) => b.popularity - a.popularity);
        setTeamData(sortedTeams);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTranslations().then(() => {
      fetchPopularTeams();
    });
  }, [currentLanguage]);

  const toggleFavorite = (teamId: number) => {
    const teamIdStr = teamId.toString();
    const isFavorite = user.preferences.favoriteTeams.includes(teamIdStr);

    if (isFavorite) {
      dispatch(userActions.removeFavoriteTeam(teamIdStr));

      // Update on server
      if (user.isAuthenticated && user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteTeams: user.preferences.favoriteTeams.filter(
            (id) => id !== teamIdStr,
          ),
        }).catch((err) => {
          console.error("Failed to update preferences:", err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteTeam(teamIdStr));

      // Update on server
      if (user.isAuthenticated && user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteTeams: [...user.preferences.favoriteTeams, teamIdStr],
        }).catch((err) => {
          console.error("Failed to update preferences:", err);
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white shadow-sm rounded">
        <div className="">
          <h3 className="text-sm font-semibold ">{t("popular_teams")}</h3>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center py-1.5 px-2 animate-pulse"
              >
                <div className="w-6 h-6 bg-gray-200 rounded-sm"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="w-full bg-white border border-gray-200">
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-900 border-b border-gray-200 px-2 py-2">
            {t("Popular teams")}
          </h3>
          <div className="">
            {teamData.map((team) => {
              const isFavorite = user.preferences.favoriteTeams.includes(
                team.id.toString(),
              );

              return (
                <div
                  key={team.id}
                  className="flex items-center py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <MyWorldTeamLogo
                    teamId={team.id}
                    teamName={team.name}
                    teamLogo={
                      team.logo || `/api/team-logo/square/${team.id}?size=24`
                    }
                    alt={team.name}
                    size="20px"
                    className="w-5 h-5 object-contain"
                    leagueContext={{
                      name: "Popular Teams",
                      country: team.country,
                    }}
                  />
                  <div className="mx-4 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {translateTeamName(team.name)}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {translateCountryName(team.country)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleFavorite(team.id)}
                    className={`transition-colors p-1 ${
                      isFavorite
                        ? "text-blue-500 hover:text-blue-600"
                        : "text-gray-400 hover:text-blue-500"
                    }`}
                  >
                    <Star
                      className="h-4 w-4"
                      fill={isFavorite ? "currentColor" : "none"}
                      stroke="currentColor"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularTeamsList;
