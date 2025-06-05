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
import {
  applyPriorityFiltering,
  groupFixturesByCountryAndLeague,
  filterPopularCountries,
  sortLeaguesByPriority,
  getCountryFlag,
} from "@/components/matches/MyNewPriorityFilters";
import { CacheManager } from "@/lib/cachingHelper";
import { backgroundCache } from "@/lib/backgroundCache";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { shouldExcludeFeaturedMatch } from "@/lib/MyFeaturedMatchExclusion";
import LazyImage from "../common/LazyImage";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";

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

  // Fetch featured match data using priority filters and caching
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

        // Popular leagues and countries configuration (from TodayPopularLeague)
        const POPULAR_LEAGUES = [
          39, 45, 48, // England: Premier League, FA Cup, EFL Cup
          140, 143, // Spain: La Liga, Copa del Rey
          135, 137, // Italy: Serie A, Coppa Italia
          78, 81, // Germany: Bundesliga, DFB Pokal
          61, 66, // France: Ligue 1, Coupe de France
          301, // UAE Pro League
          233, // Egyptian Premier League
          15, // FIFA Club World Cup
          914, 848, // COSAFA Cup, UEFA Conference League
          2, 3, // Champions League, Europa League
        ];

        const POPULAR_COUNTRIES_ORDER = [
          "England", "Spain", "Italy", "Germany", "France", "World", "Europe",
          "South America", "Brazil", "Saudi Arabia", "Egypt", "Colombia",
          "United States", "USA", "US", "United Arab Emirates", "United-Arab-Emirates",
        ];

        // Fetch matches for today, tomorrow, and day after tomorrow (top 2 leagues each)
        const datesToFetch = [
          { date: todayString, maxLeagues: 2, maxMatches: 2 },
          { date: tomorrowString, maxLeagues: 2, maxMatches: 2 },
          { date: dayAfterTomorrowString, maxLeagues: 2, maxMatches: 2 },
        ];

        for (const { date, maxLeagues, maxMatches: dateMaxMatches } of datesToFetch) {
          try {
            const response = await fetch(`/api/fixtures/date/${date}?all=true`);
            if (!response.ok) continue;

            const allFixtures = await response.json();
            if (!allFixtures || allFixtures.length === 0) continue;

            console.log(
              `🔍 [FeaturedMatch] Found ${allFixtures.length} fixtures for ${date}`,
            );

            // Apply TodayPopularLeague filtering logic
            const filteredFixtures = allFixtures.filter((fixture) => {
              if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
                return false;
              }

              // Apply MyFeaturedMatchExclusion
              if (shouldExcludeFeaturedMatch(
                fixture.league?.name || '',
                fixture.teams?.home?.name || '',
                fixture.teams?.away?.name || ''
              )) {
                return false;
              }

              // Apply smart time filtering
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

              const league = fixture.league;
              const country = league.country?.toLowerCase() || "";
              const leagueId = league.id;
              const leagueName = league.name?.toLowerCase() || "";

              // Check if it's a popular league
              const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

              // Check if it's from a popular country
              const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
                (popularCountry) => country.includes(popularCountry.toLowerCase()),
              );

              // Check if it's an international competition
              const isInternationalCompetition =
                leagueName.includes("champions league") ||
                leagueName.includes("europa league") ||
                leagueName.includes("conference league") ||
                leagueName.includes("uefa") ||
                leagueName.includes("world cup") ||
                leagueName.includes("fifa club world cup") ||
                leagueName.includes("fifa") ||
                leagueName.includes("conmebol") ||
                leagueName.includes("copa america") ||
                leagueName.includes("copa libertadores") ||
                leagueName.includes("copa sudamericana") ||
                leagueName.includes("libertadores") ||
                leagueName.includes("sudamericana") ||
                (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
                (leagueName.includes("international") && !leagueName.includes("women")) ||
                country.includes("world") ||
                country.includes("europe") ||
                country.includes("international");

              return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
            });

            // Group fixtures by country and league using TodayPopularLeague logic
            const fixturesByCountry = filteredFixtures.reduce((acc: any, fixture: any) => {
              const league = fixture.league;
              const country = league.country || "World";
              const leagueId = league.id;

              if (!acc[country]) {
                acc[country] = {
                  country,
                  leagues: {},
                  hasPopularLeague: false,
                };
              }

              // Check if this is a popular league
              const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);
              const isPopularCountry = POPULAR_COUNTRIES_ORDER.includes(country);

              if (isPopularLeague || isPopularCountry) {
                acc[country].hasPopularLeague = true;
              }

              if (!acc[country].leagues[leagueId]) {
                acc[country].leagues[leagueId] = {
                  league: league,
                  matches: [],
                  isPopular: isPopularLeague || isPopularCountry,
                };
              }

              acc[country].leagues[leagueId].matches.push(fixture);
              return acc;
            }, {});

            // Filter to show only popular countries
            const filteredCountries = Object.values(fixturesByCountry).filter(
              (countryData: any) => countryData.hasPopularLeague
            );

            // Sort countries by popular order
            const sortedCountries = filteredCountries.sort((a: any, b: any) => {
              const getPopularCountryIndex = (country: string) => {
                const index = POPULAR_COUNTRIES_ORDER.findIndex(
                  (pc) => pc.toLowerCase() === country.toLowerCase()
                );
                return index === -1 ? 999 : index;
              };

              const aPopularIndex = getPopularCountryIndex(a.country);
              const bPopularIndex = getPopularCountryIndex(b.country);

              return aPopularIndex - bPopularIndex;
            });

            // Get top leagues from all countries using TodayPopularLeague priority
            const allLeaguesFlat = sortedCountries.flatMap((countryData: any) =>
              Object.values(countryData.leagues).map((leagueData: any) => ({
                ...leagueData,
                country: countryData.country,
              }))
            );

            // Sort leagues by TodayPopularLeague priority system
            const sortedLeagues = allLeaguesFlat.sort((a: any, b: any) => {
              const getLeaguePriority = (leagueData: any) => {
                const name = (leagueData.league?.name || "").toLowerCase();
                const country = (leagueData.country || "").toLowerCase();

                // Check for UEFA Nations League - Women first (lowest priority)
                const isWomensNationsLeague = name.includes("uefa nations league") && name.includes("women");
                if (isWomensNationsLeague) return 999;

                // Handle World leagues with specific priority order
                if (country.includes("world") || country.includes("europe") || 
                    country.includes("international") || name.includes("uefa") ||
                    name.includes("fifa") || name.includes("conmebol")) {

                  // Priority 1: UEFA Nations League (HIGHEST PRIORITY)
                  if (name.includes("uefa nations league") && !name.includes("women")) {
                    return 1;
                  }

                  // Priority 2: Friendlies (but exclude UEFA Nations League and women's matches)
                  if (name.includes("friendlies") && !name.includes("uefa nations league") && !name.includes("women")) {
                    return 2;
                  }

                  // Priority 3: World Cup Qualification Asia
                  if (name.includes("world cup") && name.includes("qualification") && name.includes("asia")) {
                    return 3;
                  }

                  // Priority 4: World Cup Qualification CONCACAF
                  if (name.includes("world cup") && name.includes("qualification") && name.includes("concacaf")) {
                    return 4;
                  }

                  // Priority 5: World Cup Qualification Europe
                  if (name.includes("world cup") && name.includes("qualification") && name.includes("europe")) {
                    return 5;
                  }

                  // Priority 6: World Cup Qualification South America
                  if (name.includes("world cup") && name.includes("qualification") && name.includes("south america")) {
                    return 6;
                  }

                  // Priority 7: Tournoi Maurice Revello
                  if (name.includes("tournoi maurice revello")) {
                    return 7;
                  }

                  // Priority 8: Champions League
                  if (name.includes("champions league")) {
                    return 8;
                  }

                  // Priority 9: Europa League
                  if (name.includes("europa league")) {
                    return 9;
                  }

                  // Priority 10: Conference League
                  if (name.includes("conference league")) {
                    return 10;
                  }

                  return 50; // Other international competitions
                }

                // Handle domestic leagues
                const popularLeagues = [39, 140, 135, 78, 61]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
                if (popularLeagues.includes(leagueData.league?.id)) {
                  return 15; // High priority for popular domestic leagues
                }

                return 100; // Default priority for other leagues
              };

              const aPriority = getLeaguePriority(a);
              const bPriority = getLeaguePriority(b);

              // If priorities are different, sort by priority
              if (aPriority !== bPriority) {
                return aPriority - bPriority;
              }

              // If same priority, sort alphabetically by league name
              const aLeagueName = a.league?.name?.toLowerCase() || "";
              const bLeagueName = b.league?.name?.toLowerCase() || "";
              return aLeagueName.localeCompare(bLeagueName);
            });

            // Take only the top 2 leagues for this date
            const topLeagues = sortedLeagues.slice(0, maxLeagues);

            // Get matches from each top league
            for (const leagueData of topLeagues) {
              const leagueMatches = leagueData.matches || [];

              // Sort matches within league using TodayPopularLeague sorting
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
                    country: leagueData.country,
                  },
                  dateContext: date, // Add context for which date this match is from
                });
              }
            }
          } catch (error) {
            console.error(`🔍 [FeaturedMatch] Error fetching data for ${date}:`, error);
          }
        }

        // Sort featured matches using TodayPopularLeagueNew priority system
        const sortedFeaturedMatches = featuredMatches.sort((a, b) => {
          const aCountry = a.league?.country?.toLowerCase() || "";
          const bCountry = b.league?.country?.toLowerCase() || "";
          const aLeagueName = a.league?.name?.toLowerCase() || "";
          const bLeagueName = b.league?.name?.toLowerCase() || "";

          // Helper function to get league priority (based on TodayPopularLeagueNew)
          const getLeaguePriority = (match) => {
            const name = (match.league?.name || "").toLowerCase();
            const country = (match.league?.country || "").toLowerCase();

            // Check if it's marked as friendlies or contains friendlies in name
            const isFriendlies = name.includes("friendlies");

            // Check for UEFA Nations League - Women first (lowest priority)
            const isWomensNationsLeague =
              name.includes("uefa nations league") && name.includes("women");
            if (isWomensNationsLeague) return 999; // Lowest priority

            // Handle World leagues with specific priority order
            if (country.includes("world") || country.includes("europe") || 
                country.includes("international") || name.includes("uefa") ||
                name.includes("fifa") || name.includes("conmebol")) {

              // Priority 1: UEFA Nations League (HIGHEST PRIORITY - must come before all others)
              if (name.includes("uefa nations league") && !name.includes("women")) {
                return 1;
              }

              // Priority 2: Friendlies (but exclude UEFA Nations League and women's matches)
              if (isFriendlies && !name.includes("uefa nations league") && !name.includes("women")) {
                return 2;
              }

              // Priority 3: World Cup Qualification Asia
              if (name.includes("world cup") && name.includes("qualification") && name.includes("asia")) {
                return 3;
              }

              // Priority 4: World Cup Qualification CONCACAF
              if (name.includes("world cup") && name.includes("qualification") && name.includes("concacaf")) {
                return 4;
              }

              // Priority 5: World Cup Qualification Europe
              if (name.includes("world cup") && name.includes("qualification") && name.includes("europe")) {
                return 5;
              }

              // Priority 6: World Cup Qualification South America
              if (name.includes("world cup") && name.includes("qualification") && name.includes("south america")) {
                return 6;
              }

              // Priority 7: Tournoi Maurice Revello
              if (name.includes("tournoi maurice revello")) {
                return 7;
              }

              // Priority 8: Champions League
              if (name.includes("champions league")) {
                return 8;
              }

              // Priority 9: Europa League
              if (name.includes("europa league")) {
                return 9;
              }

              // Priority 10: Conference League
              if (name.includes("conference league")) {
                return 10;
              }

              return 50; // Other international competitions
            }

            // Handle domestic leagues
            const popularLeagues = [39, 140, 135, 78, 61]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
            if (popularLeagues.includes(match.league?.id)) {
              return 15; // High priority for popular domestic leagues
            }

            return 100; // Default priority for other leagues
          };

          const aPriority = getLeaguePriority(a);
          const bPriority = getLeaguePriority(b);

          // If priorities are different, sort by priority
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          // If same priority, apply status-based sorting
          const aStatus = a.fixture?.status?.short;
          const bStatus = b.fixture?.status?.short;

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

          // If same priority and status, sort alphabetically by league name
          return aLeagueName.localeCompare(bLeagueName);
        });

        // Take only the required number of matches
        const finalMatches = sortedFeaturedMatches.slice(0, maxMatches);
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

        console.log(
          "🔍 [FeaturedMatch] Returning",
          validMatches.length,
          "featured matches:",
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
            Getting the best match from popular leagues
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
            <p className="text-sm">Check back later for exciting matches</p>
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
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black h-[58px] w-[26px] p-2 rounded-r-full z-40 flex items-center border border-gray-200"
          >
            <ChevronLeft className="h-14 w-14" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black h-[58px] w-[26px] p-2 rounded-l-full z-40 flex items-center border border-gray-200"
          >
            <ChevronRight className="h-25 w-25" />
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
          <div className="bg-gray-50 p-2 mt-6 relative">
            <div className="flex items-center justify-center">
              {currentMatch?.league?.logo ? (
                <img
                  src={currentMatch.league.logo}
                  alt={currentMatch.league.name}
                  className="w-5 h-5 object-contain mr-2"
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
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
<Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border border-red-500 text-red-500 animate-pulse"
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

          <div className="p-0 h-full mt-0 mb-[10px] relative">
            {/* Match time/status and score display */}
            <div
              className="h-[98px] flex flex-col justify-center"
              style={{ marginBottom: "-5px" }}
            >
              {/* Match status */}
              <div className="text-center text-black"
                style={{
                  fontSize: "calc(0.875rem * 1.5)",
                  fontWeight: "700",
                  color: "#000000",
                  marginTop: "-15px"
                }}
              >
                {currentMatch?.fixture?.status?.short === "FT" ? "Full Time" :
                 currentMatch?.fixture?.status?.short === "AET" ? "After Extra Time" :
                 currentMatch?.fixture?.status?.short === "PEN" ? "After Penalties" :
                 currentMatch?.fixture?.status?.short === "1H" || 
                 currentMatch?.fixture?.status?.short === "2H" ? "Live" :
                 currentMatch?.fixture?.status?.short === "HT" ? "Half Time" :
                 currentMatch?.fixture?.status?.short === "NS" ? "Upcoming" :
                 currentMatch?.fixture?.status?.short}
              </div>

              {/* Score display for live and finished matches */}
              {currentMatch?.fixture?.status?.short &&
                (["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
                  currentMatch.fixture.status.short,
                )) && (
                  <div className="text-2xl text-black-500 font-bold flex items-center justify-center w-full">
                    <span>{currentMatch?.goals?.home ?? 0}</span>
                    <span className="text-2xl mx-2">-</span>
                    <span>{currentMatch?.goals?.away ?? 0}</span>
                  </div>
                )}
            </div>

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
                          filter: "contrast(115%) brightness(105%)",
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
                      filter: "contrast(115%) brightness(105%)",
                    }}
                    onClick={handleMatchClick}
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.svg";
                    }}
                  />
                </div>
              </div>

              {/* Match date and venue - centered below teams */}
              <div
                className="absolute text-center text-xs text-black font-medium"
                style={{
                  fontSize: "0.875rem",
                  whiteSpace: "nowrap",
                  overflow: "visible",
                  textAlign: "center",
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: "-25px",
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

                    return (
                      <>
                        {formattedDate} | {timeOnly}
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
            <div className="flex justify-around border-t border-gray-200 pt-4">
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