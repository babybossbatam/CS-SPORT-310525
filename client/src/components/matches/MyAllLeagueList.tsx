import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronDown, ChevronUp, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shouldExcludeMatchByCountry } from "@/lib/MyMatchByCountryNewExclusion";
import { isDateStringToday, isDateStringYesterday, isDateStringTomorrow } from "@/lib/dateUtilsUpdated";
import { getCachedCountryName, setCachedCountryName } from "@/lib/countryCache";
import { countryCodeMap } from "@/lib/flagUtils";
import MyGroupNationalFlag from "../common/MyGroupNationalFlag";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { userActions } from "@/lib/store";

interface MyAllLeagueListProps {
  selectedDate: string;
}

const MyAllLeagueList: React.FC<MyAllLeagueListProps> = ({ selectedDate }) => {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [allLeagues, setAllLeagues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [isFootballExpanded, setIsFootballExpanded] = useState<boolean>(false);

  // Redux state
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  // Fetch all leagues data
  useEffect(() => {
    const fetchAllLeaguesData = async () => {
      try {
        console.log(`🔍 [MyAllLeagueList] Fetching all leagues data`);

        const response = await apiRequest("GET", "/api/leagues/all");
        const data = await response.json();

        console.log(`✅ [MyAllLeagueList] Received ${data?.length || 0} leagues`);

        if (Array.isArray(data)) {
          setAllLeagues(data);
        } else {
          setAllLeagues([]);
        }
      } catch (err) {
        console.error("❌ [MyAllLeagueList] Error fetching all leagues:", err);
        setAllLeagues([]);
      }
    };

    fetchAllLeaguesData();
  }, []);

  // Fetch fixtures data
  useEffect(() => {
    const fetchFixturesData = async () => {
      if (!selectedDate) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log(`🔍 [MyAllLeagueList] Fetching data for date: ${selectedDate}`);

        const response = await apiRequest(
          "GET",
          `/api/fixtures/date/${selectedDate}?all=true`,
        );
        const data = await response.json();

        console.log(`✅ [MyAllLeagueList] Received ${data?.length || 0} fixtures`);

        if (Array.isArray(data)) {
          setFixtures(data);
        } else {
          setFixtures([]);
        }
      } catch (err) {
        console.error("❌ [MyAllLeagueList] Error fetching fixtures:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError("Failed to load leagues. Please try again later.");
        setFixtures([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFixturesData();
  }, [selectedDate]);

  // Process fixtures and group by country/league
  const { validFixtures } = useMemo(() => {
    const allFixtures = fixtures || [];
    if (!allFixtures?.length) {
      return { validFixtures: [] };
    }

    const filtered: any[] = [];
    const seenFixtures = new Set<number>();

    allFixtures.forEach((fixture: any) => {
      if (
        !fixture ||
        !fixture.league ||
        !fixture.teams ||
        !fixture.fixture?.date ||
        !fixture.fixture?.id
      ) {
        return;
      }

      if (seenFixtures.has(fixture.fixture.id)) {
        return;
      }

      const fixtureDate = new Date(fixture.fixture.date);
      const fixtureDateString = format(fixtureDate, "yyyy-MM-dd");

      if (fixtureDateString !== selectedDate) {
        return;
      }

      seenFixtures.add(fixture.fixture.id);
      filtered.push(fixture);
    });

    return { validFixtures: filtered };
  }, [fixtures, selectedDate]);

  // Group leagues by country with live match tracking
  const leaguesByCountry = useMemo(() => {
    const grouped: { [key: string]: { country: string; leagues: any; totalMatches: number; liveMatches: number } } = {};

    // First, initialize all leagues from allLeagues data
    allLeagues.forEach((league: any) => {
      const country = league.country || "Unknown";
      const leagueId = league.id;

      if (!grouped[country]) {
        grouped[country] = {
          country,
          leagues: {},
          totalMatches: 0,
          liveMatches: 0,
        };
      }

      if (!grouped[country].leagues[leagueId]) {
        grouped[country].leagues[leagueId] = {
          league: league,
          matchCount: 0,
          liveMatchCount: 0,
        };
      }
    });

    // Then, update with actual fixture data
    validFixtures.forEach((fixture: any) => {
      const country = fixture.league.country || "Unknown";
      const leagueId = fixture.league.id;
      const leagueName = fixture.league.name || "";
      const homeTeamName = fixture.teams?.home?.name || "";
      const awayTeamName = fixture.teams?.away?.name || "";

      // Apply exclusion filter
      if (shouldExcludeMatchByCountry(leagueName, homeTeamName, awayTeamName, false, country)) {
        return;
      }

      // Check if match is live
      const statusShort = fixture.fixture?.status?.short;
      const isLive = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(statusShort);

      if (!grouped[country]) {
        grouped[country] = {
          country,
          leagues: {},
          totalMatches: 0,
          liveMatches: 0,
        };
      }

      if (!grouped[country].leagues[leagueId]) {
        grouped[country].leagues[leagueId] = {
          league: fixture.league,
          matchCount: 0,
          liveMatchCount: 0,
        };
      }

      grouped[country].leagues[leagueId].matchCount++;
      grouped[country].totalMatches++;

      if (isLive) {
        grouped[country].leagues[leagueId].liveMatchCount++;
        grouped[country].liveMatches++;
      }
    });

    return grouped;
  }, [validFixtures, allLeagues]);

  // Country name mapping
  const getCountryDisplayName = (country: string | null | undefined): string => {
    if (!country || typeof country !== "string" || country.trim() === "") {
      return "Unknown";
    }

    const cachedName = getCachedCountryName(country);
    if (cachedName) {
      return cachedName;
    }

    const countryNameMap: { [key: string]: string } = {};
    Object.entries(countryCodeMap).forEach(([countryName, countryCode]) => {
      if (countryCode.length === 2) {
        countryNameMap[countryCode.toLowerCase()] = countryName;
      }
    });

    const additionalMappings: { [key: string]: string } = {
      "czech republic": "Czech-Republic",
      "united arab emirates": "United Arab Emirates",
      "saudi arabia": "Saudi Arabia",
      "united states": "United States",
      "korea republic": "South Korea",
      "russian federation": "Russia",
    };

    const cleanCountry = country.trim().toLowerCase();
    const displayName = countryNameMap[cleanCountry] || additionalMappings[cleanCountry] || country;

    setCachedCountryName(country, displayName, "country-mapping");
    return displayName;
  };

  // Get header title
  const getHeaderTitle = () => {
    if (isDateStringToday(selectedDate)) {
      return "Today's Football Leagues";
    } else if (isDateStringYesterday(selectedDate)) {
      return "Yesterday's Football Leagues";
    } else if (isDateStringTomorrow(selectedDate)) {
      return "Tomorrow's Football Leagues";
    } else {
      try {
        const customDate = parseISO(selectedDate);
        if (isValid(customDate)) {
          return `${format(customDate, "EEEE, MMMM do")} Football Leagues`;
        } else {
          return "Football Leagues";
        }
      } catch {
        return "Football Leagues";
      }
    }
  };

  // Toggle country expansion
  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(country)) {
        newExpanded.delete(country);
      } else {
        newExpanded.add(country);
      }
      return newExpanded;
    });
  };

  // Toggle Football section expansion
  const toggleFootballSection = () => {
    setIsFootballExpanded(prev => !prev);
  };

  // Toggle favorite league
  const toggleFavoriteLeague = (leagueId: number) => {
    const leagueIdStr = leagueId.toString();
    const isFavorite = user.preferences.favoriteLeagues.includes(leagueIdStr);

    if (isFavorite) {
      dispatch(userActions.removeFavoriteLeague(leagueIdStr));
      if (user.isAuthenticated && user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteLeagues: user.preferences.favoriteLeagues.filter(
            (id) => id !== leagueIdStr,
          ),
        }).catch((err) => {
          console.error("Failed to remove favorite league:", err);
          dispatch(userActions.addFavoriteLeague(leagueIdStr));
        });
      }
    } else {
      dispatch(userActions.addFavoriteLeague(leagueIdStr));
      if (user.isAuthenticated && user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteLeagues: [...user.preferences.favoriteLeagues, leagueIdStr],
        }).catch((err) => {
          console.error("Failed to add favorite league:", err);
          dispatch(userActions.removeFavoriteLeague(leagueIdStr));
        });
      }
    }
  };

  // Define all football countries
  const allFootballCountries = [
    "World", "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia", 
    "Australia", "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belgium", "Bolivia", 
    "Bosnia and Herzegovina", "Botswana", "Brazil", "Bulgaria", "Burkina Faso", 
    "Cameroon", "Canada", "Chile", "China", "Colombia", "Croatia", "Czech Republic", 
    "Denmark", "Egypt", "England", "Estonia", "Ethiopia", "Faroe Islands", "Finland", 
    "France", "Georgia", "Germany", "Ghana", "Greece", "Hungary", "Iceland", "India", 
    "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Japan", "Jordan", 
    "Kazakhstan", "Kenya", "Kuwait", "Lithuania", "Luxembourg", "Malaysia", "Mali", 
    "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman", 
    "Pakistan", "Panama", "Paraguay", "Peru", "Poland", "Portugal", "Qatar", 
    "Romania", "Russia", "Saudi Arabia", "Scotland", "Senegal", "Serbia", "Singapore", 
    "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sweden", 
    "Switzerland", "Thailand", "Tunisia", "Turkey", "Ukraine", "United Arab Emirates", 
    "Uruguay", "USA", "Uzbekistan", "Venezuela", "Vietnam", "Wales", "Yemen", "Zambia", "Zimbabwe"
  ];

  // Sort countries alphabetically with World first, showing only countries with matches
  const sortedCountries = useMemo(() => {
    // Get all countries from leaguesByCountry and filter out those with no matches
    const allCountriesData = Object.values(leaguesByCountry)
      .filter((countryData: any) => countryData.totalMatches > 0);

    return allCountriesData.sort((a: any, b: any) => {
      const countryA = typeof a.country === "string" ? a.country : "";
      const countryB = typeof b.country === "string" ? b.country : "";

      const aIsWorld = countryA.toLowerCase() === "world";
      const bIsWorld = countryB.toLowerCase() === "world";

      if (aIsWorld && !bIsWorld) return -1;
      if (bIsWorld && !aIsWorld) return 1;

      return countryA.localeCompare(countryB);
    });
  }, [leaguesByCountry]);

  if (!selectedDate) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Please select a valid date</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-red-500 font-medium text-sm">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !fixtures.length) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-52" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validFixtures.length) {
    return null;
  }

  return (
    <Card className="w-full bg-white ">
      <CardHeader className="flex flex-row justify-between items-center space-y-0 p-4 border-b border-stone-200 text-sm font-bold">
         {/* All Leagues A-Z Section */}
        <div className="flex justify-between items-center w-full">
          All Leagues A-Z
        </div>
      </CardHeader>
      <CardContent className="p-0">



        {/* Football Section with Countries */}
        <div className="divide-y divide-gray-100">
          {/* Football Header - Clickable */}
          <button
            onClick={toggleFootballSection}
            className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="text-gray-900 font-medium"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "14px",
                  }}
                >
                  Football
                </span>
                {/* Expand/Collapse Icon */}
                {isFootballExpanded }
              </div>
              <span 
                className="text-gray-500 text-sm"
                style={{
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                {(() => {
                  const totalLiveMatches = Object.values(leaguesByCountry).reduce(
                    (sum: number, countryData: any) => sum + (countryData.liveMatches || 0),
                    0
                  );
                  if (totalLiveMatches > 0) {
                    return (
                      <>
                        (<span className="text-red-500 font-semibold">{totalLiveMatches}</span>/{validFixtures.length})
                      </>
                    );
                  }
                  return `(${validFixtures.length})`;
                })()}
              </span>
            </div>
          </button>

          {/* Countries under Football - Show when expanded */}
          {isFootballExpanded && sortedCountries.map((countryData: any) => {
            const totalLeagues = Object.keys(countryData.leagues || {}).length;
            const totalMatches = countryData.totalMatches || 0;
            const liveMatches = countryData.liveMatches || 0;

            const hasMatches = totalMatches > 0;
            const isExpanded = expandedCountries.has(countryData.country);

            return (
              <div key={countryData.country} className="border-b border-gray-100 last:border-b-0">
                {/* Country Header - Clickable (nested under Football) */}
                <button
                  onClick={() => toggleCountry(countryData.country)}
                  className={`w-full flex items-center justify-between pl-2 pr-4 py-3 transition-colors  hover:bg-gray-50 cursor-pointer `}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const countryName = typeof countryData.country === "string"
                        ? countryData.country
                        : countryData.country?.name || "Unknown";

                      if (countryName === "World") {
                        return (
                          <MyGroupNationalFlag
                            teamName="World"
                            fallbackUrl="/assets/matchdetaillogo/cotif tournament.png"
                            alt="World"
                            size="24px"
                          />
                        );
                      }

                      return (
                        <MyGroupNationalFlag
                          teamName={countryName}
                          fallbackUrl="/assets/fallback-logo.svg"
                          alt={countryName}
                          size="24px"
                        />
                      );
                    })()}
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium text-gray-900"
                        style={{
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: "14px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "150px",
                        }}
                      >
                        {getCountryDisplayName(countryData.country)}
                      </span>
                      <span
                        className={`text-sm ${hasMatches ? 'text-gray-500' : 'text-gray-300'}`}
                        style={{
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

                        }}
                      >
                        ({liveMatches > 0 ? (
                          <>
                            <span className="text-red-500">{liveMatches}</span>
                            <span>/{totalMatches}</span>
                          </>
                        ) : totalMatches})
                      </span>
                    </div>
                  </div>

                  {/* Expand/Collapse Icon for Country */}
                  {totalLeagues > 0 && (
                    isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )
                  )}
                </button>

                {/* Leagues List - Show when expanded and has leagues */}
                {isExpanded && totalLeagues > 0 && (
                  <div className="   ">
                    {Object.values(countryData.leagues)
                      .sort((a: any, b: any) => a.league.name.localeCompare(b.league.name))
                      .map((leagueData: any) => {
                        const leagueId = leagueData.league.id;
                        const isStarred = user.preferences.favoriteLeagues.includes(leagueId.toString());

                        return (
                          <div key={leagueId} className="group relative flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700  px-2 transition-colors w-full">
                            <img
                              src={(() => {
                                const leagueName = leagueData.league.name?.toLowerCase() || "";
                                if (leagueName.includes("cotif")) {
                                  return "/assets/matchdetaillogo/cotif tournament.png";
                                }
                                return leagueData.league.logo || "/assets/fallback-logo.svg";
                              })()}
                              alt={leagueData.league.name || "Unknown League"}
                              className="w-5 h-5 object-contain rounded-full"
                              style={{ backgroundColor: "transparent" }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const leagueName = leagueData.league.name?.toLowerCase() || "";
                                if (leagueName.includes("cotif") && !target.src.includes("fallback-logo.svg")) {
                                  target.src = "/assets/fallback-logo.svg";
                                } else if (!target.src.includes("fallback-logo.svg")) {
                                  target.src = "/assets/fallback-logo.svg";
                                }
                              }}
                            />
                            <div className="flex-1">
                              <span
                                className="text-sm dark:text-white"
                                style={{
                                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                }}
                              >
                                {safeSubstring(leagueData.league.name, 0) || "Unknown League"}
                              </span>
                            </div>
                            <span
                              className="text-gray-500 dark:text-gray-400 text-xs mr-8"
                              style={{
                                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                              }}
                            >
                              {leagueData.liveMatchCount > 0 ? (
                                <>
                                  (<span className="text-red-500">{leagueData.liveMatchCount}</span>/{leagueData.matchCount})
                                </>
                              ) : `(${leagueData.matchCount})`}
                            </span>

                            {/* Star Button - Slides from right */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteLeague(leagueId);
                              }}
                              className={`absolute right-2 w-6 h-full -mr-2 flex items-center justify-center transition-all duration-300 ease-out  ${
                                isStarred
                                  ? 'opacity-100 transform translate-x-0 bg-white'
                                  : 'opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 group-hover:bg-white '
                              }`}
                              title={`${isStarred ? "Remove from" : "Add to"} favorites`}
                            >
                              <Star
                                className={`h-4 w-4 transition-colors ${
                                  isStarred
                                    ? "text-blue-500 fill-blue-500"
                                    : "text-blue-500"
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyAllLeagueList;