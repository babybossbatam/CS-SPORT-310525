import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Activity, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import {
  shouldExcludeFromPopularLeagues,
  isPopularLeagueSuitable,
  isRestrictedUSLeague,
} from "@/lib/MyPopularLeagueExclusion";
import { QUERY_CONFIGS, CACHE_FRESHNESS } from "@/lib/cacheConfig";
import { useCachedQuery, CacheManager } from "@/lib/cachingHelper";
import { getCurrentUTCDateString } from "@/lib/dateUtilsUpdated";
import { POPULAR_LEAGUES } from "@/lib/constants";
import {
  DEFAULT_POPULAR_TEAMS,
  DEFAULT_POPULAR_LEAGUES,
  POPULAR_COUNTRIES,
  isLiveMatch,
} from "@/lib/matchFilters";
import {
  getCountryFlagWithFallbackSync,
  clearVenezuelaFlagCache,
  forceRefreshVenezuelaFlag,
  clearAllFlagCache,
  getCountryCode,
} from "../../lib/flagUtils";
import { createFallbackHandler } from "../../lib/MyAPIFallback";
import { MyFallbackAPI } from "../../lib/MyFallbackAPI";
import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { SimpleDateFilter } from "../../lib/simpleDateFilter";
import "../../styles/TodaysMatchByCountryNew.css";
import "../../styles/flasheffect.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import { NoLiveMatchesEmpty } from "./NoLiveMatchesEmpty";
import { useCentralData } from "../../providers/CentralDataProvider";

// Helper function to shorten team names
export const shortenTeamName = (teamName: string): string => {
  if (!teamName) return teamName;

  // Remove common suffixes that make names too long
  const suffixesToRemove = [
    "-sc",
    "-SC",
    " SC",
    " FC",
    " CF",
    " United",
    " City",
    " Islands",
    " Republic",
    " National Team",
    " U23",
    " U21",
    " U20",
    " U19",
  ];

  let shortened = teamName;
  for (const suffix of suffixesToRemove) {
    if (shortened.endsWith(suffix)) {
      shortened = shortened.replace(suffix, "");
      break;
    }
  }

  // Handle specific country name shortenings
  const countryMappings: { [key: string]: string } = {
    "Cape Verde Islands": "Cape Verde",
    "Central African Republic": "CAR",
    "Dominican Republic": "Dominican Rep",
    "Bosnia and Herzegovina": "Bosnia",
    "Trinidad and Tobago": "Trinidad",
    "Papua New Guinea": "Papua NG",
    "United Arab Emirates": "UAE",
    "Saudi Arabia": "Saudi",
    "South Africa": "S. Africa",
    "New Zealand": "New Zealand",
    "Costa Rica": "Costa Rica",
    "Puerto Rico": "Puerto Rico",
  };

  // Check if the team name matches any country mappings
  if (countryMappings[shortened]) {
    shortened = countryMappings[shortened];
  }

  return shortened.trim();
};

interface LiveMatchByTimeProps {
  refreshInterval?: number;
  isTimeFilterActive?: boolean;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
  liveFixtures?: any[]; // Accept live fixtures as props
  setLiveFilterActive?: (active: boolean) => void;
}

