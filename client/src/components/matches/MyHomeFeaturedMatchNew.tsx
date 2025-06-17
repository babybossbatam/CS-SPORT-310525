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
import {
  format,
  parseISO,
  isValid,
  differenceInHours,
  subDays,
} from "date-fns";

import { FixtureResponse } from "@/types/fixtures";
import { shouldExcludeFeaturedMatch } from "@/lib/MyFeaturedMatchExclusion";
import MyCircularFlag from "@/components/common/MyCircularFlag";
import LazyImage from "@/components/common/LazyImage"; // Import LazyImage

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
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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
  const cacheMaxAge = 5 * 60 * 1000; // 5 minute cache to reduce frequent refreshes

  // Fetch fixtures for multiple days to build the 9-slide distribution
  const { data: fixtures = [], isLoading } = useCachedQuery(
    [
      "featured-matches-multi-day-v3",
      today,
      tomorrowStr,
      dayAfterStr,
      twoDaysAfterStr,
    ],
    async () => {
      console.log(
        `🔄 [MyHomeFeaturedMatchNew] Fetching multi-day data for slides distribution`,
      );

      const datePromises = [
        today,
        tomorrowStr,
        dayAfterStr,
        twoDaysAfterStr,
      ].map(async (date) => {
        try {
          const response = await apiRequest(
            "GET",
            `/api/fixtures/date/${date}?all=true`,
          );
          const data = await response.json();
          console.log(
            `✅ [MyHomeFeaturedMatchNew] Received ${data?.length || 0} fixtures for ${date}`,
          );
          return data || [];
        } catch (error) {
          console.error(
            `❌ [MyHomeFeaturedMatchNew] Error fetching fixtures for ${date}:`,
            error,
          );
          return [];
        }
      });

      const allResults = await Promise.all(datePromises);
      const allFixtures = allResults.flat();

      console.log(
        `🎯 [MyHomeFeaturedMatchNew] Total fixtures across 4 days: ${allFixtures.length}`,
      );
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
    "England",
    "Spain",
    "Italy",
    "Germany",
    "France",
    "World",
    "Europe",
    "South America",
    "United Arab Emirates",
    "United-Arab-Emirates",
  ];

  // 2. Popular leagues for featured matches (Globally popular leagues) - Updated from TodayPopularFootballLeaguesNew
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78, 61, 848, 5, 15, 914]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Conference League, UEFA Nations League, FIFA Club World Cup, COSAFA Cup

  // Country-specific popular leagues
  const COUNTRY_POPULAR_LEAGUES = {
    England: [39], // Premier League
    Spain: [140], // La Liga
    Italy: [135], // Serie A
    Germany: [78], // Bundesliga
    France: [61], // Ligue 1
    World: [2, 3, 848, 15, 8], // UEFA competitions, FIFA Club World Cup, and UEFA U21 Championship
    Europe: [2, 3, 848], // UEFA competitions
    "South America": [9, 13], // Copa Libertadores, Copa Sudamericana
    "United Arab Emirates": [305], // UAE Pro League
    "United-Arab-Emirates": [305], // UAE Pro League
  };

  // Helper function to get country priority
  const getCountryPriority = (country: string) => {
    const index = POPULAR_COUNTRIES_ORDER.findIndex(
      (c) => c.toLowerCase() === country?.toLowerCase(),
    );
    return index === -1 ? 999 : index;
  };

  // Helper function to get league priority within country
  const getLeaguePriority = (match: FixtureResponse) => {
    const country = match.league.country || "";
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
      const leagueName = (match.league.name || "").toLowerCase();

      // UEFA Nations League (highest)
      if (
        leagueName.includes("uefa nations league") &&
        !leagueName.includes("women")
      ) {
        return 1;
      }

      // World Cup Qualifications
      if (
        leagueName.includes("world cup") &&
        leagueName.includes("qualification")
      ) {
        if (leagueName.includes("south america")) return 2;
        if (leagueName.includes("europe")) return 3;
        if (leagueName.includes("asia")) return 5;
        if (leagueName.includes("concacaf")) return 6;
      }

      // Friendlies (excluding UEFA Nations League and women's)
      if (
        leagueName.includes("friendlies") &&
        !leagueName.includes("uefa nations league") &&
        !leagueName.includes("women")
      ) {
        return 4;
      }

      // Tournoi Maurice Revello
      if (leagueName.includes("tournoi maurice revello")) {
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
    if (
      ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(
        status,
      )
    ) {
      return 1;
    }

    // Priority 2: Recently finished matches
    if (status === "FT") {
      return 2;
    }

    // Priority 3: Upcoming matches (by time proximity)
    if (status === "NS") {
      const matchTime = new Date(match.fixture.date);
      const now = new Date();
      const timeDiff = Math.abs(matchTime.getTime() - now.getTime());
      return 3 + timeDiff / (1000 * 60 * 60); // Add hours as fractional priority
    }

    return 999; // Other statuses
  };

  // Featured matches filtering logic with specific slide distribution
  const featuredMatches = useMemo(() => {
    if (!fixtures?.length) return [];

    console.log(
      `🔍 [MyHomeFeaturedMatchNew] Processing ${fixtures.length} fixtures for date: ${dateToUse}`,
    );

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
        if (
          !fixture?.league ||
          !fixture?.teams?.home ||
          !fixture?.teams?.away
        ) {
          return false;
        }

        const leagueId = fixture.league?.id;
        const country = fixture.league?.country?.toLowerCase() || "";
        const leagueName = fixture.league?.name?.toLowerCase() || "";

        // Apply exclusion check - but NEVER exclude World country leagues
        if (country !== "world" && 
          shouldExcludeFromPopularLeagues(
            fixture.league.name,
            fixture.teams.home.name,
            fixture.teams.away.name,
            fixture.league.country,
          )
        ) {
          return false;
        }

        // PRIORITY 1: Only the most elite leagues (including UEFA U21 Championship)
        const eliteLeagues = [2, 3, 39, 140, 135, 78, 61, 848, 5, 8];
        if (eliteLeagues.includes(leagueId)) {
          return true;
        }

        // PRIORITY 2: Major international competitions
        const isTopInternationalCompetition =
          (leagueName.includes("uefa nations league") &&
            !leagueName.includes("women")) ||
          (leagueName.includes("uefa u21") ||
            leagueName.includes("uefa european under-21") ||
            leagueName.includes("uefa u-21") ||
            leagueName.includes("european under 21")) ||
          (leagueName.includes("world cup") &&
            leagueName.includes("qualification") &&
            (leagueName.includes("europe") ||
              leagueName.includes("south america"))) ||
          leagueName.includes("fifa club world cup");

        if (isTopInternationalCompetition) {
          return true;
        }

        // PRIORITY 3: Elite countries with popular leagues
        const eliteCountries = [
          "England",
          "Spain",
          "Italy",
          "Germany",
          "France",
        ];
        const isFromEliteCountry = eliteCountries.some((eliteCountry) =>
          country.includes(eliteCountry.toLowerCase()),
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
        // 1. Elite League Priority (including UEFA U21 Championship)
        const eliteLeagues = [2, 3, 39, 140, 135, 78, 61, 848, 5, 8];
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
        if (
          a.fixture.status.short === "NS" &&
          b.fixture.status.short === "NS"
        ) {
          const aTime = new Date(a.fixture.date).getTime();
          const bTime = new Date(b.fixture.date).getTime();
          return aTime - bTime;
        }

        return (a.league.name || "").localeCompare(b.league.name || "");
      });
    };

    // Get matches for different days
    const todayMatches = fixtures.filter((f) => {
      const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
      return fixtureDate === todayString;
    });

    const tomorrowMatches = fixtures.filter((f) => {
      const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
      return fixtureDate === tomorrowString;
    });

    const dayAfterTomorrowMatches = fixtures.filter((f) => {
      const fixtureDate = new Date(f.fixture.date).toISOString().slice(0, 10);
      return fixtureDate === dayAfterTomorrowString;
    });

    const twoDaysAfterMatches = fixtures.filter((f) => {
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
    const getLiveMatches = (matches: any[]) =>
      matches.filter((m) =>
        ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(
          m.fixture.status.short,
        ),
      );
    const getUpcomingMatches = (matches: any[]) =>
      matches.filter((m) => m.fixture.status.short === "NS");
    const getFinishedMatches = (matches: any[]) =>
      matches.filter((m) =>
        ["FT", "AET", "PEN"].includes(m.fixture.status.short),
      );

    // Get categorized matches for today
    const todayLive = getLiveMatches(todaySorted);
    const todayUpcoming = getUpcomingMatches(todaySorted);
    const todayFinished = getFinishedMatches(todaySorted);

    // Get upcoming matches for future days
    const tomorrowUpcoming = getUpcomingMatches(tomorrowSorted);
    const dayAfterUpcoming = getUpcomingMatches(dayAfterSorted);

    // Build the 9-slide distribution with new priority system
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

    // Helper function to check if live match is before 23:59:59 today
    const isValidTodayLiveMatch = (match: any) => {
      if (
        !["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(
          match.fixture.status.short,
        )
      ) {
        return false;
      }

      const matchDate = new Date(match.fixture.date);
      const today = new Date();
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      return matchDate <= endOfToday;
    };

    // Filter today's live matches to only include those before 23:59:59
    const todayValidLive = todayLive.filter(isValidTodayLiveMatch);

    // Helper function to get matches by priority for a given day
    const getMatchesByPriority = (
      liveMatches: any[],
      finishedMatches: any[],
      upcomingMatches: any[],
    ) => {
      return [
        ...liveMatches, // Highest priority
        ...finishedMatches, // Second priority
        ...upcomingMatches, // Third priority
      ];
    };

    // Get prioritized matches for each day
    const todayPrioritized = getMatchesByPriority(
      todayValidLive,
      todayFinished,
      todayUpcoming,
    );
    const tomorrowPrioritized = getMatchesByPriority(
      getLiveMatches(tomorrowSorted),
      getFinishedMatches(tomorrowSorted),
      tomorrowUpcoming,
    );
    const dayAfterPrioritized = getMatchesByPriority(
      getLiveMatches(dayAfterSorted),
      getFinishedMatches(dayAfterSorted),
      dayAfterUpcoming,
    );

    // Helper function to group matches by league cards (similar to TodayPopularFootballLeaguesNew)
    const groupMatchesByLeagueCards = (matches: any[]) => {
      const leagueCards: any[] = [];

      matches.forEach((match) => {
        const country = match.league.country;
        const leagueId = match.league.id;

        // Find existing league card for this league
        let existingCard = leagueCards.find(card => card.leagueId === leagueId);

        if (!existingCard) {
          // Create new league card
          existingCard = {
            leagueId: leagueId,
            leagueName: match.league.name,
            country: country,
            matches: [],
            popularCountryMatches: [],
            allMatches: []
          };
          leagueCards.push(existingCard);
        }

        existingCard.allMatches.push(match);

        // Check if this match is from a popular country
        const isPopularCountry = POPULAR_COUNTRIES_ORDER.some(
          (popularCountry) => country?.toLowerCase().includes(popularCountry.toLowerCase())
        );

        if (isPopularCountry) {
          existingCard.popularCountryMatches.push(match);
        }

        existingCard.matches.push(match);
      });

      // Sort league cards by priority (elite leagues first, including UEFA U21)
      leagueCards.sort((a, b) => {
        const eliteLeagues = [2, 3, 39, 140, 135, 78, 61, 848, 5, 8];
        const aEliteIndex = eliteLeagues.indexOf(a.leagueId);
        const bEliteIndex = eliteLeagues.indexOf(b.leagueId);

        if (aEliteIndex !== -1 && bEliteIndex !== -1) {
          return aEliteIndex - bEliteIndex;
        }
        if (aEliteIndex !== -1 && bEliteIndex === -1) return -1;
        if (aEliteIndex === -1 && bEliteIndex !== -1) return 1;

        return (a.leagueName || "").localeCompare(b.leagueName || "");
      });

      return leagueCards;
    };

    // NEW SLIDE DISTRIBUTION SYSTEM WITH LEAGUE CARD PRIORITIZATION:
    // TODAY - Slides 1-3 (prioritized by league cards and popular countries)
    // TOMORROW - Slides 4-6
    // 2 DAYS LATER - Slides 7-9

    console.log(`🎯 [SLIDE DEBUG] Available matches by day:`, {
      today: todayPrioritized.length,
      tomorrow: tomorrowPrioritized.length,
      dayAfter: dayAfterPrioritized.length,
      todayValidLive: todayValidLive.length,
    });

    // Group today's matches by league cards
    const todayLeagueCards = groupMatchesByLeagueCards(todayPrioritized);

    console.log(`🎯 [LEAGUE CARDS DEBUG] Today's league cards:`, 
      todayLeagueCards.map(card => ({
        league: card.leagueName,
        country: card.country,
        totalMatches: card.allMatches.length,
        popularCountryMatches: card.popularCountryMatches.length
      }))
    );

    // Slides 1-3: TODAY with league card prioritization
    // Slide 1: Pick from first league card, filter by popular country
    if (slidesDistribution.length < 1 && todayLeagueCards.length > 0) {
      const firstCard = todayLeagueCards[0];
      if (firstCard.popularCountryMatches.length > 0) {
        const match = firstCard.popularCountryMatches[0];
        if (addUniqueMatch(match)) {
          console.log(`✅ [SLIDE 1] Added from first league card popular country: ${match.teams.home.name} vs ${match.teams.away.name} (${match.league.name})`);
        }
      }
    }

    // Slide 2: If first league card has >1 popular country match, pick from first card; otherwise second card
    if (slidesDistribution.length < 2) {
      let added = false;

      if (todayLeagueCards.length > 0) {
        const firstCard = todayLeagueCards[0];

        if (firstCard.popularCountryMatches.length > 1) {
          // Pick second match from first league card
          const match = firstCard.popularCountryMatches[1];
          if (addUniqueMatch(match)) {
            added = true;
            console.log(`✅ [SLIDE 2] Added second match from first league card: ${match.teams.home.name} vs ${match.teams.away.name} (${match.league.name})`);
          }
        } else if (todayLeagueCards.length > 1) {
          // Pick from second league card, filter by popular country
          const secondCard = todayLeagueCards[1];
          if (secondCard.popularCountryMatches.length > 0) {
            const match = secondCard.popularCountryMatches[0];
            if (addUniqueMatch(match)) {
              added = true;
              console.log(`✅ [SLIDE 2] Added from second league card popular country: ${match.teams.home.name} vs ${match.teams.away.name} (${match.league.name})`);
            }
          }
        }
      }

      if (!added) {
        console.log(`⚠️ [SLIDE 2] No suitable match found`);
      }
    }

    // Slide 3: If first league card has >2 popular country matches, pick from first card; otherwise third card
    if (slidesDistribution.length < 3) {
      let added = false;

      if (todayLeagueCards.length > 0) {
        const firstCard = todayLeagueCards[0];

        if (firstCard.popularCountryMatches.length > 2) {
          // Pick third match from first league card
          const match = firstCard.popularCountryMatches[2];
          if (addUniqueMatch(match)) {
            added = true;
            console.log(`✅ [SLIDE 3] Added third match from first league card: ${match.teams.home.name} vs ${match.teams.away.name} (${match.league.name})`);
          }
        } else if (todayLeagueCards.length > 2) {
          // Pick from third league card, filter by popular country
          const thirdCard = todayLeagueCards[2];
          if (thirdCard.popularCountryMatches.length > 0) {
            const match = thirdCard.popularCountryMatches[0];
            if (addUniqueMatch(match)) {
              added = true;
              console.log(`✅ [SLIDE 3] Added from third league card popular country: ${match.teams.home.name} vs ${match.teams.away.name} (${match.league.name})`);
            }
          }
        }
      }

      if (!added) {
        console.log(`⚠️ [SLIDE 3] No suitable match found`);
      }
    }

    // Slides 4-6: TOMORROW
    for (let i = 4; i <= 6; i++) {
      let added = false;
      for (let j = 0; j < tomorrowPrioritized.length && !added; j++) {
        if (addUniqueMatch(tomorrowPrioritized[j])) {
          added = true;
          console.log(
            `✅ [SLIDE DEBUG] Added TOMORROW match to slide ${i}: ${tomorrowPrioritized[j].teams.home.name} vs ${tomorrowPrioritized[j].teams.away.name}`,
          );
        }
      }

      if (!added) {
        console.log(`⚠️ [SLIDE DEBUG] No TOMORROW match found for slide ${i}`);
      }
    }

    // Slides 7-9: 2 DAYS LATER (strictly from dayAfterTomorrow)
    for (let i = 7; i <= 9; i++) {
      let added = false;
      for (let j = 0; j < dayAfterPrioritized.length && !added; j++) {
        if (addUniqueMatch(dayAfterPrioritized[j])) {
          added = true;
          console.log(
            `✅ [SLIDE DEBUG] Added 2 DAYS LATER match to slide ${i}: ${dayAfterPrioritized[j].teams.home.name} vs ${dayAfterPrioritized[j].teams.away.name}`,
          );
        }
      }

      if (!added) {
        console.log(
          `⚠️ [SLIDE DEBUG] No 2 DAYS LATER match found for slide ${i}`,
        );
      }
    }

    // Only fill remaining slides 7-9 with matches from 2 days later if we don't have enough
    console.log(
      `🎯 [SLIDE DEBUG] Current slide count before 2-day-later-only backup: ${slidesDistribution.length}`,
    );

    if (slidesDistribution.length < 9) {
      // Only use matches from 2 days later (dayAfterTomorrow) for slides 7-9
      const twoDaysLaterOnlyMatches = [...twoDaysAfterSorted];

      console.log(
        `🎯 [SLIDE DEBUG] 2 days later backup matches available: ${twoDaysLaterOnlyMatches.length}`,
      );

      for (
        let i = 0;
        i < twoDaysLaterOnlyMatches.length && slidesDistribution.length < 9;
        i++
      ) {
        if (addUniqueMatch(twoDaysLaterOnlyMatches[i])) {
          console.log(
            `✅ [SLIDE DEBUG] Added 2-days-later backup match to slide ${slidesDistribution.length}: ${twoDaysLaterOnlyMatches[i].teams.home.name} vs ${twoDaysLaterOnlyMatches[i].teams.away.name}`,
          );
        }
      }
    }

    // Remove any undefined entries and ensure we have at least some slides
    const finalSlides = slidesDistribution.filter(Boolean);

    console.log(
      `🎯 [SLIDE DISTRIBUTION] Today: ${todaySorted.length} (Live: ${todayLive.length}, Upcoming: ${todayUpcoming.length}, Finished: ${todayFinished.length}), Tomorrow: ${tomorrowSorted.length}, Day+2: ${dayAfterSorted.length}, Day+3: ${twoDaysAfterSorted.length}`,
    );
    console.log(
      `🔍 [MyHomeFeaturedMatchNew] Final slide distribution: ${finalSlides.length} matches`,
    );
    console.log(
      `🏆 [FEATURED RESULTS] Final matches:`,
      finalSlides.map((m, i) => ({
        slide: i + 1,
        date: new Date(m.fixture.date).toISOString().slice(0, 10),
        league: m.league.name,
        match: `${m.teams.home.name} vs ${m.teams.away.name}`,
        status: m.fixture.status.short,
        leagueId: m.league.id,
        slideType:
          i === 0
            ? "TODAY Slide 1 (Live <23:59 Priority)"
            : i === 1
              ? "TODAY Slide 2 (Live <23:59 Priority)"
              : i === 2
                ? "TODAY Slide 3 (Live <23:59 Priority)"
                : i === 3
                  ? "TOMORROW Slide 4"
                  : i === 4
                    ? "TOMORROW Slide 5"
                    : i === 5
                      ? "TOMORROW Slide 6"
                      : i === 6
                        ? "2 DAYS LATER Slide 7"
                        : i === 7
                          ? "2 DAYS LATER Slide 8"
                          : i === 8
                            ? "2 DAYS LATER Slide 9"
                            : "Extra",
      })),
    );

    return finalSlides;
  }, [fixtures, dateToUse, maxMatches]);

  const currentMatch = featuredMatches[currentIndex] || null;

  // Real-time update effect for live matches
  useEffect(() => {
    // If we have a current match that's live, set up more frequent updates
    if (currentMatch && getMatchStatusLabel(currentMatch) === "LIVE") {
      const liveUpdateInterval = setInterval(async () => {
        try {
          console.log(`🔄 [LIVE UPDATE] Refreshing data for live match: ${currentMatch.teams.home.name} vs ${currentMatch.teams.away.name}`);

          // Fetch latest fixture data directly
          const response = await apiRequest("GET", `/api/fixtures/${currentMatch.fixture.id}`);
          const updatedMatch = await response.json();

          // Update the current match data if status changed - but don't reload page
          if (updatedMatch && updatedMatch.fixture.status.short !== currentMatch.fixture.status.short) {
            console.log(`🔄 [LIVE UPDATE] Status changed from ${currentMatch.fixture.status.short} to ${updatedMatch.fixture.status.short}`);
            // Just invalidate cache, let React Query handle the update naturally
            const cacheKey = `featured-matches-multi-day-v3-${today}-${tomorrowStr}-${dayAfterStr}-${twoDaysAfterStr}`;
            localStorage.removeItem(cacheKey);
            // Don't reload the page - let the component re-render naturally
          }
        } catch (error) {
          console.error("Error updating live match:", error);
        }
      }, 60000); // Reduce frequency to every 60 seconds

      return () => clearInterval(liveUpdateInterval);
    }
  }, [currentMatch, today, tomorrowStr, dayAfterStr, twoDaysAfterStr]);

  const handlePrevious = () => {
    if (featuredMatches.length <= 1) return;
    setCurrentIndex(
      currentIndex > 0 ? currentIndex - 1 : featuredMatches.length - 1,
    );
  };

  const handleNext = () => {
    if (featuredMatches.length <= 1) return;
    setCurrentIndex(
      currentIndex < featuredMatches.length - 1 ? currentIndex + 1 : 0,
    );
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
      // Always use the API elapsed time, not a local timer
      return `${elapsed || 0}'`;
    }
    if (status === "HT") return "Halftime";
    if (status === "FT") return "Ended";
    if (status === "AET") return "After Extra Time";
    if (status === "PEN") return "Ended (Penalties)";
    if (status === "PST") return "Postponed";
    if (status === "CANC") return "Cancelled";
    if (status === "ABD") return "Abandoned";
    if (status === "AWD") return "Technical Loss";
    if (status === "WO") return "Walkover";
    if (status === "LIVE") return "Live";
    if (status === "NS") return "UPCOMING";
    return status;
  };

  const getMatchStatusLabel = (match: any) => {
    if (!match) return "";
    const status = match.fixture.status.short;

    if (
      ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(
        status,
      )
    ) {
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
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
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
              {currentMatch?.league?.logo ? (
                <LazyImage
                    src={currentMatch.league.logo}
                    alt={currentMatch.league.name}
                    className="w-5 h-5 object-contain mr-2 drop-shadow-md"
                    fallbackSrc="/assets/fallback-logo.svg"
                    rootMargin="50px"
                    threshold={0.1}
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
                  {getMatchStatusLabel(currentMatch) === "FINISHED"
                    ? currentMatch?.league?.round || "Final"
                    : currentMatch?.league?.round ||
                      getMatchStatusLabel(currentMatch)}
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
              const hasScore =
                currentMatch?.fixture?.status?.short &&
                ["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(
                  status,
                );

              if (hasScore) {
                const statusText = getMatchStatus(currentMatch);
                const scoreText = `${currentMatch?.goals?.home ?? 0}   -   ${currentMatch?.goals?.away ?? 0}`;

                // Check for penalty scores
                const penaltyHome = currentMatch?.score?.penalty?.home;
                const penaltyAway = currentMatch?.score?.penalty?.away;
                const hasPenaltyScores =
                  penaltyHome !== null &&
                  penaltyHome !== undefined &&
                  penaltyAway !== null &&
                  penaltyAway !== undefined;

                const isPenaltyMatch = status === "PEN";

                return (
                  <div className="flex flex-col items-center">
                    <div
                      className={`text-sm tracking-wide mt-1 ${isLive ? "text-red-600" : "text-gray-500"}`}
                    >
                      {statusText}
                    </div>
                    <div
                      className="text-xl font-semibold text-black mb-1 mt-1"
                      style={{ fontSize: "1.95rem" }}
                    >
                      {scoreText}
                    </div>
                    {isPenaltyMatch && hasPenaltyScores && (
                      <div className="text-xs text-gray-600 mt-0.5 mb-4 text-center">
                        {penaltyHome > penaltyAway
                          ? `${currentMatch?.teams?.home?.name} has won ${penaltyHome}-${penaltyAway} after Penalties`
                          : `${currentMatch?.teams?.away?.name} has won ${penaltyAway}-${penaltyHome} after Penalties`}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Calculate days until match with proper date comparison
                const matchDate = new Date(currentMatch?.fixture?.date || "");
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
                  // It's today - but only show countdown if we've passed 00:00:00 of today
                  const todayStart = new Date(todayDateString + "T00:00:00Z"); // 00:00:00 of today
                  const hasPassedMidnight =
                    now.getTime() >= todayStart.getTime();

                  if (hasPassedMidnight) {
                    // Today has officially started (past 00:00:00), check if within 12 hours
                    const msUntilKickoff = matchDate.getTime() - now.getTime();
                    hoursUntilKickoff = msUntilKickoff / (1000 * 60 * 60);

                    if (hoursUntilKickoff > 0 && hoursUntilKickoff <= 12) {
                      showCountdown = true;
                    } else {
                      daysText = "Today";
                    }
                  } else {
                    // Haven't passed midnight yet (still before 00:00:00), show as "Today" without countdown
                    daysText = "Today";
                  }
                } else if (matchDateString === tomorrowDateString) {
                  daysText = "Tomorrow";
                } else {
                  // For other dates, calculate the difference in days
                  const matchDateOnly = new Date(matchDateString);
                  const todayOnly = new Date(todayDateString);
                  const timeDiff =
                    matchDateOnly.getTime() - todayOnly.getTime();
                  const daysUntilMatch = Math.ceil(
                    timeDiff / (1000 * 60 * 60 * 24),
                  );

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
                        const msUntilKickoff =
                          matchDate.getTime() - now.getTime();

                        if (msUntilKickoff <= 0) {
                          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                          return;
                        }

                        const hours = Math.floor(
                          msUntilKickoff / (1000 * 60 * 60),
                        );
                        const minutes = Math.floor(
                          (msUntilKickoff % (1000 * 60 * 60)) / (1000 * 60),
                        );
                        const seconds = Math.floor(
                          (msUntilKickoff % (1000 * 60)) / 1000,
                        );

                        setTimeLeft({ hours, minutes, seconds });
                      };

                      updateTimer();
                      const interval = setInterval(updateTimer, 1000);
                      return () => clearInterval(interval);
                    }, [matchDate]);

                    return (
                      <div
                        className="text-black text-center"
                        style={{ fontSize: "1.125rem" }}
                      >
                        <div
                          className="font-sans font-semibold"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {String(timeLeft.hours).padStart(2, "0")}:
                          {String(timeLeft.minutes).padStart(2, "0")}:
                          {String(timeLeft.seconds).padStart(2, "0")}
                        </div>
                      </div>
                    );
                  };

                  return <CountdownDisplay />;
                } else {
                  return (
                    <div
                      className="text-black uppercase tracking-wide"
                      style={{ fontSize: "1.125rem" }}
                    >
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
                  className="h-full w-[calc(50%-76px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative"
                  style={{
                    background: getTeamColor(
                      currentMatch?.teams?.home?.id || 0,
                    ),
                  }}
                >
                  {(() => {
                    // Check if this is a national team in an international competition
                    const isInternationalCompetition =
                      currentMatch?.league?.country === "World" ||
                      currentMatch?.league?.country === "Europe" ||
                      currentMatch?.league?.country === "South America" ||
                      currentMatch?.league?.name
                        ?.toLowerCase()
                        .includes("world cup") ||
                      currentMatch?.league?.name
                        ?.toLowerCase()
                        .includes("euro") ||
                      currentMatch?.league?.name
                        ?.toLowerCase()
                        .includes("copa america") ||
                      currentMatch?.league?.name
                        ?.toLowerCase()
                        .includes("uefa nations") ||
                      currentMatch?.league?.name
                        ?.toLowerCase()
                        .includes("cosafa") ||
                      currentMatch?.league?.name
                        ?.toLowerCase()
                        .includes("tournoi maurice revello") ||
                      currentMatch?.league?.name
                        ?.toLowerCase()
                        .includes("friendlies") ||
                      currentMatch?.league?.name
                        ?.toLowerCase()
                        .includes("international");

                    if (isInternationalCompetition) {
                      const teamName = currentMatch?.teams?.home?.name || "";

                      return (
                        <div
                          className="absolute z-20"
                          style={{
                            top: "calc(50% - 32px)",
                            left: "-32px",
                          }}
                        >
                          <MyCircularFlag
                            teamName={teamName}
                            fallbackUrl={currentMatch?.teams?.home?.logo}
                            alt={teamName}
                            size="64px"
                            className="featured-match-size"
                            leagueContext={{
                              name: currentMatch?.league?.name || "",
                              country: currentMatch?.league?.country || "",
                            }}
                          />
                        </div>
                      );
                    }

                    // Fallback to original team logo for non-international competitions
                    return (
                      <LazyImage
                        src={
                          currentMatch?.teams?.home?.logo ||
                          `/assets/fallback-logo.svg`
                        }
                        alt={currentMatch?.teams?.home?.name || "Home Team"}
                        className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full"
                        style={{
                          top: "calc(50% - 32px)",
                          left: "-32px",
                          filter:
                            "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))",
                        }}
                        fallbackSrc="/assets/fallback-logo.png"
                        rootMargin="50px"
                        threshold={0.1}
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
                  <span
                    className="vs-text font-bold"
                    style={{ fontSize: "1.5rem" }}
                  >
                    VS
                  </span>
                </div>

                {/* Away team colored bar */}
                <div
                  className="h-full w-[calc(50%-56px)] mr-[77px] transition-all duration-500 ease-in-out opacity-100"
                  style={{
                    background: getTeamColor(
                      currentMatch?.teams?.away?.id || 1,
                    ),
                  }}
                ></div>

                {/* Away team name - positioned independently */}
                <div
                  className="absolute text-white uppercase text-center max-w-[160px] truncate md:max-w-[240px] font-sans"
                  style={{
                    top: "calc(50% - 13px)",
                    right: "110px",
                    fontSize: "1.24rem",
                    fontWeight: "normal",
                  }}
                >
                  {currentMatch?.teams?.away?.name || "Away Team"}
                </div>

                {(() => {
                  // Check if this is a national team in an international competition
                  const isInternationalCompetition =
                    currentMatch?.league?.country === "World" ||
                    currentMatch?.league?.country === "Europe" ||
                    currentMatch?.league?.country === "South America" ||
                    currentMatch?.league?.name
                      ?.toLowerCase()
                      .includes("world cup") ||
                    currentMatch?.league?.name
                      ?.toLowerCase()
                      .includes("euro") ||
                    currentMatch?.league?.name
                      ?.toLowerCase()
                      .includes("copa america") ||
                    currentMatch?.league?.name
                      ?.toLowerCase()
                      .includes("uefa nations") ||
                    currentMatch?.league?.name
                      ?.toLowerCase()
                      .includes("cosafa") ||
                    currentMatch?.league?.name
                      ?.toLowerCase()
                      .includes("tournoi maurice revello") ||
                    currentMatch?.league?.name
                      ?.toLowerCase()
                      .includes("friendlies") ||
                    currentMatch?.league?.name
                      ?.toLowerCase()
                      .includes("international");

                  if (isInternationalCompetition) {
                    const teamName = currentMatch?.teams?.away?.name || "";

                    return (
                      <div
                        className="absolute z-20"
                        style={{
                          top: "calc(50% - 32px)",
                          right: "32px",
                        }}
                      >
                        <MyCircularFlag
                          teamName={teamName}
                          fallbackUrl={currentMatch?.teams?.away?.logo}
                          alt={teamName}
                          size="64px"
                          className="featured-match-size"
                          moveLeft={true}
                          leagueContext={{
                            name: currentMatch?.league?.name || "",
                            country: currentMatch?.league?.country || "",
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <LazyImage
                      src={
                        currentMatch?.teams?.away?.logo ||
                        `/assets/fallback-logo.svg`
                      }
                      alt={currentMatch?.teams?.away?.name || "Away Team"}
                      className="absolute z-20 w-[64px] h-[64px] object-contain rounded-full"
                      style={{
                        top: "calc(50% - 32px)",
                        right: "-32px",
                        filter:
                          "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))",
                      }}
                      fallbackSrc="/assets/fallback-logo.png"
                      rootMargin="50px"
                      threshold={0.1}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Match date and venue */}
            <div
              className="absolute text-center text-sm text-black font-medium"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 20px)",
                width: "max-content",
              }}
            >
              {(() => {
                try {
                  const matchDate = new Date(currentMatch?.fixture?.date || "");

                  // Get weekday and month
                  const weekday = matchDate.toLocaleDateString("en-GB", {
                    weekday: "long",
                  });
                  const month = matchDate.toLocaleDateString("en-GB", {
                    month: "short",
                  });

                  // Get day with ordinal suffix
                  const day = matchDate.getDate();
                  const getOrdinalSuffix = (day: number) => {
                    if (day > 3 && day < 21) return "th";
                    switch (day % 10) {
                      case 1:
                        return "st";
                      case 2:
                        return "nd";
                      case 3:
                        return "rd";
                      default:
                        return "th";
                    }
                  };
                  const dayWithSuffix = `${day}${getOrdinalSuffix(day)}`;

                  const formattedTime = matchDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });
                  const venueName =
                    currentMatch?.fixture?.venue?.name || "Stadium";

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