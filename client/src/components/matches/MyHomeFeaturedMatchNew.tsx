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

        // Fetch matches for today, tomorrow, and day after tomorrow
        const datesToFetch = [
          { date: todayString, maxLeagues: 3, maxMatches: 3 },
          { date: tomorrowString, maxLeagues: 3, maxMatches: 3 },
          { date: dayAfterTomorrowString, maxLeagues: 1, maxMatches: 1 },
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

            // Filter fixtures using smart time filtering and exclusion
            const filteredFixtures = allFixtures.filter((fixture) => {
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

              // Apply exclusion filters
              if (shouldExcludeFeaturedMatch(
                fixture.league?.name || '',
                fixture.teams?.home?.name || '',
                fixture.teams?.away?.name || ''
              )) {
                return false;
              }

              return true;
            });

            // Apply priority filtering using MyNewPriorityFilters
            const priorityFilteredFixtures = applyPriorityFiltering(
              filteredFixtures,
              date,
            );

            // Group by country and league
            const groupedByCountry = groupFixturesByCountryAndLeague(priorityFilteredFixtures);

            // Filter to show only popular countries
            const popularCountries = filterPopularCountries(groupedByCountry);

            // Flatten all leagues from popular countries
            const allLeaguesFlat = popularCountries.flatMap((countryData) =>
              Object.values(countryData.leagues).map((leagueData) => ({
                ...leagueData,
                country: countryData.country,
                flag: countryData.flag,
              })),
            );

            // Sort leagues by TodayPopularLeagueNew priority system
            const sortedLeagues = allLeaguesFlat.sort((a, b) => {
              const aCountry = a.country?.toLowerCase() || "";
              const bCountry = b.country?.toLowerCase() || "";
              const aLeagueName = a.league?.name?.toLowerCase() || "";
              const bLeagueName = b.league?.name?.toLowerCase() || "";

              // Helper function to get league priority (based on TodayPopularLeagueNew)
              const getLeaguePriority = (leagueData) => {
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
              return aLeagueName.localeCompare(bLeagueName);
            });

            // Take only the required number of leagues for this date
            const topLeagues = sortedLeagues.slice(0, maxLeagues);

            // Get matches from each top league
            for (const leagueData of topLeagues) {
              const leagueMatches = leagueData.matches || [];

              // Sort matches within league using TodayPopularLeagueNew sorting
              const sortedMatches = leagueMatches.sort((a, b) => {
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

                // PRIORITY 2: Upcoming (NS/TBD) matches come second, sorted by time first, then alphabetically
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

              // Take only the required number of matches for this date
              const topMatches = sortedMatches.slice(0, dateMaxMatches);

              // Add matches to featured collection
              for (const match of topMatches) {
                featuredMatches.push({
                  ...match,
                  league: {
                    ...match.league,
                    country: leagueData.country,
                    flag: leagueData.flag,
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

  // Loading state
  if (loading) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge
          variant="secondary"
          className="bg-blue-600 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
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
          className="bg-blue-600 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
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
    <Card
      className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden relative cursor-pointer hover:shadow-xl transition-shadow duration-200"
      onClick={handleMatchClick}
    >
      <Badge
        variant="secondary"
        className="bg-blue-600 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
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
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 p-2 rounded-full z-30 shadow-md transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 p-2 rounded-full z-30 shadow-md transition-all duration-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      <CardContent className="p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {/* League Info */}
            <div className="flex items-center gap-2 mb-4">
              {currentMatch.league?.flag && (
                <img
                  src={currentMatch.league.flag}
                  alt={currentMatch.league.country || "Country"}
                  className="w-4 h-4 rounded-sm object-cover"
                />
              )}
              <span className="text-sm font-medium text-gray-600">
                {currentMatch.league.name}
              </span>
              <Badge
                className={`text-xs px-2 py-1 text-white ${getStatusColor(currentMatch.fixture.status.short)}`}
              >
                {getMatchStatus(currentMatch)}
              </Badge>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center mb-4">
              {currentMatch.goals.home !== null &&
              currentMatch.goals.away !== null ? (
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {currentMatch.goals.home}-{currentMatch.goals.away}
                  </div>
                  <div className="text-xs font-semibold text-gray-600 mt-1">
                    {currentMatch.fixture.status.short === "FT" ? "Ended" :
                     currentMatch.fixture.status.short === "AET" ? "AET" :
                     currentMatch.fixture.status.short === "PEN" ? "PEN" :
                     currentMatch.fixture.status.short === "1H" || 
                     currentMatch.fixture.status.short === "2H" ? "Live" :
                     currentMatch.fixture.status.short === "HT" ? "HT" :
                     currentMatch.fixture.status.short}
                  </div>
                </div>
              ) : (
                <div className="text-lg font-medium text-gray-500">vs</div>
              )}
            </div>

            {/* Match content in TodayPopularLeagueNew style */}
            <div className="match-card-container group">
              {/* Star Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-yellow-500 hover:text-yellow-600 p-1 rounded-full z-30 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Add to favorites"
              >
                <Star className="h-3 w-3" />
              </button>

              <div className="match-content-container p-4">
                {/* Home Team Name - positioned further left */}
                <div
                  className={`home-team-name text-sm font-medium text-gray-900 truncate flex-1 ${
                    currentMatch.goals.home !== null &&
                    currentMatch.goals.away !== null &&
                    currentMatch.goals.home > currentMatch.goals.away
                      ? "font-bold"
                      : ""
                  }`}
                >
                  {shortenTeamName ? shortenTeamName(currentMatch.teams.home.name) : currentMatch.teams.home.name}
                </div>

                {/* Home team logo - closer to center */}
                <div className="team-logo-container flex-shrink-0 mx-2">
                  <LazyImage
                    src={
                      currentMatch.teams.home.id
                        ? `/api/team-logo/square/${currentMatch.teams.home.id}?size=36`
                        : "/assets/fallback-logo.svg"
                    }
                    alt={currentMatch.teams.home.name}
                    title={currentMatch.teams.home.name}
                    className={`w-9 h-9 object-contain ${
                      isNationalTeam(currentMatch.teams.home, currentMatch.league)
                        ? "national-team"
                        : ""
                    }`}
                    style={{ backgroundColor: "transparent" }}
                    fallbackSrc="/assets/fallback-logo.svg"
                  />
                </div>

                {/* Score/Time Center - Fixed width and centered */}
                <div className="match-score-container flex-shrink-0 text-center min-w-[80px]">
                  {(() => {
                                    const status = currentMatch.fixture.status.short;
                                    const fixtureDate = parseISO(currentMatch.fixture.date);

                                    // Live matches
                                    if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                                      return (
                                        <div className="relative">
                                          <div className="match-score-display">
                                            <span className="score-number">
                                              {currentMatch.goals.home ?? 0}
                                            </span>
                                            <span className="score-separator">
                                              -
                                            </span>
                                            <span className="score-number">
                                              {currentMatch.goals.away ?? 0}
                                            </span>
                                          </div>
                                          <div className="match-status-label status-live">
                                            {status === "HT"
                                              ? "Halftime"
                                              : `${currentMatch.fixture.status.elapsed || 0}'`}
                                          </div>
                                        </div>
                                      );
                                    }

                                    // All finished match statuses
                                    if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
                                      // Check if we have actual numerical scores
                                      const homeScore = currentMatch.goals.home;
                                      const awayScore = currentMatch.goals.away;
                                      const hasValidScores =
                                        homeScore !== null &&
                                        homeScore !== undefined &&
                                        awayScore !== null &&
                                        awayScore !== undefined &&
                                        !isNaN(Number(homeScore)) &&
                                        !isNaN(Number(awayScore));

                                      if (hasValidScores) {
                                        return (
                                          <div className="relative">
                                            <div className="match-score-display">
                                              <span className="score-number">
                                                {homeScore}
                                              </span>
                                              <span className="score-separator">
                                                -
                                              </span>
                                              <span className="score-number">
                                                {awayScore}                                              </span>
                                            </div>
                                            <div className="match-status-label status-ended">
                                              {status === "FT"
                                                ? "Ended"
                                                : status === "AET"
                                                  ? "AET"
                                                  : status === "PEN"
                                                    ? "PEN"
                                                    : status === "AWD"
                                                      ? "Awarded"
                                                      : status === "WO"
                                                        ? "Walkover"
                                                        : status === "ABD"
                                                          ? "Abandoned"
                                                          : status === "CANC"
                                                            ? "Cancelled"
                                                            : status === "SUSP"
                                                              ? "Suspended"
                                                              : status}
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        // Match is finished but no valid score data
                                        const statusText =
                                          status === "FT"
                                            ? "No Score"
                                            : status === "AET"
                                              ? "AET"
                                              : status === "PEN"
                                                ? "PEN"
                                                : status === "AWD"
                                                  ? "Awarded"
                                                  : status === "WO"
                                                    ? "Walkover"
                                                    : status === "ABD"
                                                      ? "Abandoned"
                                                      : status === "CANC"
                                                        ? "Cancelled"
                                                        : status === "SUSP"
                                                          ? "Suspended"
                                                          : "No Score";

                                        return (
                                          <div className="relative">
                                            <div className="text-sm font-medium text-gray-900">
                                              {format(fixtureDate, "HH:mm")}
                                            </div>
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                              <span className="text-gray-600 bg-white px-1 rounded">
                                                {statusText}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      }
                                    }

                                    // Postponed or delayed matches
                                    if (["PST", "CANC", "ABD", "SUSP", "AWD", "WO"].includes(status)) {
                                      const statusText =
                                        status === "PST"
                                          ? "Postponed"
                                          : status === "CANC"
                                            ? "Cancelled"
                                            : status === "ABD"
                                              ? "Abandoned"
                                              : status === "SUSP"
                                                ? "Suspended"
                                                : status === "AWD"
                                                  ? "Awarded"
                                                  : status === "WO"
                                                    ? "Walkover"
                                                    : status;

                                      return (
                                        <div className="relative">
                                          <div className="text-sm font-medium text-gray-900">
                                            {format(fixtureDate, "HH:mm")}
                                          </div>
                                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                            <span className="text-red-600 bg-white px-1 rounded">
                                              {statusText}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }

                                    // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                                    return (
                                      <div className="relative flex items-center justify-center h-full">
                                        <div className="match-time-display">
                                          {status === "TBD"
                                            ? "TBD"
                                            : format(fixtureDate, "HH:mm")}
                                        </div>
                                        {status === "TBD" && (
                                          <div className="match-status-label status-upcoming">
                                            Time TBD
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                </div>

                {/* Away team logo - closer to center */}
                <div className="team-logo-container flex-shrink-0 mx-2">
                  <LazyImage
                    src={
                      currentMatch.teams.away.id
                        ? `/api/team-logo/square/${currentMatch.teams.away.id}?size=36`
                        : "/assets/fallback-logo.svg"
                    }
                    alt={currentMatch.teams.away.name}
                    title={currentMatch.teams.away.name}
                    className={`w-9 h-9 object-contain ${
                      isNationalTeam(currentMatch.teams.away, currentMatch.league)
                        ? "national-team"
                        : ""
                    }`}
                    style={{ backgroundColor: "transparent" }}
                    fallbackSrc="/assets/fallback-logo.svg"
                  />
                </div>

                {/* Away Team Name - positioned further right */}
                <div
                  className={`away-team-name text-sm font-medium text-gray-900 truncate flex-1 text-right ${
                    currentMatch.goals.home !== null &&
                    currentMatch.goals.away !== null &&
                    currentMatch.goals.away > currentMatch.goals.home
                      ? "font-bold"
                      : ""
                  }`}
                >
                  {shortenTeamName ? shortenTeamName(currentMatch.teams.away.name) : currentMatch.teams.away.name}
                </div>
              </div>
            </div>

            {/* Match Info */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(currentMatch.fixture.date), "MMM dd, HH:mm")}
                </div>
                {currentMatch.fixture?.venue?.name && (
                  <div className="flex items-center gap-1">
                    <Grid3X3 className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">
                      {currentMatch.fixture.venue.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span>View Details</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicator dots for multiple matches */}
        {matches.length > 1 && (
          <div className="flex justify-center gap-2 py-3 bg-gray-50">
            {matches.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? "bg-blue-600" : "bg-gray-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>

      <style jsx>{`
        .match-card-container {
          position: relative;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s ease;
        }

        .match-card-container:hover {
          background-color: #f9fafb;
        }

        .match-content-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 60px;
          padding: 12px 16px;
        }

        .home-team-name,
        .away-team-name {
          min-width: 0;
          max-width: 120px;
        }

        .team-logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .team-logo {
          transition: transform 0.2s ease;
        }

        .team-logo:hover {
          transform: scale(1.1);
        }

        .national-team {
          border-radius: 2px;
        }

        .match-score-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .score-number {
          font-weight: 700;
          font-size: 18px;
        }

        .score-separator {
          margin: 0 4px;
          font-weight: 400;
        }
      `}</style>
    </Card>
  );
};

export default MyFeaturedMatchSlide;