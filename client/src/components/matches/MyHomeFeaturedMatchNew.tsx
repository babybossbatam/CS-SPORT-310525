import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useCachedQuery } from "@/lib/cachingHelper";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { shouldExcludeFromPopularLeagues } from "@/lib/MyPopularLeagueExclusion";
import { getCountryFlagWithFallbackSync } from "@/lib/flagUtils";

import { FixtureResponse } from "@/types/fixtures";
import { shouldExcludeFeaturedMatch } from "@/lib/MyFeaturedMatchExclusion";

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 9,
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Get multiple days of data for slide distribution
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().slice(0, 10);
  const twoDaysAfter = new Date();
  twoDaysAfter.setDate(twoDaysAfter.getDate() + 3);
  const twoDaysAfterStr = twoDaysAfter.toISOString().slice(0, 10);

  const dateToUse = selectedDate || today;
  const cacheMaxAge = 2 * 60 * 60 * 1000; // 2 hours cache for featured matches

  // Fetch fixtures for multiple days to build the 8-slide distribution
  const {
    data: fixtures = [],
    isLoading,
  } = useCachedQuery(
    ["featured-matches-multi-day", today, tomorrowStr, dayAfterStr, twoDaysAfterStr],
    async () => {
      console.log(`🔄 [MyHomeFeaturedMatchNew] Fetching multi-day data for slides distribution`);

      const datePromises = [today, tomorrowStr, dayAfterStr, twoDaysAfterStr].map(async (date) => {
        try {
          const response = await apiRequest("GET", `/api/fixtures/date/${date}?all=true`);
          const data = await response.json();
          console.log(`✅ [MyHomeFeaturedMatchNew] Received ${data?.length || 0} fixtures for ${date}`);
          return data || [];
        } catch (error) {
          console.error(`❌ [MyHomeFeaturedMatchNew] Error fetching fixtures for ${date}:`, error);
          return [];
        }
      });

      const allResults = await Promise.all(datePromises);
      const allFixtures = allResults.flat();

      console.log(`🎯 [MyHomeFeaturedMatchNew] Total fixtures across 4 days: ${allFixtures.length}`);
      return allFixtures;
    },
    {
      enabled: true,
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

  // Featured matches filtering logic with specific slide distribution
  const featuredMatches = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(`🔍 [MyHomeFeaturedMatchNew] Processing ${fixtures.length} fixtures for date: ${dateToUse}`);

    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().slice(0, 10);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowString = dayAfterTomorrow.toISOString().slice(0, 10);
    const twoDaysAfter = new Date(today);
    twoDaysAfter.setDate(twoDaysAfter.getDate() + 3);
    const twoDaysAfterString = twoDaysAfter.toISOString().slice(0, 10);

    // Filter matches by elite leagues and competitions
    const getEliteMatches = (matchesArray: any[]) => {
      return matchesArray.filter((fixture) => {
        // Basic validation
        if (!fixture?.league || !fixture?.teams?.home || !fixture?.teams?.away) {
          return false;
        }

        const leagueId = fixture.league?.id;
        const country = fixture.league?.country?.toLowerCase() || "";
        const leagueName = fixture.league?.name?.toLowerCase() || "";

        // Apply exclusion check
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
        const eliteLeagues = [2, 3, 39, 140, 135, 78, 61, 848, 5];
        if (eliteLeagues.includes(leagueId)) {
          return true;
        }

        // PRIORITY 2: Major international competitions
        const isTopInternationalCompetition =
          leagueName.includes("uefa nations league") && !leagueName.includes("women") ||
          (leagueName.includes("world cup") && leagueName.includes("qualification") && 
           (leagueName.includes("europe") || leagueName.includes("south america"))) ||
          leagueName.includes("fifa club world cup");

        if (isTopInternationalCompetition) {
          return true;
        }

        // PRIORITY 3: Elite countries with popular leagues
        const eliteCountries = ["England", "Spain", "Italy", "Germany", "France"];
        const isFromEliteCountry = eliteCountries.some(
          (eliteCountry) => country.includes(eliteCountry.toLowerCase()),
        );

        if (isFromEliteCountry && POPULAR_LEAGUES.includes(leagueId)) {
          return true;
        }

        return false;
      });
    };

    // Sort matches by priority
    const sortByPriority = (matches: any[]) => {
      return matches.sort((a, b) => {
        // 1. Elite League Priority
        const eliteLeagues = [2, 3, 39, 140, 135, 78, 61, 848, 5];
        const aEliteIndex = eliteLeagues.indexOf(a.league.id);
        const bEliteIndex = eliteLeagues.indexOf(b.league.id);

        if (aEliteIndex !== -1 && bEliteIndex !== -1) {
          return aEliteIndex - bEliteIndex;
        }
        if (aEliteIndex !== -1 && bEliteIndex === -1) return -1;
        if (aEliteIndex === -1 && bEliteIndex !== -1) return 1;

        // 2. Match Status Priority
        const aStatusPriority = getMatchStatusPriority(a);
        const bStatusPriority = getMatchStatusPriority(b);

        if (aStatusPriority !== bStatusPriority) {
          return aStatusPriority - bStatusPriority;
        }

        // 3. Time proximity for upcoming matches
        if (a.fixture.status.short === 'NS' && b.fixture.status.short === 'NS') {
          const aTime = new Date(a.fixture.date).getTime();
          const bTime = new Date(b.fixture.date).getTime();
          return aTime - bTime;
        }

        return (a.league.name || '').localeCompare(b.league.name || '');
      });
    };

    // Get matches for different days
    const todayMatches = fixtures.filter(f => {
      const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
      return fixtureDate === todayString;
    });

    const tomorrowMatches = fixtures.filter(f => {
      const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
      return fixtureDate === tomorrowString;
    });

    const dayAfterTomorrowMatches = fixtures.filter(f => {
      const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
      return fixtureDate === dayAfterTomorrowString;
    });

    const twoDaysAfterMatches = fixtures.filter(f => {
      const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
      return fixtureDate === twoDaysAfterString;
    });

    // Process each day's matches
    const todayElite = getEliteMatches(todayMatches);
    const tomorrowElite = getEliteMatches(tomorrowMatches);
    const dayAfterElite = getEliteMatches(dayAfterTomorrowMatches);
    const twoDaysAfterElite = getEliteMatches(twoDaysAfterMatches);

    // Sort each day's matches
    const todaySorted = sortByPriority(todayElite);
    const tomorrowSorted = sortByPriority(tomorrowElite);
    const dayAfterSorted = sortByPriority(dayAfterElite);
    const twoDaysAfterSorted = sortByPriority(twoDaysAfterElite);

    // Helper function to get matches by priority type
    const getLiveMatches = (matches: any[]) => matches.filter(m => ['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(m.fixture.status.short));
    const getUpcomingMatches = (matches: any[]) => matches.filter(m => m.fixture.status.short === 'NS');
    const getFinishedMatches = (matches: any[]) => matches.filter(m => ['FT', 'AET', 'PEN'].includes(m.fixture.status.short));

    // Get categorized matches for today
    const todayLive = getLiveMatches(todaySorted);
    const todayUpcoming = getUpcomingMatches(todaySorted);
    const todayFinished = getFinishedMatches(todaySorted);

    // Get upcoming matches for future days
    const tomorrowUpcoming = getUpcomingMatches(tomorrowSorted);
    const dayAfterUpcoming = getUpcomingMatches(dayAfterSorted);

    // Build the 9-slide distribution with improved logic for finished matches
    const slidesDistribution = [];
    const usedFixtureIds = new Set<number>();

    // Helper function to add match if not already used
    const addUniqueMatch = (match: any) => {
      if (match && !usedFixtureIds.has(match.fixture.id)) {
        slidesDistribution.push(match);
        usedFixtureIds.add(match.fixture.id);
        return true;
      }
      return false;
    };

    // Slide 1: ONLY Live or Recently Finished Matches
    // Priority: live first, then finished (NO upcoming matches in slide 1)
    if (todayLive.length > 0) {
      addUniqueMatch(todayLive[0]);
    } else if (todayFinished.length > 0) {
      addUniqueMatch(todayFinished[0]);
    }

    // Slide 2: Today Finished Match / Today Upcoming Match / Tomorrow Upcoming
    // Priority: finished first, then upcoming, then tomorrow
    let addedToSlide2 = false;
    for (let i = 0; i < todayFinished.length && !addedToSlide2; i++) {
      if (addUniqueMatch(todayFinished[i])) {
        addedToSlide2 = true;
      }
    }
    if (!addedToSlide2) {
      for (let i = 0; i < todayUpcoming.length && !addedToSlide2; i++) {
        if (addUniqueMatch(todayUpcoming[i])) {
          addedToSlide2 = true;
        }
      }
    }
    if (!addedToSlide2 && tomorrowUpcoming.length > 0) {
      addUniqueMatch(tomorrowUpcoming[0]);
      addedToSlide2 = true;
    }

    // Slide 3: Today Finished Match / Today Upcoming Match
    // Priority: finished matches first (different from slide 2), then upcoming
    let addedToSlide3 = false;
    for (let i = 0; i < todayFinished.length && !addedToSlide3; i++) {
      if (addUniqueMatch(todayFinished[i])) {
        addedToSlide3 = true;
      }
    }
    if (!addedToSlide3) {
      for (let i = 0; i < todayUpcoming.length && !addedToSlide3; i++) {
        if (addUniqueMatch(todayUpcoming[i])) {
          addedToSlide3 = true;
        }
      }
    }

    // Slide 4: Tomorrow Upcoming Match (first unique match)
    for (let i = 0; i < tomorrowUpcoming.length; i++) {
      if (addUniqueMatch(tomorrowUpcoming[i])) {
        break;
      }
    }

    // Slide 5: Day after tomorrow Upcoming Match (first unique match)
    for (let i = 0; i < dayAfterUpcoming.length; i++) {
      if (addUniqueMatch(dayAfterUpcoming[i])) {
        break;
      }
    }

    // Slide 6: Tomorrow Upcoming Match / Recent Finished match (second unique match)
    let addedToSlide6 = false;
    for (let i = 0; i < tomorrowUpcoming.length && !addedToSlide6; i++) {
      if (addUniqueMatch(tomorrowUpcoming[i])) {
        addedToSlide6 = true;
      }
    }
    if (!addedToSlide6) {
      const tomorrowFinished = getFinishedMatches(tomorrowSorted);
      for (let i = 0; i < tomorrowFinished.length && !addedToSlide6; i++) {
        if (addUniqueMatch(tomorrowFinished[i])) {
          addedToSlide6 = true;
        }
      }
    }

    // Slide 7: Day after tomorrow Upcoming Match (second unique match)
    for (let i = 0; i < dayAfterUpcoming.length; i++) {
      if (addUniqueMatch(dayAfterUpcoming[i])) {
        break;
      }
    }

    // Slide 8: Day after tomorrow Upcoming Match (third unique match)
    for (let i = 0; i < dayAfterUpcoming.length; i++) {
      if (addUniqueMatch(dayAfterUpcoming[i])) {
        break;
      }
    }

    // Slide 9: Day after tomorrow Upcoming Match / Any remaining matches
    for (let i = 0; i < dayAfterUpcoming.length; i++) {
      if (addUniqueMatch(dayAfterUpcoming[i])) {
        break;
      }
    }

    // Ensure we have exactly 9 slides by filling with additional matches if needed
    const allRemainingMatches = [...todayUpcoming, ...tomorrowUpcoming, ...dayAfterUpcoming, ...todayFinished];
    while (slidesDistribution.length < 9 && allRemainingMatches.length > 0) {
      for (let i = 0; i < allRemainingMatches.length && slidesDistribution.length < 9; i++) {
        if (addUniqueMatch(allRemainingMatches[i])) {
          break;
        }
      }
      // Break if no more unique matches can be added
      if (slidesDistribution.length < 9) {
        const currentLength = slidesDistribution.length;
        for (let i = 0; i < allRemainingMatches.length && slidesDistribution.length < 9; i++) {
          addUniqueMatch(allRemainingMatches[i]);
        }
        // If no new matches were added, break to avoid infinite loop
        if (slidesDistribution.length === currentLength) {
          break;
        }
      }
    }

    // Remove any undefined entries and ensure we have at least some slides
    const finalSlides = slidesDistribution.filter(Boolean);

    console.log(`🎯 [SLIDE DISTRIBUTION] Today: ${todaySorted.length} (Live: ${todayLive.length}, Upcoming: ${todayUpcoming.length}, Finished: ${todayFinished.length}), Tomorrow: ${tomorrowSorted.length}, Day+2: ${dayAfterSorted.length}, Day+3: ${twoDaysAfterSorted.length}`);
    console.log(`🔍 [MyHomeFeaturedMatchNew] Final slide distribution: ${finalSlides.length} matches`);
    console.log(`🏆 [FEATURED RESULTS] Final matches:`, finalSlides.map((m, i) => ({
      slide: i + 1,
      date: new Date(m.fixture.date).toISOString().slice(0, 10),
      league: m.league.name,
      match: `${m.teams.home.name} vs ${m.teams.away.name}`,
      status: m.fixture.status.short,
      leagueId: m.league.id,
      slideType: i === 0 ? 'Live/Finished ONLY' : 
                 i === 1 ? 'Today Finished/Upcoming' :
                 i === 2 ? 'Today Finished/Upcoming #2' :
                 i === 3 ? 'Tomorrow Upcoming #1' :
                 i === 4 ? 'Day+2 Upcoming #1' :
                 i === 5 ? 'Tomorrow Upcoming #2' :
                 i === 6 ? 'Day+2 Upcoming #2' :
                 i === 7 ? 'Day+2 Upcoming #3' :
                 i === 8 ? 'Day+2 Upcoming #4' : 'Extra'
    })));

    return finalSlides;
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
    if (status === "AET") return "After Extra Time";
    if (status === "PEN") return "Ended (Penalties)";
    if (status === "NS") return "UPCOMING";
    return status;
  };

  const getMatchStatusLabel = (match: any) => {
    if (!match) return "";
    const status = match.fixture.status.short;

    if (["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(status)) {
      return "LIVE";
    } else if (["FT", "AET", "PEN"].includes(status)) {
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
          <div className="bg-white p-2 mt-6 relative">
            <div className="flex items-center justify-center">
              {(() => {
                // Helper function to get country code for Circle Flags
                const getCountryCodeForCircleFlags = (country: string): string | null => {
                  const countryMap: { [key: string]: string } = {
                    'England': 'gb-eng',
                    'Scotland': 'gb-sct', 
                    'Wales': 'gb-wls',
                    'Northern Ireland': 'gb-nir',
                    'Spain': 'es',
                    'Italy': 'it',
                    'Germany': 'de',
                    'France': 'fr',
                    'Portugal': 'pt',
                    'Netherlands': 'nl',
                    'Belgium': 'be',
                    'Croatia': 'hr',
                    'Poland': 'pl',
                    'Ukraine': 'ua',
                    'Turkey': 'tr',
                    'Switzerland': 'ch',
                    'Austria': 'at',
                    'Czech Republic': 'cz',
                    'Denmark': 'dk',
                    'Sweden': 'se',
                    'Norway': 'no',
                    'Finland': 'fi',
                    'Russia': 'ru',
                    'Serbia': 'rs',
                    'Slovenia': 'si',
                    'Slovakia': 'sk',
                    'Hungary': 'hu',
                    'Romania': 'ro',
                    'Bulgaria': 'bg',
                    'Greece': 'gr',
                    'Bosnia and Herzegovina': 'ba',
                    'Montenegro': 'me',
                    'North Macedonia': 'mk',
                    'FYR Macedonia': 'mk',
                    'Macedonia': 'mk',
                    'Albania': 'al',
                    'Kosovo': 'xk',
                    'Moldova': 'md',
                    'Belarus': 'by',
                    'Lithuania': 'lt',
                    'Latvia': 'lv',
                    'Estonia': 'ee',
                    'Iceland': 'is',
                    'Ireland': 'ie',
                    'Luxembourg': 'lu',
                    'Liechtenstein': 'li',
                    'Malta': 'mt',
                    'Cyprus': 'cy',
                    'Georgia': 'ge',
                    'Armenia': 'am',
                    'Azerbaijan': 'az',
                    'Kazakhstan': 'kz',
                    'Faroe Islands': 'fo',
                    'Gibraltar': 'gi',
                    'Andorra': 'ad',
                    'San Marino': 'sm',
                    'Monaco': 'mc',
                    'Vatican City': 'va',
                    'Brazil': 'br',
                    'Argentina': 'ar',
                    'Uruguay': 'uy',
                    'Chile': 'cl',
                    'Peru': 'pe',
                    'Colombia': 'co',
                    'Ecuador': 'ec',
                    'Venezuela': 've',
                    'Bolivia': 'bo',
                    'Paraguay': 'py',
                    'Guyana': 'gy',
                    'Suriname': 'sr',
                    'French Guiana': 'gf'
                  };

                  return countryMap[country] || null;
                };

                // Check if this is an international competition
                const isInternationalCompetition = currentMatch?.league?.country === 'World' || 
                                                 currentMatch?.league?.country === 'Europe' ||
                                                 currentMatch?.league?.country === 'South America' ||
                                                 currentMatch?.league?.name?.toLowerCase().includes('world cup') ||
                                                 currentMatch?.league?.name?.toLowerCase().includes('euro') ||
                                                 currentMatch?.league?.name?.toLowerCase().includes('copa america') ||
                                                 currentMatch?.league?.name?.toLowerCase().includes('uefa nations') ||
                                                 currentMatch?.league?.name?.toLowerCase().includes('international');

                if (isInternationalCompetition && currentMatch?.league?.country) {
                  // For international competitions, use Circle Flags
                  if (currentMatch.league.country === 'World') {
                    return (
                      <img
                        src="https://hatscripts.github.io/circle-flags/flags/un.svg"
                        alt="World Competition"
                        className="w-5 h-5 object-contain mr-2 drop-shadow-md rounded-sm"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          if (currentMatch?.league?.logo && !e.currentTarget.src.includes(currentMatch.league.logo)) {
                            e.currentTarget.src = currentMatch.league.logo;
                          } else {
                            e.currentTarget.src = "/assets/fallback-logo.svg";
                          }
                        }}
                      />
                    );
                  } else if (currentMatch.league.country === 'Europe') {
                    return (
                      <img
                        src="https://hatscripts.github.io/circle-flags/flags/eu.svg"
                        alt="European Competition"
                        className="w-5 h-5 object-contain mr-2 drop-shadow-md rounded-sm"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          if (currentMatch?.league?.logo && !e.currentTarget.src.includes(currentMatch.league.logo)) {
                            e.currentTarget.src = currentMatch.league.logo;
                          } else {
                            e.currentTarget.src = "/assets/fallback-logo.svg";
                          }
                        }}
                      />
                    );
                  }
                }

                // For national teams or country-specific leagues, try Circle Flags first
                if (currentMatch?.league?.country) {
                  const countryCode = getCountryCodeForCircleFlags(currentMatch.league.country);

                  if (countryCode) {
                    return (
                      <img
                        src={`https://hatscripts.github.io/circle-flags/flags/${countryCode}.svg`}
                        alt={currentMatch.league.country}
                        className="w-5 h-5 object-contain mr-2 drop-shadow-md rounded-sm"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          // Fallback to original flag utils, then league logo
                          const fallbackFlag = getCountryFlagWithFallbackSync(currentMatch.league.country, currentMatch?.league?.logo);
                          if (fallbackFlag && !e.currentTarget.src.includes(fallbackFlag)) {
                            e.currentTarget.src = fallbackFlag;
                          } else if (currentMatch?.league?.logo && !e.currentTarget.src.includes(currentMatch.league.logo)) {
                            e.currentTarget.src = currentMatch.league.logo;
                          } else {
                            e.currentTarget.src = "/assets/fallback-logo.svg";
                          }
                        }}
                      />
                    );
                  }

                  // Fallback to original flag system
                  const countryFlag = getCountryFlagWithFallbackSync(currentMatch.league.country, currentMatch?.league?.logo);
                  if (countryFlag) {
                    return (
                      <img
                        src={countryFlag}
                        alt={currentMatch.league.country}
                        className="w-5 h-5 object-contain mr-2 drop-shadow-md rounded-sm"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          if (currentMatch?.league?.logo && !e.currentTarget.src.includes(currentMatch.league.logo)) {
                            e.currentTarget.src = currentMatch.league.logo;
                          } else {
                            e.currentTarget.src = "/assets/fallback-logo.svg";
                          }
                        }}
                      />
                    );
                  }
                }

                // Always use league logo for league info section
                if (currentMatch?.league?.logo) {
                  return (
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
                  );
                } else {
                  return <Trophy className="w-5 h-5 text-amber-500 mr-2" />;
                }
              })()}
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
                  {getMatchStatusLabel(currentMatch) === "FINISHED" ? (currentMatch?.league?.round || "Final") : (currentMatch?.league?.round || getMatchStatusLabel(currentMatch))}
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

                // Check for penalty scores
                const penaltyHome = currentMatch?.score?.penalty?.home;
                const penaltyAway = currentMatch?.score?.penalty?.away;
                const hasPenaltyScores = penaltyHome !== null && penaltyHome !== undefined && 
                                       penaltyAway !== null && penaltyAway !== undefined;

                const isPenaltyMatch = status === "PEN";

                return (
                  <div className="flex flex-col items-center">
                    <div className={`text-sm tracking-wide mt-1 ${isLive ? "text-red-600" : "text-gray-500"}`}>
                      {statusText}
                    </div>
                    <div className="text-xl font-semibold text-black mb-1 mt-1" style={{ fontSize: '1.95rem' }}>
                      {scoreText}
                    </div>
                    {isPenaltyMatch && hasPenaltyScores && (
                      <div className="text-xs text-gray-600 mt-0.5 mb-4 text-center">
                        {penaltyHome > penaltyAway 
                          ? `${currentMatch?.teams?.home?.name} has won ${penaltyHome}-${penaltyAway} after Penalties`
                          : `${currentMatch?.teams?.away?.name} has won ${penaltyAway}-${penaltyHome} after Penalties`
                        }
                      </div>
                    )}
                  </div>
                );
              } else {
                // Calculate days until match with proper date comparison
                const matchDate = new Date(currentMatch?.fixture?.date || '');
                const now = new Date();

                // Get the current date in the same format as the match date
                const today = new Date();
                const todayDateString = today.toISOString().slice(0, 10); // YYYY-MM-DD
                const matchDateString = matchDate.toISOString().slice(0, 10); // YYYY-MM-DD
                
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowDateString = tomorrow.toISOString().slice(0, 10);

                let daysText;
                let showCountdown = false;
                let hoursUntilKickoff = 0;

                if (matchDateString === todayDateString) {
                  // It's today - check if within 12 hours
                  const msUntilKickoff = matchDate.getTime() - now.getTime();
                  hoursUntilKickoff = msUntilKickoff / (1000 * 60 * 60);
                  
                  if (hoursUntilKickoff > 0 && hoursUntilKickoff <= 12) {
                    showCountdown = true;
                  } else {
                    daysText = 'Today';
                  }
                } else if (matchDateString === tomorrowDateString) {
                  daysText = 'Tomorrow';
                } else {
                  // For other dates, calculate the difference in days
                  const matchDateOnly = new Date(matchDateString);
                  const todayOnly = new Date(todayDateString);
                  const timeDiff = matchDateOnly.getTime() - todayOnly.getTime();
                  const daysUntilMatch = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                  
                  if (daysUntilMatch > 0) {
                    daysText = `${daysUntilMatch} Days`;
                  } else {
                    daysText = `${Math.abs(daysUntilMatch)} Days Ago`;
                  }
                }

                if (showCountdown) {
                  // Show countdown timer
                  const CountdownDisplay = () => {
                    useEffect(() => {
                      const updateTimer = () => {
                        const now = new Date();
                        const msUntilKickoff = matchDate.getTime() - now.getTime();
                        
                        if (msUntilKickoff <= 0) {
                          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                          return;
                        }

                        const hours = Math.floor(msUntilKickoff / (1000 * 60 * 60));
                        const minutes = Math.floor((msUntilKickoff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((msUntilKickoff % (1000 * 60)) / 1000);

                        setTimeLeft({ hours, minutes, seconds });
                      };

                      updateTimer();
                      const interval = setInterval(updateTimer, 1000);
                      return () => clearInterval(interval);
                    }, [matchDate]);

                  return (
                      <div className="text-black text-center" style={{ fontSize: '1.125rem' }}>
                        <div className="uppercase tracking-wide mb-1">Kicks off in</div>
                        <div className="font-mono font-semibold">
                          {String(timeLeft.hours).padStart(2, '0')}:
                          {String(timeLeft.minutes).padStart(2, '0')}:
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </div>
                      </div>
                    );
                  };

                  return <CountdownDisplay />;
                } else {
                  return (
                    <div className="text-black uppercase tracking-wide" style={{ fontSize: '1.125rem' }}>
                      {daysText}
                    </div>
                  );
                }
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
                  {(() => {
                  // Helper function to get country code for Circle Flags from team name
                  const getCountryCodeFromTeamName = (teamName: string): string | null => {
                    const teamCountryMap: { [key: string]: string } = {
                      // European teams
                      'England': 'gb-eng',
                      'Scotland': 'gb-sct',
                      'Wales': 'gb-wls',
                      'Northern Ireland': 'gb-nir',
                      'Spain': 'es',
                      'Italy': 'it',
                      'Germany': 'de',
                      'France': 'fr',
                      'Portugal': 'pt',
                      'Netherlands': 'nl',
                      'Belgium': 'be',
                      'Croatia': 'hr',
                      'Poland': 'pl',
                      'Ukraine': 'ua',
                      'Turkey': 'tr',
                      'Switzerland': 'ch',
                      'Austria': 'at',
                      'Czech Republic': 'cz',
                      'Czechia': 'cz',
                      'Denmark': 'dk',
                      'Sweden': 'se',
                      'Norway': 'no',
                      'Finland': 'fi',
                      'Russia': 'ru',
                      'Serbia': 'rs',
                      'Slovenia': 'si',
                      'Slovakia': 'sk',
                      'Hungary': 'hu',
                      'Romania': 'ro',
                      'Bulgaria': 'bg',
                      'Greece': 'gr',
                      'Bosnia and Herzegovina': 'ba',
                      'Montenegro': 'me',
                      'North Macedonia': 'mk',
                      'FYR Macedonia': 'mk',
                      'Macedonia': 'mk',
                      'Albania': 'al',
                      'Kosovo': 'xk',
                      'Moldova': 'md',
                      'Belarus': 'by',
                      'Lithuania': 'lt',
                      'Latvia': 'lv',
                      'Estonia': 'ee',
                      'Iceland': 'is',
                      'Ireland': 'ie',
                      'Luxembourg': 'lu',
                      'Malta': 'mt',
                      'Cyprus': 'cy',
                      'Georgia': 'ge',
                      'Armenia': 'am',
                      'Azerbaijan': 'az',
                      'Kazakhstan': 'kz',
                      'Faroe Islands': 'fo',
                      'Gibraltar': 'gi',
                      'Andorra': 'ad',
                      'San Marino': 'sm',
                      'Monaco': 'mc',

                      // South American teams
                      'Brazil': 'br',
                      'Argentina': 'ar',
                      'Uruguay': 'uy',
                      'Chile': 'cl',
                      'Peru': 'pe',
                      'Colombia': 'co',
                      'Ecuador': 'ec',
                      'Venezuela': 've',
                      'Bolivia': 'bo',
                      'Paraguay': 'py',
                      'Guyana': 'gy',
                      'Suriname': 'sr',

                      // North/Central American teams
                      'United States': 'us',
                      'Mexico': 'mx',
                      'Canada': 'ca',
                      'Costa Rica': 'cr',
                      'Panama': 'pa',
                      'Honduras': 'hn',
                      'Guatemala': 'gt',
                      'El Salvador': 'sv',
                      'Nicaragua': 'ni',
                      'Belize': 'bz',
                      'Jamaica': 'jm',
                      'Trinidad and Tobago': 'tt',
                      'Barbados': 'bb',
                      'Grenada': 'gd',
                      'Saint Lucia': 'lc',
                      'Saint Vincent and the Grenadines': 'vc',
                      'Antigua and Barbuda': 'ag',
                      'Dominica': 'dm',
                      'Saint Kitts and Nevis': 'kn',
                      'Cuba': 'cu',
                      'Haiti': 'ht',
                      'Dominican Republic': 'do',

                      // African teams
                      'Nigeria': 'ng',
                      'Morocco': 'ma',
                      'Egypt': 'eg',
                      'Ghana': 'gh',
                      'Senegal': 'sn',
                      'Algeria': 'dz',
                      'Tunisia': 'tn',
                      'Cameroon': 'cm',
                      'Mali': 'ml',
                      'Burkina Faso': 'bf',
                      'Ivory Coast': 'ci',
                      'Guinea': 'gn',
                      'Cape Verde': 'cv',
                      'Gambia': 'gm',
                      'Guinea-Bissau': 'gw',
                      'Liberia': 'lr',
                      'Sierra Leone': 'sl',
                      'Mauritania': 'mr',
                      'Niger': 'ne',
                      'Chad': 'td',
                      'Central African Republic': 'cf',
                      'Congo': 'cg',
                      'DR Congo': 'cd',
                      'Gabon': 'ga',
                      'Equatorial Guinea': 'gq',
                      'Sao Tome and Principe': 'st',
                      'Angola': 'ao',
                      'Zambia': 'zm',
                      'Zimbabwe': 'zw',
                      'Malawi': 'mw',
                      'Mozambique': 'mz',
                      'Madagascar': 'mg',
                      'Mauritius': 'mu',
                      'Comoros': 'km',
                      'Seychelles': 'sc',
                      'South Africa': 'za',
                      'Namibia': 'na',
                      'Botswana': 'bw',
                      'Lesotho': 'ls',
                      'Eswatini': 'sz',
                      'Kenya': 'ke',
                      'Uganda': 'ug',
                      'Tanzania': 'tz',
                      'Rwanda': 'rw',
                      'Burundi': 'bi',
                      'South Sudan': 'ss',
                      'Sudan': 'sd',
                      'Ethiopia': 'et',
                      'Eritrea': 'er',
                      'Djibouti': 'dj',
                      'Somalia': 'so',
                      'Libya': 'ly',

                      // Asian teams
                      'Japan': 'jp',
                      'South Korea': 'kr',
                      'China': 'cn',
                      'Australia': 'au',
                      'Iran': 'ir',
                      'Saudi Arabia': 'sa',
                      'Iraq': 'iq',
                      'United Arab Emirates': 'ae',
                      'Qatar': 'qa',
                      'Kuwait': 'kw',
                      'Bahrain': 'bh',
                      'Oman': 'om',
                      'Yemen': 'ye',
                      'Jordan': 'jo',
                      'Syria': 'sy',
                      'Lebanon': 'lb',
                      'Palestine': 'ps',
                      'Israel': 'il',
                      'India': 'in',
                      'Pakistan': 'pk',
                      'Bangladesh': 'bd',
                      'Sri Lanka': 'lk',
                      'Maldives': 'mv',
                      'Afghanistan': 'af',
                      'Nepal': 'np',
                      'Bhutan': 'bt',
                      'Myanmar': 'mm',
                      'Thailand': 'th',
                      'Vietnam': 'vn',
                      'Laos': 'la',
                      'Cambodia': 'kh',
                      'Malaysia': 'my',
                      'Singapore': 'sg',
                      'Indonesia': 'id',
                      'Philippines': 'ph',
                      'Brunei': 'bn',
                      'Timor-Leste': 'tl',
                      'Mongolia': 'mn',
                      'North Korea': 'kp',
                      'Taiwan': 'tw',
                      'Hong Kong': 'hk',
                      'Macau': 'mo',
                      'Uzbekistan': 'uz',
                      'Turkmenistan': 'tm',
                      'Tajikistan': 'tj',
                      'Kyrgyzstan': 'kg',

                      // Oceania teams
                      'New Zealand': 'nz',
                      'Fiji': 'fj',
                      'Papua New Guinea': 'pg',
                      'Solomon Islands': 'sb',
                      'Vanuatu': 'vu',
                      'New Caledonia': 'nc',
                      'Tahiti': 'pf',
                      'Samoa': 'ws',
                      'Tonga': 'to',
                      'Cook Islands': 'ck',
                      'American Samoa': 'as'
                    };

                    // Direct match first
                    if (teamCountryMap[teamName]) {
                      return teamCountryMap[teamName];
                    }

                    // Try partial matches for common variations
                    const lowerTeamName = teamName.toLowerCase();
                    for (const [country, code] of Object.entries(teamCountryMap)) {
                      if (lowerTeamName.includes(country.toLowerCase()) || country.toLowerCase().includes(lowerTeamName)) {
                        return code;
                      }
                    }

                    return null;
                  };

                  // Check if this is a national team in an international competition
                  const isInternationalCompetition = currentMatch?.league?.country === 'World' || 
                                                   currentMatch?.league?.country === 'Europe' ||
                                                   currentMatch?.league?.country === 'South America' ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('world cup') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('euro') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('copa america') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('uefa nations') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('cosafa') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('tournoi maurice revello') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('friendlies') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('international');

                  if (isInternationalCompetition) {
                    const teamName = currentMatch?.teams?.home?.name || '';
                    const countryCode = getCountryCodeFromTeamName(teamName);

                    if (countryCode) {
                      return (
                        <img
                          src={`https://hatscripts.github.io/circle-flags/flags/${countryCode}.svg`}
                          alt={teamName}
                          className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full"
                          style={{
                            top: "calc(50% - 32px)",
                            left: "-32px",
                            filter: "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                          }}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            // Fallback to original team logo, then fallback logo
                            if (currentMatch?.teams?.home?.logo && !e.currentTarget.src.includes(currentMatch.teams.home.logo)) {
                              e.currentTarget.src = currentMatch.teams.home.logo;
                            } else {
                              e.currentTarget.src = "/assets/fallback-logo.svg";
                            }
                          }}
                        />
                      );
                    }
                  }

                  // Fallback to original team logo for non-international competitions
                  return (
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
                  );
                })()}
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

                {(() => {
                  // Helper function to get country code for Circle Flags from team name
                  const getCountryCodeFromTeamName = (teamName: string): string | null => {
                    const teamCountryMap: { [key: string]: string } = {
                      // European teams
                      'England': 'gb-eng',
                      'Scotland': 'gb-sct',
                      'Wales': 'gb-wls',
                      'Northern Ireland': 'gb-nir',
                      'Spain': 'es',
                      'Italy': 'it',
                      'Germany': 'de',
                      'France': 'fr',
                      'Portugal': 'pt',
                      'Netherlands': 'nl',
                      'Belgium': 'be',
                      'Croatia': 'hr',
                      'Poland': 'pl',
                      'Ukraine': 'ua',
                      'Turkey': 'tr',
                      'Switzerland': 'ch',
                      'Austria': 'at',
                      'Czech Republic': 'cz',
                      'Czechia': 'cz',
                      'Denmark': 'dk',
                      'Sweden': 'se',
                      'Norway': 'no',
                      'Finland': 'fi',
                      'Russia': 'ru',
                      'Serbia': 'rs',
                      'Slovenia': 'si',
                      'Slovakia': 'sk',
                      'Hungary': 'hu',
                      'Romania': 'ro',
                      'Bulgaria': 'bg',
                      'Greece': 'gr',
                      'Bosnia and Herzegovina': 'ba',
                      'Montenegro': 'me',
                      'North Macedonia': 'mk',
                      'FYR Macedonia': 'mk',
                      'Macedonia': 'mk',
                      'Albania': 'al',
                      'Kosovo': 'xk',
                      'Moldova': 'md',
                      'Belarus': 'by',
                      'Lithuania': 'lt',
                      'Latvia': 'lv',
                      'Estonia': 'ee',
                      'Iceland': 'is',
                      'Ireland': 'ie',
                      'Luxembourg': 'lu',
                      'Malta': 'mt',
                      'Cyprus': 'cy',
                      'Georgia': 'ge',
                      'Armenia': 'am',
                      'Azerbaijan': 'az',
                      'Kazakhstan': 'kz',
                      'Faroe Islands': 'fo',
                      'Gibraltar': 'gi',
                      'Andorra': 'ad',
                      'San Marino': 'sm',
                      'Monaco': 'mc',

                      // South American teams
                      'Brazil': 'br',
                      'Argentina': 'ar',
                      'Uruguay': 'uy',
                      'Chile': 'cl',
                      'Peru': 'pe',
                      'Colombia': 'co',
                      'Ecuador': 'ec',
                      'Venezuela': 've',
                      'Bolivia': 'bo',
                      'Paraguay': 'py',
                      'Guyana': 'gy',
                      'Suriname': 'sr',

                      // North/Central American teams
                      'United States': 'us',
                      'Mexico': 'mx',
                      'Canada': 'ca',
                      'Costa Rica': 'cr',
                      'Panama': 'pa',
                      'Honduras': 'hn',
                      'Guatemala': 'gt',
                      'El Salvador': 'sv',
                      'Nicaragua': 'ni',
                      'Belize': 'bz',
                      'Jamaica': 'jm',
                      'Trinidad and Tobago': 'tt',
                      'Barbados': 'bb',
                      'Grenada': 'gd',
                      'Saint Lucia': 'lc',
                      'Saint Vincent and the Grenadines': 'vc',
                      'Antigua and Barbuda': 'ag',
                      'Dominica': 'dm',
                      'Saint Kitts and Nevis': 'kn',
                      'Cuba': 'cu',
                      'Haiti': 'ht',
                      'Dominican Republic': 'do',

                      // African teams
                      'Nigeria': 'ng',
                      'Morocco': 'ma',
                      'Egypt': 'eg',
                      'Ghana': 'gh',
                      'Senegal': 'sn',
                      'Algeria': 'dz',
                      'Tunisia': 'tn',
                      'Cameroon': 'cm',
                      'Mali': 'ml',
                      'Burkina Faso': 'bf',
                      'Ivory Coast': 'ci',
                      'Guinea': 'gn',
                      'Cape Verde': 'cv',
                      'Gambia': 'gm',
                      'Guinea-Bissau': 'gw',
                      'Liberia': 'lr',
                      'Sierra Leone': 'sl',
                      'Mauritania': 'mr',
                      'Niger': 'ne',
                      'Chad': 'td',
                      'Central African Republic': 'cf',
                      'Congo': 'cg',
                      'DR Congo': 'cd',
                      'Gabon': 'ga',
                      'Equatorial Guinea': 'gq',
                      'Sao Tome and Principe': 'st',
                      'Angola': 'ao',
                      'Zambia': 'zm',
                      'Zimbabwe': 'zw',
                      'Malawi': 'mw',
                      'Mozambique': 'mz',
                      'Madagascar': 'mg',
                      'Mauritius': 'mu',
                      'Comoros': 'km',
                      'Seychelles': 'sc',
                      'South Africa': 'za',
                      'Namibia': 'na',
                      'Botswana': 'bw',
                      'Lesotho': 'ls',
                      'Eswatini': 'sz',
                      'Kenya': 'ke',
                      'Uganda': 'ug',
                      'Tanzania': 'tz',
                      'Rwanda': 'rw',
                      'Burundi': 'bi',
                      'South Sudan': 'ss',
                      'Sudan': 'sd',
                      'Ethiopia': 'et',
                      'Eritrea': 'er',
                      'Djibouti': 'dj',
                      'Somalia': 'so',
                      'Libya': 'ly',

                      // Asian teams
                      'Japan': 'jp',
                      'South Korea': 'kr',
                      'China': 'cn',
                      'Australia': 'au',
                      'Iran': 'ir',
                      'Saudi Arabia': 'sa',
                      'Iraq': 'iq',
                      'United Arab Emirates': 'ae',
                      'Qatar': 'qa',
                      'Kuwait': 'kw',
                      'Bahrain': 'bh',
                      'Oman': 'om',
                      'Yemen': 'ye',
                      'Jordan': 'jo',
                      'Syria': 'sy',
                      'Lebanon': 'lb',
                      'Palestine': 'ps',
                      'Israel': 'il',
                      'India': 'in',
                      'Pakistan': 'pk',
                      'Bangladesh': 'bd',
                      'Sri Lanka': 'lk',
                      'Maldives': 'mv',
                      'Afghanistan': 'af',
                      'Nepal': 'np',
                      'Bhutan': 'bt',
                      'Myanmar': 'mm',
                      'Thailand': 'th',
                      'Vietnam': 'vn',
                      'Laos': 'la',
                      'Cambodia': 'kh',
                      'Malaysia': 'my',
                      'Singapore': 'sg',
                      'Indonesia': 'id',
                      'Philippines': 'ph',
                      'Brunei': 'bn',
                      'Timor-Leste': 'tl',
                      'Mongolia': 'mn',
                      'North Korea': 'kp',
                      'Taiwan': 'tw',
                      'Hong Kong': 'hk',
                      'Macau': 'mo',
                      'Uzbekistan': 'uz',
                      'Turkmenistan': 'tm',
                      'Tajikistan': 'tj',
                      'Kyrgyzstan': 'kg',

                      // Oceania teams
                      'New Zealand': 'nz',
                      'Fiji': 'fj',
                      'Papua New Guinea': 'pg',
                      'Solomon Islands': 'sb',
                      'Vanuatu': 'vu',
                      'New Caledonia': 'nc',
                      'Tahiti': 'pf',
                      'Samoa': 'ws',
                      'Tonga': 'to',
                      'Cook Islands': 'ck',
                      'American Samoa': 'as'
                    };

                    // Direct match first
                    if (teamCountryMap[teamName]) {
                      return teamCountryMap[teamName];
                    }

                    // Try partial matches for common variations
                    const lowerTeamName = teamName.toLowerCase();
                    for (const [country, code] of Object.entries(teamCountryMap)) {
                      if (lowerTeamName.includes(country.toLowerCase()) || country.toLowerCase().includes(lowerTeamName)) {
                        return code;
                      }
                    }

                    return null;
                  };

                  // Check if this is a national team in an international competition
                  const isInternationalCompetition = currentMatch?.league?.country === 'World' || 
                                                   currentMatch?.league?.country === 'Europe' ||
                                                   currentMatch?.league?.country === 'South America' ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('world cup') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('euro') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('copa america') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('uefa nations') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('cosafa') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('tournoi maurice revello') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('friendlies') ||
                                                   currentMatch?.league?.name?.toLowerCase().includes('international');

                  if (isInternationalCompetition) {
                    const teamName = currentMatch?.teams?.away?.name || '';
                    const countryCode = getCountryCodeFromTeamName(teamName);

                    if (countryCode) {
                      return (
                        <img
                          src={`https://hatscripts.github.io/circle-flags/flags/${countryCode}.svg`}
                          alt={teamName}
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
                            // Fallback to original team logo, then fallback logo
                            if (currentMatch?.teams?.away?.logo && !e.currentTarget.src.includes(currentMatch.teams.away.logo)) {
                              e.currentTarget.src = currentMatch.teams.away.logo;
                            } else {
                              e.currentTarget.src = "/assets/fallback-logo.svg";
                            }
                          }}
                        />
                      );
                    }
                  }

                  return (
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
                  );
                })()}
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
              {(() => {
                try {
                  const matchDate = new Date(currentMatch?.fixture?.date || '');

                  // Get weekday and month
                  const weekday = matchDate.toLocaleDateString('en-GB', { weekday: 'long' });
                  const month = matchDate.toLocaleDateString('en-GB', { month: 'short' });

                  // Get day with ordinal suffix
                  const day = matchDate.getDate();
                  const getOrdinalSuffix = (day: number) => {
                    if (day > 3 && day < 21) return 'th';
                    switch (day % 10) {
                      case 1: return 'st';
                      case 2: return 'nd';
                      case 3: return 'rd';
                      default: return 'th';
                    }
                  };
                  const dayWithSuffix = `${day}${getOrdinalSuffix(day)}`;

                  const formattedTime = matchDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  });
                  const venueName = currentMatch?.fixture?.venue?.name || "Stadium";

                  return `${weekday}, ${dayWithSuffix} ${month} | ${formattedTime} | ${venueName}`;
                } catch (e) {
                  return `Today | ${currentMatch?.fixture?.venue?.name || "Stadium"}`;
                }
              })()}
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