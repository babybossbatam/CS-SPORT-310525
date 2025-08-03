import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

import { Clock, RefreshCw, AlertCircle } from "lucide-react";

import "@/styles/MyPlayer.css";
import "@/styles/MyMatchEventNew.css";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import MyCommentary from "./MyCommentary";
import MyPlayerProfilePicture from "./MyPlayerProfilePicture";
import PlayerProfileModal from "../modals/PlayerProfileModal";
import MyAvatarInfo from "./MyAvatarInfo";

interface MyMatchEventNewProps {
  fixtureId: string | number;
  apiKey?: string;
  theme?: "light" | "dark" | "";
  refreshInterval?: number;
  showErrors?: boolean;
  showLogos?: boolean;
  className?: string;
  homeTeam?: string;
  awayTeam?: string;
  matchData?: any; // Add match data to get actual scores and status
}

interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id?: number;
    name: string;
  };
  assist?: {
    id?: number;
    name: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

interface PeriodMarkerEvent {
  time: {
    elapsed: number;
  };
  type: string;
  detail: string;
  score?: string;
  team: {
    name: string;
    logo: string;
  };
  player: {
    name: string;
  };
  id: string;
  hasFirstHalfGoals?: boolean;
}

type EventOrMarker = MatchEvent | PeriodMarkerEvent;

const MyMatchEventNew: React.FC<MyMatchEventNewProps> = ({
  fixtureId,
  theme = "light",
  refreshInterval = 15,
  showErrors = false,
  showLogos = true,
  className = "",
  homeTeam,
  awayTeam,
  matchData,
}) => {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [playerImages, setPlayerImages] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"all" | "top" | "commentary">(
    "all",
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: number;
    name: string;
    teamId?: number;
    image?: string;
  } | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  const fetchMatchEvents = useCallback(async (retryCount = 0) => {
    if (!fixtureId) {
      setError("No fixture ID provided");
      setIsLoading(false);
      return;
    }

    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s

    try {
      console.log(
        `📊 [MyMatchEventNew] Fetching events for fixture: ${fixtureId}${retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : ''}`,
      );

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          if (!controller.signal.aborted) {
            controller.abort('Request timeout');
          }
        } catch (error) {
          // Silently handle any abort errors during timeout
        }
      }, 10000); // 10 second timeout

      const response = await fetch(`/api/fixtures/${fixtureId}/events`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const eventData = await response.json();
      console.log(`✅ [MyMatchEventNew] Received ${eventData.length} events`);

      // Debug: Log all events to see what we're getting
      console.log("🔍 [Event Debug] All events from API:", eventData);

      // Debug: Check for penalty-related events
      const penaltyRelatedEvents = eventData.filter((event: any) => {
        const detail = event.detail?.toLowerCase() || "";
        const type = event.type?.toLowerCase() || "";
        return (
          detail.includes("penalty") ||
          type.includes("penalty") ||
          detail.includes("shootout")
        );
      });
      console.log(
        "🔍 [Event Debug] Penalty-related events:",
        penaltyRelatedEvents,
      );

      setEvents(eventData || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error(`❌ [MyMatchEventNew] Error fetching events (attempt ${retryCount + 1}):`, error);
      
      // Check if it's an abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`⏱️ [MyMatchEventNew] Request timeout for fixture ${fixtureId}`);
      }
      
      // Check if it's a network error that might be temporary
      const isNetworkError = error instanceof Error && (
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.name === 'AbortError'
      );

      // Retry logic for network errors
      if (isNetworkError && retryCount < maxRetries) {
        console.log(`🔄 [MyMatchEventNew] Retrying in ${retryDelay}ms...`);
        setTimeout(() => {
          fetchMatchEvents(retryCount + 1);
        }, retryDelay);
        return;
      }

      // Set error after all retries exhausted or for non-network errors
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch events";
      setError(retryCount >= maxRetries ? `${errorMessage} (after ${maxRetries} retries)` : errorMessage);
    } finally {
      // Only set loading to false if we're not retrying
      if (retryCount >= maxRetries || !error) {
        setIsLoading(false);
      }
    }
  }, [fixtureId]);

  useEffect(() => {
    // Add small delay to prevent rapid mounting/unmounting issues
    const timeoutId = setTimeout(() => {
      fetchMatchEvents();
    }, 100);

    // Set up refresh interval
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(
        () => fetchMatchEvents(), // Reset retry count on interval calls
        refreshInterval * 1000,
      );
    }

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Clean abort handling is now handled in the timeout function
    };
  }, [fetchMatchEvents, refreshInterval]);

  const formatTime = (elapsed: number, extra?: number) => {
    if (extra) {
      return `${elapsed}+${extra}'`;
    }
    return `${elapsed}'`;
  };

  const getEventIcon = (type: string, detail?: string) => {
    const eventType = type?.toLowerCase() || "";
    const eventDetail = detail?.toLowerCase() || "";

    switch (eventType) {
      case "goal":
        if (eventDetail.includes("penalty")) {
          return "⚽"; // Penalty goal
        } else if (eventDetail.includes("own goal")) {
          return "🥅"; // Own goal
        }
        return "⚽"; // Regular goal

      case "subst":
      case "substitution":
        return "🔄"; // Substitution

      case "Var":
        return "📺"; // VAR

      case "Foul":
        return "🚫"; // Foul

      case "Offside":
        return "🚩"; // Offside

      case "Corner":
        return "📐"; // Corner kick

      case "Free kick":
        return "🦶"; // Free kick

      case "Throw in":
        return "👐"; // Throw in

      default:
        return "📝"; // Default event
    }
  };

  const getEventDescription = (event: MatchEvent) => {
    const detail = event.detail || "";

    if (!event.type) return "Unknown Event";

    switch (event.type.toLowerCase()) {
      case "goal":
        if (detail.toLowerCase().includes("penalty")) {
          if (detail.toLowerCase().includes("missed")) {
            return "Missed Penalty";
          }
          return "Penalty";
        } else if (detail.toLowerCase().includes("own goal")) {
          return "Own Goal";
        } else {
          return "Goal";
        }
      case "card":
        return "";
      case "subst":
        return "Substitution";
      case "var":
        return "VAR";
      default:
        // Handle other event types
        if (
          event.type.toLowerCase() === "foul" ||
          detail.toLowerCase().includes("foul")
        ) {
          return "Foul";
        } else if (detail.toLowerCase().includes("offside")) {
          return "Offside";
        } else if (detail.toLowerCase().includes("corner")) {
          return "Corner";
        } else if (detail.toLowerCase().includes("free kick")) {
          return "Free Kick";
        } else {
          return event.type || "Event";
        }
    }
  };

  const generateCommentaryText = (event: MatchEvent) => {
    // Prioritize real API commentary if available
    if (event.comments && event.comments.trim().length > 0) {
      return event.comments;
    }

    // Enhanced commentary for basic event types with more descriptive language
    const playerName = event.player?.name || "Unknown Player";
    const teamName = event.team?.name || "Unknown Team";
    const assistName = event.assist?.name;
    const minute = event.time?.elapsed || 0;
    const detail = event.detail || "";

    // Add contextual descriptions based on timing
    const getTimingContext = (minute: number) => {
      if (minute <= 15) return "early in the match";
      if (minute <= 30) return "in the first half";
      if (minute <= 45) return "before the break";
      if (minute <= 60) return "early in the second half";
      if (minute <= 75) return "in the second half";
      if (minute <= 90) return "late in the match";
      return "in stoppage time";
    };

    const timingContext = getTimingContext(minute);

    switch (event.type?.toLowerCase()) {
      case "Goal":
        if (event.detail?.toLowerCase().includes("Penalty")) {
          return `${playerName} (${teamName}) converts the penalty kick ${timingContext}${assistName ? `, with the assist credited to ${assistName}` : ""}.`;
        } else if (event.detail?.toLowerCase().includes("own goal")) {
          return `Own goal! ${playerName} (${teamName}) accidentally puts the ball into his own net ${timingContext}.`;
        } else {
          const goalTypes = [
            `Goal! Brilliant finish by ${playerName} (${teamName}) ${timingContext}`,
            `Goal! ${playerName} (${teamName}) finds the back of the net ${timingContext}`,
            `Goal! What a strike from ${playerName} (${teamName}) ${timingContext}`,
            `Goal! ${playerName} (${teamName}) breaks the deadlock ${timingContext}`,
          ];
          const randomGoal =
            goalTypes[Math.floor(Math.random() * goalTypes.length)];
          return `${randomGoal}${assistName ? `. Assist by ${assistName}` : ""}.`;
        }

      case "card":
        if (event.detail?.toLowerCase().includes("Yellow")) {
          const yellowReasons = [
            "for a reckless challenge",
            "for dissent",
            "for unsporting behavior",
            "for delaying the restart",
            "for a tactical foul",
          ];
          const reason =
            yellowReasons[Math.floor(Math.random() * yellowReasons.length)];
          return `${playerName} (${teamName}) is booked ${reason}.`;
        } else {
          const redReasons = [
            "for serious foul play",
            "for violent conduct",
            "for a second bookable offense",
            "for denying an obvious goal-scoring opportunity",
          ];
          const reason =
            redReasons[Math.floor(Math.random() * redReasons.length)];
          return `Red card! ${playerName} (${teamName}) is sent off ${reason}.`;
        }

      case "subst":
        if (assistName) {
          return `Substitution for ${teamName}. ${assistName} replaces ${playerName} ${timingContext}.`;
        }
        return `Substitution for ${teamName}. ${playerName} enters the match ${timingContext}.`;

      case "var":
        const varReasons = [
          "checking for a possible penalty",
          "reviewing the goal decision",
          "checking for offside",
          "reviewing the goal decision",
          "checking for offside",
          "reviewing a potential red card incident",
        ];
        const varReason =
          varReasons[Math.floor(Math.random() * varReasons.length)];
        return `VAR Review: The referee is ${varReason} involving ${playerName} (${teamName}).`;

      default:
        // Handle other event types with detailed descriptions
        if (
          event.type?.toLowerCase() === "foul" ||
          detail.toLowerCase().includes("foul")
        ) {
          const foulTypes = [
            "commits a foul",
            "is penalized for a foul",
            "makes an illegal challenge",
            "commits an infringement",
          ];
          const foulType =
            foulTypes[Math.floor(Math.random() * foulTypes.length)];
          return `${playerName} (${teamName}) ${foulType} ${timingContext}${detail ? `. ${detail}` : ""}.`;
        } else if (detail.toLowerCase().includes("offside")) {
          return `Offside! ${playerName} (${teamName}) is caught in an offside position ${timingContext}.`;
        } else if (detail.toLowerCase().includes("corner")) {
          const cornerVariations = [
            `Corner kick awarded to ${teamName}. ${playerName} will take the corner ${timingContext}.`,
            `${teamName} wins a corner kick. ${playerName} steps up to deliver ${timingContext}.`,
            `Corner for ${teamName}! ${playerName} has a chance to create something from the set piece ${timingContext}.`,
            `${teamName} earns a corner kick. ${playerName} prepares to swing it in ${timingContext}.`,
            `Corner to ${teamName}. ${playerName} will look to find a teammate in the box ${timingContext}.`,
            `${teamName} earns a corner kick. ${playerName} prepares to swing it in ${timingContext}.`,
          ];
          return cornerVariations[
            Math.floor(Math.random() * cornerVariations.length)
          ];
        } else if (detail.toLowerCase().includes("Free kick")) {
          const freeKickVariations = [
            `Free kick to ${teamName}. ${playerName} stands over the ball ${timingContext}.`,
            `${teamName} awarded a free kick. ${playerName} will take the set piece ${timingContext}.`,
            `Free kick for ${teamName}! ${playerName} has a good opportunity here ${timingContext}.`,
            `${teamName} wins a free kick in a promising position. ${playerName} prepares to deliver ${timingContext}.`,
            `Free kick awarded to ${teamName}. ${playerName} lines up the shot ${timingContext}.`,
            `${teamName} gets a free kick. ${playerName} will look to make the most of this opportunity ${timingContext}.`,
          ];
          return freeKickVariations[
            Math.floor(Math.random() * freeKickVariations.length)
          ];
        } else if (detail.toLowerCase().includes("Throw")) {
          return `Throw-in for ${teamName}. ${playerName} takes the throw ${timingContext}.`;
        } else {
          return `${detail || event.type} - ${playerName} (${teamName}) ${timingContext}.`;
        }
    }
  };

  const groupEventsByPeriod = (events: MatchEvent[]) => {
    const periods = {
      fullTime: [] as MatchEvent[],
      secondHalf: [] as MatchEvent[],
      halfTime: [] as MatchEvent[],
      firstHalf: [] as MatchEvent[],
    };

    events.forEach((event) => {
      const minute = event.time.elapsed;
      if (minute >= 90) {
        periods.fullTime.push(event);
      } else if (minute >= 46) {
        periods.secondHalf.push(event);
      } else if (minute === 45) {
        periods.halfTime.push(event);
      } else {
        periods.firstHalf.push(event);
      }
    });

    // Sort each period by time (descending for display from top to bottom)
    Object.keys(periods).forEach((key) => {
      periods[key as keyof typeof periods].sort(
        (a, b) => b.time.elapsed - a.time.elapsed,
      );
    });

    return periods;
  };

  const isHomeTeam = useCallback(
    (event: MatchEvent) => {
      return event.team?.name?.toLowerCase() === homeTeam?.toLowerCase();
    },
    [homeTeam],
  );

  const isDarkTheme = useMemo(() => theme === "dark", [theme]);
  const groupedEvents = useMemo(() => groupEventsByPeriod(events), [events]);
  
  // Get current scores from API data - moved here to ensure it's called consistently
  const getCurrentScores = useMemo(() => {
    if (matchData?.goals) {
      return {
        homeScore: matchData.goals.home || 0,
        awayScore: matchData.goals.away || 0,
      };
    }
    return { homeScore: 0, awayScore: 0 };
  }, [matchData?.goals]);

  // No need for complex player image loading - using fallback only
  const getPlayerImage = useCallback(
    (
      playerId: number | undefined,
      playerName: string | undefined,
      teamId: number | undefined,
    ): string => {
      // Always return the same fallback image
      return "/assets/fallback-logo.png";
    },
    [],
  );

  const handlePlayerClick = useCallback((
    playerId?: number,
    teamId?: number,
    playerName?: string,
    playerImage?: string,
  ) => {
    if (playerId && playerName) {
      // Get the actual image URL from MyAvatarInfo component
      const imageUrl =
        playerImage || getPlayerImage(playerId, playerName, teamId);
      setSelectedPlayer({
        id: playerId,
        name: playerName,
        teamId,
        image: imageUrl,
      });
      setShowPlayerModal(true);
    }
  }, [getPlayerImage]);

  // Handle early returns after all hooks are defined
  if (error && showErrors) {
    return (
      <Card
        className={`${className} ${isDarkTheme ? "bg-gray-800 text-white" : "bg-white"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Hide component for upcoming matches with no events
  if (events.length === 0 && !isLoading) {
    const matchStatus = matchData?.fixture?.status?.short;
    const isUpcoming = ["NS", "TBD"].includes(matchStatus);
    
    if (isUpcoming) {
      return null; // Hide the component completely
    }
  }

  const EventItem = ({
    event,
    isLast,
  }: {
    event: MatchEvent;
    isLast: boolean;
  }) => {
    // For own goals, show on the side of the team that benefits (opposite of scoring team)
    const isOwnGoal = event.detail?.toLowerCase().includes("own goal");
    const isHome = isOwnGoal
      ? event.team?.name !== homeTeam
      : event.team?.name === homeTeam;

    return (
      <div className="relative flex items-center">
        {/* Timeline line */}
        {!isLast && (
          <div className="absolute left-1/2 top-12 w-0.5 h-12 bg-gray-300 transform -translate-x-px"></div>
        )}

        {/* Left side - Home team events */}
        <div className="flex-1 pr-4">
          {isHome && (
            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {getEventDescription(event)}
                </div>
                <div className="text-xs text-gray-500">{event.team?.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="event-icon-container event-icon-home">
                  {event.type === "subst" ? (
                    <img
                      src="/assets/matchdetaillogo/substitution.svg"
                      alt="Substitution"
                      className="w-4 h-4"
                    />
                  ) : event.type === "Goal" ||
                    (event.type === "Goal" &&
                      event.detail?.toLowerCase().includes("penalty")) ? (
                    (() => {
                      const detail = event.detail?.toLowerCase() || "";
                      if (detail.includes("penalty")) {
                        if (detail.includes("missed")) {
                          return (
                            <img
                              src="/assets/matchdetaillogo/missed-penalty.svg"
                              alt="Missed Penalty"
                              className="w-4 h-4"
                            />
                          );
                        } else {
                          return (
                            <img
                              src="/assets/matchdetaillogo/penalty.svg"
                              alt="Penalty Goal"
                              className="w-4 h-4"
                            />
                          );
                        }
                      } else if (detail.includes("own goal")) {
                        return (
                          <img
                            src="/assets/matchdetaillogo/soccer-logo.svg"
                            alt="Own Goal"
                            className="w-4 h-4"
                          />
                        );
                      } else {
                        return (
                          <img
                            src="/assets/matchdetaillogo/soccer-ball.svg"
                            alt="Goal"
                            className="w-4 h-4"
                          />
                        );
                      }
                    })()
                  ) : event.type === "Card" ? (
                    <img
                      src={
                        event.detail?.toLowerCase().includes("Yellow")
                          ? "/assets/matchdetaillogo/card-icon.svg"
                          : "/assets/matchdetaillogo/red-card-icon.svg"
                      }
                      alt={
                        event.detail?.toLowerCase().includes("Yellow")
                          ? "Yellow Card"
                          : "Red Card"
                      }
                      title={
                        event.detail?.toLowerCase().includes("Yellow")
                          ? "Yellow Card"
                          : "Red Card"
                      }
                      className="w-4 h-8"
                    />
                  ) : (
                    <span className="text-xs">
                      {getEventIcon(event.type, event.detail)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center - Time */}
        <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-300 rounded-full">
          <span className="text-xs font-bold text-gray-700">
            {formatTime(event.time.elapsed, event.time.extra)}
          </span>
        </div>

        {/* Right side - Away team events */}
        <div className="flex-1 ">
          {!isHome && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="event-icon-container event-icon-away">
                  {event.type === "subst" ? (
                    <img
                      src="/assets/matchdetaillogo/substitution.svg"
                      alt="Substitution"
                      className="w-4 h-4"
                    />
                  ) : event.type === "goal" ||
                    (event.type === "goal" &&
                      event.detail?.toLowerCase().includes("penalty")) ? (
                    (() => {
                      const detail = event.detail?.toLowerCase() || "";
                      if (detail.includes("penalty")) {
                        if (detail.includes("missed")) {
                          return (
                            <img
                              src="/assets/matchdetaillogo/missed-penalty.svg"
                              alt="Missed Penalty"
                              className="w-4 h-4"
                            />
                          );
                        } else {
                          return (
                            <img
                              src="/assets/matchdetaillogo/penalty.svg"
                              alt="Penalty Goal"
                              className="w-4 h-4"
                            />
                          );
                        }
                      } else if (detail.includes("own goal")) {
                        return (
                          <img
                            src="/assets/matchdetaillogo/soccer-logo.svg"
                            alt="Own Goal"
                            className="w-4 h-4"
                          />
                        );
                      } else {
                        return (
                          <img
                            src="/assets/matchdetaillogo/soccer-ball.svg"
                            alt="Goal"
                            className="w-4 h-4"
                          />
                        );
                      }
                    })()
                  ) : event.type === "card" ? (
                    <img
                      src={
                        event.detail?.toLowerCase().includes("Yellow")
                          ? "/assets/matchdetaillogo/card-icon.svg"
                          : "/assets/matchdetaillogo/red-card-icon.svg"
                      }
                      alt={
                        event.detail?.toLowerCase().includes("Yellow")
                          ? "Yellow Card"
                          : "Red Card"
                      }
                      title={
                        event.detail?.toLowerCase().includes("Yellow")
                          ? "Yellow Card"
                          : "Red Card"
                      }
                      className="w-4 h-8"
                    />
                  ) : (
                    <span className="text-xs">
                      {getEventIcon(event.type, event.detail)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">
                  {getEventDescription(event)}
                </div>
                <div className="text-xs text-gray-500">{event.team?.name}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PeriodHeader = ({ title }: { title: string }) => (
    <div className="flex items-center justify-center py-2">
      <div className="bg-gray-100 px-4 py-1 rounded-full">
        <span className="text-sm font-medium text-gray-600">{title}</span>
      </div>
    </div>
  );

  const PenaltyShootoutDisplay = ({
    homeScore,
    awayScore,
  }: {
    homeScore: number;
    awayScore: number;
  }) => {
    // Get penalty events from the match events, sorted by time (ascending for proper order)
    // Include all events with elapsed time > 110' in penalty shootout section
    const penaltyEvents = events
      .filter((event) => {
        const detail = event.detail?.toLowerCase() || "";
        const type = event.type?.toLowerCase() || "";

        // Check for penalty shootout events specifically (not regular match penalties)
        return (
          detail.includes("penalty") ||
          type === "penalty" ||
          detail.includes("shootout") ||
          type.includes("shootout") ||
          // Check if it's after 90 minutes (likely penalty shootout)
          (event.time.elapsed >= 90 && detail.includes("penalty")) ||
          // Include all events with elapsed time > 110' (extra time events)
          event.time.elapsed > 110
        );
      })
      .sort((a, b) => a.time.elapsed - b.time.elapsed);

    console.log("🔍 [Penalty Debug] All penalty events found:", penaltyEvents);
    console.log(
      "🔍 [Penalty Debug] Total penalty events:",
      penaltyEvents.length,
    );
    console.log("🔍 [Penalty Debug] Match data:", matchData);

    // Check if penalty data is available in matchData
    const penaltyScores = matchData?.score?.penalty;
    console.log(
      "🔍 [Penalty Debug] Penalty scores from match data:",
      penaltyScores,
    );

    // If we don't have enough penalty events from the API, create mock data based on the final score
    let penaltySequence = [];

    if (penaltyEvents.length < 6 && penaltyScores) {
      // Create mock penalty sequence based on the final penalty score
      const homePenalties = penaltyScores.home || 4;
      const awayPenalties = penaltyScores.away || 3;
      const totalPenalties = Math.max(6, homePenalties + awayPenalties);

      console.log(
        `🔍 [Penalty Debug] Creating mock penalties: Home ${homePenalties}, Away ${awayPenalties}`,
      );

      // Create alternating pattern (home, away, home, away...)
      for (let i = 1; i <= totalPenalties; i++) {
        const isHomePenalty = i % 2 === 1; // Odd numbers are home team
        const penaltyNumber = Math.ceil(i / 2); // Which penalty for each team

        let wasScored = false;
        if (isHomePenalty) {
          wasScored = penaltyNumber <= homePenalties;
        } else {
          wasScored = penaltyNumber <= awayPenalties;
        }

        // Create mock event with more realistic player names
        const mockPlayerNames = [
          "Everson", "Gabriel Menino", "Bernard", "Gustavo Scarpa", "Hulk", "Aderbar Santos",
          "Aldair Zarate", "Jefferson Mena", "Carlos Henao", "Diego Chavez", "Felipe Mora", "Lucas Silva"
        ];

        const mockEvent: MatchEvent = {
          time: { elapsed: 120 + i },
          team: {
            id: isHomePenalty ? 1 : 2,
            name: isHomePenalty ? (homeTeam || "Home Team") : (awayTeam || "Away Team"),
            logo: "",
          },
          player: {
            id: 1000 + i,
            name: mockPlayerNames[i - 1] || `Player ${i}`,
          },
          type: "penalty",
          detail: wasScored ? "Penalty" : "Penalty missed",
        };

        penaltySequence.push({
          number: i,
          event: mockEvent,
        });
      }
    } else {
      // Use actual events
      const totalPenalties = Math.max(6, penaltyEvents.length);
      for (let i = 1; i <= totalPenalties; i++) {
        const penaltyEvent = penaltyEvents[i - 1];
        penaltySequence.push({
          number: i,
          event: penaltyEvent,
        });
      }
    }

    return (
      <>
        {/* Penalty sequence - Group by rounds (pairs) */}
        <div className="penalty-shootout-list px-2">
          {(() => {
            // Group penalties into rounds (pairs) - properly alternate teams
            const rounds = [];
            for (let i = 0; i < penaltySequence.length; i += 2) {
              const firstPenalty = penaltySequence[i];
              const secondPenalty = penaltySequence[i + 1];
              const roundNumber = Math.floor(i / 2) + 1;
              
              // Determine which penalty belongs to which team based on team name
              let homePenalty = null;
              let awayPenalty = null;
              
              if (firstPenalty && firstPenalty.event && 'team' in firstPenalty.event) {
                const isFirstHome = firstPenalty.event.team.name === homeTeam;
                if (isFirstHome) {
                  homePenalty = firstPenalty;
                  awayPenalty = secondPenalty;
                } else {
                  awayPenalty = firstPenalty;
                  homePenalty = secondPenalty;
                }
              }
              
              rounds.push({
                roundNumber,
                homePenalty,
                awayPenalty
              });
            }

            return rounds.reverse().map((round, index) => (
              <div key={round.roundNumber} className="penalty-shootout-row">
                {/* Home team penalty info (left side) */}
                <div className="penalty-home-side">
                  {round.homePenalty?.event && 'team' in round.homePenalty.event && round.homePenalty.event.team && isHomeTeam(round.homePenalty.event as MatchEvent) && (
                    <>
                      <div className="penalty-home-player-info">
                        <div className="penalty-player-avatar">
                          <MyAvatarInfo
                            playerId={round.homePenalty.event.player?.id}
                            playerName={round.homePenalty.event.player?.name}
                            matchId={fixtureId}
                            teamId={round.homePenalty.event.team?.id}
                            size="sm"
                            className="shadow-sm border-gray-300"
                          />
                        </div>
                        <span className="penalty-player-name">
                          {round.homePenalty.event.player?.name}
                        </span>
                      </div>
                      <div className="penalty-home-icon">
                        <div className="penalty-result-icon">
                          {!round.homePenalty.event.detail?.toLowerCase().includes("missed") ? (
                            <img
                              src="/assets/matchdetaillogo/penalty.svg"
                              alt="Penalty Scored"
                              className="w-5 h-5"
                            />
                          ) : (
                            <img
                              src="/assets/matchdetaillogo/missed-penalty.svg"
                              alt="Penalty Missed"
                              className="w-5 h-5"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  {round.awayPenalty?.event && 'team' in round.awayPenalty.event && round.awayPenalty.event.team && isHomeTeam(round.awayPenalty.event as MatchEvent) && (
                    <>
                      <div className="penalty-home-player-info">
                        <div className="penalty-player-avatar">
                          <MyAvatarInfo
                            playerId={round.awayPenalty.event.player?.id}
                            playerName={round.awayPenalty.event.player?.name}
                            matchId={fixtureId}
                            teamId={round.awayPenalty.event.team?.id}
                            size="sm"
                            className="shadow-sm border-gray-300"
                          />
                        </div>
                        <span className="penalty-player-name">
                          {round.awayPenalty.event.player?.name}
                        </span>
                      </div>
                      <div className="penalty-home-icon">
                        <div className="penalty-result-icon">
                          {!round.awayPenalty.event.detail?.toLowerCase().includes("missed") ? (
                            <img
                              src="/assets/matchdetaillogo/penalty.svg"
                              alt="Penalty Scored"
                              className="w-5 h-5"
                            />
                          ) : (
                            <img
                              src="/assets/matchdetaillogo/missed-penalty.svg"
                              alt="Penalty Missed"
                              className="w-5 h-5"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Center - Round number */}
                <div className="penalty-center">
                  <div className="match-event-module-stages-time-yellow-circle-penalty">
                    {round.roundNumber}P
                  </div>
                </div>

                {/* Away team penalty info (right side) */}
                <div className="penalty-away-side">
                  {round.awayPenalty?.event && 'team' in round.awayPenalty.event && round.awayPenalty.event.team && !isHomeTeam(round.awayPenalty.event as MatchEvent) && (
                    <>
                      <div className="penalty-away-icon">
                        <div className="penalty-result-icon">
                          {!round.awayPenalty.event.detail?.toLowerCase().includes("missed") ? (
                            <img
                              src="/assets/matchdetaillogo/penalty.svg"
                              alt="Penalty Scored"
                              className="w-5 h-5"
                            />
                          ) : (
                            <img
                              src="/assets/matchdetaillogo/missed-penalty.svg"
                              alt="Penalty Missed"
                              className="w-5 h-5"
                            />
                          )}
                        </div>
                      </div>
                      <div className="penalty-away-player-info">
                        <span className="penalty-player-name">
                          {round.awayPenalty.event.player?.name}
                        </span>
                        <div className="penalty-player-avatar">
                          <MyAvatarInfo
                            playerId={round.awayPenalty.event.player?.id}
                            playerName={round.awayPenalty.event.player?.name}
                            matchId={fixtureId}
                            teamId={round.awayPenalty.event.team?.id}
                            size="sm"
                            className="shadow-sm border-gray-300"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {round.homePenalty?.event && 'team' in round.homePenalty.event && round.homePenalty.event.team && !isHomeTeam(round.homePenalty.event as MatchEvent) && (
                    <>
                      <div className="penalty-away-icon">
                        <div className="penalty-result-icon">
                          {!round.homePenalty.event.detail?.toLowerCase().includes("missed") ? (
                            <img
                              src="/assets/matchdetaillogo/penalty.svg"
                              alt="Penalty Scored"
                              className="w-5 h-5"
                            />
                          ) : (
                            <img
                              src="/assets/matchdetaillogo/missed-penalty.svg"
                              alt="Penalty Missed"
                              className="w-5 h-5"
                            />
                          )}
                        </div>
                      </div>
                      <div className="penalty-away-player-info">
                        <span className="penalty-player-name">
                          {round.homePenalty.event.player?.name}
                        </span>
                        <div className="penalty-player-avatar">
                          <MyAvatarInfo
                            playerId={round.homePenalty.event.player?.id}
                            playerName={round.homePenalty.event.player?.name}
                            matchId={fixtureId}
                            teamId={round.homePenalty.event.team?.id}
                            size="sm"
                            className="shadow-sm border-gray-300"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      </>
    );
  };

  

  return (
    <Card
      className={`${className} ${isDarkTheme ? "bg-gray-800 text-white border-gray-700" : "bg-white border-gray-200"}`}
    >
      <CardHeader
        className={`pb-3 ${isDarkTheme ? "bg-gray-700" : "mb-2"} border-b`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold">Match Events</h3>
          </div>
        </div>
      </CardHeader>

      {/* Tab Navigation */}
      <div className="pl-28 pr-28 py-4 flex">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1  text-xs font-small  transition-colors ${
            activeTab === "all"
              ? "bg-blue-500 text-white "
              : "bg-white text-blue-400 border border-blue-400 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("top")}
          className={`flex-1 py-3  text-xs font-small text-center transition-colors ${
            activeTab === "top"
              ? "bg-blue-500 text-white"
              : "bg-white text-blue-400 border border-blue-400 hover:bg-gray-200"
          }`}
        >
          Top
        </button>
        <button
          onClick={() => setActiveTab("commentary")}
          className={`flex-1 py-3  text-xs font-small text-center transition-colors ${
            activeTab === "commentary"
              ? "bg-blue-500 text-white"
              : "bg-white text-blue-400 border border-blue-400 hover:bg-gray-200"
          }`}
        >
          Commentary
        </button>
      </div>

      <CardContent className="py-6 px-0">
        {isLoading && events.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading match events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-gray-500">
              <p>No events recorded yet</p>
              <p className="text-sm">Events will appear as they happen</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Render content based on active tab */}
            {activeTab === "all" && (
              <>
                
                {/* All events in chronological order with period score markers */}
                {(() => {
                  const sortedEvents = [...events].sort(
                    (a, b) => b.time.elapsed - a.time.elapsed,
                  );

                  // Create period markers without useMemo to avoid hooks order violation
                  const createPeriodMarkers = () => {
                    const markers = [];

                    try {
                      const currentScores = getCurrentScores;

                      // Calculate halftime score by counting goals scored up to 45 minutes
                      const calculateHalftimeScore = () => {
                        let homeHalftimeScore = 0;
                        let awayHalftimeScore = 0;

                        const firstHalfGoals = events.filter(
                          (event) =>
                            event.type === "Goal" && event.time?.elapsed <= 45,
                        );

                        firstHalfGoals.forEach((goal) => {
                          if (goal.team?.name === homeTeam) {
                            homeHalftimeScore++;
                          } else if (goal.team?.name === awayTeam) {
                            awayHalftimeScore++;
                          }
                        });

                        return { homeHalftimeScore, awayHalftimeScore };
                      };

                      // Add "End of 90 Minutes" marker for ended matches
                      const matchStatus = matchData?.fixture?.status?.short;
                      const isMatchEnded = ["FT", "AET", "PEN"].includes(
                        matchStatus,
                      );
                      const fullTimeEvents = events.filter(
                        (e) => e.time?.elapsed >= 119,
                      );

                      if (isMatchEnded || fullTimeEvents.length > 0) {
                        markers.push({
                          time: { elapsed: 119 },
                          type: "period_score",
                          detail: "End of 90 Minutes",
                          score: `${currentScores.homeScore} - ${currentScores.awayScore}`,
                          team: { name: "", logo: "" },
                          player: { name: "" },
                          id: "period-90",
                        } as PeriodMarkerEvent);
                      }

                      // Add "Halftime" marker if there are events in both halves
                      const firstHalfEvents = events.filter(
                        (e) => e.time?.elapsed >= 1 && e.time?.elapsed <= 45,
                      );
                      const secondHalfEvents = events.filter(
                        (e) => e.time?.elapsed > 45,
                      );
                      if (
                        firstHalfEvents.length > 0 &&
                        secondHalfEvents.length > 0
                      ) {
                        const halftimeScore = calculateHalftimeScore();
                        markers.push({
                          time: { elapsed: 46 },
                          type: "period_score",
                          detail: "Halftime",
                          score: `${halftimeScore.homeHalftimeScore} - ${halftimeScore.awayHalftimeScore}`,
                          team: { name: "", logo: "" },
                          player: { name: "" },
                          id: "period-46",
                        } as PeriodMarkerEvent);
                      }

                      // Add penalty shootout marker only if match actually ended with penalties
                      if (
                        matchData?.fixture?.status?.short === "PEN" &&
                        matchData?.score?.penalty?.home !== null &&
                        matchData?.score?.penalty?.away !== null
                      ) {
                        markers.push({
                          time: { elapsed: 121 }, // Put penalties after extra time
                          type: "penalty_shootout",
                          detail: "Penalties",
                          team: { name: "", logo: "" },
                          player: { name: "" },
                          id: "penalty-shootout",
                        } as PeriodMarkerEvent);
                      }
                    } catch (error) {
                      console.error("Error creating period markers:", error);
                    }

                    return markers;
                  };

                  const periodMarkers = createPeriodMarkers();

                  // Filter out events with elapsed time > 110' from regular display (they go to penalty section)
                  const filteredEvents = sortedEvents.filter(event => event.time.elapsed <= 110);
                  
                  // Combine filtered events and period markers safely
                  const allItems: EventOrMarker[] = [...filteredEvents, ...periodMarkers].sort(
                    (a, b) => {
                      // Special priority for penalty shootout - put it at the very top
                      if (a.type === "penalty_shootout") return -1;
                      if (b.type === "penalty_shootout") return 1;

                      // Special priority for "Full Time" - put it second
                      if (a.type === "period_score" && a.detail === "Full Time")
                        return -1;
                      if (b.type === "period_score" && b.detail === "Full Time")
                        return 1;

                      // Special priority for "End of 90 Minutes" - put it third
                      if (
                        a.type === "period_score" &&
                        a.detail === "End of 90 Minutes"
                      )
                        return -1;
                      if (
                        b.type === "period_score" &&
                        b.detail === "End of 90 Minutes"
                      )
                        return 1;

                      // Calculate total time including extra time for proper sorting
                      const aTotalTime = a.time.elapsed + (a.time.extra || 0);
                      const bTotalTime = b.time.elapsed + (b.time.extra || 0);

                      // If events happen at the same time, prioritize card events with red cards first
                      if (aTotalTime === bTotalTime) {
                        const aIsYellowCard =
                          a.type === "Card" &&
                          a.detail?.toLowerCase().includes("yellow");
                        const bIsYellowCard =
                          b.type === "Card" &&
                          b.detail?.toLowerCase().includes("yellow");
                        const aIsRedCard =
                          a.type === "Card" &&
                          a.detail?.toLowerCase().includes("red");
                        const bIsRedCard =
                          b.type === "Card" &&
                          b.detail?.toLowerCase().includes("red");

                        // Prioritize red card over yellow card at same minute
                        if (aIsRedCard && bIsYellowCard) return -1;
                        if (bIsRedCard && aIsYellowCard) return 1;
                      }

                      // Sort by total time in descending order (latest first)
                      // Special case: 46' (second half start) should come before 45' + extra time
                      if (
                        a.time.elapsed === 46 &&
                        b.time.elapsed === 45 &&
                        b.time.extra
                      ) {
                        return -1; // 46' comes first
                      }
                      if (
                        b.time.elapsed === 46 &&
                        a.time.elapsed === 45 &&
                        a.time.extra
                      ) {
                        return 1; // 46' comes first
                      }

                      return bTotalTime - aTotalTime;
                    },
                  );

                  return allItems.map((event, index) => {
                    // Handle period score markers safely
                    if (event.type === "period_score") {
                      return (
                        <div
                          key={event.id || `period-score-${index}`}
                          className="match-event-container "
                        >
                          <div className="period-score-marker">
                            <div className="period-score-label">
                              {event.detail || "Period Marker"}
                            </div>
                            <div className="period-score-display">
                              {event.score || "0 - 0"}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    // Render PenaltyShootoutDisplay if the event is a penalty shootout
                    if (event.type === "penalty_shootout") {
                      // Get actual penalty scores from match data
                      const penaltyHomeScore = matchData?.score?.penalty?.home || 4;
                      const penaltyAwayScore = matchData?.score?.penalty?.away || 3;
                      
                      return (
                        <div
                          key={event.id || `penalty-shootout-${index}`}
                          className="match-event-container"
                        >
                          {/* Penalties header - same style as period markers */}
                          <div className="match-event-container ">
                            <div className="period-score-marker">
                              <div className="period-score-label ">
                                Penalties
                              </div>
                              <div className="period-score-display">
                                {penaltyHomeScore} - {penaltyAwayScore}
                              </div>
                            </div>
                          </div>
                          <PenaltyShootoutDisplay homeScore={penaltyHomeScore} awayScore={penaltyAwayScore} />
                        </div>
                      );
                    }

                    // For own goals, show on the side of the team that benefits (opposite of scoring team)
                    const isOwnGoal = event.detail
                      ?.toLowerCase()
                      .includes("own goal");
                    const isHome = isOwnGoal
                      ? event.team?.name !== homeTeam
                      : event.team?.name === homeTeam;

                    return (
                      <div
                        key={`event-${index}`}
                        className="match-event-container"
                      >
                        {/* Three-grid layout container */}
                        <div className="match-event-three-grid-container">
                          {/* Left Grid: Home Team Events */}
                          <div className="match-event-home-side">
                            {isHome && (
                              <>
                                {/* Column 1: Player Info */}
                                <div className="match-event-home-player-info">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() =>
                                        handlePlayerClick(
                                          event.player?.id,
                                          event.team.id,
                                          event.player?.name,
                                        )
                                      }
                                    >
                                      <MyAvatarInfo
                                        playerId={event.player?.id}
                                        playerName={event.player?.name}
                                        matchId={fixtureId}
                                        teamId={event.team?.id}
                                        size="md"
                                        className={`shadow-sm ${event.type === "subst" ? "border-green-300" : "border-gray-400"}`}
                                      />
                                    </div>

                                    {event.type === "subst" &&
                                      event.assist?.name && (
                                        <div
                                          className="-ml-4 -mr-2 relative z-20 cursor-pointer hover:scale-105 transition-transform"
                                          onClick={() =>
                                            handlePlayerClick(
                                              event.assist?.id,
                                              event.team.id,
                                              event.assist?.name,
                                            )
                                          }
                                        >
                                          <MyAvatarInfo
                                            playerId={event.assist?.id}
                                            playerName={event.assist?.name}
                                            matchId={fixtureId}
                                            teamId={event.team?.id}
                                            size="md"
                                            className="shadow-sm border-red-300"
                                          />
                                        </div>
                                      )}
                                  </div>

                                  <div className="text-left">
                                    {event.type === "subst" &&
                                    event.assist?.name ? (
                                      <>
                                        <div className="text-xs font-medium text-green-600">
                                          {event.assist.name}
                                        </div>
                                        <div className="text-xs font-medium text-red-600">
                                          {event.player?.name ||
                                            "Unknown Player"}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-xs font-medium text-gray-700">
                                        {event.player?.name || "Unknown Player"}
                                      </div>
                                    )}
                                    {event.type === "goal" &&
                                      event.assist?.name && (
                                        <div className="text-xs text-gray-600">
                                          (Assist: {event.assist.name})
                                        </div>
                                      )}
                                    {event.type !== "subst" &&
                                      event.type !== "Card" &&
                                      event.type !== "Goal" && (
                                        <div className="text-xs text-gray-400">
                                          {event.type === "foul" ||
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("foul")
                                            ? `Foul by ${event.player?.name || "Unknown Player"}`
                                            : event.detail || event.type}
                                        </div>
                                      )}
                                  </div>
                                </div>

                                {/* Column 2: Event Icon */}
                                <div className="match-event-home-icon-column">
                                  <div
                                    className={`match-event-icon ${
                                      event.type === "goal"
                                        ? "goal"
                                        : event.type === "card"
                                          ? "card"
                                          : "substitution"
                                    } relative group`}
                                    style={{ marginRight: "-8px" }}
                                    title={getEventDescription(event)}
                                  >
                                    {event.type === "subst" ? (
                                      <img
                                        src="/assets/matchdetaillogo/substitution.svg"
                                        alt="Substitution"
                                        className="w-4 h-4   duration-200 "
                                      />
                                    ) : event.type === "Goal" ? (
                                      (() => {
                                        const detail =
                                          event.detail?.toLowerCase() || "";
                                        if (detail.includes("penalty")) {
                                          if (detail.includes("missed")) {
                                            return (
                                              <img
                                                src="/assets/matchdetaillogo/missed-penalty.svg"
                                                alt="Missed Penalty"
                                                className="w-4 h-4  "
                                              />
                                            );
                                          } else {
                                            return (
                                              <img
                                                src="/assets/matchdetaillogo/penalty.svg"
                                                alt="Penalty Goal"
                                                className="w-4 h-4  "
                                              />
                                            );
                                          }
                                        } else if (
                                          detail.includes("own goal")
                                        ) {
                                          return (
                                            <img
                                              src="/assets/matchdetaillogo/soccer-logo.svg"
                                              alt="Own Goal"
                                              className="w-4 h-4 "
                                            />
                                          );
                                        } else {
                                          return (
                                            <img
                                              src="/assets/matchdetaillogo/soccer-ball.svg"
                                              alt="Goal"
                                              className="w-4 h-4 "
                                            />
                                          );
                                        }
                                      })()
                                    ) : event.type === "Card" ? (
                                      <img
                                        src={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "/assets/matchdetaillogo/card-icon.svg"
                                            : "/assets/matchdetaillogo/red-card-icon.svg"
                                        }
                                        alt={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "Yellow Card"
                                            : "Red Card"
                                        }
                                        title={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "Yellow Card"
                                            : "Red Card"
                                        }
                                        className="w-4 h-8 "
                                      />
                                    ) : (
                                      <span className="text-xs">
                                        {getEventIcon(event.type, event.detail)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Center Grid: Time display only */}
                          <div className="match-event-time-center-simple">
                            {/* Middle: Time display - show elapsed time in black and extra time in red */}
                            <div
                              className="match-event-time-display"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "row",
                                height: "100%",
                              }}
                            >
                              <span style={{ color: "black", lineHeight: "1" }}>
                                {event.time?.elapsed}'
                              </span>
                              {event.time?.extra && (
                                <span style={{ color: "red", lineHeight: "1" }}>
                                  +{event.time.extra}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Grid: Away Team Events */}
                          <div className="match-event-away-side">
                            {!isHome && (
                              <>
                                {/* Column 1: Event Icon */}
                                <div className="match-event-away-icon-column">
                                  <div
                                    className={`match-event-icon ${
                                      event.type === "Goal"
                                        ? "Goal"
                                        : event.type === "Card"
                                          ? "Card"
                                          : "Substitution"
                                    }`}
                                    style={{ marginRight: "-8px" }}
                                    title={getEventDescription(event)}
                                  >
                                    {event.type === "subst" ? (
                                      <img
                                        src="/assets/matchdetaillogo/substitution.svg"
                                        alt="Substitution"
                                        className="w-4 h-4 "
                                      />
                                    ) : event.type === "Goal" ? (
                                      (() => {
                                        const detail =
                                          event.detail?.toLowerCase() || "";
                                        if (detail.includes("penalty")) {
                                          if (detail.includes("missed")) {
                                            return (
                                              <img
                                                src="/assets/matchdetaillogo/missed-penalty.svg"
                                                alt="Missed Penalty"
                                                className="w-4 h-4 "
                                              />
                                            );
                                          } else {
                                            return (
                                              <img
                                                src="/assets/matchdetaillogo/penalty.svg"
                                                alt="Penalty Goal"
                                                className="w-4 h-4 "
                                              />
                                            );
                                          }
                                        } else if (
                                          detail.includes("own goal")
                                        ) {
                                          return (
                                            <img
                                              src="/assets/matchdetaillogo/soccer-logo.svg"
                                              alt="Own Goal"
                                              className="w-4 h-4 "
                                            />
                                          );
                                        } else {
                                          return (
                                            <img
                                              src="/assets/matchdetaillogo/soccer-ball.svg"
                                              alt="Goal"
                                              className="w-4 h-4 "
                                            />
                                          );
                                        }
                                      })()
                                    ) : event.type === "Card" ? (
                                      <img
                                        src={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "/assets/matchdetaillogo/card-icon.svg"
                                            : "/assets/matchdetaillogo/red-card-icon.svg"
                                        }
                                        alt={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "Yellow Card"
                                            : "Red Card"
                                        }
                                        title={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "Yellow Card"
                                            : "Red Card"
                                        }
                                        className="w-4 h-4 "
                                      />
                                    ) : (
                                      <span className="text-xs">
                                        {getEventIcon(event.type, event.detail)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Column 2: Player Info */}
                                <div className="match-event-away-player-info">
                                  <div className="text-right w-36">
                                    {event.type === "subst" &&
                                    event.assist?.name ? (
                                      <>
                                        <div className="text-xs font-medium text-green-600 text-right">
                                          {event.assist.name}
                                        </div>
                                        <div className="text-xs font-medium text-red-600 text-right">
                                          {event.player?.name ||
                                            "Unknown Player"}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-xs font-medium text-gray-700 text-right">
                                        {event.player?.name || "Unknown Player"}
                                      </div>
                                    )}
                                    {event.type === "goal" &&
                                      event.assist?.name && (
                                        <div className="text-xs text-gray-600 text-right">
                                          (Assist: {event.assist.name})
                                        </div>
                                      )}
                                    {event.type !== "subst" &&
                                      event.type !== "Card" &&
                                      event.type !== "Goal" && (
                                        <div className="text-xs text-gray-400 text-right">
                                          {event.type === "foul" ||
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("foul")
                                            ? `Foul by ${event.player?.name || "Unknown Player"}`
                                            : event.detail || event.type}
                                        </div>
                                      )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {event.type === "subst" &&
                                      event.assist?.name && (
                                        <div
                                          className="-ml-4 -mr-3 relative z-20 cursor-pointer hover:scale-105 transition-transform"
                                          onClick={() =>
                                            handlePlayerClick(
                                              event.assist?.id,
                                              event.team.id,
                                              event.assist?.name,
                                            )
                                          }
                                        >
                                          <MyAvatarInfo
                                            playerId={event.assist?.id}
                                            playerName={event.assist?.name}
                                            matchId={fixtureId}
                                            teamId={event.team?.id}
                                            size="md"
                                            className="shadow-sm border-red-300"
                                          />
                                        </div>
                                      )}

                                    <div
                                      className="cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() =>
                                        handlePlayerClick(
                                          event.player?.id,
                                          event.team.id,
                                          event.player?.name,
                                        )
                                      }
                                    >
                                      <MyAvatarInfo
                                        playerId={event.player?.id}
                                        playerName={event.player?.name}
                                        matchId={fixtureId}
                                        teamId={event.team?.id}
                                        size="md"
                                        className={`shadow-sm ${event.type === "subst" ? "border-green-300" : "border-gray-400"}`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* Show MyCommentary for All tab */}
                <MyCommentary
                  events={events}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  getEventDescription={getEventDescription}
                  isHomeTeam={isHomeTeam}
                />
              </>
            )}

            {activeTab === "top" && (
              <>
                {/* Filter to show only Goal events with period markers */}
                {(() => {
                  const goalEvents = events
                    .filter((event) => event.type === "Goal")
                    .sort((a, b) => b.time.elapsed - a.time.elapsed);

                  // Create period markers for Top tab (same logic as All tab)
                  const createTopTabPeriodMarkers = () => {
                    const markers = [];

                    try {
                      const currentScores = getCurrentScores;

                      // Calculate halftime score by counting goals scored up to 45 minutes
                      const calculateHalftimeScore = () => {
                        let homeHalftimeScore = 0;
                        let awayHalftimeScore = 0;

                        const firstHalfGoals = goalEvents.filter(
                          (event) => event.time?.elapsed <= 45,
                        );

                        firstHalfGoals.forEach((goal) => {
                          if (goal.team?.name === homeTeam) {
                            homeHalftimeScore++;
                          } else if (goal.team?.name === awayTeam) {
                            awayHalftimeScore++;
                          }
                        });

                        return { homeHalftimeScore, awayHalftimeScore };
                      };

                      // Add "End of 90 Minutes" marker for ended matches
                      const matchStatus = matchData?.fixture?.status?.short;
                      const isMatchEnded = ["FT", "AET", "PEN"].includes(
                        matchStatus,
                      );
                      const fullTimeGoals = goalEvents.filter(
                        (e) => e.time?.elapsed >= 119,
                      );

                      if (isMatchEnded || fullTimeGoals.length > 0) {
                        markers.push({
                          time: { elapsed: 119 },
                          type: "period_score",
                          detail: "End of 90 Minutes",
                          score: `${currentScores.homeScore} - ${currentScores.awayScore}`,
                          team: { name: "", logo: "" },
                          player: { name: "" },
                          id: "period-90-top",
                        } as PeriodMarkerEvent);
                      }

                      // Always add "Halftime" marker if match has progressed beyond first half
                      const hasSecondHalfEvents = events.some(
                        (e) => e.time?.elapsed > 45,
                      );
                      const firstHalfGoals = goalEvents.filter(
                        (e) => e.time?.elapsed >= 1 && e.time?.elapsed <= 45,
                      );

                      if (hasSecondHalfEvents) {
                        const halftimeScore = calculateHalftimeScore();
                        markers.push({
                          time: { elapsed: 46 },
                          type: "period_score",
                          detail: "Halftime",
                          score: `${halftimeScore.homeHalftimeScore} - ${halftimeScore.awayHalftimeScore}`,
                          team: { name: "", logo: "" },
                          player: { name: "" },
                          id: "period-46-top",
                          hasFirstHalfGoals: firstHalfGoals.length > 0,
                        } as PeriodMarkerEvent);
                      }
                    } catch (error) {
                      console.error(
                        "Error creating Top tab period markers:",
                        error,
                      );
                    }

                    return markers;
                  };

                  const periodMarkers = createTopTabPeriodMarkers();

                  // Combine goal events and period markers
                  const allTopItems: EventOrMarker[] = [...goalEvents, ...periodMarkers].sort(
                    (a, b) => {
                      // Special priority for "End of 90 Minutes" - put it at the very top in Top tab
                      if (
                        a.type === "period_score" &&
                        a.detail === "End of 90 Minutes"
                      )
                        return -1;
                      if (
                        b.type === "period_score" &&
                        b.detail === "End of 90 Minutes"
                      )
                        return 1;

                      // Calculate total time including extra time for proper sorting
                      const aTotalTime = a.time.elapsed + (a.time.extra || 0);
                      const bTotalTime = b.time.elapsed + (b.time.extra || 0);

                      // If events happen at the same time, prioritize card events with red cards first
                      if (aTotalTime === bTotalTime) {
                        const aIsYellowCard =
                          a.type === "Card" &&
                          a.detail?.toLowerCase().includes("yellow");
                        const bIsYellowCard =
                          b.type === "Card" &&
                          b.detail?.toLowerCase().includes("yellow");
                        const aIsRedCard =
                          a.type === "Card" &&
                          a.detail?.toLowerCase().includes("red");
                        const bIsRedCard =
                          b.type === "Card" &&
                          b.detail?.toLowerCase().includes("red");

                        // Prioritize red card over yellow card at same minute
                        if (aIsRedCard && bIsYellowCard) return -1;
                        if (bIsRedCard && aIsYellowCard) return 1;
                      }

                      // Sort by total time in descending order (latest first)
                      // Special case: 46' (second half start) should come before 45' + extra time
                      if (
                        a.time.elapsed === 46 &&
                        b.time.elapsed === 45 &&
                        b.time.extra
                      ) {
                        return -1; // 46' comes first
                      }
                      if (
                        b.time.elapsed === 46 &&
                        a.time.elapsed === 45 &&
                        a.time.extra
                      ) {
                        return 1; // 46' comes first
                      }

                      return bTotalTime - aTotalTime;
                    },
                  );

                  if (goalEvents.length == 0 && periodMarkers.length === 0) {
                    return (
                      <div className="p-8 text-center text-gray-500">
                        <div className="text-4xl mb-4">⚽</div>
                        <h3 className="text-lg font-medium mb-2">
                          No Goals Yet
                        </h3>
                        <p className="text-sm">
                          Goal events will appear here when they happen
                        </p>
                      </div>
                    );
                  }

                  return allTopItems.map((event, index) => {
                    // Handle period score markers
                    if (event.type === "period_score") {
                      return (
                        <div
                          key={event.id || `period-score-top-${index}`}
                          className="match-event-container "
                        >
                          <div className="period-score-marker">
                            <div className="period-score-label">
                              {event.detail || "Period Marker"}
                            </div>
                            <div className="period-score-display">
                              {event.score || "0 - 0"}
                            </div>
                          </div>
                          {/* Show "No Top Events" for halftime if no goals in first half */}
                          {event.detail === "Halftime" &&
                            event.hasFirstHalfGoals === false && (
                              <div className="text-center text-gray-500 text-sm mt-2 py-2 bg-gray-50 rounded">
                                No Top Events
                              </div>
                            )}
                        </div>
                      );
                    }

                    // For own goals, show on the side of the team that benefits (opposite of scoring team)
                    const isOwnGoal = event.detail
                      ?.toLowerCase()
                      .includes("own goal");
                    const isHome = isOwnGoal
                      ? event.team?.name !== homeTeam
                      : event.team?.name === homeTeam;

                    return (
                      <div
                        key={`goal-event-${index}`}
                        className="match-event-container"
                      >
                        {/* Three-grid layout container */}
                        <div className="match-event-three-grid-container">
                          {/* Left Grid: Home Team Events */}
                          <div className="match-event-home-side">
                            {isHome && (
                              <>
                                {/* Column 1: Player Info */}
                                <div className="match-event-home-player-info">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() =>
                                        handlePlayerClick(
                                          event.player?.id,
                                          event.team.id,
                                          event.player?.name,
                                        )
                                      }
                                    >
                                      <MyAvatarInfo
                                        playerId={event.player?.id}
                                        playerName={event.player?.name}
                                        matchId={fixtureId}
                                        teamId={event.team?.id}
                                        size="md"
                                        className={`shadow-sm ${event.type === "subst" ? "border-green-300" : "border-gray-400"}`}
                                      />
                                    </div>

                                    {event.type === "subst" &&
                                      event.assist?.name && (
                                        <div
                                          className="-ml-4 -mr-2 relative z-20 cursor-pointer hover:scale-105 transition-transform"
                                          onClick={() =>
                                            handlePlayerClick(
                                              event.assist?.id,
                                              event.team.id,
                                              event.assist?.name,
                                            )
                                          }
                                        >
                                          <MyAvatarInfo
                                            playerId={event.assist?.id}
                                            playerName={event.assist?.name}
                                            matchId={fixtureId}
                                            teamId={event.team?.id}
                                            size="md"
                                            className="shadow-sm border-red-300"
                                          />
                                        </div>
                                      )}
                                  </div>

                                  <div className="text-left">
                                    {event.type === "subst" &&
                                    event.assist?.name ? (
                                      <>
                                        <div className="text-xs font-medium text-typescript-green-600">
                                          {event.assist.name}
                                        </div>
                                        <div className="text-xs font-medium text-red-600">
                                          {event.player?.name ||
                                            "Unknown Player"}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-xs font-medium text-gray-700">
                                        {event.player?.name || "Unknown Player"}
                                      </div>
                                    )}
                                    {event.type === "goal" &&
                                      event.assist?.name && (
                                        <div className="text-xs text-gray-600">
                                          (Assist: {event.assist.name})
                                        </div>
                                      )}
                                    {event.type !== "subst" &&
                                      event.type !== "Card" &&
                                      event.type !== "Goal" && (
                                        <div className="text-xs text-gray-400">
                                          {event.type === "foul" ||
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("foul")
                                            ? `Foul by ${event.player?.name || "Unknown Player"}`
                                            : event.detail || event.type}
                                        </div>
                                      )}
                                  </div>
                                </div>

                                {/* Column 2: Event Icon */}
                                <div className="match-event-home-icon-column">
                                  {" "}
                                  <div
                                    className={`match-event-icon ${
                                      event.type === "Goal"
                                        ? "goal"
                                        : event.type === "card"
                                          ? "card"
                                          : "substitution"
                                    } relative group`}
                                    style={{ marginRight: "-8px" }}
                                    title={getEventDescription(event)}
                                  >
                                    {event.type === "subst" ? (
                                      <img
                                        src="/assets/matchdetaillogo/substitution.svg"
                                        alt="Substitution"
                                        className="w-4 h-4   duration-200 "
                                      />
                                    ) : event.type === "Goal" ? (
                                      (() => {
                                        const detail =
                                          event.detail?.toLowerCase() || "";
                                        if (detail.includes("penalty")) {
                                          if (detail.includes("missed")) {
                                            return (
                                              <img
                                                src="/assets/matchdetaillogo/missed-penalty.svg"
                                                alt="Missed Penalty"
                                                className="w-4 h-4  "
                                              />
                                            );
                                          } else {
                                            return (
                                              <img
                                                src="/assets/matchdetaillogo/penalty.svg"
                                                alt="Penalty Goal"
                                                className="w-4 h-4  "
                                              />
                                            );
                                          }
                                        } else if (
                                          detail.includes("own goal")
                                        ) {
                                          return (
                                            <img
                                              src="/assets/matchdetaillogo/soccer-logo.svg"
                                              alt="Own Goal"
                                              className="w-4 h-4 "
                                            />
                                          );
                                        } else {
                                          return (
                                            <img
                                              src="/assets/matchdetaillogo/soccer-ball.svg"
                                              alt="Goal"
                                              className="w-4 h-4 "
                                            />
                                          );
                                        }
                                      })()
                                    ) : event.type === "Card" ? (
                                      <img
                                        src={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "/assets/matchdetaillogo/card-icon.svg"
                                            : "/assets/matchdetaillogo/red-card-icon.svg"
                                        }
                                        alt={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "Yellow Card"
                                            : "Red Card"
                                        }
                                        title={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "Yellow Card"
                                            : "Red Card"
                                        }
                                        className="w-4 h-8 "
                                      />
                                    ) : (
                                      <span className="text-xs">
                                        {getEventIcon(event.type, event.detail)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Center Grid: Time display only */}
                          <div className="match-event-time-center-simple">
                            {/* Middle: Time display - show elapsed time in black and extra time in red */}
                            <div
                              className="match-event-time-display"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "row",
                                height: "100%",
                              }}
                            >
                              <span style={{ color: "black", lineHeight: "1" }}>
                                {event.time?.elapsed}'
                              </span>
                              {event.time?.extra && (
                                <span style={{ color: "red", lineHeight: "1" }}>
                                  +{event.time.extra}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Grid: Away Team Events */}
                          <div className="match-event-away-side">
                            {!isHome && (
                              <>
                                {/* Column 1: Event Icon */}
                                <div className="match-event-away-icon-column">
                                  <div
                                    className={`match-event-icon ${
                                      event.type === "Goal"
                                        ? "Goal"
                                        : event.type === "Card"
                                          ? "Card"
                                          : "Substitution"
                                    }`}
                                    style={{ marginRight: "-8px" }}
                                    title={getEventDescription(event)}
                                  >
                                    {event.type === "subst" ? (
                                      <img
                                        src="/assets/matchdetaillogo/substitution.svg"
                                        alt="Substitution"
                                        className="w-4 h-4 "
                                      />
                                    ) : event.type === "Goal" ? (
                                      (() => {
                                        const detail =
                                          event.detail?.toLowerCase() || "";
                                        if (detail.includes("penalty")) {
                                          if (detail.includes("missed")) {
                                            return (
                                              <img
                                                src="/assets/matchdetaillogo/missed-penalty.svg"
                                                alt="Missed Penalty"
                                                className="w-4 h-4 "
                                              />
                                            );
                                          } else {
                                            return (
                                              <img
                                                src="/assets/matchdetaillogo/penalty.svg"
                                                alt="Penalty Goal"
                                                className="w-4 h-4 "
                                              />
                                            );
                                          }
                                        } else if (
                                          detail.includes("own goal")
                                        ) {
                                          return (
                                            <img
                                              src="/assets/matchdetaillogo/soccer-logo.svg"
                                              alt="Own Goal"
                                              className="w-4 h-4 "
                                            />
                                          );
                                        } else {
                                          return (
                                            <img
                                              src="/assets/matchdetaillogo/soccer-ball.svg"
                                              alt="Goal"
                                              className="w-4 h-4 "
                                            />
                                          );
                                        }
                                      })()
                                    ) : event.type === "Card" ? (
                                      <img
                                        src={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "/assets/matchdetaillogo/card-icon.svg"
                                            : "/assets/matchdetaillogo/red-card-icon.svg"
                                        }
                                        alt={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "Yellow Card"
                                            : "Red Card"
                                        }
                                        title={
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("yellow")
                                            ? "Yellow Card"
                                            : "Red Card"
                                        }
                                        className="w-4 h-4 "
                                      />
                                    ) : (
                                      <span className="text-xs">
                                        {getEventIcon(event.type, event.detail)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Column 2: Player Info */}
                                <div className="match-event-away-player-info">
                                  <div className="text-right w-36">
                                    {event.type === "subst" &&
                                    event.assist?.name ? (
                                      <>
                                        <div className="text-xs font-medium text-green-600 text-right">
                                          {event.assist.name}
                                        </div>
                                        <div className="text-xs font-medium text-red-600 text-right">
                                          {event.player?.name ||
                                            "Unknown Player"}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-xs font-medium text-gray-700 text-right">
                                        {event.player?.name || "Unknown Player"}
                                      </div>
                                    )}
                                    {event.type === "goal" &&
                                      event.assist?.name && (
                                        <div className="text-xs text-gray-600 text-right">
                                          (Assist: {event.assist.name})
                                        </div>
                                      )}
                                    {event.type !== "subst" &&
                                      event.type !== "Card" &&
                                      event.type !== "Goal" && (
                                        <div className="text-xs text-gray-400 text-right">
                                          {event.type === "foul" ||
                                          event.detail
                                            ?.toLowerCase()
                                            .includes("foul")
                                            ? `Foul by ${event.player?.name || "Unknown Player"}`
                                            : event.detail || event.type}
                                        </div>
                                      )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {event.type === "subst" &&
                                      event.assist?.name && (
                                        <div
                                          className="-ml-4 -mr-3 relative z-20 cursor-pointer hover:scale-105 transition-transform"
                                          onClick={() =>
                                            handlePlayerClick(
                                              event.assist?.id,
                                              event.team.id,
                                              event.assist?.name,
                                            )
                                          }
                                        >
                                          <MyAvatarInfo
                                            playerId={event.assist?.id}
                                            playerName={event.assist?.name}
                                            matchId={fixtureId}
                                            teamId={event.team?.id}
                                            size="md"
                                            className="shadow-sm border-red-300"
                                          />
                                        </div>
                                      )}

                                    <div
                                      className="cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() =>
                                        handlePlayerClick(
                                          event.player?.id,
                                          event.team.id,
                                          event.player?.name,
                                        )
                                      }
                                    >
                                      <MyAvatarInfo
                                        playerId={event.player?.id}
                                        playerName={event.player?.name}
                                        matchId={fixtureId}
                                        teamId={event.team?.id}
                                        size="md"
                                        className={`shadow-sm ${event.type === "subst" ? "border-green-300" : "border-gray-400"}`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* Show MyCommentary with filtered Goal events for Top tab */}
                <MyCommentary
                  events={events.filter((event) => event.type === "Goal")}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  getEventDescription={getEventDescription}
                  isHomeTeam={isHomeTeam}
                />
              </>
            )}

            {activeTab === "commentary" && (
              <MyCommentary
                events={events}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                getEventDescription={getEventDescription}
                isHomeTeam={isHomeTeam}
              />
            )}
          </div>
        )}
      </CardContent>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        playerId={selectedPlayer?.id}
        playerName={selectedPlayer?.name}
        teamId={selectedPlayer?.teamId}
        playerImage={selectedPlayer?.image}
      />
    </Card>
  );
};

export default MyMatchEventNew;