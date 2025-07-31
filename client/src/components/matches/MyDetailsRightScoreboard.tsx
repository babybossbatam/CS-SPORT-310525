import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, MapPin, Users, Star, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { User, Trophy } from "lucide-react";
import { format } from "date-fns";
import MyCircularFlag from "@/components/common/MyCircularFlag";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";
import { isNationalTeam } from "@/lib/teamLogoSources";
import MatchCountdownTimer from "./MatchCountdownTimer";
import MyMatchStats from "./MyMatchStats";
import MyHighlights from "./MyHighlights";

// Add CSS for cleaner pulse effect
const pulseStyles = `
  .status-live-elapsed {
    background-color: #ef4444;
    color: white;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px;
    animation: smoothPulse 2s infinite ease-in-out;
  }

  .status-halftime {
    background-color: #f97316;
    color: white;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px;
    animation: smoothPulse 2s infinite ease-in-out;
  }

  @keyframes smoothPulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1);
    }
  }
`;

interface MyDetailsRightScoreboardProps {
  match?: any;
  defaultMatch?: any;
  className?: string;
  onClose?: () => void;
  onMatchCardClick?: (match: any) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const MyDetailsRightScoreboard = ({
  match,
  defaultMatch,
  className = "",
  onClose,
  onMatchCardClick,
  activeTab: externalActiveTab,
  onTabChange,
}: MyDetailsRightScoreboardProps) => {

  // All hooks must be called before any conditional returns
  const [liveElapsed, setLiveElapsed] = useState<number | null>(null);
  const [liveScores, setLiveScores] = useState<{home: number | null, away: number | null} | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [currentMatchData, setCurrentMatchData] = useState<any | null>(null);
  const [internalActiveTab, setInternalActiveTab] = useState<string>("match");
  const activeTab = externalActiveTab || internalActiveTab;
  const [featuredMatches, setFeaturedMatches] = useState<any[]>([]);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  // Load starred matches from localStorage on component mount
  useEffect(() => {
    const savedStarredMatches = localStorage.getItem('starredMatches');
    if (savedStarredMatches) {
      try {
        const parsed = JSON.parse(savedStarredMatches);
        setStarredMatches(new Set(parsed));
      } catch (error) {
        console.error('Failed to parse starred matches from localStorage:', error);
      }
    }
  }, []);

  // Function to toggle starred matches
  const toggleStarMatch = (fixtureId: number) => {
    setStarredMatches(prev => {
      const newStarredMatches = new Set(prev);
      if (newStarredMatches.has(fixtureId)) {
        newStarredMatches.delete(fixtureId);
      } else {
        newStarredMatches.add(fixtureId);
      }
      
      // Save to localStorage
      localStorage.setItem('starredMatches', JSON.stringify(Array.from(newStarredMatches)));
      
      return newStarredMatches;
    });
  };

  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  // Fetch featured matches data
  useEffect(() => {
    const fetchFeaturedMatches = async () => {
      try {
        const response = await fetch('/api/fixtures/featured');
        if (response.ok) {
          const data = await response.json();
          setFeaturedMatches(data);
        }
      } catch (error) {
        console.error('Failed to fetch featured matches:', error);
      }
    };

    fetchFeaturedMatches();
  }, []);

  // Get the first featured match from MyHomeFeaturedMatchNew data
  const featuredMatch = featuredMatches.length > 0 ? featuredMatches[0] : null;

  // Use the passed match, defaultMatch, or featured match - no sample fallback
  const displayMatch = match || defaultMatch || featuredMatch;

  // Extract team data for passing to child components like MyHighlights
  const getTeamData = () => {
    if (!displayMatch) return null;
    return {
      homeTeamData: {
        id: displayMatch.teams.home.id,
        name: displayMatch.teams.home.name,
        logo: displayMatch.teams.home.logo
      },
      awayTeamData: {
        id: displayMatch.teams.away.id,
        name: displayMatch.teams.away.name,
        logo: displayMatch.teams.away.logo
      }
    };
  };

  const handleMatchCardClick = () => {
    if (!displayMatch) return;
    
    console.log("🎯 [MyDetailsRightScoreboard] Match card clicked:", {
      fixtureId: displayMatch?.fixture?.id,
      teams: `${displayMatch?.teams?.home?.name} vs ${displayMatch?.teams?.away?.name}`,
      league: displayMatch?.league?.name,
      status: displayMatch?.fixture?.status?.short,
      source: "MyDetailsRightScoreboard",
    });

    if (onMatchCardClick) {
      onMatchCardClick(displayMatch);
    }
  };

  // Early return if no match data is available - AFTER all hooks
  if (!displayMatch) {
    console.warn("🎯 [MyDetailsRightScoreboard] No match data available");
    return null;
  }

  // Debug: Log the match data being received
  console.log("🎯 [MyDetailsRightScoreboard] Received match data:", {
    hasMatch: !!match,
    hasFeaturedMatch: !!featuredMatch,
    fixtureId: displayMatch?.fixture?.id,
    teams: `${displayMatch?.teams?.home?.name} vs ${displayMatch?.teams?.away?.name}`,
    status: displayMatch?.fixture?.status?.short,
    league: displayMatch?.league?.name,
  });

  // State for real-time timer
  const [realTimeElapsed, setRealTimeElapsed] = useState<number | null>(null);

  // Simple state management without unnecessary memoization
  const [currentScores, setCurrentScores] = useState<{home: number, away: number} | null>(null);
  const [currentLiveStatus, setCurrentLiveStatus] = useState<string | null>(null);
  const [isMatchEnded, setIsMatchEnded] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'STATIC' | 'LIVE'>('STATIC');

  // Helper functions for live score updates
  const updateLiveScores = useCallback((newScores: {home: number | null, away: number | null}) => {
    setLiveScores(newScores);
    setCurrentScores({
      home: newScores.home || 0,
      away: newScores.away || 0
    });
  }, []);

  const updateCurrentLiveStatus = useCallback((status: string) => {
    setCurrentLiveStatus(status);
    setLiveStatus(status);
  }, []);

  // Real-time update effect for live matches with continuous timer
  useEffect(() => {
    if (!displayMatch) return;

    // Use current match data if available, otherwise fallback to passed data
    const matchToUse = currentMatchData || displayMatch;
    const status = matchToUse.fixture.status.short;
    const isLiveMatch = ["1H", "2H", "LIVE", "HT", "ET", "P"].includes(status);

    if (isLiveMatch) {
      // Initialize with current elapsed time from API
      const initialElapsed = displayMatch.fixture.status.elapsed || 0;
      setLiveElapsed(initialElapsed);
      setRealTimeElapsed(initialElapsed);

      console.log("🎯 [Live Timer] Initializing timer:", {
        fixtureId: displayMatch.fixture.id,
        status: status,
        initialElapsed: initialElapsed,
        teams: `${displayMatch.teams?.home?.name} vs ${displayMatch.teams?.away?.name}`
      });

      // Initialize with current scores
      setCurrentScores({
        home: displayMatch.goals.home,
        away: displayMatch.goals.away
      });
      // Initialize with current status
      setLiveStatus(displayMatch.fixture.status.short);

      console.log("🎯 [Live Timer] Starting real-time timer for match:", {
        fixtureId: displayMatch.fixture.id,
        teams: `${displayMatch.teams?.home?.name} vs ${displayMatch.teams?.away?.name}`,
        status: status,
        initialElapsed: initialElapsed,
      });

      // Real-time timer that increments every 2 minutes (reduced frequency)
      let realtimeTimer: NodeJS.Timeout | null = null;
      if (status !== "HT" && status !== "P") {
        realtimeTimer = setInterval(() => {
          setRealTimeElapsed(prev => {
            const newTime = (prev !== null ? prev : initialElapsed) + 2; // Increment by 2
            // Minimal logging to prevent spam
            if (newTime % 10 === 0) { // Log only every 10 minutes
              console.log("⏱️ [Timer] Update:", newTime, "min");
            }
            return newTime;
          });
        }, 120000); // Increment every 2 minutes instead of 1
      }

      // Fetch updated data from API every 5 minutes (much less aggressive)
      const apiSyncTimer = setInterval(async () => {
        try {
          const response = await fetch("/api/fixtures/live");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const liveFixtures = await response.json();
          // Minimal logging to prevent spam
          if (Math.random() < 0.1) { // Log only 10% of the time
            console.log("🔄 [Sync]:", liveFixtures.length, "fixtures");
          }

          // Find the current match in live fixtures
          const currentLiveMatch = liveFixtures.find(
            (fixture: any) => fixture.fixture.id === displayMatch.fixture.id,
          );

          if (currentLiveMatch) {
            const apiElapsed = currentLiveMatch.fixture.status.elapsed;

            // Sync real-time timer with API if there's a significant difference (reduced logging)
            if (apiElapsed !== null && Math.abs((realTimeElapsed || 0) - apiElapsed) > 3) {
              setRealTimeElapsed(apiElapsed);
              setLiveElapsed(apiElapsed);
            }

            // Update live scores
            if (currentLiveMatch.goals) {
              const liveMatchScores = {
                home: currentLiveMatch.goals.home,
                away: currentLiveMatch.goals.away
              };
              updateLiveScores(liveMatchScores);
            }

            // Update live status
            if (currentLiveMatch.fixture.status.short) {
              updateCurrentLiveStatus(currentLiveMatch.fixture.status.short);

              // Stop real-time timer if match is now in halftime or penalties
              if ((currentLiveMatch.fixture.status.short === "HT" || currentLiveMatch.fixture.status.short === "P") && realtimeTimer) {
                clearInterval(realtimeTimer);
                realtimeTimer = null;
              }

              // Restart real-time timer if match resumed from halftime
              if ((currentLiveMatch.fixture.status.short === "2H" || currentLiveMatch.fixture.status.short === "ET") && !realtimeTimer) {
                realtimeTimer = setInterval(() => {
                  setRealTimeElapsed(prev => prev !== null ? prev + 1 : 0);
                }, 60000);
              }
            }
          } else {
            console.log("❌ [Live Timer] Match not found in live fixtures - checking if ended");

            // Check if match has ended
            try {
              const specificMatchResponse = await fetch(`/api/fixtures/${displayMatch.fixture.id}`);
              if (specificMatchResponse.ok) {
                const specificMatchData = await specificMatchResponse.json();
                // If match has ended, stop all timers
                if (["FT", "AET", "PEN"].includes(specificMatchData.fixture?.status?.short || "")) {
                  if (realtimeTimer) clearInterval(realtimeTimer);
                  clearInterval(apiSyncTimer);
                  setRealTimeElapsed(null);
                  setLiveElapsed(null);
                }
              }
            } catch (specificError) {
              console.error("❌ [Live Timer] Failed to fetch specific match:", specificError);
            }
          }
        } catch (error) {
          console.error("❌ [Sync Error]:", error);
        }
      }, 300000); // Sync with API every 5 minutes (much less aggressive)

      return () => {
        console.log("🛑 [Live Timer] Cleaning up timers for match:", displayMatch.fixture.id);
        if (realtimeTimer) clearInterval(realtimeTimer);
        clearInterval(apiSyncTimer);
      };
    } else {
      setLiveElapsed(null);
      setRealTimeElapsed(null);
      setCurrentScores(null);
      setLiveStatus(null);
    }
  }, [
    displayMatch,
    displayMatch?.fixture?.status?.short,
    displayMatch?.fixture?.id,
    updateLiveScores,
    updateCurrentLiveStatus,
  ]);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMM dd, yyyy, h:mm:ss a");
    } catch (error) {
      return "Date TBD";
    }
  };

  const getStatusBadge = (status: string) => {
    // Always prioritize the actual match data status to avoid confusion
    const actualStatus = displayMatch.fixture.status.short;

    // Only use live status if it matches the actual status or is a valid progression
    let currentStatus = actualStatus;
    if (liveStatus || currentLiveStatus) {
      const liveStatusToUse = liveStatus || currentLiveStatus;
      // Validate that live status is a reasonable progression from actual status
      if (actualStatus === liveStatusToUse || 
          (actualStatus === "1H" && liveStatusToUse === "HT") ||
          (actualStatus === "HT" && liveStatusToUse === "2H") ||
          (actualStatus === "2H" && liveStatusToUse === "FT")) {
        currentStatus = liveStatusToUse;
      }
    }

    const isEndedMatch = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(currentStatus);

    // Check if it's a finished match and determine the appropriate label
    const getFinishedLabel = () => {
      if (!["FT", "AET", "PEN"].includes(currentStatus)) return "Finished";

      try {
        const matchDate = new Date(displayMatch.fixture.date);
        const now = new Date();
        const hoursElapsed =
          (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);

        // If finished less than 1 hour ago, show "Just Finished"
        return hoursElapsed <= 1 ? "Just Finished" : "Ended";
      } catch (error) {
        return "Ended";
      }
    };

    // For live matches, show elapsed time with pulse animation
    // But ensure match is not ended according to API
    const isLiveMatch = ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(currentStatus) && !isEndedMatch;
    if (isLiveMatch) {
      // Real-time calculation for live matches
      let displayText = "LIVE";
      const elapsed = liveElapsed !== null ? liveElapsed : displayMatch.fixture.status.elapsed;

      if (currentStatus === "HT") {
        displayText = "Halftime";
      } else if (currentStatus === "P") {
        displayText = "Penalties";
      } else if (currentStatus === "ET") {
        displayText = elapsed ? `${elapsed}' ET` : "Extra Time";
      } else {
                                // For LIVE, LIV, 1H, 2H - use validated elapsed time from the actual match data
                                // Priority: Use the passed match data elapsed time (most reliable source)
                                const validatedElapsed = displayMatch.fixture.status.elapsed;

                                // Only use real-time elapsed if it's reasonably close to API elapsed (within 5 minutes)
                                let currentElapsed = validatedElapsed;
                                if (realTimeElapsed !== null && validatedElapsed !== null) {
                                  const timeDiff = Math.abs(realTimeElapsed - validatedElapsed);
                                  if (timeDiff <= 5) { // Within 5 minutes tolerance
                                    currentElapsed = realTimeElapsed;
                                  }
                                }

                                console.log("🔄 [Live Display] Validated elapsed time:", {
                                  validatedElapsed,
                                  realTimeElapsed,
                                  currentElapsed,
                                  status: currentStatus,
                                  fixtureId: displayMatch.fixture.id
                                });

                                if (currentElapsed !== null && currentElapsed !== undefined && currentElapsed > 0) {
                                  displayText = `${currentElapsed}'`;
                                } else {
                                  displayText = "LIVE";
                                }
                              }

      return (
        <div className={`match-status-label mx-4 rounded-md ${currentStatus === "HT" ? "status-halftime" : "status-live-elapsed"}`}>
          {displayText}
        </div>
      );
    }

    const statusConfig = {
      NS: { label: "Upcoming", variant: "default" as const },
      FT: { label: getFinishedLabel(), variant: "default" as const },
      AET: { label: getFinishedLabel(), variant: "default" as const },
      PEN: { label: getFinishedLabel(), variant: "default" as const },
      HT: { label: "Half Time", variant: "outline" as const },
    };

    const config = statusConfig[currentStatus as keyof typeof statusConfig] || {
      label: currentStatus,
      variant: "default" as const,
    };

    // Apply gray color for finished matches and upcoming matches
    const isFinished = ["FT", "AET", "PEN"].includes(currentStatus);
    const isUpcoming = currentStatus === "NS";
    const badgeClassName = isFinished
      ? "bg-gray-500 text-white font-normal text-[11px]"
      : isUpcoming
        ? "bg-gray-500 text-white font-normal text-[11px]"
        : "";

    return (
      <Badge variant={config.variant} className={badgeClassName}>
        {config.label}
      </Badge>
    );
  };

  // Component now simply displays the passed match data without complex updates

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseStyles }} />
      <Card
        className={`w-full ${className} p-0 bg-gradient-to-br from-pink-50 via-orange-50 to-pink-50 relative transition-all duration-200 cursor-pointer hover:shadow-lg`}
        onClick={handleMatchCardClick}
      >
      {/* Star button on the left */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleStarMatch(displayMatch.fixture.id);
        }}
        className={`absolute top-2 left-2 w-6 h-6 flex items-center justify-center z-10 transition-colors duration-200 ${
          starredMatches.has(displayMatch.fixture.id)
            ? 'text-yellow-500 hover:text-yellow-600'
            : 'text-gray-500 hover:text-yellow-500'
        }`}
        aria-label="Add to favorites"
        title="Add to favorites"
      >
        <Star
          className={`w-4 h-4 ${
            starredMatches.has(displayMatch.fixture.id) ? 'fill-current' : ''
          }`}
        />
      </button>
      
      {/* Close button on the right */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 w-6 h-6 flex items-center justify-center z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <CardTitle className="text-md font-normal text-gray-900 text-center pt-2">
        {displayMatch.teams.home.name} vs {displayMatch.teams.away.name}
        <div className="text-xs text-gray-400 font-normal text-center">
          {displayMatch.league.country}, {displayMatch.league.name}
        </div>
      </CardTitle>
      <CardHeader className="text-center"></CardHeader>

      <CardContent className="p-0 m-0 ">
        {/* Teams Section for adjust top and bottom*/}
        <div className="flex items-center justify-between mb-4 -mt-6">
          {/* Home Team */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            {displayMatch.league.country === "World" ||
            displayMatch.league.country === "International" ? (
              <MyWorldTeamLogo
                teamName={displayMatch.teams.home.name}
                teamLogo={displayMatch.teams.home.logo}
                alt={displayMatch.teams.home.name}
                size="56px"
                leagueContext={{
                  name: displayMatch.league.name,
                  country: displayMatch.league.country,
                }}
              />
            ) : isNationalTeam(displayMatch.teams.home, displayMatch.league) ? (
              <MyCircularFlag
                teamName={displayMatch.teams.home.name}
                fallbackUrl={displayMatch.teams.home.logo}
                alt={displayMatch.teams.home.name}
                size="56px"
              />
            ) : (
              <img
                src={
                  displayMatch.teams.home.logo || "/assets/fallback-logo.png"
                }
                alt={displayMatch.teams.home.name}
                className="w-16 h-16 object-contain"
                style={{
                  filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))",
                }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/fallback-logo.png";
                }}
              />
            )}
            <span className="text-md font-medium text-center ">
              {displayMatch.teams.home.name}
            </span>
          </div>

          {/* Score/Time */}
          <div className="flex flex-col items-center space-y-1 px-4">
            {displayMatch.fixture.status.short === "NS" ? (
              <div className="text-center">
                <div className="text-3xl py-1 font-medium text-gray-700 -mt-10">
                  {(() => {
                    try {
                      const matchDate = new Date(displayMatch.fixture.date);
                      const today = new Date();
                      const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);

                      const matchDay = new Date(
                        matchDate.getFullYear(),
                        matchDate.getMonth(),
                        matchDate.getDate(),
                      );
                      const todayDay = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate(),
                      );
                      const tomorrowDay = new Date(
                        tomorrow.getFullYear(),
                        tomorrow.getMonth(),
                        tomorrow.getDate(),
                      );

                      // Check if match is today and less than 12 hours away
                      if (matchDay.getTime() === todayDay.getTime()) {
                        const hoursToMatch =
                          (matchDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60);

                        if (hoursToMatch > 0 && hoursToMatch <= 12) {
                          // Show countdown timer for matches within 12 hours
                          return (
                            <div className="flex flex-col items-center space-y-1">
                              <MatchCountdownTimer
                                matchDate={displayMatch.fixture.date}
                              />
                            </div>
                          );
                        } else {
                          return "Today";
                        }
                      } else if (matchDay.getTime() === tomorrowDay.getTime()) {
                        return "Tomorrow";
                      } else {
                        const diffTime =
                          matchDay.getTime() - todayDay.getTime();
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24),
                        );
                        if (diffDays > 1 && diffDays <= 7) {
                          return `${diffDays} days`;
                        } else {
                          return format(matchDate, "dd MMM");
                        }
                      }
                    } catch (error) {
                      return "Upcoming";
                    }
                  })()}
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  {(() => {
                    try {
                      const matchDate = new Date(displayMatch.fixture.date);
                      const today = new Date();
                      const matchDay = new Date(
                        matchDate.getFullYear(),
                        matchDate.getMonth(),
                        matchDate.getDate(),
                      );
                      const todayDay = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate(),
                      );

                      // Don't show time if countdown timer is displayed
                      if (matchDay.getTime() === todayDay.getTime()) {
                        const hoursToMatch =
                          (matchDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60);
                        if (hoursToMatch > 0 && hoursToMatch <= 12) {
                          return ""; // Hide time when countdown is shown
                        }
                      }

                      return format(matchDate, "HH:mm");
                    } catch (error) {
                      return "TBD";
                    }
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center mb-4">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {getStatusBadge(displayMatch.fixture.status.short)}
                </div>
                <div className="text-3xl font-semi-bold">
                  {`${displayMatch.goals?.home ?? 0} - ${displayMatch.goals?.away ?? 0}`}
                </div>
                <div className="text-sm text-gray-900 font-semi-bold">
                  {format(new Date(displayMatch.fixture.date), "dd/MM")}
                </div>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            {displayMatch.league.country === "World" ||
            displayMatch.league.country === "International" ? (
              <MyWorldTeamLogo
                teamName={displayMatch.teams.away.name}
                teamLogo={displayMatch.teams.away.logo}
                alt={displayMatch.teams.away.name}
                size="56px"
                leagueContext={{
                  name: displayMatch.league.name,
                  country: displayMatch.league.country,
                }}
              />
            ) : isNationalTeam(displayMatch.teams.away, displayMatch.league) ? (
              <MyCircularFlag
                teamName={displayMatch.teams.away.name}
                fallbackUrl={displayMatch.teams.away.logo}
                alt={displayMatch.teams.away.name}
                size="56px"
              />
            ) : (
              <img
                src={
                  displayMatch.teams.away.logo || "/assets/fallback-logo.png"
                }
                alt={displayMatch.teams.away.name}
                className="w-16 h-16 object-contain"
                style={{
                  filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))",
                }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/fallback-logo.png";
                }}
              />
            )}
            <span className="text-md font-medium text-center mb-4">
              {displayMatch.teams.away.name}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Navigation Tabs */}
      <Card>
        <div className="flex space-x-1 pb-0  px-0">
          <button className={`flex-0 py-0 px-4 text-sm font-normal ${activeTab === 'match' ? 'text-gray-600 border-b border-blue-500' : 'text-gray-500 hover:text-gray-700'} pb-0`}
          onClick={() => handleTabChange("match")}
          >
            Match
          </button>
          <button className={`flex-0 py-0 px-4 text-sm font-normal ${activeTab === 'lineups' ? 'text-gray-600 border-b border-blue-500' : 'text-gray-500 hover:text-gray-700'} pb-0`}
           onClick={() => handleTabChange("lineups")}
          >
            {displayMatch.fixture.status.short === "NS"
              ? "Probable Lineups"
              : "Lineups"}
          </button>
          <button  className={`flex-0 py-0 px-4 text-sm font-normal ${activeTab === 'stats' ? 'text-gray-600 border-b border-blue-500' : 'text-gray-500 hover:text-gray-700'} pb-0`}
           onClick={() => handleTabChange("stats")}
          >
            Stats
          </button>
          <button className={`flex-0 py-0 px-4 text-sm font-normal ${activeTab === 'trends' ? 'text-gray-600 border-b border-blue-500' : 'text-gray-500 hover:text-gray-700'} relative pb-0`}
           onClick={() => handleTabChange("trends")}
          >
            Trends
          </button>
          <button  className={`flex-0 py-0 px-4 text-sm font-normal ${activeTab === 'h2h' ? 'text-gray-600 border-b border-blue-500' : 'text-gray-500 hover:text-gray-700'} pb-0`}
           onClick={() => handleTabChange("h2h")}
          >
            Head to Head
          </button>
          {activeTab === 'highlights' && (
              <MyHighlights
                match={displayMatch}
                matchStatus={liveStatus || displayMatch?.fixture?.status?.short}
                homeTeamData={getTeamData().homeTeamData}
                awayTeamData={getTeamData().awayTeamData}
              />
            )}
        </div>
      </Card>

      {/* Tab content will be rendered by parent component */}

      </Card>
    </>
  );
};

export default MyDetailsRightScoreboard;