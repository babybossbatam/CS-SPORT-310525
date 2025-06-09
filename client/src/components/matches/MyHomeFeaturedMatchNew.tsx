import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useCachedQuery } from "@/lib/cachingHelper";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { shouldExcludeFromPopularLeagues } from "@/lib/MyPopularLeagueExclusion";

import { FixtureResponse } from "@/types/fixtures";
import { shouldExcludeFeaturedMatch } from "@/lib/MyFeaturedMatchExclusion";

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 3,
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get today's date if no selectedDate provided
  const today = new Date().toISOString().slice(0, 10);
  const dateToUse = selectedDate || today;

  // Smart cache duration based on date type
  const isToday = dateToUse === today;
  const isFuture = dateToUse > today;
  const cacheMaxAge = isFuture ? 4 * 60 * 60 * 1000 : isToday ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;

  // Fetch all fixtures for the selected date with smart caching
  const {
    data: fixtures = [],
    isLoading,
  } = useCachedQuery(
    ["all-fixtures-by-date", dateToUse],
    async () => {
      console.log(`🔄 [MyHomeFeaturedMatchNew] Fetching fresh data for date: ${dateToUse}`);
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${dateToUse}?all=true`,
      );
      const data = await response.json();
      console.log(`✅ [MyHomeFeaturedMatchNew] Received ${data?.length || 0} fixtures for ${dateToUse}`);
      return data;
    },
    {
      enabled: !!dateToUse,
      maxAge: cacheMaxAge,
      backgroundRefresh: false,
      staleTime: cacheMaxAge,
      gcTime: cacheMaxAge * 2,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  // 1. Country Priority System
  const POPULAR_COUNTRIES_ORDER = [
    "England", "Spain", "Italy", "Germany", "France", 
    "World", "Europe", "South America", "United Arab Emirates", "United-Arab-Emirates"
  ];

  // 2. Popular leagues for featured matches (Globally popular leagues) - Updated from TodayPopularFootballLeaguesNew
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78, 61, 848, 5, 15, 914]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Conference League, UEFA Nations League, FIFA Club World Cup, COSAFA Cup

  // Country-specific popular leagues
  const COUNTRY_POPULAR_LEAGUES = {
    "England": [39], // Premier League
    "Spain": [140], // La Liga
    "Italy": [135], // Serie A
    "Germany": [78], // Bundesliga
    "France": [61], // Ligue 1
    "World": [2, 3, 848, 15], // UEFA competitions and FIFA Club World Cup
    "Europe": [2, 3, 848], // UEFA competitions
    "South America": [9, 13], // Copa Libertadores, Copa Sudamericana
    "United Arab Emirates": [305], // UAE Pro League
    "United-Arab-Emirates": [305], // UAE Pro League
  };

  // Helper function to get country priority
  const getCountryPriority = (country: string) => {
    const index = POPULAR_COUNTRIES_ORDER.findIndex(c => 
      c.toLowerCase() === country?.toLowerCase()
    );
    return index === -1 ? 999 : index;
  };

  // Helper function to get league priority within country
  const getLeaguePriority = (match: FixtureResponse) => {
    const country = match.league.country || '';
    const leagueId = match.league.id;

    // Priority 1: Popular for specific country (highest priority)
    const countryLeagues = COUNTRY_POPULAR_LEAGUES[country] || [];
    if (countryLeagues.includes(leagueId)) {
      return 1;
    }

    // Priority 2: Globally popular leagues (second priority)
    if (POPULAR_LEAGUES.includes(leagueId)) {
      return 2;
    }

    // Priority 3: Special World league sorting (for "World" country)
    if (country === "World") {
      const leagueName = (match.league.name || '').toLowerCase();

      // UEFA Nations League (highest)
      if (leagueName.includes('uefa nations league') && !leagueName.includes('women')) {
        return 1;
      }

      // World Cup Qualifications
      if (leagueName.includes('world cup') && leagueName.includes('qualification')) {
        if (leagueName.includes('south america')) return 2;
        if (leagueName.includes('europe')) return 3;
        if (leagueName.includes('asia')) return 5;
        if (leagueName.includes('concacaf')) return 6;
      }

      // Friendlies (excluding UEFA Nations League and women's)
      if (leagueName.includes('friendlies') && !leagueName.includes('uefa nations league') && !leagueName.includes('women')) {
        return 4;
      }

      // Tournoi Maurice Revello
      if (leagueName.includes('tournoi maurice revello')) {
        return 7;
      }

      return 999; // Other World leagues
    }

    return 999; // Low priority
  };

  // Helper function to get match status priority
  const getMatchStatusPriority = (match: FixtureResponse) => {
    const status = match.fixture.status.short;

    // Priority 1: LIVE matches (highest priority)
    if (['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(status)) {
      return 1;
    }

    // Priority 2: Recently finished matches
    if (status === 'FT') {
      return 2;
    }

    // Priority 3: Upcoming matches (by time proximity)
    if (status === 'NS') {
      const matchTime = new Date(match.fixture.date);
      const now = new Date();
      const timeDiff = Math.abs(matchTime.getTime() - now.getTime());
      return 3 + (timeDiff / (1000 * 60 * 60)); // Add hours as fractional priority
    }

    return 999; // Other statuses
  };

  // Featured matches filtering logic using TodayPopularFootballLeaguesNew approach
  const featuredMatches = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(`🔍 [MyHomeFeaturedMatchNew] Processing ${fixtures.length} fixtures for date: ${dateToUse}`);

    // Apply smart time filtering with selected date context
    const timeFiltered = fixtures.filter((fixture) => {
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const fixtureDate = new Date(fixture.fixture.date).toISOString().slice(0, 10);

        // For featured matches, we want to be more inclusive with time filtering
        // Check if the fixture date matches the selected date
        if (fixtureDate === dateToUse) {
          return true;
        }

        // Also use smart time filtering as backup
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          dateToUse + "T12:00:00Z",
        );

        // Check if this match should be included based on the selected date
        const today = new Date();
        const todayString = today.toISOString().slice(0, 10);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().slice(0, 10);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().slice(0, 10);

        const shouldInclude = (() => {
          if (dateToUse === tomorrowString && smartResult.label === "tomorrow") return true;
          if (dateToUse === todayString && smartResult.label === "today") return true;
          if (dateToUse === yesterdayString && smartResult.label === "yesterday") return true;

          // Handle custom dates
          if (dateToUse !== todayString && dateToUse !== tomorrowString && dateToUse !== yesterdayString) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange) return true;
          }

          return false;
        })();

        return shouldInclude;
      }
      return true;
    });

    // ENHANCED: Apply strict filtering for only TOP-TIER leagues and matches
    const topTierFiltered = timeFiltered.filter((fixture) => {
      // Basic validation
      if (!fixture?.league || !fixture?.teams?.home || !fixture?.teams?.away) {
        return false;
      }

      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";
      const leagueName = fixture.league?.name?.toLowerCase() || "";

      // Apply exclusion check from TodayPopularFootballLeaguesNew
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

      // PRIORITY 1: Only the most elite leagues
      const eliteLeagues = [2, 3, 39, 140, 135, 78, 61, 848, 5]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Conference League, UEFA Nations League
      if (eliteLeagues.includes(leagueId)) {
        console.log(`🏆 [ELITE LEAGUE] Found elite league match: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${fixture.league.name})`);
        return true;
      }

      // PRIORITY 2: Major international competitions
      const isTopInternationalCompetition =
        leagueName.includes("uefa nations league") && !leagueName.includes("women") ||
        (leagueName.includes("world cup") && leagueName.includes("qualification") && 
         (leagueName.includes("europe") || leagueName.includes("south america"))) ||
        leagueName.includes("fifa club world cup");

      if (isTopInternationalCompetition) {
        console.log(`🌍 [TOP INTERNATIONAL] Found top international match: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${fixture.league.name})`);
        return true;
      }

      // PRIORITY 3: Only if from elite countries AND elite status
      const eliteCountries = ["England", "Spain", "Italy", "Germany", "France"];
      const isFromEliteCountry = eliteCountries.some(
        (eliteCountry) => country.includes(eliteCountry.toLowerCase()),
      );

      // For elite countries, only allow if it's a popular league within that country
      if (isFromEliteCountry && POPULAR_LEAGUES.includes(leagueId)) {
        console.log(`⭐ [ELITE COUNTRY] Found elite country popular league: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${fixture.league.name})`);
        return true;
      }

      // REJECT everything else for featured matches
      return false;
    });

    console.log(`🎯 [FEATURED FILTER] Filtered from ${fixtures.length} to ${topTierFiltered.length} top-tier matches`);

    // Sort by comprehensive priority system (same as TodayPopularFootballLeaguesNew)
    const sortedMatches = topTierFiltered.sort((a, b) => {
      // 1. Elite League Priority (most important)
      const eliteLeagues = [2, 3, 39, 140, 135, 78, 61, 848, 5]; // In priority order
      const aEliteIndex = eliteLeagues.indexOf(a.league.id);
      const bEliteIndex = eliteLeagues.indexOf(b.league.id);

      if (aEliteIndex !== -1 && bEliteIndex !== -1) {
        return aEliteIndex - bEliteIndex; // Sort by elite league priority
      }
      if (aEliteIndex !== -1 && bEliteIndex === -1) return -1;
      if (aEliteIndex === -1 && bEliteIndex !== -1) return 1;

      // 2. Country Priority System
      const aCountryPriority = getCountryPriority(a.league.country || '');
      const bCountryPriority = getCountryPriority(b.league.country || '');

      if (aCountryPriority !== bCountryPriority) {
        return aCountryPriority - bCountryPriority;
      }

      // 3. League Priority within Countries
      const aLeaguePriority = getLeaguePriority(a);
      const bLeaguePriority = getLeaguePriority(b);

      if (aLeaguePriority !== bLeaguePriority) {
        return aLeaguePriority - bLeaguePriority;
      }

      // 4. Match Status Priority - LIVE matches first
      const aStatusPriority = getMatchStatusPriority(a);
      const bStatusPriority = getMatchStatusPriority(b);

      if (aStatusPriority !== bStatusPriority) {
        return aStatusPriority - bStatusPriority;
      }

      // Final tiebreaker: alphabetical by league name
      return (a.league.name || '').localeCompare(b.league.name || '');
    });

    const limitedMatches = sortedMatches.slice(0, maxMatches || 3);
    console.log(`🔍 [MyHomeFeaturedMatchNew] Filtered ${fixtures.length} fixtures to ${limitedMatches.length} featured matches`);
    console.log(`🏆 [FEATURED RESULTS] Final matches:`, limitedMatches.map(m => ({
      league: m.league.name,
      match: `${m.teams.home.name} vs ${m.teams.away.name}`,
      status: m.fixture.status.short,
      leagueId: m.league.id
    })));

    return limitedMatches;
  }, [fixtures, dateToUse, maxMatches]);

  const currentMatch = featuredMatches[currentIndex] || null;

  const handlePrevious = () => {
    if (featuredMatches.length <= 1) return;
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : featuredMatches.length - 1);
  };

  const handleNext = () => {
    if (featuredMatches.length <= 1) return;
    setCurrentIndex(currentIndex < featuredMatches.length - 1 ? currentIndex + 1 : 0);
  };

  const handleMatchClick = () => {
    if (currentMatch?.fixture?.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  const getMatchStatus = (match: any) => {
    if (!match) return "";
    const status = match.fixture.status.short;
    const elapsed = match.fixture.status.elapsed;

    if (["1H", "2H"].includes(status)) {
      return `${elapsed}'`;
    }
    if (status === "HT") return "Halftime";
    if (status === "FT") return "Ended";
    if (status === "PEN") return "Penalty";
    if (status === "NS") return "UPCOMING";
    return status;
  };

  const getMatchStatusLabel = (match: any) => {
    if (!match) return "";
    const status = match.fixture.status.short;

    if (["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "PEN", "SUSP", "INT"].includes(status)) {
      return "LIVE";
    } else if (status === "FT") {
      return "FINISHED";
    } else {
      return "UPCOMING";
    }
  };

  const getTeamColor = (teamId: number) => {
    const colors = [
      "#6f7c93", // blue-gray
      "#8b0000", // dark red
      "#1d3557", // dark blue
      "#2a9d8f", // teal
      "#e63946", // red
    ];
    return colors[teamId % colors.length];
  };

  // Show loading state
  if (isLoading && !fixtures?.length) {
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
            <Trophy className="h-12 w-12 mb-3 opacity-50 animate-pulse" />
            <p className="text-lg font-medium mb-1">
              Loading featured matches...
            </p>
            <p className="text-sm">Please wait</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentMatch || featuredMatches.length === 0) {
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
            <p className="text-sm">Check back later for today's highlights</p>
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
      {featuredMatches.length > 1 && (
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
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.svg";
                  }}
                />
              ) : (
                <Trophy className="w-5 h-5 text-amber-500 mr-2" />
              )}
              <span className="text-sm font-medium">
                {currentMatch?.league?.name || "League Name"}
              </span>
              {getMatchStatusLabel(currentMatch) === "LIVE" ? (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 border border-red-500 text-red-500 animate-pulse ml-2"
                >
                  LIVE
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border ml-[3px] ${
                    getMatchStatusLabel(currentMatch) === "FINISHED"
                      ? "border-gray-500 text-gray-500"
                      : "border-blue-500 text-blue-500"
                  }`}
                >
                  {getMatchStatusLabel(currentMatch) === "FINISHED" ? "Final" : (currentMatch?.league?.round || getMatchStatusLabel(currentMatch))}
                </Badge>
              )}
            </div>
          </div>

          {/* Score and Status Display */}
          <div className="score-area h-20 flex flex-col justify-center items-center relative">
            {(() => {
              const status = currentMatch?.fixture?.status?.short;
              const elapsed = currentMatch?.fixture?.status?.elapsed;
              const isLive = getMatchStatusLabel(currentMatch) === "LIVE";
              const hasScore = currentMatch?.fixture?.status?.short &&
                ["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(status);

              if (hasScore) {
                const statusText = getMatchStatus(currentMatch);
                const scoreText = `${currentMatch?.goals?.home ?? 0}   -   ${currentMatch?.goals?.away ?? 0}`;

                return (
                  <div className={`flex flex-col items-center gap-1 ${isLive ? "text-red-600" : "text-gray-500"}`}>
                    <div className="text-xl tracking-wide">
                      {statusText}
                    </div>
                    <div className="text-xl font-semibold">
                      {scoreText}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="text-gray-100 text-sm uppercase tracking-wide">
                    UPCOMING
                  </div>
                );
              }
            })()}
          </div>

          {/* Team scoreboard with colored bars */}
          <div className="relative">
            <div className="flex relative h-[53px] rounded-md mb-8 cursor-pointer">
              <div className="w-full h-full flex justify-between relative">
                {/* Home team colored bar and logo */}
                <div
                  className="h-full w-[calc(50%-16px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative"
                  style={{
                    background: getTeamColor(currentMatch?.teams?.home?.id || 0),
                  }}
                >
                  <img
                    src={currentMatch?.teams?.home?.logo || `/assets/fallback-logo.svg`}
                    alt={currentMatch?.teams?.home?.name || "Home Team"}
                    className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full"
                    style={{
                      top: "calc(50% - 32px)",
                      left: "-32px",
                      filter: "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                    }}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.svg";
                    }}
                  />
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
                    background: getTeamColor(currentMatch?.teams?.away?.id || 1),
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
                  src={currentMatch?.teams?.away?.logo || `/assets/fallback-logo.svg`}
                  alt={currentMatch?.teams?.away?.name || "Away Team"}
                  className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full"
                  style={{
                    top: "calc(50% - 32px)",
                    right: "87px",
                    transform: "translateX(50%)",
                    filter: "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                  }}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.svg";
                  }}
                />
              </div>
            </div>

            {/* Match date and venue */}
            <div className="absolute text-center text-sm text-black font-medium"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 20px)",
                width: "max-content",
              }}
            >
              Today | {currentMatch?.fixture?.venue?.name || "Stadium"}
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="flex justify-around border-t border-gray-200 pt-4 mt-12 pb-4">
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/MatchDetail.svg"
                alt="Match Page"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-xs text-gray-600 mt-1">Match Page</span>
            </button>
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}/lineups`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/lineups.svg"
                alt="Lineups"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-xs text-gray-600 mt-1">Lineups</span>
            </button>
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}/h2h`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/stats.svg"
                alt="H2H"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-xs text-gray-600 mt-1">H2H</span>
            </button>
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}/standings`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/standings.svg"
                alt="Standings"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-xs text-gray-600 mt-1">Standings</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      {featuredMatches.length > 1 && (
        <div className="flex justify-center gap-2 py-2 mt-2">
          {featuredMatches.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1 h-1 rounded-full transition-all duration-200 ${
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