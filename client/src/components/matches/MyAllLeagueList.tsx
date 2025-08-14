import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronDown, ChevronUp, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shouldExcludeMatchByCountry } from "@/lib/MyMatchByCountryNewExclusion";
import {
  isDateStringToday,
  isDateStringYesterday,
  isDateStringTomorrow,
} from "@/lib/dateUtilsUpdated";
import { getCachedCountryName, setCachedCountryName } from "@/lib/countryCache";
import { countryCodeMap } from "@/lib/flagUtils";
import MyGroupNationalFlag from "../common/MyGroupNationalFlag";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { userActions } from "@/lib/store";
import { useCachedQuery } from "@/lib/cachingHelper";
import { performanceMonitor } from "@/lib/performanceMonitor";
import {
  useLanguage,
  useTranslation,
  countryToLanguageMap,
} from "@/contexts/LanguageContext";
import { smartLeagueCountryTranslation } from "@/lib/smartLeagueCountryTranslation";

interface MyAllLeagueListProps {
  selectedDate: string;
}

const MyAllLeagueList: React.FC<MyAllLeagueListProps> = ({ selectedDate }) => {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [isFootballExpanded, setIsFootballExpanded] = useState<boolean>(false);

  // Redux state
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  // Language functionality
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();

  // Fetch fixtures data with caching (league data is derived from fixtures)
  const {
    data: fixturesData,
    isLoading: isFixturesLoading,
    error: fixturesError,
  } = useCachedQuery(
    ["all-fixtures-by-date", selectedDate],
    async () => {
      if (!selectedDate) return [];

      performanceMonitor.startMeasure("fixtures-fetch");
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();
      performanceMonitor.endMeasure("fixtures-fetch");
      return Array.isArray(data) ? data : [];
    },
    {
      enabled: !!selectedDate,
      staleTime: 5 * 60 * 1000, // 5 minutes for fixtures
      maxAge: 30 * 60 * 1000,
    },
  );

  // Update local state when fixtures data changes (optimized)
  useEffect(() => {
    if (fixturesData) {
      setFixtures(fixturesData);

      // Defer translation learning to avoid blocking UI
      if (fixturesData.length > 0) {
        // Use setTimeout to defer heavy operations
        const timeoutId = setTimeout(() => {
          console.log(`🎓 [Auto-Learning] Processing ${fixturesData.length} fixtures for automatic translation learning...`);
          
          // Learn from fixtures in background
          smartLeagueCountryTranslation.learnFromFixtures(fixturesData);
          smartLeagueCountryTranslation.massLearnMixedLanguageLeagues(fixturesData);
          
          console.log(`✅ [Auto-Learning] Completed learning from ${fixturesData.length} fixtures`);
        }, 100); // Small delay to let UI render first

        return () => clearTimeout(timeoutId);
      }
    }
    setIsLoading(isFixturesLoading);
    setError(
      fixturesError ? "Failed to load fixtures. Please try again later." : null,
    );
  }, [fixturesData, isFixturesLoading, fixturesError]);

  // Optimized: Group leagues by country with better performance
  const leaguesByCountry = useMemo(() => {
    const allFixtures = fixtures || [];
    if (!allFixtures?.length) {
      return {};
    }

    const grouped: {
      [key: string]: {
        country: string;
        leagues: any;
        totalMatches: number;
        liveMatches: number;
      };
    } = {};

    const liveStatuses = new Set(["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"]);
    const seenFixtures = new Set<number>();
    const tempCountries: {
      [key: string]: {
        leagues: { [key: number]: any };
        totalMatches: number;
        liveMatches: number;
      };
    } = {};

    // Pre-filter fixtures by date
    const validFixtures = allFixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.league?.id || !fixture?.fixture?.id) return false;
      if (seenFixtures.has(fixture.fixture.id)) return false;
      
      const fixtureDateString = new Date(fixture.fixture.date).toISOString().split('T')[0];
      const isValidDate = fixtureDateString === selectedDate;
      
      if (isValidDate) {
        seenFixtures.add(fixture.fixture.id);
      }
      
      return isValidDate;
    });

    // Process fixtures efficiently
    for (const fixture of validFixtures) {
      const country = fixture.league.country || "Unknown";
      const leagueId = fixture.league.id;
      const status = fixture.fixture?.status?.short;

      // Quick live check
      const isLive = liveStatuses.has(status) && 
        (Date.now() - new Date(fixture.fixture.date).getTime()) <= 4 * 60 * 60 * 1000;

      // Initialize country/league data efficiently
      if (!tempCountries[country]) {
        tempCountries[country] = { leagues: {}, totalMatches: 0, liveMatches: 0 };
      }

      const countryData = tempCountries[country];
      if (!countryData.leagues[leagueId]) {
        countryData.leagues[leagueId] = {
          league: fixture.league,
          matchCount: 0,
          liveMatchCount: 0,
        };
      }

      // Update counts
      countryData.leagues[leagueId].matchCount++;
      countryData.totalMatches++;

      if (isLive) {
        countryData.leagues[leagueId].liveMatchCount++;
        countryData.liveMatches++;
      }
    }

    // Convert to final format
    for (const country in tempCountries) {
      grouped[country] = {
        country,
        leagues: tempCountries[country].leagues,
        totalMatches: tempCountries[country].totalMatches,
        liveMatches: tempCountries[country].liveMatches,
      };
    }

    return grouped;
  }, [fixtures, selectedDate]);

  // Get total match count for header
  const totalMatches = useMemo(() => {
    return Object.values(leaguesByCountry).reduce(
      (sum, countryData) => sum + countryData.totalMatches,
      0,
    );
  }, [leaguesByCountry]);

  // Optimized country name translation with stable caching
  const getCountryDisplayName = useCallback((country: string | null | undefined): string => {
    if (!country || typeof country !== "string") {
      return "Unknown";
    }

    const originalCountry = country.trim();

    // Use the smart translation system directly (it has its own caching)
    const translatedName =
      smartLeagueCountryTranslation.translateCountryName(
        originalCountry,
        currentLanguage,
      ) || originalCountry;

    return translatedName;
  }, [currentLanguage]);

  // Get header title
  const getHeaderTitle = () => {
    if (isDateStringToday(selectedDate)) {
      return t("today_matches");
    } else if (isDateStringYesterday(selectedDate)) {
      return t("yesterday_matches");
    } else if (isDateStringTomorrow(selectedDate)) {
      return t("tomorrow_matches");
    } else {
      try {
        const customDate = parseISO(selectedDate);
        if (isValid(customDate)) {
          return `${format(customDate, "EEEE, MMMM do")} ${t("football_leagues")}`;
        } else {
          return t("football_leagues");
        }
      } catch {
        return t("football_leagues");
      }
    }
  };

  // Memoized event handlers to prevent re-renders
  const toggleCountry = useCallback((country: string) => {
    setExpandedCountries((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(country)) {
        newExpanded.delete(country);
      } else {
        newExpanded.add(country);
      }
      return newExpanded;
    });
  }, []);

  const handleCountryFlagClick = useCallback((
    countryName: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    const languageCode = countryToLanguageMap[countryName];
    if (languageCode) {
      setLanguage(languageCode);
    }
  }, [setLanguage]);

  const toggleFootballSection = useCallback(() => {
    setIsFootballExpanded((prev) => !prev);
  }, []);

  const toggleFavoriteLeague = useCallback((leagueId: number) => {
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
  }, [user.preferences.favoriteLeagues, user.isAuthenticated, user.id, dispatch]);

  // Define all football countries
  const allFootballCountries = [
    "World",
    "Afghanistan",
    "Albania",
    "Algeria",
    "Angola",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahrain",
    "Bangladesh",
    "Belgium",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Bulgaria",
    "Burkina Faso",
    "Cameroon",
    "Canada",
    "Chile",
    "China",
    "Colombia",
    "Croatia",
    "Czech Republic",
    "Denmark",
    "Egypt",
    "England",
    "Estonia",
    "Ethiopia",
    "Faroe Islands",
    "Finland",
    "France",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kuwait",
    "Lithuania",
    "Luxembourg",
    "Malaysia",
    "Mali",
    "Mexico",
    "Morocco",
    "Netherlands",
    "New Zealand",
    "Nigeria",
    "Norway",
    "Oman",
    "Pakistan",
    "Panama",
    "Paraguay",
    "Peru",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Saudi Arabia",
    "Scotland",
    "Senegal",
    "Serbia",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "South Africa",
    "South Korea",
    "Spain",
    "Sweden",
    "Switzerland",
    "Thailand",
    "Tunisia",
    "Turkey",
    "Ukraine",
    "United Arab Emirates",
    "Uruguay",
    "USA",
    "Uzbekistan",
    "Venezuela",
    "Vietnam",
    "Wales",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  // Optimized sorted countries with minimal processing
  const sortedCountries = useMemo(() => {
    const countries = Object.values(leaguesByCountry);
    if (!countries.length) return [];

    // Single pass: filter, separate world, and sort
    const validCountries = countries.filter((c: any) => c.totalMatches > 0);
    let worldCountry = null;
    const otherCountries = [];

    for (const country of validCountries) {
      if (country.country?.toLowerCase() === "world") {
        worldCountry = country;
      } else {
        otherCountries.push(country);
      }
    }

    // Sort others only once
    otherCountries.sort((a: any, b: any) => a.country?.localeCompare(b.country) || 0);

    return worldCountry ? [worldCountry, ...otherCountries] : otherCountries;
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

  if (!totalMatches) {
    return null;
  }

  return (
    <Card className="w-full bg-white ">
      <CardHeader className="flex flex-row justify-between items-center space-y-0 p-4 border-b border-stone-200 text-sm font-bold">
        {/* All Leagues A-Z Section */}
        <div className="flex justify-between items-center w-full">
          {t("all_leagues")}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Football Section with Countries */}
        <div className="divide-y divide-gray-100">
          {/* Football Header - Clickable */}
          <button
            onClick={toggleFootballSection}
            className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-gray-900 dark:text-white font-medium"
                  style={{
                    fontFamily:
                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "14px",
                  }}
                >
                  {t("football")}
                </span>
                {/* Expand/Collapse Icon */}
                {isFootballExpanded}
              </div>
              <span
                className="text-gray-500 text-sm"
                style={{
                  fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                {(() => {
                  const totalLiveMatches = Object.values(
                    leaguesByCountry,
                  ).reduce(
                    (sum: number, countryData: any) =>
                      sum + (countryData.liveMatches || 0),
                    0,
                  );
                  if (totalLiveMatches > 0) {
                    return (
                      <>
                        (
                        <span className="text-red-500 font-semibold">
                          {totalLiveMatches}
                        </span>
                        /{totalMatches})
                      </>
                    );
                  }
                  return `(${totalMatches})`;
                })()}
              </span>
            </div>
          </button>

          {/* Countries under Football - Show when expanded with virtual scrolling */}
          {isFootballExpanded &&
            sortedCountries.slice(0, 30).map((countryData: any) => {
              const totalLeagues = Object.keys(
                countryData.leagues || {},
              ).length;
              const totalMatches = countryData.totalMatches || 0;
              const liveMatches = countryData.liveMatches || 0;

              const hasMatches = totalMatches > 0;
              const isExpanded = expandedCountries.has(countryData.country);

              return (
                <div
                  key={countryData.country}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  {/* Country Header - Clickable (nested under Football) */}
                  <button
                    onClick={() => toggleCountry(countryData.country)}
                    className={`w-full flex items-center justify-between pl-2 pr-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer `}
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const countryName =
                          typeof countryData.country === "string"
                            ? countryData.country
                            : countryData.country?.name || "Unknown";

                        // Get the display name using smart translation
                        const displayCountryName =
                          getCountryDisplayName(countryName);

                        // Check for World using both original and translated names
                        const isWorldCountry =
                          countryName.toLowerCase() === "world" ||
                          displayCountryName.toLowerCase().includes("world") ||
                          displayCountryName.includes("世界") ||
                          displayCountryName.includes("世界");

                        const flagElement = isWorldCountry ? (
                          <MyGroupNationalFlag
                            teamName="World"
                            fallbackUrl="/assets/matchdetaillogo/cotif tournament.png"
                            alt={displayCountryName}
                            size="24px"
                          />
                        ) : (
                          <MyGroupNationalFlag
                            teamName={countryName}
                            fallbackUrl="/assets/fallback-logo.svg"
                            alt={displayCountryName}
                            size="24px"
                          />
                        );

                        // Make flag clickable if country has language mapping (check both original and display names)
                        const hasLanguageMapping =
                          countryToLanguageMap[countryName] ||
                          countryToLanguageMap[displayCountryName];

                        return hasLanguageMapping ? (
                          <button
                            onClick={(e) =>
                              handleCountryFlagClick(countryName, e)
                            }
                            className="hover:scale-110 transition-transform duration-200 cursor-pointer"
                            title={`Switch to ${displayCountryName} language`}
                          >
                            {flagElement}
                          </button>
                        ) : (
                          flagElement
                        );
                      })()}
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium text-gray-900 dark:text-white"
                          style={{
                            fontFamily:
                              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
                          className={`text-sm ${hasMatches ? "text-gray-500" : "text-gray-300"}`}
                          style={{
                            fontFamily:
                              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          }}
                        >
                          (
                          {liveMatches > 0 ? (
                            <>
                              <span className="text-red-500">
                                {liveMatches}
                              </span>
                              <span>/{totalMatches}</span>
                            </>
                          ) : (
                            totalMatches
                          )}
                          )
                        </span>
                      </div>
                    </div>

                    {/* Expand/Collapse Icon for Country */}
                    {totalLeagues > 0 &&
                      (isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ))}
                  </button>

                  {/* Leagues List - Show when expanded and has leagues (limited for performance) */}
                  {isExpanded && totalLeagues > 0 && (
                    <div className="   ">
                      {Object.values(countryData.leagues)
                        .slice(0, 15)
                        .map((leagueData: any) => {
                          const leagueId = leagueData.league.id;
                          const isStarred =
                            user.preferences.favoriteLeagues.includes(
                              leagueId.toString(),
                            );

                          return (
                            <div
                              key={leagueId}
                              className="group relative flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700  px-2 transition-colors w-full"
                            >
                              <img
                                src={(() => {
                                  const leagueName =
                                    leagueData.league.name?.toLowerCase() || "";
                                  if (leagueName.includes("cotif")) {
                                    return "/assets/matchdetaillogo/cotif tournament.png";
                                  }
                                  return (
                                    leagueData.league.logo ||
                                    "/assets/fallback-logo.svg"
                                  );
                                })()}
                                alt={leagueData.league.name || "Unknown League"}
                                className="w-5 h-5 object-contain rounded-full"
                                style={{ backgroundColor: "transparent" }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const leagueName =
                                    leagueData.league.name?.toLowerCase() || "";
                                  if (
                                    leagueName.includes("cotif") &&
                                    !target.src.includes("fallback-logo.svg")
                                  ) {
                                    target.src = "/assets/fallback-logo.svg";
                                  } else if (
                                    !target.src.includes("fallback-logo.svg")
                                  ) {
                                    target.src = "/assets/fallback-logo.svg";
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <span
                                  className="text-sm dark:text-white"
                                  style={{
                                    fontFamily:
                                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                  }}
                                >
                                  {(() => {
                                    const originalName = leagueData.league.name || "Unknown League";
                                    
                                    // Simple translation without forcing refresh
                                    const translatedName = smartLeagueCountryTranslation.translateLeagueName(
                                      originalName,
                                      currentLanguage,
                                    );
                                    
                                    return translatedName || originalName;
                                  })()}
                                </span>
                              </div>
                              <span
                                className="text-gray-500 dark:text-gray-400 text-xs mr-8"
                                style={{
                                  fontFamily:
                                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                }}
                              >
                                {leagueData.liveMatchCount > 0 ? (
                                  <>
                                    (
                                    <span className="text-red-500">
                                      {leagueData.liveMatchCount}
                                    </span>
                                    /{leagueData.matchCount})
                                  </>
                                ) : (
                                  `(${leagueData.matchCount})`
                                )}
                              </span>

                              {/* Star Button - Slides from right */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteLeague(leagueId);
                                }}
                                className={`absolute right-2 w-6 h-full -mr-2 flex items-center justify-center transition-all duration-300 ease-out  ${
                                  isStarred
                                    ? "opacity-100 transform translate-x-0 bg-white"
                                    : "opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 group-hover:bg-white "
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