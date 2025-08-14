import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { LEAGUES_BY_COUNTRY, getLeaguesForCountry, mergeStaticWithDynamicLeagues, LeagueInfo } from "@/lib/constants/leaguesByCountry";

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

  // Optimized: Group leagues by country using static data + fixtures
  const leaguesByCountry = useMemo(() => {
    const allFixtures = fixtures || [];
    
    // Initialize with static league data
    const grouped: {
      [key: string]: {
        country: string;
        leagues: any;
        totalMatches: number;
        liveMatches: number;
      };
    } = {};

    // First, populate with static leagues (no matches initially)
    Object.keys(LEAGUES_BY_COUNTRY).forEach(country => {
      const staticLeagues = getLeaguesForCountry(country);
      grouped[country] = {
        country,
        leagues: {},
        totalMatches: 0,
        liveMatches: 0,
      };

      // Initialize static leagues with zero counts
      staticLeagues.forEach(league => {
        grouped[country].leagues[league.id] = {
          league: {
            id: league.id,
            name: league.name,
            logo: league.logo,
            country: league.country
          },
          matchCount: 0,
          liveMatchCount: 0,
        };
      });
    });

    // If no fixtures, return static data with zero counts
    if (!allFixtures?.length) {
      return grouped;
    }

    const liveStatuses = new Set(["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"]);
    const seenFixtures = new Set<number>();

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

    // Now update with actual fixture data
    for (const fixture of validFixtures) {
      const country = fixture.league.country || "Unknown";
      const leagueId = fixture.league.id;
      const status = fixture.fixture?.status?.short;

      // Quick live check
      const isLive = liveStatuses.has(status) &&
        (Date.now() - new Date(fixture.fixture.date).getTime()) <= 4 * 60 * 60 * 1000;

      // Initialize country if not in static data
      if (!grouped[country]) {
        grouped[country] = {
          country,
          leagues: {},
          totalMatches: 0,
          liveMatches: 0,
        };
      }

      const countryData = grouped[country];
      
      // Initialize league if not in static data
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

    return grouped;
  }, [fixtures, selectedDate]);

  // Get total match count for header
  const totalMatches = useMemo(() => {
    return Object.values(leaguesByCountry).reduce(
      (sum, countryData) => sum + countryData.totalMatches,
      0,
    );
  }, [leaguesByCountry]);

  // Enhanced country name translation using the smart translation system
  const getCountryDisplayName = useCallback((country: string | null | undefined): string => {
    if (!country || typeof country !== "string") {
      return "Unknown";
    }

    const originalCountry = country.trim();

    // Use the smart translation system
    const translation = smartLeagueCountryTranslation.translateCountryName(originalCountry, currentLanguage);
    
    // Log translation for debugging
    console.log(`🌍 [MyAllLeagueList] Translating country: "${originalCountry}" -> "${translation}" (language: ${currentLanguage})`);
    
    // Return translation if available, otherwise return original
    return translation || originalCountry;
  }, [currentLanguage]);

  // Enhanced league name translation using the smart translation system
  const getLeagueDisplayName = useCallback((leagueName: string | null | undefined): string => {
    if (!leagueName || typeof leagueName !== "string") {
      return "Unknown League";
    }

    const originalLeague = leagueName.trim();

    // Use the smart translation system
    const translation = smartLeagueCountryTranslation.translateLeagueName(originalLeague, currentLanguage);
    
    // Return translation if available, otherwise return original
    return translation || originalLeague;
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

  

  // Get countries that actually have matches for the selected date
  const countriesWithMatches = useMemo(() => {
    const countriesSet = new Set();
    
    // Extract unique countries from fixtures efficiently
    if (fixtures && fixtures.length > 0) {
      fixtures.forEach(fixture => {
        if (fixture?.league?.country) {
          countriesSet.add(fixture.league.country);
        }
      });
    }

    return Array.from(countriesSet);
  }, [fixtures]);

  // Get all countries from LEAGUES_BY_COUNTRY (whether they have matches or not)
  const allAvailableCountries = useMemo(() => {
    return Object.keys(LEAGUES_BY_COUNTRY);
  }, []);

  // Static countries list to show immediately (before fixtures load)
  const staticCountriesList = useMemo(() => {
    const staticCountries = [];
    const seenDisplayNames = new Set(); // Track seen display names to avoid duplicates
    const seenOriginalNames = new Set(); // Track original names that have been translated
    
    // Add main countries from static data first
    allAvailableCountries.forEach(country => {
      // Use the enhanced translation function that includes fallbacks
      const displayName = getCountryDisplayName(country);
      
      // Skip if we've already seen this display name
      if (seenDisplayNames.has(displayName)) {
        console.log(`🚫 [StaticList] Skipping duplicate display name: "${country}" -> "${displayName}"`);
        return;
      }
      
      // If this is a translation (display name differs from original), mark the original as seen
      if (displayName !== country) {
        seenOriginalNames.add(country);
      }
      
      // Skip if this original name was already used for a translation
      if (seenOriginalNames.has(country) && displayName === country) {
        console.log(`🚫 [StaticList] Skipping original name that was already translated: "${country}"`);
        return;
      }
      
      seenDisplayNames.add(displayName);
      
      const mappedData = {
        originalName: country,
        displayName,
        hasLanguageMapping: !!(countryToLanguageMap[country] || countryToLanguageMap[displayName])
      };
      
      staticCountries.push({
        country,
        leagues: getLeaguesForCountry(country).reduce((acc, league) => {
          acc[league.id] = {
            league: {
              id: league.id,
              name: league.name,
              logo: league.logo,
              country: league.country
            },
            matchCount: 0,
            liveMatchCount: 0,
          };
          return acc;
        }, {}),
        totalMatches: 0,
        liveMatches: 0,
        mappedData
      });
      
      console.log(`🏁 [StaticList] Country: "${country}" -> "${displayName}" (${currentLanguage})`);
    });

    // Sort alphabetically by display name
    staticCountries.sort((a: any, b: any) => 
      a.mappedData.displayName.localeCompare(b.mappedData.displayName)
    );

    return staticCountries;
  }, [allAvailableCountries, currentLanguage, countryToLanguageMap, getCountryDisplayName]);

  // Dynamic countries with actual match data (when fixtures are loaded)
  const sortedCountries = useMemo(() => {
    // Always show the static list first to ensure all countries are visible
    // Then merge with dynamic data when available
    const countriesData = [];
    const seenDisplayNames = new Set(); // Track seen display names to avoid duplicates
    const seenOriginalNames = new Set(); // Track original names that have been translated

    // First, add all countries from static list (always show all countries)
    allAvailableCountries.forEach(country => {
      const countryData = leaguesByCountry[country];
      
      // Use the enhanced translation function that includes fallbacks
      const displayName = getCountryDisplayName(country);
      
      // Skip if we've already seen this display name
      if (seenDisplayNames.has(displayName)) {
        console.log(`🚫 [AllCountries] Skipping duplicate display name: "${country}" -> "${displayName}"`);
        return;
      }
      
      // If this is a translation (display name differs from original), mark the original as seen
      if (displayName !== country) {
        seenOriginalNames.add(country);
      }
      
      // Skip if this original name was already used for a translation
      if (seenOriginalNames.has(country) && displayName === country) {
        console.log(`🚫 [AllCountries] Skipping original name that was already translated: "${country}"`);
        return;
      }
      
      seenDisplayNames.add(displayName);
      
      // Use actual match data if available, otherwise use static data structure
      const finalCountryData = countryData || {
        country,
        leagues: getLeaguesForCountry(country).reduce((acc, league) => {
          acc[league.id] = {
            league: {
              id: league.id,
              name: league.name,
              logo: league.logo,
              country: league.country
            },
            matchCount: 0,
            liveMatchCount: 0,
          };
          return acc;
        }, {}),
        totalMatches: 0,
        liveMatches: 0,
      };
      
      countriesData.push({
        ...finalCountryData,
        mappedData: {
          originalName: country,
          displayName,
          hasLanguageMapping: !!(countryToLanguageMap[country] || countryToLanguageMap[displayName])
        }
      });
      
      console.log(`🌍 [AllCountries] Added country: "${country}" -> "${displayName}" (matches: ${finalCountryData.totalMatches})`);
    });

    // Then add any additional countries that have matches but aren't in our static list
    if (fixtures && fixtures.length > 0) {
      countriesWithMatches.forEach(country => {
        if (!allAvailableCountries.includes(country)) {
          const countryData = leaguesByCountry[country];
          if (countryData && countryData.totalMatches > 0) {
            // Use the enhanced translation function that includes fallbacks
            const displayName = getCountryDisplayName(country);
            
            // Skip if we've already seen this display name
            if (seenDisplayNames.has(displayName)) {
              console.log(`🚫 [AllCountries] Skipping duplicate dynamic country: "${country}" -> "${displayName}"`);
              return;
            }
            
            // If this is a translation (display name differs from original), mark the original as seen
            if (displayName !== country) {
              seenOriginalNames.add(country);
            }
            
            // Skip if this original name was already used for a translation
            if (seenOriginalNames.has(country) && displayName === country) {
              console.log(`🚫 [AllCountries] Skipping dynamic original name that was already translated: "${country}"`);
              return;
            }
            
            seenDisplayNames.add(displayName);
            
            countriesData.push({
              ...countryData,
              mappedData: {
                originalName: country,
                displayName,
                hasLanguageMapping: !!(countryToLanguageMap[country] || countryToLanguageMap[displayName])
              }
            });
            
            console.log(`🌍 [AllCountries] Added dynamic country: "${country}" -> "${displayName}" (matches: ${countryData.totalMatches})`);
          }
        }
      });
    }

    // Separate World and others
    let worldCountry = null;
    const otherCountries = [];

    for (const country of countriesData) {
      if (country.country?.toLowerCase() === "world") {
        worldCountry = country;
      } else {
        otherCountries.push(country);
      }
    }

    // Sort others alphabetically by display name
    otherCountries.sort((a: any, b: any) => 
      a.mappedData.displayName.localeCompare(b.mappedData.displayName)
    );

    return worldCountry ? [worldCountry, ...otherCountries] : otherCountries;
  }, [leaguesByCountry, countriesWithMatches, allAvailableCountries, getCountryDisplayName, countryToLanguageMap, fixtures, staticCountriesList]);

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

  // Show the card structure immediately, even while loading
  const shouldShowContent = true; // Always show the card structure

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
                {isFootballExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
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

          {/* Countries under Football - Show when expanded */}
          {isFootballExpanded && (
            <>
              {sortedCountries.map((countryData: any) => {
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
                        const countryName = countryData.country;
                        const mappedData = countryData.mappedData;
                        const displayCountryName = mappedData.displayName;

                        // Check for World using original name
                        const isWorldCountry = countryName.toLowerCase() === "world";

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

                        // Use pre-computed language mapping check
                        return mappedData.hasLanguageMapping ? (
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
                          {countryData.mappedData.displayName}
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
                                  {getLeagueDisplayName(leagueData.league.name)}
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyAllLeagueList;