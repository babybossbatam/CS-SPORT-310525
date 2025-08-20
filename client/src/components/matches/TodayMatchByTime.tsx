import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Calendar, Star } from "lucide-react";
import { parseISO, isValid, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
import MyCircularFlag from "../common/MyCircularFlag";
import { formatMatchTimeWithTimezone } from "@/lib/timezoneApiService";
import "../../styles/MyLogoPositioning.css";
import "../../styles/flasheffect.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { smartTeamTranslation } from "@/lib/smartTeamTranslation";
import { smartLeagueCountryTranslation } from "@/lib/smartLeagueCountryTranslation";

interface FixtureData {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed?: number;
    };
    venue?: {
      name: string;
      city: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    penalty?: {
      home: number | null;
      away: number | null;
    };
  };
}

interface TodayMatchByTimeProps {
  selectedDate: string;
  timeFilterActive: boolean;
  liveFilterActive: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive,
  liveFilterActive,
  onMatchCardClick,
}) => {
  const { translations, currentLanguage } = useLanguage();

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  };

  // Smart team name translation function
  const translateTeamName = (teamName: string): string => {
    if (!teamName) return '';
    const translated = smartTeamTranslation.translateTeamName(teamName, currentLanguage);
    return translated || teamName;
  };

  // Match status translation function
  const translateMatchStatus = (status: string): string => {
    if (!status) return '';

    const statusTranslations: Record<string, Record<string, string>> = {
      'FT': {
        'zh': '全场结束', 'zh-hk': '全場結束', 'zh-tw': '全場結束',
        'es': 'Tiempo completo', 'de': 'Abpfiff', 'it': 'Finito', 'pt': 'Final'
      },
      'HT': {
        'zh': '半场结束', 'zh-hk': '半場結束', 'zh-tw': '半場結束',
        'es': 'Medio tiempo', 'de': 'Halbzeit', 'it': 'Primo tempo', 'pt': 'Intervalo'
      },
      'LIVE': {
        'zh': '直播中', 'zh-hk': '直播中', 'zh-tw': '直播中',
        'es': 'En vivo', 'de': 'Live', 'it': 'Live', 'pt': 'Ao vivo'
      },
      'NS': {
        'zh': '未开始', 'zh-hk': '未開始', 'zh-tw': '未開始',
        'es': 'No iniciado', 'de': 'Nicht gestartet', 'it': 'Non iniziato', 'pt': 'Não iniciado'
      },
      'PST': {
        'zh': '推迟', 'zh-hk': '推遲', 'zh-tw': '推遲',
        'es': 'Pospuesto', 'de': 'Verschoben', 'it': 'Rinviato', 'pt': 'Adiado'
      }
    };

    return statusTranslations[status]?.[currentLanguage] || status;
  };

  // Penalty status translation function
  const translatePenaltyStatus = (penaltyStatus: string): string => {
    if (!penaltyStatus) return '';

    const penaltyTranslations: Record<string, Record<string, string>> = {
      'PEN': {
        'zh': '点球', 'zh-hk': '十二碼', 'zh-tw': '十二碼',
        'es': 'Penales', 'de': 'Elfmeter', 'it': 'Rigori', 'pt': 'Pênaltis'
      },
      'AET': {
        'zh': '加时', 'zh-hk': '加時', 'zh-tw': '加時',
        'es': 'Tiempo extra', 'de': 'Verlängerung', 'it': 'Tempi supplementari', 'pt': 'Prorrogação'
      }
    };

    return penaltyTranslations[penaltyStatus]?.[currentLanguage] || penaltyStatus;
  };

  const [isExpanded, setIsExpanded] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [hoveredMatchId, setHoveredMatchId] = useState<number | null>(null);

  // League IDs to fetch data from
  const leagueIds = [
    38, 15, 2, 10, 11, 848, 886, 71, 3, 5, 531, 22, 72, 73, 75, 76, 233, 667,
    531, 940, 908, 1169, 23, 1077, 253, 850, 893, 921, 130, 128, 493, 239, 265,
    237, 235, 743,
  ];

  // Fetch fixtures for all leagues
  const {
    data: allFixtures,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["todayMatchByTime", "allFixtures", selectedDate],
    queryFn: async () => {
      console.log(
        `🎯 [TodayMatchByTime] Fetching fixtures for ${leagueIds.length} leagues for date ${selectedDate}:`,
        leagueIds,
      );

      const promises = leagueIds.map(async (leagueId) => {
        try {
          const response = await fetch(`/api/leagues/${leagueId}/fixtures`);
          if (!response.ok) {
            console.log(
              `❌ [TodayMatchByTime] Failed to fetch league ${leagueId}: ${response.status} ${response.statusText}`,
            );
            return [];
          }
          const data = await response.json();
          return data.response || data || [];
        } catch (error) {
          console.error(
            `❌ [TodayMatchByTime] Error fetching league ${leagueId}:`,
            error,
          );
          return [];
        }
      });

      const results = await Promise.all(promises);
      const allFixtures = results.flatMap((fixtures) => fixtures);

      console.log(
        `🔄 [TodayMatchByTime] Total fixtures fetched: ${allFixtures.length}`,
      );
      return allFixtures;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
    enabled: timeFilterActive,
  });

  // Process and sort fixtures by match status and kick-off time
  const sortedFixtures = useMemo(() => {
    if (!allFixtures?.length) {
      return [];
    }

    // Filter fixtures for the selected date
    const filteredFixtures = allFixtures.filter((fixture: FixtureData) => {
      if (!fixture?.league || !fixture?.teams || !fixture?.fixture?.date) {
        return false;
      }

      // Apply date filtering
      const fixtureDate = new Date(fixture.fixture.date);
      const fixtureDateString = format(fixtureDate, "yyyy-MM-dd");
      return fixtureDateString === selectedDate;
    });

    // Sort by match status priority and kick-off time
    const sorted = filteredFixtures.sort((a, b) => {
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;
      const aTime = new Date(a.fixture.date).getTime();
      const bTime = new Date(b.fixture.date).getTime();

      // Check match status categories
      const aLive = [
        "LIVE",
        "LIV",
        "1H",
        "HT",
        "2H",
        "ET",
        "BT",
        "P",
        "INT",
      ].includes(aStatus);
      const bLive = [
        "LIVE",
        "LIV",
        "1H",
        "HT",
        "2H",
        "ET",
        "BT",
        "P",
        "INT",
      ].includes(bStatus);

      const aUpcoming = ["NS", "TBD"].includes(aStatus);
      const bUpcoming = ["NS", "TBD"].includes(bStatus);

      const aEnded = [
        "FT",
        "AET",
        "PEN",
        "AWD",
        "WO",
        "ABD",
        "CANC",
        "SUSP",
      ].includes(aStatus);
      const bEnded = [
        "FT",
        "AET",
        "PEN",
        "AWD",
        "WO",
        "ABD",
        "CANC",
        "SUSP",
      ].includes(aStatus);

      // Priority 1: Live matches first
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // If both are live, sort by kick-off time (earliest first)
      if (aLive && bLive) {
        return aTime - bTime;
      }

      // Priority 2: Upcoming matches second
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;

      // If both are upcoming, sort by kick-off time (earliest first)
      if (aUpcoming && bUpcoming) {
        return aTime - bTime;
      }

      // Priority 3: Ended matches last
      if (aEnded && !bEnded) return 1;
      if (!aEnded && bEnded) return -1;

      // If both are ended, sort by kick-off time (most recent first)
      if (aEnded && bEnded) {
        return bTime - aTime;
      }

      // Default: sort by kick-off time
      return aTime - bTime;
    });

    console.log(
      `✅ [TodayMatchByTime] Sorted ${sorted.length} fixtures by status and kick-off time for ${selectedDate}`,
    );
    return sorted;
  }, [allFixtures, selectedDate]);

  const toggleStarMatch = (matchId: number) => {
    setStarredMatches((prev) => {
      const newStarred = new Set(prev);
      if (newStarred.has(matchId)) {
        newStarred.delete(matchId);
      } else {
        newStarred.add(matchId);
      }
      return newStarred;
    });
  };

  const handleMatchClick = (fixture: FixtureData) => {
    console.log("🎯 [TodayMatchByTime] Match card clicked:", {
      fixtureId: fixture.fixture?.id,
      teams: `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`,
      league: fixture.league?.name,
      status: fixture.fixture?.status?.short,
    });

    // Set this match as selected
    setSelectedMatchId(fixture.fixture?.id);

    if (onMatchCardClick) {
      onMatchCardClick(fixture);
    }
  };

  if (!timeFilterActive) return null;

  if (isLoading) {
    return (
      <Card className="mt-4 overflow-hidden">
        <CardHeader className="cursor-pointer flex items-center justify-between p-3 bg-white border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-gray-800">
              {t("popular_football_leagues")}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="country-matches-container">
              <div className="match-card-container">
                <div className="match-three-grid-container">
                  <div
                    className="match-status-top"
                    style={{
                      minHeight: "20px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <div className="match-content-container">
                    <div
                      className="home-team-name"
                      style={{ textAlign: "right" }}
                    >
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div
                      className="home-team-logo-container"
                      style={{ padding: "0 0.6rem" }}
                    >
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <div className="match-score-container">
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <div
                      className="away-team-logo-container"
                      style={{ padding: "0 0.5rem" }}
                    >
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <div
                      className="away-team-name"
                      style={{ textAlign: "left" }}
                    >
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-4 overflow-hidden">
        <CardHeader className="cursor-pointer flex items-center justify-between p-3 bg-white border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-gray-800">
              {t("popular_football_leagues")}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            <div>Error loading matches</div>
            <div className="text-xs mt-2">{error.message}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 overflow-hidden">
      <CardHeader
        className="cursor-pointer flex items-left justify-between p-3 bg-white border-b"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 text-sm">
            {t("popular_football_leagues")}
          </span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {sortedFixtures.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div>No matches found for {selectedDate}</div>
            </div>
          ) : (
            <div className="match-cards-wrapper">
              {sortedFixtures.map((fixture: FixtureData) => {
                const matchId = fixture.fixture.id;
                const isStarred = starredMatches.has(matchId);
                const leagueContext = {
                  leagueId: fixture.league.id,
                  leagueName: fixture.league.name,
                  country: fixture.league.country,
                };

                return (
                  <div key={matchId} className="country-matches-container">
                    <div
                      className={`match-card-container group border-b border-gray-200 ${
                        selectedMatchId === matchId ? "selected-match" : ""
                      } ${hoveredMatchId === matchId ? "hovered-match" : ""}`}
                      data-fixture-id={matchId}
                      onClick={() => handleMatchClick(fixture)}
                      onMouseEnter={() => setHoveredMatchId(matchId)}
                      onMouseLeave={() => setHoveredMatchId(null)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Star Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarMatch(matchId);
                        }}
                        className="match-star-button"
                        title="Add to favorites"
                        onMouseEnter={(e) => {
                          e.currentTarget
                            .closest(".match-card-container")
                            ?.classList.add("disable-hover");
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget
                            .closest(".match-card-container")
                            ?.classList.remove("disable-hover");
                        }}
                      >
                        <Star
                          className={`match-star-icon ${isStarred ? "starred" : ""}`}
                        />
                      </button>

                      {/* Match content container - Using MyNewLeague2's 3-grid system */}
                      <div className="match-three-grid-container">
                        {/* Top Grid: Match Status */}
                        <div
                          className="match-status-top"
                          style={{
                            minHeight: "20px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {(() => {
                            const status = fixture.fixture.status.short;
                            const elapsed = fixture.fixture.status.elapsed;

                            // Check if match finished more than 4 hours ago
                            const matchDateTime = new Date(
                              fixture.fixture.date,
                            );
                            const hoursOld =
                              (Date.now() - matchDateTime.getTime()) /
                              (1000 * 60 * 60);
                            const isStaleFinishedMatch =
                              (["FT", "AET", "PEN"].includes(status) &&
                                hoursOld > 4) ||
                              ([
                                "FT",
                                "AET",
                                "PEN",
                                "AWD",
                                "WO",
                                "ABD",
                                "CANC",
                                "SUSP",
                              ].includes(status) &&
                                hoursOld > 4) ||
                              (hoursOld > 4 &&
                                [
                                  "LIVE",
                                  "1H",
                                  "2H",
                                  "HT",
                                  "ET",
                                  "BT",
                                  "P",
                                  "INT",
                                ].includes(status));

                            // Show live status only for truly live matches (not finished and not stale)
                            if (
                              ![
                                "FT",
                                "AET",
                                "PEN",
                                "AWD",
                                "WO",
                                "ABD",
                                "CANC",
                                "SUSP",
                              ].includes(status) &&
                              !isStaleFinishedMatch &&
                              hoursOld <= 4 &&
                              [
                                "LIVE",
                                "LIV",
                                "1H",
                                "HT",
                                "2H",
                                "ET",
                                "BT",
                                "P",
                                "INT",
                              ].includes(status)
                            ) {
                              let displayText = "";
                              let statusClass = "status-live-elapsed";

                              if (status === "HT") {
                                displayText = t("halftime");
                                statusClass = "status-halftime";
                              } else if (status === "P") {
                                displayText = t("penalties");
                              } else if (status === "ET") {
                                if (elapsed) {
                                  const extraTime = elapsed - 90;
                                  displayText =
                                    extraTime > 0
                                      ? `90' + ${extraTime}'`
                                      : `${elapsed}'`;
                                } else {
                                  displayText = t("extra_time");
                                }
                              } else if (status === "BT") {
                                displayText = t("break_time");
                              } else if (status === "INT") {
                                displayText = t("interrupted");
                              } else {
                                displayText = elapsed ? `${elapsed}'` : t("live");
                              }

                              return (
                                <div
                                  className={`match-status-label ${statusClass}`}
                                >
                                  {displayText}
                                </div>
                              );
                            }

                            // Postponed/Cancelled matches
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
                                <div className="match-status-label status-postponed">
                                  {status === "PST"
                                    ? t("postponed")
                                    : status === "CANC"
                                      ? t("cancelled")
                                      : status === "ABD"
                                        ? t("abandoned")
                                        : status === "SUSP"
                                          ? t("suspended")
                                          : status === "AWD"
                                            ? t("awarded")
                                            : status === "WO"
                                              ? t("walkover")
                                              : status}
                                </div>
                              );
                            }

                            // Check for overdue matches that should be marked as postponed
                            if (status === "NS" || status === "TBD") {
                              const matchTime = new Date(fixture.fixture.date);
                              const now = new Date();
                              const hoursAgo =
                                (now.getTime() - matchTime.getTime()) /
                                (1000 * 60 * 60);

                              // If match is more than 2 hours overdue, show postponed status
                              if (hoursAgo > 2) {
                                return (
                                  <div className="match-status-label status-postponed">
                                    {t("postponed")}
                                  </div>
                                );
                              }

                              // For upcoming matches, don't show status in top grid
                              if (status === "TBD") {
                                return (
                                  <div className="match-status-label status-upcoming">
                                    {t("time_tbd")}
                                  </div>
                                );
                              }

                              // For upcoming matches, don't show status in top grid
                              return null;
                            }

                            // Show "Ended" status for finished matches or stale matches
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
                              ].includes(status) ||
                              isStaleFinishedMatch
                            ) {
                              return (
                                <div
                                  className="match-status-label status-ended"
                                  style={{
                                    minWidth: "60px",
                                    textAlign: "center",
                                    transition: "none",
                                    animation: "none",
                                  }}
                                >
                                  {status === "FT" || isStaleFinishedMatch
                                    ? t("ended")
                                    : status === "AET"
                                      ? t("after_extra_time")
                                      : getMatchStatusTranslation(status, currentLanguage)}
                                </div>
                              );
                            }

                            return null;
                          })()}
                        </div>

                        {/* Middle Grid: Main match content */}
                        <div className="match-content-container">
                          {/* Home Team Name */}
                          <div
                            className={`home-team-name ${
                              fixture.goals.home !== null &&
                              fixture.goals.away !== null &&
                              fixture.goals.home > fixture.goals.away &&
                              ["FT", "AET", "PEN"].includes(
                                fixture.fixture.status.short,
                              )
                                ? "winner"
                                : ""
                            }`}
                            style={{
                              textAlign: "right",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {(() => {
                              const originalName = fixture.teams.home.name || "";
                              const leagueInfo = {
                                name: fixture.league.name,
                                country: fixture.league.country,
                              };

                              try {
                                const translatedName = translateTeamName(originalName);
                                return shortenTeamName(translatedName) || "Unknown Team";
                              } catch (error) {
                                return shortenTeamName(originalName) || "Unknown Team";
                              }
                            })()}
                          </div>

                          {/* Home team logo */}
                          <div
                            className="home-team-logo-container"
                            style={{ padding: "0 0.6rem" }}
                          >
                            {fixture.league.id === 10 ? (
                              <MyCircularFlag
                                teamName={fixture.teams.home.name || ""}
                                teamId={fixture.teams.home.id}
                                fallbackUrl={
                                  fixture.teams.home.id
                                    ? `/api/team-logo/square/${fixture.teams.home.id}?size=32`
                                    : "/assets/fallback.png"
                                }
                                alt={fixture.teams.home.name}
                                size="34px"
                                className="popular-leagues-size"
                              />
                            ) : (
                              <MyWorldTeamLogo
                                teamName={fixture.teams.home.name}
                                teamLogo={
                                  fixture.teams.home.id
                                    ? `/api/team-logo/square/${fixture.teams.home.id}?size=32`
                                    : "/assets/fallback.png"
                                }
                                alt={fixture.teams.home.name}
                                size="34px"
                                className="popular-leagues-size"
                                leagueContext={leagueContext}
                              />
                            )}
                          </div>

                          {/* Score/Time Center */}
                          <div className="match-score-container">
                            {(() => {
                              const status = fixture.fixture.status.short;

                              // Live matches - show current score
                              if (
                                [
                                  "LIVE",
                                  "LIV",
                                  "1H",
                                  "HT",
                                  "2H",
                                  "ET",
                                  "BT",
                                  "P",
                                  "INT",
                                  "45",
                                  "90",
                                ].includes(status)
                              ) {
                                return (
                                  <div className="match-score-display">
                                    <span className="score-number">
                                      {fixture.goals.home ?? 0}
                                    </span>
                                    <span className="score-separator">-</span>
                                    <span className="score-number">
                                      {fixture.goals.away ?? 0}
                                    </span>
                                  </div>
                                );
                              }

                              // Ended matches - show final score
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
                                return (
                                  <div className="match-score-display">
                                    <span className="score-number">
                                      {fixture.goals.home ?? 0}
                                    </span>
                                    <span className="score-separator">-</span>
                                    <span className="score-number">
                                      {fixture.goals.away ?? 0}
                                    </span>
                                  </div>
                                );
                              }

                              // For postponed matches and upcoming matches - show kick-off time
                              if (
                                status === "NS" ||
                                status === "TBD" ||
                                [
                                  "PST",
                                  "CANC",
                                  "ABD",
                                  "SUSP",
                                  "AWD",
                                  "WO",
                                ].includes(status)
                              ) {
                                const matchTime = new Date(
                                  fixture.fixture.date,
                                );

                                // For postponed/cancelled matches, still show the kick-off time
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
                                  const localTime =
                                    matchTime.toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    });

                                  return (
                                    <div
                                      className="match-time-display"
                                      style={{ fontSize: "0.882em" }}
                                    >
                                      {localTime}
                                    </div>
                                  );
                                }

                                // Check if match should have started already (more than 2 hours ago) for NS/TBD
                                const now = new Date();
                                const hoursAgo =
                                  (now.getTime() - matchTime.getTime()) /
                                  (1000 * 60 * 60);

                                // If match is more than 2 hours overdue, show kick-off time but with postponed styling
                                if (hoursAgo > 2) {
                                  const localTime =
                                    matchTime.toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    });

                                  return (
                                    <div
                                      className="match-time-display text-orange-600"
                                      style={{ fontSize: "0.8em" }}
                                    >
                                      {localTime}
                                    </div>
                                  );
                                }

                                // Use simplified local time formatting for regular upcoming matches
                                const localTime = matchTime.toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  },
                                );

                                return (
                                  <div
                                    className="match-time-display"
                                    style={{ fontSize: "0.882em" }}
                                  >
                                    {status === "TBD" ? "TBD" : localTime}
                                  </div>
                                );
                              }

                              // Fallback for any unhandled status - show time or score if available
                              if (
                                fixture.goals.home !== null ||
                                fixture.goals.away !== null
                              ) {
                                return (
                                  <div className="match-score-display">
                                    <span className="score-number">
                                      {fixture.goals.home ?? 0}
                                    </span>
                                    <span className="score-separator">-</span>
                                    <span className="score-number">
                                      {fixture.goals.away ?? 0}
                                    </span>
                                  </div>
                                );
                              }

                              // Last resort - show match time
                              return (
                                <div
                                  className="match-time-display"
                                  style={{ fontSize: "0.882em" }}
                                >
                                  {formatMatchTimeWithTimezone(
                                    fixture.fixture.date,
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Away team logo */}
                          <div
                            className="away-team-logo-container"
                            style={{ padding: "0 0.5rem" }}
                          >
                            {fixture.league.id === 10 ? (
                              <MyCircularFlag
                                teamName={fixture.teams.away.name || ""}
                                teamId={fixture.teams.away.id}
                                fallbackUrl={
                                  fixture.teams.away.id
                                    ? `/api/team-logo/square/${fixture.teams.away.id}?size=32`
                                    : "/assets/fallback-logo.svg"
                                }
                                alt={fixture.teams.away.name}
                                size="34px"
                                className="popular-leagues-size"
                              />
                            ) : (
                              <MyWorldTeamLogo
                                teamName={fixture.teams.away.name}
                                teamLogo={
                                  fixture.teams.away.id
                                    ? `/api/team-logo/square/${fixture.teams.away.id}?size=32`
                                    : "/assets/fallback-logo.svg"
                                }
                                alt={fixture.teams.away.name}
                                size="34px"
                                className="popular-leagues-size"
                                leagueContext={leagueContext}
                              />
                            )}
                          </div>

                          {/* Away Team Name */}
                          <div
                            className={`away-team-name ${
                              fixture.goals.home !== null &&
                              fixture.goals.away !== null &&
                              fixture.goals.away > fixture.goals.home &&
                              ["FT", "AET", "PEN"].includes(
                                fixture.fixture.status.short,
                              )
                                ? "winner"
                                : ""
                            }`}
                            style={{
                              paddingLeft: "0.75rem",
                              textAlign: "left",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {(() => {
                              const originalName = fixture.teams.away.name || "";
                              const leagueInfo = {
                                name: fixture.league.name,
                                country: fixture.league.country,
                              };

                              try {
                                const translatedName = translateTeamName(originalName);
                                return shortenTeamName(translatedName) || "Unknown Team";
                              } catch (error) {
                                return shortenTeamName(originalName) || "Unknown Team";
                              }
                            })()}
                          </div>
                        </div>

                        {/* Bottom Grid: Penalty Result Status */}
                        <div className="match-penalty-bottom">
                          {(() => {
                            const isPenaltyMatch =
                              fixture.fixture.status.short === "PEN";
                            const penaltyHome = fixture.score?.penalty?.home;
                            const penaltyAway = fixture.score?.penalty?.away;
                            const hasPenaltyScores =
                              penaltyHome !== null &&
                              penaltyHome !== undefined &&
                              penaltyAway !== null &&
                              penaltyAway !== undefined;

                            if (isPenaltyMatch && hasPenaltyScores) {
                              const leagueInfo = {
                                name: fixture.league.name,
                                country: fixture.league.country,
                              };

                              // Translate penalty text similar to MyNewLeague2
                              const translatePenaltyText = (text: string) => {
                                let translatedText = text;

                                // Translation map for penalty-related phrases
                                const penaltyTranslations: Array<[string, { [key: string]: string }]> = [
                                  ['won on penalties', {
                                    'zh': '点球获胜',
                                    'zh-hk': 'PK大戰獲勝',
                                    'zh-tw': 'PK大戰獲勝',
                                    'es': 'ganó en penales',
                                    'de': 'gewann im Elfmeterschießen',
                                    'it': 'ha vinto ai rigori',
                                    'pt': 'venceu nos pênaltis'
                                  }],
                                  ['on penalties', {
                                    'zh': '点球',
                                    'zh-hk': 'PK大戰',
                                    'zh-tw': 'PK大戰',
                                    'es': 'en penales',
                                    'de': 'im Elfmeterschießen',
                                    'it': 'ai rigori',
                                    'pt': 'nos pênaltis'
                                  }]
                                ];

                                penaltyTranslations.forEach(([english, translations]) => {
                                  if (translations[currentLanguage]) {
                                    translatedText = translatedText.replace(english, translations[currentLanguage]);
                                  }
                                });

                                return translatedText;
                              };

                              const homeTeamTranslated = translateTeamName(fixture.teams.home.name);
                              const awayTeamTranslated = translateTeamName(fixture.teams.away.name);

                              const winnerText =
                                penaltyHome > penaltyAway
                                  ? `${shortenTeamName(homeTeamTranslated)} won ${penaltyHome}-${penaltyAway} on penalties`
                                  : `${shortenTeamName(awayTeamTranslated)} won ${penaltyAway}-${penaltyHome} on penalties`;

                              return (
                                <div className="penalty-result-display">
                                  <span
                                    className="penalty-winner"
                                    style={{ background: "transparent" }}
                                  >
                                    {translatePenaltyText(winnerText)}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TodayMatchByTime;