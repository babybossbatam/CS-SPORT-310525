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
import { useCachedQuery } from "@/lib/cachingHelper";
import { performanceMonitor } from "@/lib/performanceMonitor";
import { useLanguage, useTranslation, countryToLanguageMap } from "@/contexts/LanguageContext";
import { smartLeagueCountryTranslation } from "@/lib/smartLeagueCountryTranslation";

interface MyAllLeagueListProps {
  selectedDate: string;
}

const MyAllLeagueList: React.FC<MyAllLeagueListProps> = ({ selectedDate }) => {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
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
    error: fixturesError
  } = useCachedQuery(
    ['all-fixtures-by-date', selectedDate],
    async () => {
      if (!selectedDate) return [];
      
      performanceMonitor.startMeasure('fixtures-fetch');
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();
      performanceMonitor.endMeasure('fixtures-fetch');
      return Array.isArray(data) ? data : [];
    },
    {
      enabled: !!selectedDate,
      staleTime: 5 * 60 * 1000, // 5 minutes for fixtures
      maxAge: 30 * 60 * 1000
    }
  );

  // Update local state when fixtures data changes
  useEffect(() => {
    if (fixturesData) {
      setFixtures(fixturesData);
      
      // Enhanced auto-learning from fixtures data
      if (Array.isArray(fixturesData) && fixturesData.length > 0) {
        // Learn from fixtures using the smart translation system
        smartLeagueCountryTranslation.learnFromFixtures(fixturesData);
        
        // Additional learning pass for country names specifically
        const uniqueCountries = new Set<string>();
        fixturesData.forEach((fixture: any) => {
          if (fixture?.league?.country && fixture.league.country !== "Unknown") {
            uniqueCountries.add(fixture.league.country.trim());
          }
        });
        
        // Learn each unique country name
        uniqueCountries.forEach(countryName => {
          smartLeagueCountryTranslation.autoLearnFromAnyCountryName(countryName, {
            leagueContext: "multiple fixtures",
            occurrenceCount: fixturesData.filter(f => f?.league?.country === countryName).length
          });
        });
        
        console.log(`📚 [Country Learning] Learned from ${uniqueCountries.size} unique countries in ${fixturesData.length} fixtures`);
      }
    }
    setIsLoading(isFixturesLoading);
    setError(fixturesError ? "Failed to load fixtures. Please try again later." : null);
  }, [fixturesData, isFixturesLoading, fixturesError]);

  // Optimized: Group leagues by country with match counts only (no full fixture processing)
  const leaguesByCountry = useMemo(() => {
    const grouped: { [key: string]: { country: string; leagues: any; totalMatches: number; liveMatches: number } } = {};
    const allFixtures = fixtures || [];
    
    if (!allFixtures?.length) {
      return grouped;
    }

    const seenFixtures = new Set<number>();

    // Process fixtures minimally for counts only
    allFixtures.forEach((fixture: any) => {
      // Quick validation
      if (
        !fixture?.league?.id ||
        !fixture?.fixture?.id ||
        !fixture?.fixture?.date ||
        seenFixtures.has(fixture.fixture.id)
      ) {
        return;
      }

      // Quick date check
      const fixtureDate = fixture.fixture.date.substring(0, 10); // Extract YYYY-MM-DD
      if (fixtureDate !== selectedDate) {
        return;
      }

      seenFixtures.add(fixture.fixture.id);

      const country = fixture.league.country || "Unknown";
      const leagueId = fixture.league.id;
      const leagueName = fixture.league.name || "";

      // Quick exclusion check (simplified)
      const homeTeamName = fixture.teams?.home?.name || "";
      const awayTeamName = fixture.teams?.away?.name || "";
      if (shouldExcludeMatchByCountry(leagueName, homeTeamName, awayTeamName, false, country)) {
        return;
      }

      // Enhanced auto-learning for country and league names
      if (leagueName) {
        smartLeagueCountryTranslation.autoLearnFromAnyLeagueName(leagueName, { 
          countryName: country, 
          leagueId: leagueId,
          fixtureContext: true
        });
      }
      if (country && country !== "Unknown") {
        smartLeagueCountryTranslation.autoLearnFromAnyCountryName(country, {
          leagueContext: leagueName,
          occurrenceCount: 1,
          fixtureContext: true,
          normalizedName: country.trim()
        });
      }

      // Quick live status check
      const statusShort = fixture.fixture?.status?.short;
      const isLive = statusShort && ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(statusShort);

      // Initialize country group
      if (!grouped[country]) {
        grouped[country] = {
          country,
          leagues: {},
          totalMatches: 0,
          liveMatches: 0,
        };
      }

      // Initialize league
      if (!grouped[country].leagues[leagueId]) {
        grouped[country].leagues[leagueId] = {
          league: fixture.league,
          matchCount: 0,
          liveMatchCount: 0,
        };
      }

      // Increment counts
      grouped[country].leagues[leagueId].matchCount++;
      grouped[country].totalMatches++;

      if (isLive) {
        grouped[country].leagues[leagueId].liveMatchCount++;
        grouped[country].liveMatches++;
      }
    });

    return grouped;
  }, [fixtures, selectedDate]);

  // Get total match count for header
  const totalMatches = useMemo(() => {
    return Object.values(leaguesByCountry).reduce((sum, countryData) => sum + countryData.totalMatches, 0);
  }, [leaguesByCountry]);

  // Enhanced country name mapping with intelligent learning translation system
  const getCountryDisplayName = (country: string | null | undefined): string => {
    if (!country || typeof country !== "string" || country.trim() === "") {
      return t('unknown') || "Unknown";
    }

    const originalCountry = country.trim();

    // Step 1: Enhanced reverse translation detection for already-translated names (fixed duplicates)
    const reverseTranslationMap: { [key: string]: string } = {
      // Simplified Chinese translations back to English
      "巴西": "Brazil",
      "哥伦比亚": "Colombia", 
      "阿根廷": "Argentina",
      "西班牙": "Spain",
      "德国": "Germany",
      "意大利": "Italy",
      "法国": "France",
      "英格兰": "England",
      "俄罗斯": "Russia",
      "美国": "United States",
      "加拿大": "Canada",
      "澳大利亚": "Australia",
      "荷兰": "Netherlands",
      "葡萄牙": "Portugal",
      "比利时": "Belgium",
      "墨西哥": "Mexico",
      "世界": "World",
      // Traditional Chinese translations back to English
      "哥倫比亞": "Colombia",
      "阿根廷_TW": "Argentina", 
      "西班牙_TW": "Spain",
      "德國": "Germany",
      "法國": "France",
      "英格蘭": "England",
      "俄羅斯": "Russia",
      "美國": "United States",
      "加拿大_TW": "Canada",
      "澳大利亞": "Australia",
      "荷蘭": "Netherlands",
      "葡萄牙_TW": "Portugal",
      "比利時": "Belgium",
      "墨西哥_TW": "Mexico",
      "世界_TW": "World"
    };

    // Check if this is already a translated name that needs to be normalized back to English first
    const normalizedCountry = reverseTranslationMap[originalCountry] || originalCountry;

    // Step 2: Auto-learn from the normalized country name with enhanced context
    smartLeagueCountryTranslation.autoLearnFromAnyCountryName(normalizedCountry, {
      leagueContext: "multiple leagues",
      occurrenceCount: 1,
      originalName: originalCountry !== normalizedCountry ? originalCountry : undefined,
      fixtureContext: true,
      normalizedName: normalizedCountry
    });

    // Step 3: Get smart translation using the learning system with normalized name
    const smartTranslation = smartLeagueCountryTranslation.translateCountryName(normalizedCountry, currentLanguage);
    
    // If smart translation worked and is appropriate for current language, use it
    if (smartTranslation && smartTranslation !== normalizedCountry && smartTranslation.length > 0) {
      console.log(`🌍 [Smart Country Translation] "${originalCountry}" → "${normalizedCountry}" → "${smartTranslation}" (${currentLanguage})`);
      
      // Cache both the original and smart translation result
      setCachedCountryName(originalCountry, smartTranslation, "smart-translation");
      setCachedCountryName(normalizedCountry, smartTranslation, "smart-translation");
      
      // Special handling for "World" to ensure perfect translation
      if (normalizedCountry.toLowerCase() === "world") {
        console.log(`🌐 [World Translation] Perfect translation for "World": "${smartTranslation}" (${currentLanguage})`);
      }
      
      return smartTranslation;
    }

    // Step 4: Check if we have a cached translation
    const cachedName = getCachedCountryName(originalCountry) || getCachedCountryName(normalizedCountry);
    if (cachedName && cachedName !== originalCountry && cachedName !== normalizedCountry) {
      console.log(`💾 [Cached Country Translation] "${originalCountry}" → "${cachedName}"`);
      return cachedName;
    }

    // Step 5: Enhanced country mappings for common variations and normalization
    const enhancedCountryMappings: { [key: string]: string } = {
      // Basic normalization
      "czech republic": "Czech Republic",
      "czech-republic": "Czech Republic", 
      "united arab emirates": "United Arab Emirates",
      "saudi arabia": "Saudi Arabia",
      "united states": "United States",
      "usa": "United States",
      "korea republic": "South Korea",
      "south korea": "South Korea",
      "russian federation": "Russia",
      "england": "England",
      "scotland": "Scotland",
      "wales": "Wales",
      "northern ireland": "Northern Ireland",
      "republic of ireland": "Ireland",
      "korea dpr": "North Korea",
      // Special case for World
      "world": "World",
      // Countries from your image
      "armenia": "Armenia",
      "australia": "Australia", 
      "bhutan": "Bhutan",
      "bolivia": "Bolivia",
      "canada": "Canada",
      "dominican republic": "Dominican Republic",
      "dominican-republic": "Dominican Republic",
      "denmark": "Denmark",
      "estonia": "Estonia",
      "ecuador": "Ecuador",
      "colombia": "Colombia",
      "brazil": "Brazil",
      // Additional common countries
      "netherlands": "Netherlands",
      "germany": "Germany",
      "france": "France",
      "italy": "Italy",
      "spain": "Spain",
      "portugal": "Portugal",
      "belgium": "Belgium",
      "switzerland": "Switzerland",
      "austria": "Austria",
      "poland": "Poland",
      "turkey": "Turkey",
      "greece": "Greece",
      "norway": "Norway",
      "sweden": "Sweden",
      "finland": "Finland"
    };

    // Step 6: Use country code mapping as fallback
    const countryNameMap: { [key: string]: string } = {};
    Object.entries(countryCodeMap).forEach(([countryName, countryCode]) => {
      if (countryCode.length === 2) {
        countryNameMap[countryCode.toLowerCase()] = countryName;
      }
    });

    const cleanCountry = normalizedCountry.toLowerCase();
    let displayName = enhancedCountryMappings[cleanCountry] || 
                     countryNameMap[cleanCountry] || 
                     normalizedCountry;

    // Step 7: Auto-learn the mapping for future use and re-attempt translation
    if (displayName !== normalizedCountry) {
      smartLeagueCountryTranslation.autoLearnFromAnyCountryName(displayName, { 
        originalName: originalCountry,
        normalizedName: normalizedCountry,
        leagueContext: "normalization",
        fixtureContext: true
      });
      
      // Try smart translation again with normalized name
      const retryTranslation = smartLeagueCountryTranslation.translateCountryName(displayName, currentLanguage);
      if (retryTranslation && retryTranslation !== displayName && retryTranslation.length > 0) {
        console.log(`🔄 [Retry Smart Translation] "${displayName}" → "${retryTranslation}" (${currentLanguage})`);
        displayName = retryTranslation;
        
        // Special logging for World translations
        if (displayName.toLowerCase() === "world" || retryTranslation.includes("世界") || retryTranslation.includes("World")) {
          console.log(`🌐 [World Retry Translation] Perfect retry translation for World: "${retryTranslation}" (${currentLanguage})`);
        }
      }
    }

    // Step 8: Final fallback - if we're in English mode and have a normalized name, use it
    if (currentLanguage === 'en' && normalizedCountry !== originalCountry && displayName === originalCountry) {
      displayName = normalizedCountry;
      console.log(`📝 [Normalized Country] "${originalCountry}" → "${displayName}" (English fallback)`);
    }

    // Step 9: Enhanced caching and final World handling
    setCachedCountryName(originalCountry, displayName, "enhanced-mapping");
    if (normalizedCountry !== originalCountry) {
      setCachedCountryName(normalizedCountry, displayName, "enhanced-mapping");
    }

    // Step 10: Enhanced World translation with perfect learning system integration
    if (displayName.toLowerCase() === "world" || normalizedCountry.toLowerCase() === "world" || originalCountry.toLowerCase() === "world") {
      // Enhanced World translations for all supported languages with perfect context
      const enhancedWorldTranslations: { [key: string]: string } = {
        'zh': '世界',
        'zh-hk': '世界',
        'zh-tw': '世界', 
        'es': 'Mundial',
        'de': 'Welt',
        'it': 'Mondo',
        'pt': 'Mundial',
        'en': 'World'
      };

      // First, teach the smart system the perfect World translation
      const perfectWorldTranslation = enhancedWorldTranslations[currentLanguage] || enhancedWorldTranslations['en'];
      
      // Proactively teach the smart system this perfect mapping
      smartLeagueCountryTranslation.autoLearnFromAnyCountryName("World", {
        leagueContext: "international-competitions",
        preferredTranslation: perfectWorldTranslation,
        language: currentLanguage,
        fixtureContext: true,
        normalizedName: "World",
        occurrenceCount: 100 // High priority
      });

      // Now get the smart translation (should return our perfect mapping)
      let finalWorldTranslation = smartLeagueCountryTranslation.translateCountryName("World", currentLanguage);
      
      // If smart translation doesn't work as expected, use our enhanced fallback
      if (!finalWorldTranslation || finalWorldTranslation === "World" || finalWorldTranslation === originalCountry) {
        finalWorldTranslation = perfectWorldTranslation;
        console.log(`🔄 [World Fallback] Using enhanced fallback: "${finalWorldTranslation}" (${currentLanguage})`);
      }

      if (finalWorldTranslation && finalWorldTranslation.length > 0) {
        console.log(`🌐 [Perfect World Translation] "${originalCountry}" → "${finalWorldTranslation}" (${currentLanguage})`);
        displayName = finalWorldTranslation;
        
        // Cache all possible variations of World
        const worldVariations = ["World", "world", "WORLD", "世界"];
        worldVariations.forEach(variation => {
          setCachedCountryName(variation, finalWorldTranslation, "perfect-world-translation");
        });
        setCachedCountryName(originalCountry, finalWorldTranslation, "perfect-world-translation");
        
        // Reinforce the learning with all variations
        const reinforceVariations = ["World", "world", "WORLD"];
        reinforceVariations.forEach(variation => {
          smartLeagueCountryTranslation.autoLearnFromAnyCountryName(variation, {
            leagueContext: "international-world-competitions",
            preferredTranslation: finalWorldTranslation,
            language: currentLanguage,
            fixtureContext: true,
            normalizedName: "World",
            occurrenceCount: 50
          });
        });
      }
    }
    
    console.log(`🗺️ [Enhanced Country Mapping] "${originalCountry}" → "${displayName}" (Language: ${currentLanguage})`);
    return displayName;
  };

  // Get header title
  const getHeaderTitle = () => {
    if (isDateStringToday(selectedDate)) {
      return t('today_matches');
    } else if (isDateStringYesterday(selectedDate)) {
      return t('yesterday_matches');
    } else if (isDateStringTomorrow(selectedDate)) {
      return t('tomorrow_matches');
    } else {
      try {
        const customDate = parseISO(selectedDate);
        if (isValid(customDate)) {
          return `${format(customDate, "EEEE, MMMM do")} ${t('football_leagues')}`;
        } else {
          return t('football_leagues');
        }
      } catch {
        return t('football_leagues');
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

  // Handle country flag click for language switching
  const handleCountryFlagClick = (countryName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const languageCode = countryToLanguageMap[countryName];
    if (languageCode) {
      setLanguage(languageCode);
    }
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

  if (!totalMatches) {
    return null;
  }

  return (
    <Card className="w-full bg-white ">
      <CardHeader className="flex flex-row justify-between items-center space-y-0 p-4 border-b border-stone-200 text-sm font-bold">
         {/* All Leagues A-Z Section */}
        <div className="flex justify-between items-center w-full">
          {t('all_leagues')}
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
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "14px",
                  }}
                >
                  {t('football')}
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
                        (<span className="text-red-500 font-semibold">{totalLiveMatches}</span>/{totalMatches})
                      </>
                    );
                  }
                  return `(${totalMatches})`;
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
                  className={`w-full flex items-center justify-between pl-2 pr-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer `}
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const countryName = typeof countryData.country === "string"
                        ? countryData.country
                        : countryData.country?.name || "Unknown";

                      // Get the display name using smart translation
                      const displayCountryName = getCountryDisplayName(countryName);
                      
                      // Check for World using both original and translated names
                      const isWorldCountry = countryName.toLowerCase() === "world" || 
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
                      const hasLanguageMapping = countryToLanguageMap[countryName] || countryToLanguageMap[displayCountryName];
                      
                      return hasLanguageMapping ? (
                        <button
                          onClick={(e) => handleCountryFlagClick(countryName, e)}
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