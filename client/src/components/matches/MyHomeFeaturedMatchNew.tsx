
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  Clock,
  Grid3X3,
  Star,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid, addDays } from "date-fns";
import { CacheManager } from "@/lib/cachingHelper";
import { backgroundCache } from "@/lib/backgroundCache";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import LazyImage from "../common/LazyImage";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import { apiRequest } from "@/lib/queryClient";
import {
  shouldExcludeFromPopularLeagues,
  isPopularLeagueSuitable,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 1,
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current date if not provided
  const currentDate = selectedDate || new Date().toISOString().split("T")[0];

  // TOP 3 LEAGUES ONLY - exactly same as used in TodayPopularLeagueNew
  const TOP_3_LEAGUES = [
    39,  // Premier League (England)
    140, // La Liga (Spain) 
    135, // Serie A (Italy)
  ];

  // Popular countries prioritization - same as TodayPopularLeagueNew
  const POPULAR_COUNTRIES_ORDER = [
    "England",
    "Spain",
    "Italy",
    "Germany",
    "France",
    "World",
    "Europe",
    "South America",
    "Brazil",
    "Saudi Arabia",
    "Egypt",
    "Colombia",
    "United States",
    "USA",
    "US",
    "United Arab Emirates",
    "United-Arab-Emirates",
  ];

  // Fetch featured match data using same logic as TodayPopularLeagueNew
  useEffect(() => {
    const loadFeaturedMatches = async () => {
      try {
        setLoading(true);

        // Check cache first
        const cacheKey = ["featured-matches", currentDate];
        const cachedData = CacheManager.getCachedData(cacheKey, 15 * 60 * 1000); // 15 minutes cache

        if (cachedData) {
          console.log(
            "🎯 [FeaturedMatch] Using cached data:",
            cachedData.length,
            "matches",
          );
          setMatches(cachedData);
          setCurrentIndex(0);
          setLoading(false);
          return;
        }

        console.log(
          "🔍 [FeaturedMatch] Fetching fresh data for date:",
          currentDate,
        );

        // Get dates for today, tomorrow, and day after tomorrow
        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        const tomorrow = addDays(today, 1);
        const tomorrowString = format(tomorrow, "yyyy-MM-dd");
        const dayAfterTomorrow = addDays(today, 2);
        const dayAfterTomorrowString = format(dayAfterTomorrow, "yyyy-MM-dd");

        const featuredMatches = [];

        // Fetch matches for today, tomorrow, and day after tomorrow (TOP 3 leagues each)
        const datesToFetch = [
          { date: todayString, maxLeagues: 3, maxMatches: 2 },
          { date: tomorrowString, maxLeagues: 3, maxMatches: 2 },
          { date: dayAfterTomorrowString, maxLeagues: 3, maxMatches: 2 },
        ];

        for (const { date, maxLeagues, maxMatches: dateMaxMatches } of datesToFetch) {
          try {
            const response = await apiRequest('GET', `/api/fixtures/date/${date}?all=true`);
            if (!response.ok) continue;

            const allFixtures = await response.json();
            if (!allFixtures || allFixtures.length === 0) continue;

            console.log(
              `🔍 [FeaturedMatch] Found ${allFixtures.length} fixtures for ${date}`,
            );

            // Apply EXACT same filtering logic as TodayPopularLeagueNew
            const filteredFixtures = allFixtures.filter((fixture) => {
              if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
                return false;
              }

              // Apply smart time filtering to ensure correct date
              if (fixture.fixture.date && fixture.fixture.status?.short) {
                const smartResult = MySmartTimeFilter.getSmartTimeLabel(
                  fixture.fixture.date,
                  fixture.fixture.status.short,
                  date + "T12:00:00Z",
                );

                // Check if this match should be included based on the date
                const shouldInclude = (() => {
                  if (date === tomorrowString && smartResult.label === "tomorrow") return true;
                  if (date === todayString && smartResult.label === "today") return true;
                  if (date === dayAfterTomorrowString && smartResult.isWithinTimeRange) return true;
                  return false;
                })();

                if (!shouldInclude) return false;
              }

              // Client-side filtering for popular leagues and countries - SAME AS TodayPopularLeagueNew
              const leagueId = fixture.league?.id;
              const country = fixture.league?.country?.toLowerCase() || "";

              // Check if it's a TOP 3 league
              const isTop3League = TOP_3_LEAGUES.includes(leagueId);

              // Check if it's from a popular country
              const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
                (popularCountry) => country.includes(popularCountry.toLowerCase()),
              );

              // Apply exclusion check FIRST, before checking international competitions
              const leagueName = fixture.league?.name?.toLowerCase() || "";
              const homeTeamName = fixture.teams?.home?.name?.toLowerCase() || "";
              const awayTeamName = fixture.teams?.away?.name?.toLowerCase() || "";

              // Early exclusion for women's competitions and other unwanted matches
              if (
                shouldExcludeFromPopularLeagues(
                  fixture.league.name,
                  fixture.teams.home.name,
                  fixture.teams.away.name,
                  country,
                )
              ) {
                return false;
              }

              // Check if it's an international competition (after exclusion check)
              const isInternationalCompetition =
                // UEFA competitions (but women's already excluded above)
                leagueName.includes("champions league") ||
                leagueName.includes("europa league") ||
                leagueName.includes("conference league") ||
                leagueName.includes("uefa") ||
                // FIFA competitions
                leagueName.includes("world cup") ||
                leagueName.includes("fifa club world cup") ||
                leagueName.includes("fifa") ||
                // CONMEBOL competitions
                leagueName.includes("conmebol") ||
                leagueName.includes("copa america") ||
                leagueName.includes("copa libertadores") ||
                leagueName.includes("copa sudamericana") ||
                leagueName.includes("libertadores") ||
                leagueName.includes("sudamericana") ||
                // Men's International Friendlies (excludes women's)
                (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
                (leagueName.includes("international") &&
                  !leagueName.includes("women")) ||
                country.includes("world") ||
                country.includes("europe") ||
                country.includes("international");

              return (
                isTop3League || isFromPopularCountry || isInternationalCompetition
              );
            });

            // Apply SAME final filtering as TodayPopularLeagueNew
            const finalFiltered = filteredFixtures.filter((fixture) => {
              // Apply popular league exclusion filters
              if (
                shouldExcludeFromPopularLeagues(
                  fixture.league.name,
                  fixture.teams.home.name,
                  fixture.teams.away.name,
                  fixture.league.country,
                )
              ) {
                return false;
              }

              // Additional check for restricted US leagues
              if (isRestrictedUSLeague(fixture.league.id, fixture.league.country)) {
                return false;
              }

              // Skip fixtures with null or undefined country
              if (!fixture.league.country) {
                return false;
              }

              const countryName = fixture.league.country?.toLowerCase() || "";
              const leagueId = fixture.league.id;
              const leagueNameLower = fixture.league.name?.toLowerCase() || "";

              // Check for international competitions first
              const isInternationalCompetition =
                // UEFA competitions
                leagueNameLower.includes("champions league") ||
                leagueNameLower.includes("europa league") ||
                leagueNameLower.includes("conference league") ||
                leagueNameLower.includes("uefa") ||
                leagueNameLower.includes("euro") ||
                // FIFA competitions
                leagueNameLower.includes("world cup") ||
                leagueNameLower.includes("fifa club world cup") ||
                leagueNameLower.includes("fifa cup") ||
                leagueNameLower.includes("fifa") ||
                // CONMEBOL competitions
                leagueNameLower.includes("conmebol") ||
                leagueNameLower.includes("copa america") ||
                leagueNameLower.includes("copa libertadores") ||
                leagueNameLower.includes("copa sudamericana") ||
                leagueNameLower.includes("libertadores") ||
                leagueNameLower.includes("sudamericana") ||
                // Men's International Friendlies (excludes women's)
                (leagueNameLower.includes("friendlies") &&
                  !leagueNameLower.includes("women")) ||
                (leagueNameLower.includes("international") &&
                  !leagueNameLower.includes("women")) ||
                countryName.includes("world") ||
                countryName.includes("europe") ||
                countryName.includes("international");

              // Allow all international competitions through
              if (isInternationalCompetition) {
                return true;
              }

              // Check if it's a popular country
              const matchingCountry = POPULAR_COUNTRIES_ORDER.find((country) =>
                countryName.includes(country.toLowerCase()),
              );

              if (!matchingCountry) {
                return false;
              }

              return true;
            });

            // Group fixtures by country and league using SAME logic as TodayPopularLeagueNew
            const fixturesByCountry = finalFiltered.reduce(
              (acc: any, fixture: any) => {
                if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
                  return acc;
                }

                const league = fixture.league;
                if (!league.id || !league.name) {
                  return acc;
                }

                const country = league.country;
                const leagueName = league.name?.toLowerCase() || "";
                const homeTeamName = fixture.teams?.home?.name || "";
                const awayTeamName = fixture.teams?.away?.name || "";

                // Check if fixture should be excluded using popular league specialized filter
                if (
                  shouldExcludeFromPopularLeagues(
                    leagueName,
                    homeTeamName,
                    awayTeamName,
                    country,
                  )
                ) {
                  return acc;
                }

                // Additional check for restricted US leagues
                if (isRestrictedUSLeague(league.id, country)) {
                  return acc;
                }

                const leagueId = league.id;
                if (!acc[country]) {
                  acc[country] = {
                    country,
                    leagues: {},
                    hasPopularLeague: false,
                  };
                }

                // Check if this is a TOP 3 league
                const isTop3League = TOP_3_LEAGUES.includes(leagueId);
                
                if (isTop3League) {
                  acc[country].hasPopularLeague = true;
                }

                if (!acc[country].leagues[leagueId]) {
                  acc[country].leagues[leagueId] = {
                    league: {
                      ...league,
                      logo:
                        league.logo ||
                        "https://media.api-sports.io/football/leagues/1.png",
                    },
                    matches: [],
                    isPopular: isTop3League,
                    isPopularForCountry: isTop3League,
                  };
                }

                // Validate team data before adding
                if (
                  fixture.teams.home &&
                  fixture.teams.away &&
                  fixture.teams.home.name &&
                  fixture.teams.away.name
                ) {
                  acc[country].leagues[leagueId].matches.push({
                    ...fixture,
                    teams: {
                      home: {
                        ...fixture.teams.home,
                        logo: fixture.teams.home.logo || "/assets/fallback-logo.svg",
                      },
                      away: {
                        ...fixture.teams.away,
                        logo: fixture.teams.away.logo || "/assets/fallback-logo.svg",
                      },
                    },
                  });
                }

                return acc;
              },
              {},
            );

            // Get only TOP 3 leagues that have matches
            const top3Countries = Object.values(fixturesByCountry).filter(
              (countryData: any) => {
                return countryData.hasPopularLeague;
              }
            );

            // Sort countries by the POPULAR_COUNTRIES_ORDER - SAME as TodayPopularLeagueNew
            const sortedCountries = top3Countries.sort((a: any, b: any) => {
              const getPopularCountryIndex = (country: string) => {
                if (!country) return 999;
                const index = POPULAR_COUNTRIES_ORDER.findIndex(
                  (pc) =>
                    pc.toLowerCase() === country.toLowerCase(),
                );
                return index === -1 ? 999 : index;
              };

              const aPopularIndex = getPopularCountryIndex(a.country);
              const bPopularIndex = getPopularCountryIndex(b.country);

              const aIsPopularCountry = aPopularIndex !== 999;
              const bIsPopularCountry = bPopularIndex !== 999;

              // Priority order: Popular countries with TOP 3 leagues first
              if (
                aIsPopularCountry &&
                a.hasPopularLeague &&
                (!bIsPopularCountry || !b.hasPopularLeague)
              )
                return -1;
              if (
                bIsPopularCountry &&
                b.hasPopularLeague &&
                (!aIsPopularCountry || !a.hasPopularLeague)
              )
                return 1;

              // Both are popular countries with TOP 3 leagues - sort by priority order
              if (
                aIsPopularCountry &&
                a.hasPopularLeague &&
                bIsPopularCountry &&
                b.hasPopularLeague
              ) {
                return aPopularIndex - bPopularIndex;
              }

              // Default to alphabetical sorting for other cases
              const countryA = a.country || "";
              const countryB = b.country || "";
              return countryA.localeCompare(countryB);
            });

            // Get matches from each TOP 3 league that has matches
            for (const countryData of sortedCountries) {
              const topLeagues = Object.values(countryData.leagues)
                .filter((leagueData: any) => leagueData.isPopular && leagueData.matches.length > 0)
                .sort((a: any, b: any) => {
                  const aIndex = TOP_3_LEAGUES.indexOf(a.league.id);
                  const bIndex = TOP_3_LEAGUES.indexOf(b.league.id);
                  return aIndex - bIndex;
                })
                .slice(0, 3); // Only take TOP 3

              // Get matches from each top league - only if they have matches
              for (const leagueData of topLeagues) {
                const leagueMatches = leagueData.matches || [];

                // Skip leagues with no matches
                if (leagueMatches.length === 0) {
                  continue;
                }

                // Sort matches within league using SAME sorting as TodayPopularLeagueNew
                const sortedMatches = leagueMatches.sort((a: any, b: any) => {
                  const aStatus = a.fixture.status.short;
                  const bStatus = b.fixture.status.short;
                  const aDate = parseISO(a.fixture.date);
                  const bDate = parseISO(b.fixture.date);

                  // Ensure valid dates
                  if (!isValid(aDate) || !isValid(bDate)) {
                    return 0;
                  }

                  const aTime = aDate.getTime();
                  const bTime = bDate.getTime();

                  // Define status categories
                  const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
                  const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

                  const aUpcoming = aStatus === "NS" || aStatus === "TBD";
                  const bUpcoming = bStatus === "NS" || bStatus === "TBD";

                  const aFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(aStatus);
                  const bFinished = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(bStatus);

                  // PRIORITY 1: LIVE matches always come first
                  if (aLive && !bLive) return -1;
                  if (!aLive && bLive) return 1;

                  // If both are LIVE, sort by elapsed time (shortest first), then alphabetically by home team
                  if (aLive && bLive) {
                    const aElapsed = Number(a.fixture.status.elapsed) || 0;
                    const bElapsed = Number(b.fixture.status.elapsed) || 0;

                    if (aElapsed !== bElapsed) {
                      return aElapsed - bElapsed;
                    }

                    // If same elapsed time, sort alphabetically by home team name
                    const aHomeTeam = a.teams?.home?.name || "";
                    const bHomeTeam = b.teams?.home?.name || "";
                    return aHomeTeam.localeCompare(bHomeTeam);
                  }

                  // PRIORITY 2: Upcoming (NS/TBD) matches come second, sorted by time first, then alphabetically by home team
                  if (aUpcoming && !bUpcoming) return -1;
                  if (!aUpcoming && bUpcoming) return 1;

                  // If both are upcoming, sort by time first, then alphabetically by home team
                  if (aUpcoming && bUpcoming) {
                    if (aTime !== bTime) {
                      return aTime - bTime; // Earlier matches first
                    }

                    // If same time, sort alphabetically by home team name
                    const aHomeTeam = a.teams?.home?.name || "";
                    const bHomeTeam = b.teams?.home?.name || "";
                    return aHomeTeam.localeCompare(bHomeTeam);
                  }

                  // PRIORITY 3: Finished matches come last, sorted alphabetically by home team
                  if (aFinished && !bFinished) return 1;
                  if (!aFinished && bFinished) return -1;

                  // If both are finished, sort alphabetically by home team name
                  if (aFinished && bFinished) {
                    const aHomeTeam = a.teams?.home?.name || "";
                    const bHomeTeam = b.teams?.home?.name || "";
                    return aHomeTeam.localeCompare(bHomeTeam);
                  }

                  // DEFAULT: For any other cases, sort alphabetically by home team name
                  const aHomeTeam = a.teams?.home?.name || "";
                  const bHomeTeam = b.teams?.home?.name || "";
                  return aHomeTeam.localeCompare(bHomeTeam);
                });

                // Take only the top matches from this league for this date
                const topMatches = sortedMatches.slice(0, dateMaxMatches);

                // Add matches to featured collection
                for (const match of topMatches) {
                  featuredMatches.push({
                    ...match,
                    league: {
                      ...match.league,
                      country: countryData.country,
                    },
                    dateContext: date, // Add context for which date this match is from
                  });
                }
              }
            }
          } catch (error) {
            console.error(`🔍 [FeaturedMatch] Error fetching data for ${date}:`, error);
          }
        }

        // Simple sorting: Live matches first, then by match status and time
        const sortedFeaturedMatches = featuredMatches.sort((a, b) => {
          const aStatus = a.fixture?.status?.short;
          const bStatus = b.fixture?.status?.short;

          // Live matches first
          const aIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(aStatus);
          const bIsLive = ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(bStatus);

          if (aIsLive && !bIsLive) return -1;
          if (!aIsLive && bIsLive) return 1;

          // Recent finished matches
          const now = new Date();
          const aDate = new Date(a.fixture?.date);
          const bDate = new Date(b.fixture?.date);

          const aIsRecentFinished =
            ["FT", "AET", "PEN"].includes(aStatus) &&
            now.getTime() - aDate.getTime() < 6 * 60 * 60 * 1000;
          const bIsRecentFinished =
            ["FT", "AET", "PEN"].includes(bStatus) &&
            now.getTime() - bDate.getTime() < 6 * 60 * 60 * 1000;

          if (aIsRecentFinished && !bIsRecentFinished) return -1;
          if (!aIsRecentFinished && bIsRecentFinished) return 1;

          // Sort by match time (earliest first)
          return aDate.getTime() - bDate.getTime();
        });

        // Take only 6 total matches for the slide
        const finalMatches = sortedFeaturedMatches.slice(0, 6);
        // Validate data structure before setting
        const validMatches = finalMatches.filter((match) => {
          const isValid =
            match &&
            match.teams &&
            match.teams.home &&
            match.teams.away &&
            match.fixture &&
            match.league;

          if (!isValid) {
            console.warn("🔍 [FeaturedMatch] Invalid match data:", match);
          }
          return isValid;
        });

        // Only show slides if we have matches from the TOP 3 leagues shown in TodayPopularLeagueNew
        if (validMatches.length === 0) {
          console.log("🔍 [FeaturedMatch] No matches found from TOP 3 leagues that are shown in TodayPopularLeagueNew");
          setMatches([]);
          setCurrentIndex(0);
          setLoading(false);
          return;
        }

        console.log(
          "🔍 [FeaturedMatch] Returning TOP 3 leagues matches from TodayPopularLeagueNew data (max 6):",
          validMatches.length,
          "matches:",
          {
            matches: validMatches.map((m) => ({
              league: m.league?.name || "Unknown League",
              homeTeam: m.teams?.home?.name || "Unknown Home",
              awayTeam: m.teams?.away?.name || "Unknown Away",
              status:
                m.fixture?.status?.short === "NS"
                  ? "UPCOMING"
                  : ["1H", "2H", "HT", "LIVE", "ET", "BT", "P"].includes(
                        m.fixture?.status?.short,
                      )
                    ? "LIVE"
                    : "FINISHED",
            })),
          },
        );

        // Cache the result
        CacheManager.setCachedData(cacheKey, validMatches);

        // Store in background cache as well
        backgroundCache.set(
          `featured-matches-${currentDate}`,
          validMatches,
          15 * 60 * 1000,
        );

        setMatches(validMatches);
        setCurrentIndex(0);
      } catch (error) {
        console.error(
          "🔍 [FeaturedMatch] Error fetching featured matches:",
          error,
        );
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedMatches();
  }, [currentDate, maxMatches]);

  // Handle navigation (slide functions)
  const handlePrevious = () => {
    if (matches.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
  };

  const handleNext = () => {
    if (matches.length <= 1) return;
    setCurrentIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
  };

  const handleMatchClick = () => {
    if (isValidMatch && currentMatch.fixture.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  // Get current match
  const currentMatch = matches[currentIndex];

  // Validate current match has required data structure
  const isValidMatch =
    currentMatch &&
    currentMatch.teams &&
    currentMatch.teams.home &&
    currentMatch.teams.away &&
    currentMatch.fixture &&
    currentMatch.league;

  // Get match status display
  const getMatchStatus = (match) => {
    const status = match.fixture.status.short;
    const elapsed = match.fixture.status.elapsed;

    if (["1H", "2H"].includes(status)) {
      return `${elapsed}'`;
    }
    if (status === "HT") return "HT";
    if (status === "FT") return "FT";
    if (status === "NS") {
      const matchDate = new Date(match.fixture.date);
      return format(matchDate, "HH:mm");
    }
    return status;
  };

  // Get match status color
  const getStatusColor = (status) => {
    if (["1H", "2H", "LIVE"].includes(status)) return "bg-red-500";
    if (status === "HT") return "bg-orange-500";
    if (status === "FT") return "bg-gray-500";
    return "bg-blue-500";
  };

  // Get match status label
  const getMatchStatusLabel = (match) => {
    if (!match) return "";

    const { fixture } = match;

    if (
      ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(
        fixture.status.short,
      )
    ) {
      return "LIVE";
    } else if (fixture.status.short === "FT") {
      return "FINISHED";
    } else {
      return "UPCOMING";
    }
  };

  // Team color helper function
  const getTeamColor = (teamId) => {
    const colors = [
      "#6f7c93", // blue-gray
      "#8b0000", // dark red
      "#1d3557", // dark blue
      "#2a9d8f", // teal
      "#e63946", // red
    ];
    return colors[teamId % colors.length];
  };

  // Loading state
  if (loading) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-500 animate-pulse" />
          <p className="text-gray-600 font-medium">
            Loading today's featured match...
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Getting the best match from TOP 3 leagues
          </p>
        </CardContent>
      </Card>
    );
  }

  // No matches state
  if (!isValidMatch || matches.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">
              No featured matches available
            </p>
            <p className="text-sm">No matches from TOP 3 leagues today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-8">
      <Badge
        variant="secondary"
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        Featured Match
      </Badge>

      {/* Navigation arrows */}
      {matches.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 w-10 h-10 rounded-full shadow-lg border border-gray-200 z-40 flex items-center justify-center transition-all duration-200 hover:shadow-xl"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 w-10 h-10 rounded-full shadow-lg border border-gray-200 z-40 flex items-center justify-center transition-all duration-200 hover:shadow-xl"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden h-full w-full bg-white shadow-sm cursor-pointer"
          onClick={handleMatchClick}
        >
          {/* League info section */}
          <div className="bg-white p-2 mt-6 relative mt-4 mb-4">
            <div className="flex items-center justify-center">
              {currentMatch?.league?.logo ? (
                <img
                  src={currentMatch.league.logo}
                  alt={currentMatch.league.name}
                  className="w-5 h-5 object-contain mr-2 drop-shadow-md"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.svg";
                  }}
                />
              ) : (
                <Trophy className="w-5 h-5 text-amber-500 mr-2" />
              )}
              <span className="text-sm font-medium">{currentMatch?.league?.name || "League Name"}</span>
              {getMatchStatusLabel(currentMatch) === "LIVE" ? (
                <div className="flex items-center gap-1.5 ml-2">
                  <div className="w-2h-2 rounded-fullbg-red-500 animate-pulse" />
<Badge
                    variant="outline"
                    className="text-[10px] px-1.5 border border-red-500 text-red-500 animate-pulse"
                  >
                    LIVE
                  </Badge>
                </div>
              ) : (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border ml-[3px] ${
                    getMatchStatusLabel(currentMatch) === "FINISHED"
                      ? "border-gray-500 text-gray-500"
                      : "border-blue-500 text-blue-500"
                  }`}
                >
                  {getMatchStatusLabel(currentMatch)}
                </Badge>
              )}
            </div>
          </div>

          {/* Score display for live and finished matches using grid */}
          {currentMatch?.fixture?.status?.short &&
            (["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
              currentMatch.fixture.status.short,
            )) && (
              <div className="match-score-container">
                {/* Score using grid display - moved to top */}
                <div className="match-score-display mb-4" style={{ fontSize: "calc(1.125rem * 0.968)" }}>
                  <span className="score-number">{currentMatch?.goals?.home ?? 0}</span>
                  <span className="score-separator">-</span>
                  <span className="score-number">{currentMatch?.goals?.away ?? 0}</span>
                </div>

                {/* Match status label positioned below score */}
                <div className="match-status-label status-live" style={{ marginTop: "-0.25rem" }}>
                  {(() => {
                    const status = currentMatch?.fixture?.status?.short;
                    const elapsed = currentMatch?.fixture?.status?.elapsed;

                    // Live matches - show elapsed time
                    if (["LIVE", "1H", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                      if (status === "HT") {
                        return "HT";
                      }
                      return `${elapsed || 0}'`;
                    }

                    // Finished matches
                    if (status === "FT") return "Ended";
                    if (status === "AET") return "After Extra Time";
                    if (status === "PEN") return "After Penalties";
                    if (status === "AWD") return "Awarded";
                    if (status === "WO") return "Walkover";
                    if (status === "ABD") return "Abandoned";
                    if (status === "CANC") return "Cancelled";
                    if (status === "SUSP") return "Suspended";

                    // Half time
                    if (status === "HT") return "Half Time";

                    // Upcoming matches
                    if (status === "NS") return "Upcoming";
                    if (status === "TBD") return "Time TBD";
                    if (status === "PST") return "Postponed";

                    // Default
                    return status || "Upcoming";
                  })()}
                </div>
              </div>
            )}

          {/* Match status for matches without scores using grid - same layout as score display */}
          {currentMatch?.fixture?.status?.short &&
            !(["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
              currentMatch.fixture.status.short,
            )) && (
              <div className="match-score-container">
                {/* Status display - positioned same as score display */}
                <div className="match-score-display mb-4" style={{ fontSize: "calc(1.125rem * 0.968 * 1.1 * 1.1)" }}>
                  <span className="score-number">
                    {(() => {
                      const status = currentMatch?.fixture?.status?.short;

                      // Upcoming matches - calculate days until match
                      if (status === "NS") {
                        try {
                          const matchDate = parseISO(currentMatch.fixture.date);
                          const now = new Date();

                          // Calculate difference in days
                          const msToMatch = matchDate.getTime() - now.getTime();
                          const daysToMatch = Math.ceil(msToMatch / (1000 * 60 * 60 * 24));

                          if (daysToMatch === 0) {
                            return "Today";
                          } else if (daysToMatch === 1) {
                            return "Tomorrow";
                          } else if (daysToMatch > 1) {
                            return `${daysToMatch} Days`;
                          } else {
                            return "Today"; // Past date defaults to Today
                          }
                        } catch (e) {
                          return "Today";
                        }
                      }
                      if (status === "TBD") return "Time TBD";
                      if (status === "PST") return "Postponed";

                      // Default
                      return status || "";
                    })()}
                  </span>
                </div>

                {/* Match status label positioned below - same as score version */}
                <div className="match-status-label status-upcoming" style={{
                  fontSize: currentMatch?.fixture?.status?.short === "NS" ? "calc(1.5 * 1rem)" : "1rem",
                  marginTop: "16px"
                }}>
                  {(() => {
                    const status = currentMatch?.fixture?.status?.short;
                    const elapsed = currentMatch?.fixture?.status?.elapsed;

                    // Live matches - show elapsed time
                    if (["LIVE", "1H", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                      if (status === "HT") {
                        return "HT";
                      }
                      return `${elapsed || 0}'`;
                    }

                    // Finished matches
                    if (status === "FT") return "Ended";
                    if (status === "AET") return "After Extra Time";
                    if (status === "PEN") return "After Penalties";
                    if (status === "AWD") return "Awarded";
                    if (status === "WO") return "Walkover";
                    if (status === "ABD") return "Abandoned";
                    if (status === "CANC") return "Cancelled";
                    if (status === "SUSP") return "Suspended";

                    // Half time
                    if (status === "HT") return "Half Time";

                    // Upcoming matches - don't show days here to avoid duplication with score display
                    if (status === "NS") {
                      return ""; // Days are already shown in the score display section above
                    }
                    if (status === "TBD") return "Time TBD";
                    if (status === "PST") return "Postponed";

                    // Default
                    return status || "Upcoming";
                  })()}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-gray-500">
                  {/* Additional content positioned absolutely below without affecting grid */}
                </div>
              </div>
            )}

            {/* Team scoreboard with colored bars */}
            <div className="relative">
              <div
                className="flex relative h-[53px] rounded-md mb-8"
                onClick={handleMatchClick}
                style={{ cursor: "pointer" }}
              >
                <div className="w-full h-full flex justify-between relative">
                  {/* Home team colored bar and logo */}
                  <div
                    className="h-full w-[calc(50%-16px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative"
                    style={{
                      background: getTeamColor(
                        currentMatch?.teams?.home?.id || 0,
                      ),
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    {currentMatch?.teams?.home && (
                      <img
                        src={
                          currentMatch.teams.home.logo ||
                          `/assets/fallback-logo.svg`
                        }
                        alt={currentMatch.teams.home.name || "Home Team"}
                        className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full"
                        style={{
                          cursor: "pointer",
                          top: "calc(50% - 32px)",
                          left: "-32px",
                          filter: "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                        }}
                        onClick={handleMatchClick}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (
                            target.src.includes("sportmonks") &&
                            currentMatch.teams.home.logo
                          ) {
                            target.src = currentMatch.teams.home.logo;
                          } else if (
                            target.src !== "/assets/fallback-logo.svg"
                          ) {
                            target.src = "/assets/fallback-logo.svg";
                          }
                        }}
                      />
                    )}
                  </div>

                  <div
                    className="absolute text-white uppercase text-center max-w-[160px] truncate md:max-w-[240px] font-sans"
                    style={{
                      top: "calc(50% - 13px)",
                      left: "120px",
                      fontSize: "1.24rem",
                      fontWeight: "normal",
                    }}
                  >
                    {currentMatch?.teams?.home?.name || "TBD"}
                  </div>

                  {/* VS circle */}
                  <div
                    className="absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden"
                    style={{
                      background: "#a00000",
                      left: "calc(50% - 26px)",
                      top: "calc(50% - 26px)",
                      minWidth: "52px",
                    }}
                  >
                    <span className="vs-text font-bold">VS</span>
                  </div>

                  {/* Away team colored bar and logo */}
                  <div
                    className="h-full w-[calc(50%-26px)] mr-[87px] transition-all duration-500 ease-in-out opacity-100"
                    style={{
                      background: getTeamColor(currentMatch.teams.away.id),
                      transition: "all 0.3s ease-in-out",
                    }}
                  ></div>

                  <div
                    className="absolute text-white uppercase text-center max-w-[120px] truncate md:max-w-[200px] font-sans"
                    style={{
                      top: "calc(50% - 13px)",
                      right: "130px",
                      fontSize: "1.24rem",
                      fontWeight: "normal",
                    }}
                  >
                    {currentMatch?.teams?.away?.name || "Away Team"}
                  </div>

                  <img
                    src={
                      currentMatch?.teams?.away?.logo ||
                      `/assets/fallback-logo.svg`
                    }
                    alt={currentMatch?.teams?.away?.name || "Away Team"}
                    className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full transition-all duration-300 ease-in-out hover:scale-110 hover:contrast-125 hover:brightness-110 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    style={{
                      cursor: "pointer",
                      top: "calc(50% - 32px)",
                      right: "87px",
                      transform: "translateX(50%)",
                      filter: "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                    }}
                    onClick={handleMatchClick}
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.svg";
                    }}
                  />
                </div>
              </div>

              {/* Match date and venue - aligned with VS component */}
              <div
                className="absolute text-center text-xs text-black font-medium"
                style={{
                  fontSize: "0.875rem",
                  whiteSpace: "nowrap",
                  overflow: "visible",
                  textAlign: "center",
                  position: "flex",
                  left: "50%",
                  transform: "translateX(-50%)",
                  top: "calc(100% + 20px)",
                  width: "max-content",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                {(() => {
                  try {
                    const matchDate = parseISO(
                      currentMatch.fixture.date,
                    );
                    const formattedDate = format(
                      matchDate,
                      "EEEE, do MMM",
                      );
                    const timeOnly = format(matchDate, "HH:mm");
                    const isUpcoming = currentMatch.fixture.status.short === "NS" || currentMatch.fixture.status.short === "TBD";

                    return (
                      <>
                        {formattedDate}
                        {!isUpcoming && ` | ${timeOnly}`}
                        {currentMatch.fixture.venue?.name
                          ? ` | ${currentMatch.fixture.venue.name}`
                          : ""}
                      </>
                    );
                  } catch (e) {
                    return currentMatch.fixture.venue?.name || "";
                  }
                })()}
              </div>
            </div>

            {/* Bottom navigation */}
            <div className="flex justify-around border-t border-gray-200 pt-4 mt-12 pb-4">
              <button
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() =>
                  currentMatch?.fixture?.id &&
                  navigate(`/match/${currentMatch.fixture.id}`)
                }
              >
                <img
                  src="/assets/matchdetaillogo/MatchDetail.svg"
                  alt="Match Page"
                  width="18"
                  height="18"
                  className="text-gray-600"
                />
                <span className="text-[0.75rem] text-gray-600 mt-1">
                  Match Page
                </span>
              </button>
              <button
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() =>
                  currentMatch?.fixture?.id &&
                  navigate(`/match/${currentMatch.fixture.id}/lineups`)
                }
              >
                <img
                  src="/assets/matchdetaillogo/lineups.svg"
                  alt="Lineups"
                  width="18"
                  height="18"
                  className="text-gray-600"
                />
                <span className="text-[0.75rem] text-gray-600 mt-1">
                  Lineups
                </span>
              </button>
              <button
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() =>
                  currentMatch?.fixture?.id &&
                  navigate(`/match/${currentMatch.fixture.id}/h2h`)
                }
              >
                <img
                  src="/assets/matchdetaillogo/stats.svg"
                  alt="H2H"
                  width="18"
                  height="18"
                  className="text-gray-600"
                />
                <span className="text-[0.75rem] text-gray-600 mt-1">
                  H2H
                </span>
              </button>
              <button
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() =>
                  currentMatch?.fixture?.id &&
                  navigate(`/match/${currentMatch.fixture.id}/standings`)
                }
              >
                <img
                  src="/assets/matchdetaillogo/standings.svg"
                  alt="Standings"
                  width="18"
                  height="18"
                  className="text-gray-600"
                />
                <span className="text-[0.75rem] text-gray-600 mt-1">
                  Standings
                </span>
              </button>
            </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      {matches.length > 1 && (
        <div className="flex justify-center gap-2 py-2 mt-2">
          {matches.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                index === currentIndex ? "bg-black" : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default MyFeaturedMatchSlide;
