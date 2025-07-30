import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shouldExcludeMatchByCountry } from "@/lib/MyMatchByCountryNewExclusion";
import { isDateStringToday, isDateStringYesterday, isDateStringTomorrow } from "@/lib/dateUtilsUpdated";
import { getCachedCountryName, setCachedCountryName } from "@/lib/countryCache";
import { countryCodeMap } from "@/lib/flagUtils";
import MyGroupNationalFlag from "../common/MyGroupNationalFlag";

interface MyAllLeagueListProps {
  selectedDate: string;
}

const MyAllLeagueList: React.FC<MyAllLeagueListProps> = ({ selectedDate }) => {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [isFootballExpanded, setIsFootballExpanded] = useState<boolean>(true);

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
      const isLive = fixture.fixture?.status?.short === "1H" || 
                     fixture.fixture?.status?.short === "2H" || 
                     fixture.fixture?.status?.short === "HT" ||
                     fixture.fixture?.status?.short === "LIVE";

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
  }, [validFixtures]);

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

  // Sort countries alphabetically with World first, showing all countries
  const sortedCountries = useMemo(() => {
    const allCountriesData = allFootballCountries.map(country => {
      // Check if this country has matches
      const existingCountryData = Object.values(leaguesByCountry).find((data: any) => 
        data.country?.toLowerCase() === country.toLowerCase()
      );

      if (existingCountryData) {
        return existingCountryData;
      } else {
        // Return empty country data for countries without matches
        return {
          country,
          leagues: {}
        };
      }
    });

    return allCountriesData.sort((a: any, b: any) => {
      const countryA = a.country || "";
      const countryB = b.country || "";

      const aIsWorld = countryA.toLowerCase() === "world";
      const bIsWorld = countryB.toLowerCase() === "world";

      if (aIsWorld && !bIsWorld) return -1;
      if (bIsWorld && !aIsWorld) return 1;

      return countryA.localeCompare(countryB);
    });
  }, [Object.keys(leaguesByCountry).length]);

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
                ({(() => {
                  const totalLiveMatches = Object.values(leaguesByCountry).reduce(
                    (sum: number, countryData: any) => sum + (countryData.liveMatches || 0),
                    0
                  );
                  if (totalLiveMatches > 0) {
                    return (
                      <>
                        <span className="text-red-400">{totalLiveMatches}</span>
                        <span>/{validFixtures.length}</span>
                      </>
                    );
                  }
                  return validFixtures.length;
                })()})
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
                  onClick={() => hasMatches && toggleCountry(countryData.country)}
                  className={`w-full flex items-center justify-between pl-2 pr-4 py-3 transition-colors border-l-2 border-transparent ${
                    hasMatches 
                      ? 'hover:bg-gray-50 cursor-pointer hover:border-l-blue-100' 
                      : 'cursor-not-allowed '
                  }`}
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
                            <span className="text-red-400">{liveMatches}</span>
                            <span>/{totalMatches}</span>
                          </>
                        ) : totalMatches})
                      </span>
                    </div>
                  </div>

                  {/* Expand/Collapse Icon for Country - Only show if has matches */}
                  {hasMatches && (
                    isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )
                  )}
                </button>

                {/* Leagues List - Show when expanded and has matches */}
                {isExpanded && hasMatches && (
                  <div className="space-y-2 ml-3 pb-4">
                    {Object.values(countryData.leagues)
                      .sort((a: any, b: any) => a.league.name.localeCompare(b.league.name))
                      .map((leagueData: any) => (
                        <div className="flex items-center gap-3 py-2">
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
                              className="text-gray-800 font-medium"
                              style={{
                                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                fontSize: "13px",
                              }}
                            >
                              {safeSubstring(leagueData.league.name, 0) || "Unknown League"}
                            </span>
                          </div>
                          <span
                            className="text-gray-500 text-xs"
                            style={{
                              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                            }}
                          >
                            {leagueData.liveMatchCount > 0 ? `(${leagueData.liveMatchCount}/${leagueData.matchCount})` : `(${leagueData.matchCount})`}
                          </span>
                        </div>
                      ))}
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