const LiveMatchByTime: React.FC<LiveMatchByTimeProps> = ({
  refreshInterval = 30000,
  isTimeFilterActive = false,
  liveFilterActive = false,
  timeFilterActive = false,
  liveFixtures: propsFixtures,
  setLiveFilterActive,
}) => {
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  
  // Flash animation states
  const [halftimeFlashMatches, setHalftimeFlashMatches] = useState<Set<number>>(new Set());
  const [fulltimeFlashMatches, setFulltimeFlashMatches] = useState<Set<number>>(new Set());
  const [goalFlashMatches, setGoalFlashMatches] = useState<Set<number>>(new Set());
  const [previousMatchStatuses, setPreviousMatchStatuses] = useState<Map<number, string>>(new Map());
  const [previousMatchScores, setPreviousMatchScores] = useState<Map<number, {home: number, away: number}>>(new Map());

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

  const toggleStarMatch = (fixtureId: number) => {
    const newStarred = new Set(starredMatches);
    if (newStarred.has(fixtureId)) {
      newStarred.delete(fixtureId);
    } else {
      newStarred.add(fixtureId);
    }
    setStarredMatches(newStarred);
  };

  // Use central live data cache
  const { liveFixtures: fetchedFixtures, isLoading, error } = useCentralData();

  // Use props data if available, otherwise use fetched data
  const fixtures = propsFixtures || fetchedFixtures;

  // Enhanced country flag mapping with better null safety
  const getCountryFlag = (
    country: string | null | undefined,
    leagueFlag?: string | null,
  ) => {
    // Use league flag if available and valid
    if (
      leagueFlag &&
      typeof leagueFlag === "string" &&
      leagueFlag.trim() !== ""
    ) {
      return leagueFlag;
    }

    // Add comprehensive null/undefined check for country
    if (!country || typeof country !== "string" || country.trim() === "") {
      return "/assets/fallback-logo.png"; // Default football logo
    }

    const cleanCountry = country.trim();

    // Special handling for Unknown country only
    if (cleanCountry === "Unknown") {
      return "/assets/fallback-logo.png"; // Default football logo
    }

    // Special cases for international competitions
    if (cleanCountry === "World") {
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzNkYyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yIDEyaDIwbS0yMCA0aDIwbS0yMC04aDIwIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTIgMmE0IDE0IDAgMCAwIDAgMjBBNCAxNCAwIDAgMCAxMiAyIiBzdHJva2U9IiMzMzczZGMiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K";
    }

    if (cleanCountry === "Europe") {
      return "https://flagsapi.com/EU/flat/24.png";
    }

    // Use centralized countryCodeMap from flagUtils

    // Use country mapping, fallback to SportsRadar for unknown countries
    let countryCode = "XX";
    if (countryCodeMap[cleanCountry]) {
      countryCode = countryCodeMap[cleanCountry];
      return `https://flagsapi.com/${countryCode}/flat/24.png`;
    } else {
      console.warn(
        "Unknown country for flag mapping, trying SportsRadar fallback:",
        cleanCountry,
      );
      // Try SportsRadar flags API as fallback
      return `https://api.sportradar.com/flags-images-t3/sr/country-flags/flags/${cleanCountry.toLowerCase().replace(/\s+/g, "_")}/flag_24x24.png`;
    }
  };

  // Use only the live fixtures data
  const allFixtures = fixtures;

  // Effect to detect status and score changes with flash effects
  useEffect(() => {
    if (!allFixtures?.length) return;

    const newHalftimeMatches = new Set<number>();
    const newFulltimeMatches = new Set<number>();
    const newGoalMatches = new Set<number>();
    const currentStatuses = new Map<number, string>();
    const currentScores = new Map<number, {home: number, away: number}>();

    allFixtures.forEach((fixture) => {
      const matchId = fixture.fixture.id;
      const currentStatus = fixture.fixture.status.short;
      const previousStatus = previousMatchStatuses.get(matchId);
      const currentScore = {
        home: fixture.goals.home ?? 0,
        away: fixture.goals.away ?? 0
      };
      const previousScore = previousMatchScores.get(matchId);

      currentStatuses.set(matchId, currentStatus);
      currentScores.set(matchId, currentScore);

      // Log all status transitions for debugging
      if (previousStatus && previousStatus !== currentStatus) {
        console.log(`🔄 [STATUS TRANSITION] Match ${matchId}:`, {
          teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
          transition: `${previousStatus} → ${currentStatus}`,
          time: new Date().toLocaleTimeString()
        });

        // Detect transition from upcoming to live
        const wasUpcoming = ['NS', 'TBD'].includes(previousStatus);
        const isNowLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(currentStatus);
        
        if (wasUpcoming && isNowLive) {
          console.log(`🟢 [MATCH STARTED] Match ${matchId} started!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
        }

        // Detect transition from live to ended
        const wasLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'].includes(previousStatus);
        const isNowEnded = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(currentStatus);
        
        if (wasLive && isNowEnded) {
          console.log(`🏁 [MATCH ENDED] Match ${matchId} ended!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            finalScore: `${currentScore.home}-${currentScore.away}`,
            previousStatus,
            currentStatus
          });
        }

        // Check if status just changed to halftime
        if (currentStatus === 'HT') {
          console.log(`🟠 [HALFTIME FLASH] Match ${matchId} just went to halftime!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newHalftimeMatches.add(matchId);
        }

        // Check if status just changed to fulltime
        if (currentStatus === 'FT') {
          console.log(`🔵 [FULLTIME FLASH] Match ${matchId} just finished!`, {
            home: fixture.teams?.home?.name,
            away: fixture.teams?.away?.name,
            previousStatus,
            currentStatus
          });
          newFulltimeMatches.add(matchId);
        }
      }

      // Check for goal changes
      if (previousScore && 
          (currentScore.home !== previousScore.home || currentScore.away !== previousScore.away)) {
        console.log(`⚽ [GOAL FLASH] Match ${matchId} score changed!`, {
          home: fixture.teams?.home?.name,
          away: fixture.teams?.away?.name,
          previousScore,
          currentScore
        });
        newGoalMatches.add(matchId);
      }
    });

    // Update previous statuses and scores for next comparison
    setPreviousMatchStatuses(currentStatuses);
    setPreviousMatchScores(currentScores);

    // Trigger flash for new halftime matches
    if (newHalftimeMatches.size > 0) {
      setHalftimeFlashMatches(newHalftimeMatches);
      setTimeout(() => {
        setHalftimeFlashMatches(new Set());
      }, 3000);
    }

    // Trigger flash for new fulltime matches
    if (newFulltimeMatches.size > 0) {
      setFulltimeFlashMatches(newFulltimeMatches);
      setTimeout(() => {
        setFulltimeFlashMatches(new Set());
      }, 3000);
    }

    // Trigger flash for new goal matches
    if (newGoalMatches.size > 0) {
      setGoalFlashMatches(newGoalMatches);
      setTimeout(() => {
        setGoalFlashMatches(new Set());
      }, 2000);
    }
  }, [allFixtures]);

  // Collect all matches from all leagues and add league info with smart date labeling
  const allMatches = allFixtures.map((fixture: any) => {
    const today = new Date();
    const todayString = format(today, 'yyyy-MM-dd');

    const smartResult = MySmartTimeFilter.getSmartTimeLabel(
      fixture.fixture.date,
      fixture.fixture.status.short,
      todayString + 'T12:00:00Z' // Use today as context for live matches
    );

    return {
      ...fixture,
      leagueInfo: {
        name: fixture.league?.name || "Unknown League",
        country: fixture.league?.country || "Unknown Country",
        logo: fixture.league?.logo || "/assets/fallback-logo.svg",
      },
      smartDateLabel: smartResult.label,
      smartDateReason: smartResult.reason,
      isActualDate: smartResult.isWithinTimeRange
    };
  });

  // Filter for live matches only when both filters are active
  const filteredMatches =
    liveFilterActive && timeFilterActive
      ? allMatches.filter((match: any) => {
          const status = match.fixture.status.short;
          return ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
            status,
          );
        })
      : allMatches;

  // Sort all matches by time with most recent first
  const sortedMatches = filteredMatches.sort((a: any, b: any) => {
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
    const now = new Date().getTime();

    // Check if matches are live
    const aIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
      aStatus,
    );
    const bIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
      bStatus,
    );

    // Check if matches are finished
    const aIsFinished = ["FT", "AET", "PEN"].includes(aStatus);
    const bIsFinished = ["FT", "AET", "PEN"].includes(bStatus);

    // Calculate time distance from now for prioritization
    const aTimeDistance = Math.abs(aTime - now);
    const bTimeDistance = Math.abs(bTime - now);

    // Live matches first (sorted by elapsed time descending - longest running first)
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    if (aIsLive && bIsLive) {
      const aElapsed = Number(a.fixture.status.elapsed) || 0;
      const bElapsed = Number(b.fixture.status.elapsed) || 0;

      // Ensure consistent ascending order: shorter elapsed time first
      const sortResult = aElapsed - bElapsed;
      return sortResult;
    }

    // Recently finished matches next (most recent first)
    if (aIsFinished && !bIsFinished) return -1;
    if (!aIsFinished && bIsFinished) return 1;
    if (aIsFinished && bIsFinished) {
      return bTime - aTime; // Most recent finished matches first
    }

    // Upcoming matches last (closest to start time first)
    return aTime - bTime;
  });

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-3 w-44" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <>
        {/* Header Section */}
        <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
          Popular Football Live Score
        </CardHeader>
        <div className="bg-gray-100 min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading live matches...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest scores</p>
          </div>
        </div>
      </>
    );
  }

  // Show no matches when no data is available
  if (!allFixtures.length) {
    return (
      <div className="bg-gray-100 min-h-[400px]">
        <NoLiveMatchesEmpty 
          showBackButton={true}
          onBackToHome={() => {
            window.location.href = '/';
          }}
          setLiveFilterActive={setLiveFilterActive}
        />
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        <div className="flex justify-between items-center w-full">
          <span>
            {liveFilterActive && timeFilterActive
              ? "Popular Football Live Score"
              : liveFilterActive && !timeFilterActive
                ? "Live Football Scores"
                : !liveFilterActive && timeFilterActive
                  ? "All Matches by Time"
                  : "Live Football Scores"}
          </span>
          
        </div>
      </CardHeader>

      {/* Single consolidated card with all matches sorted by time */}
      <Card className=" overflow-hidden">
        {/* Header showing total matches */}

        {/* All Matches */}
        <CardContent className="p-0">
          <div className="space-y-0">
            {sortedMatches.map((match: any, index: number) => (
              <div
                key={`${match.fixture.id}-${match.fixture.status.elapsed}-${index}`}
                className="country-matches-container"
              >
                <div 
                  className={`match-card-container group ${
                    halftimeFlashMatches.has(match.fixture.id) ? 'halftime-flash' : ''
                  } ${
                    fulltimeFlashMatches.has(match.fixture.id) ? 'fulltime-flash' : ''
                  } ${
                    goalFlashMatches.has(match.fixture.id) ? 'goal-flash' : ''
                  }`}
                  data-fixture-id={match.fixture.id}
                ></div>
                
                {/* Star Button with slide-in effect */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStarMatch(match.fixture.id);
                  }}
                  className="match-star-button"
                  title="Add to favorites"
                  onMouseEnter={(e) => {
                    e.currentTarget
                      .closest(".group")
                      ?.classList.add("disable-hover");
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget
                      .closest(".group")
                      ?.classList.remove("disable-hover");
                  }}
                >
                  <Star
                    className={`match-star-icon ${
                      starredMatches.has(match.fixture.id) ? "starred" : ""
                    }`}
                  />
                </button>

                {/* Three-grid layout container */}
                <div className="match-three-grid-container">
                  {/* Top Grid: Match Status */}
                  <div className="match-status-top">
                    {(() => {
                      const status = match.fixture.status.short;
                      const elapsed = match.fixture.status.elapsed;

                      // Live matches status
                      if (
                        [
                          "LIVE",
                          "1H",
                          "HT",
                          "2H",
                          "ET",
                          "BT",
                          "P",
                          "INT",
                        ].includes(status)
                      ) {
                        return (
                          <div className="match-status-label status-live">
                            {status === "HT"
                              ? "Halftime"
                              : `${elapsed || 0}'`}
                            
                          </div>
                        );
                      }

                      // Finished matches status
                      if (
                        [
                          "FT",
                          "AET",
                          "PEN",
                          "AWD",
                          "WO",
                          "ABD",
                          "CANC",
                          "SUSP",
                        ].includes(status)
                      ) {
                        const statusText =
                          status === "FT"
                            ? "Full Time"
                            : status === "AET"
                              ? "After Extra Time"
                              : status === "PEN"
                                ? "Penalties"
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
                                          : status;

                        return (
                          <div className="match-status-label status-ended">
                            {statusText}
                          </div>
                        );
                      }

                      // Postponed matches
                      if (["PST"].includes(status)) {
                        return (
                          <div className="match-status-label status-postponed">
                            Postponed
                          </div>
                        );
                      }

                      // No status for upcoming matches
                      return null;
                    })()}
                  </div>

                  {/* Middle Grid: Main Content */}
                  <div className="match-content-container">
                    {/* Home Team Name - positioned further left */}
                    <div
                      className={`home-team-name ${
                        match.goals.home !== null &&
                        match.goals.away !== null &&
                        match.goals.home > match.goals.away
                          ? "winner"
                          : ""
                      }`}
                    >
                      {match.teams.home.name || "Unknown Team"}
                    </div>

                    {/* Home team logo - grid area */}
                    <div className="home-team-logo-container">
                      {(() => {
                        // Check if this is a national team
                        const isActualNationalTeam = isNationalTeam(
                          match.teams.home,
                          match.leagueInfo,
                        );

                        // Check for youth teams
                        const isYouthTeam = match.teams.home.name?.includes("U20") || 
                                           match.teams.home.name?.includes("U21") ||
                                           match.teams.home.name?.includes("U19") ||
                                           match.teams.home.name?.includes("U23");

                        // Check if this is FIFA Club World Cup (club competition, not national teams)
                        const isFifaClubWorldCup = match.leagueInfo?.name?.toLowerCase().includes("fifa club world cup");

                        // Use MyCircularFlag for national teams and youth teams, but NOT for club competitions like FIFA Club World Cup
                        if ((isActualNationalTeam || isYouthTeam) && !isFifaClubWorldCup) {
                          return (
                            <MyCircularFlag
                              teamName={match.teams.home.name || ""}
                              fallbackUrl={
                                match.teams.home.id
                                  ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                  : "/assets/fallback-logo.svg"
                              }
                              alt={match.teams.home.name}
                              size="32px"
                              className=""
                            />
                          );
                        }

                        // Default to regular team logo for club teams
                        return (
                          <LazyImage
                            src={
                              match.teams.home.id
                                ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.home.name}
                            title={match.teams.home.name}
                            className="team-logo"
                            style={{ backgroundColor: "transparent" }}
                            fallbackSrc="/assets/fallback-logo.svg"
                          />
                        );
                      })()}
                    </div>

                    {/* Score/Time Center - Fixed width and centered */}
                    <div className="match-score-container">
                      {(() => {
                        const status = match.fixture.status.short;
                        const fixtureDate = parseISO(match.fixture.date);

                        // Live matches
                        if (
                          [
                            "LIVE",
                            "1H",
                            "HT",
                            "2H",
                            "ET",
                            "BT",
                            "P",
                            "INT",
                          ].includes(status)
                        ) {
                          return (
                            <div className="match-score-display">
                              <span className="score-number">
                                {match.goals.home ?? 0}
                              </span>
                              <span className="score-separator">
                                -
                              </span>
                              <span className="score-number">
                                {match.goals.away ?? 0}
                              </span>
                            </div>
                          );
                        }

                        // All finished match statuses
                        if (
                          [
                            "FT",
                            "AET",
                            "PEN",
                            "AWD",
                            "WO",
                            "ABD",
                            "CANC",
                            "SUSP",
                          ].includes(status)
                        ) {
                          // Check if we have actual numerical scores
                          const homeScore = match.goals.home;
                          const awayScore = match.goals.away;
                          const hasValidScores =
                            homeScore !== null &&
                            homeScore !== undefined &&
                            awayScore !== null &&
                            awayScore !== undefined &&
                            !isNaN(Number(homeScore)) &&
                            !isNaN(Number(awayScore));

                          if (hasValidScores) {
                            return (
                              <div className="match-score-display">
                                <span className="score-number">
                                  {homeScore}
                                </span>
                                <span className="score-separator">
                                  -
                                </span>
                                <span className="score-number">
                                  {awayScore}
                                </span>
                              </div>
                            );
                          } else {
                            // Match is finished but no valid score data
                            return (
                              <div className="match-time-display">
                                {format(fixtureDate, "HH:mm")}
                              </div>
                            );
                          }
                        }

                        // Postponed or delayed matches
                        if (
                          [
                            "PST",
                            "CANC",
                            "ABD",
                            "SUSP",
                            "AWD",
                            "WO",
                          ].includes(status)
                        ) {
                          return (
                            <div className="match-time-display">
                              {format(fixtureDate, "HH:mm")}
                            </div>
                          );
                        }

                        // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                        return (
                          <div className="match-time-display">
                            {status === "TBD"
                              ? "TBD"
                              : format(fixtureDate, "HH:mm")}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Away team logo - grid area */}
                    <div className="away-team-logo-container">
                      {(() => {
                        // Check if this is a national team
                        const isActualNationalTeam = isNationalTeam(
                          match.teams.away,
                          match.leagueInfo,
                        );

                        // Check for youth teams
                        const isYouthTeam = match.teams.away.name?.includes("U20") || 
                                           match.teams.away.name?.includes("U21") ||
                                           match.teams.away.name?.includes("U19") ||
                                           match.teams.away.name?.includes("U23");

                        // Check if this is FIFA Club World Cup (club competition, not national teams)
                        const isFifaClubWorldCup = match.leagueInfo?.name?.toLowerCase().includes("fifa club world cup");

                        // Use MyCircularFlag for national teams and youth teams, but NOT for club competitions like FIFA Club World Cup
                        if ((isActualNationalTeam || isYouthTeam) && !isFifaClubWorldCup) {
                          return (
                            <MyCircularFlag
                              teamName={match.teams.away.name || ""}
                              fallbackUrl={
                                match.teams.away.id
                                  ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                  : "/assets/fallback-logo.svg"
                              }
                              alt={match.teams.away.name}
                              size="32px"
                              className=""
                            />
                          );
                        }

                        // Default to regular team logo for club teams
                        return (
                          <LazyImage
                            src={
                              match.teams.away.id
                                ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.away.name}
                            title={match.teams.away.name}
                            className="team-logo"
                            style={{ backgroundColor: "transparent" }}
                            fallbackSrc="/assets/fallback-logo.svg"
                          />
                        );
                      })()}
                    </div>

                    {/* Away Team Name - positioned further right */}
                    <div
                      className={`away-team-name ${
                        match.goals.home !== null &&
                        match.goals.away !== null &&
                        match.goals.away > match.goals.home
                          ? "winner"
                          : ""
                      }`}
                    >
                      {match.teams.away.name || "Unknown Team"}
                    </div>
                  </div>

                  {/* Bottom Grid: Penalty Results */}
                  <div className="match-penalty-bottom">
                    {(() => {
                      const status = match.fixture.status.short;
                      
                      // Show penalty results for matches that ended in penalties
                      if (status === "PEN" && match.score?.penalty) {
                        const penaltyHome = match.score.penalty.home;
                        const penaltyAway = match.score.penalty.away;
                        
                        if (penaltyHome !== null && penaltyAway !== null) {
                          const winner = penaltyHome > penaltyAway ? match.teams.home.name : match.teams.away.name;
                          
                          return (
                            <div className="penalty-result-display">
                              <div className="penalty-text">
                                Penalties: {penaltyHome} - {penaltyAway}
                              </div>
                              <div className="penalty-winner">
                                {winner} won on penalties
                              </div>
                            </div>
                          );
                        }
                      }
                      
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
     
        </CardContent>
      </Card>
    </>
  );
};

export default LiveMatchByTime;