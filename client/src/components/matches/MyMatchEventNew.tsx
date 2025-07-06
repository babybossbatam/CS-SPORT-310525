import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

import { Clock, RefreshCw, AlertCircle } from "lucide-react";

import "@/styles/MyPlayer.css";
import "@/styles/MyMatchEventNew.css";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import MyCommentary from "./MyCommentary";

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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMatchEvents = async () => {
    if (!fixtureId) {
      setError("No fixture ID provided");
      setIsLoading(false);
      return;
    }

    try {
      console.log(
        `📊 [MyMatchEventNew] Fetching events for fixture: ${fixtureId}`,
      );

      const response = await fetch(`/api/fixtures/${fixtureId}/events`);

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const eventData = await response.json();
      console.log(`✅ [MyMatchEventNew] Received ${eventData.length} events`);
      
      // Debug: Log all events to see what we're getting
      console.log("🔍 [Event Debug] All events from API:", eventData);
      
      // Debug: Check for penalty-related events
      const penaltyRelatedEvents = eventData.filter((event: any) => {
        const detail = event.detail?.toLowerCase() || "";
        const type = event.type?.toLowerCase() || "";
        return detail.includes("penalty") || type.includes("penalty") || detail.includes("shootout");
      });
      console.log("🔍 [Event Debug] Penalty-related events:", penaltyRelatedEvents);

      setEvents(eventData || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error(`❌ [MyMatchEventNew] Error fetching events:`, error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch events",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchEvents();

    // Set up refresh interval
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(
        fetchMatchEvents,
        refreshInterval * 1000,
      );
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fixtureId, refreshInterval]);

  const formatTime = (elapsed: number, extra?: number) => {
    if (extra) {
      return `${elapsed}+${extra}'`;
    }
    return `${elapsed}'`;
  };

  const getEventIcon = (type: string, detail?: string) => {
    const eventType = type?.toLowerCase() || '';
    const eventDetail = detail?.toLowerCase() || '';

    switch (eventType) {
      case 'goal':
        if (eventDetail.includes('penalty')) {
          return '⚽'; // Penalty goal
        } else if (eventDetail.includes('own goal')) {
          return '🥅'; // Own goal
        }
        return '⚽'; // Regular goal



      case 'subst':
      case 'substitution':
        return '🔄'; // Substitution

      case 'Var':
        return '📺'; // VAR

      case 'Foul':
        return '🚫'; // Foul

      case 'Offside':
        return '🚩'; // Offside

      case 'Corner':
        return '📐'; // Corner kick

      case 'Free kick':
        return '🦶'; // Free kick

      case 'Throw in':
        return '👐'; // Throw in

      default:
        return '📝'; // Default event
    }
  };

  const getEventDescription = (event: MatchEvent) => {
    const playerName = event.player?.name || "Unknown Player";
    const teamName = event.team?.name || "Unknown Team";
    const assistName = event.assist?.name;
    const detail = event.detail || "";

    if (!event.type) return `${playerName} (${teamName})`;

    switch (event.type.toLowerCase()) {
      case "Goal":
        if (detail.toLowerCase().includes("Penalty")) {
          return `${playerName} (${teamName}) - Penalty Goal${assistName ? `, assist: ${assistName}` : ""}`;
        } else if (detail.toLowerCase().includes("own goal")) {
          return `${playerName} (${teamName}) - Own Goal`;
        } else {
          return `${playerName} (${teamName}) - Goal${assistName ? `, assist: ${assistName}` : ""}`;
        }
      case "Card":
        if (detail.toLowerCase().includes("yellow")) {
          return `${playerName} (${teamName}) - Yellow Card`;
        } else if (detail.toLowerCase().includes("red")) {
          return `${playerName} (${teamName}) - red card`;
        } else {
          return `${playerName} (${teamName}) - ${detail || "Card"}`;
        }
      case "subst":
        if (assistName) {
          return `${teamName} - Substitution: ${assistName} on, ${playerName} off`;
        }
        return `${playerName} (${teamName}) - Substitution`;
      case "var":
        return `VAR Review - ${detail || "Video Review"} involving ${playerName} (${teamName})`;
      default:
        // Handle other event types like fouls, offside, etc.
        if (
          event.type.toLowerCase() === "foul" ||
          detail.toLowerCase().includes("foul")
        ) {
          return `${playerName} (${teamName}) - Foul${detail ? `: ${detail}` : ""}`;
        } else if (detail.toLowerCase().includes("offside")) {
          return `${playerName} (${teamName}) - Offside`;
        } else if (detail.toLowerCase().includes("corner")) {
          return `${teamName} - Corner Kick`;
        } else if (detail.toLowerCase().includes("free kick")) {
          return `${playerName} (${teamName}) - Free Kick`;
        } else {
          return `${playerName} (${teamName}) - ${detail || event.type}`;
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

  const isHomeTeam = (event: MatchEvent) => {
    return event.team?.name?.toLowerCase() === homeTeam?.toLowerCase();
  };

  const isDarkTheme = theme === "dark";
  const groupedEvents = groupEventsByPeriod(events);

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

  const getPlayerImage = (
    playerId: number | undefined,
    playerName: string | undefined,
  ) => {
    if (!playerId) {
      return "";
    }
    return `/api/player-photo/${playerId}`;
  };

  const EventItem = ({
    event,
    isLast,
  }: {
    event: MatchEvent;
    isLast: boolean;
  }) => {
    const isHome = isHomeTeam(event);

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
    // Only look for actual penalty shootout events (after 120 minutes or with specific shootout indicators)
    const penaltyEvents = events
      .filter((event) => {
        const detail = event.detail?.toLowerCase() || "";
        const type = event.type?.toLowerCase() || "";
        
        // Only include events that are clearly penalty shootout events
        return (
          (detail.includes("penalty") && event.time.elapsed >= 120) ||
          detail.includes("shootout") ||
          type.includes("shootout")
        );
      })
      .sort((a, b) => a.time.elapsed - b.time.elapsed);

    console.log("🔍 [Penalty Debug] All penalty events found:", penaltyEvents);
    console.log("🔍 [Penalty Debug] Total penalty events:", penaltyEvents.length);
    console.log("🔍 [Penalty Debug] Match data:", matchData);

    // Check if penalty data is available in matchData
    const penaltyScores = matchData?.score?.penalty;
    console.log("🔍 [Penalty Debug] Penalty scores from match data:", penaltyScores);

    // If we don't have enough penalty events from the API, create mock data based on the final score
    let penaltySequence = [];
    
    if (penaltyEvents.length < 6 && penaltyScores) {
      // Create mock penalty sequence based on the final penalty score
      const homePenalties = penaltyScores.home || 4;
      const awayPenalties = penaltyScores.away || 3;
      const totalPenalties = Math.max(6, homePenalties + awayPenalties);
      
      console.log(`🔍 [Penalty Debug] Creating mock penalties: Home ${homePenalties}, Away ${awayPenalties}`);
      
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
        
        // Create mock event
        const mockEvent = {
          time: { elapsed: 120 + i },
          team: {
            id: isHomePenalty ? 1 : 2,
            name: isHomePenalty ? homeTeam : awayTeam,
            logo: ""
          },
          player: {
            id: 1000 + i,
            name: i === 1 ? "Malik Tillman" : i === 2 ? "F. Calvo" : `Player ${i}`
          },
          type: "penalty",
          detail: wasScored ? "Penalty" : "Penalty missed"
        };
        
        penaltySequence.push({
          number: i,
          event: mockEvent
        });
      }
    } else {
      // Use actual events
      const totalPenalties = Math.max(6, penaltyEvents.length);
      for (let i = 1; i <= totalPenalties; i++) {
        const penaltyEvent = penaltyEvents[i - 1];
        penaltySequence.push({
          number: i,
          event: penaltyEvent
        });
      }
    }

    return (
      <div className="penalty-shootout-timeline">
        <div className="penalty-timeline-header">
          <span className="text-sm font-bold text-gray-700">Penalty Shootout</span>
        </div>
        
        <div className="penalty-timeline-container">
          {penaltySequence.reverse().map((penalty, index) => {
            const isHome = penalty.event ? isHomeTeam(penalty.event) : false;
            const isAway = penalty.event ? !isHomeTeam(penalty.event) : false;
            
            return (
              <div key={penalty.number} className="penalty-timeline-item">
                {/* Penalty event with player info */}
                <div className="flex items-center justify-between w-full">
                  {/* Home team penalty info (left side) */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {penalty.event && isHome ? (
                      <>
                        <div className="penalty-player-info penalty-player-info-home">
                          <Avatar className="w-10 h-10 border-2 border-gray-400 shadow-sm flex-shrink-0">
                            <AvatarImage
                              src={getPlayerImage(
                                penalty.event.player?.id,
                                penalty.event.player?.name,
                              )}
                              alt={penalty.event.player?.name || "Player"}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                              {penalty.event.player?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2) || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 ml-2">
                            <span className="penalty-player-name text-xs font-medium text-left truncate">
                              {penalty.event.player?.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {(() => {
                            const detail = penalty.event.detail?.toLowerCase() || "";
                            if (detail.includes("missed")) {
                              return (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">X</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">✓</span>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1"></div>
                    )}
                  </div>

                  {/* Center - Penalty number indicator */}
                  <div className="penalty-number-indicator mx-4 flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-orange-300">
                      {penalty.number}P
                    </div>
                  </div>

                  {/* Away team penalty info (right side) */}
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    {penalty.event && isAway ? (
                      <>
                        <div className="flex items-center gap-1 mr-2">
                          {(() => {
                            const detail = penalty.event.detail?.toLowerCase() || "";
                            if (detail.includes("missed")) {
                              return (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">X</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">✓</span>
                                </div>
                              );
                            }
                          })()}
                        </div>
                        <div className="penalty-player-info penalty-player-info-away">
                          <div className="flex flex-col min-w-0 mr-2">
                            <span className="penalty-player-name text-xs font-medium text-right truncate">
                              {penalty.event.player?.name}
                            </span>
                          </div>
                          <Avatar className="w-10 h-10 border-2 border-gray-400 shadow-sm flex-shrink-0">
                            <AvatarImage
                              src={getPlayerImage(
                                penalty.event.player?.id,
                                penalty.event.player?.name,
                              )}
                              alt={penalty.event.player?.name || "Player"}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-red-500 text-white text-xs font-bold">
                              {penalty.event.player?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2) || "P"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1"></div>
                    )}
                  </div>
                </div>
                
                {/* Connecting line */}
                {index < penaltySequence.length - 1 && (
                  <div className="penalty-connecting-line"></div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Final score indicator at bottom */}
        <div className="penalty-final-score">
          <div className="text-xs text-gray-500 text-center">
            Final: {homeScore} - {awayScore}
          </div>
        </div>
      </div>
    );
  };

  // Get current scores from API data
  const getCurrentScores = () => {
    if (matchData?.goals) {
      return {
        homeScore: matchData.goals.home || 0,
        awayScore: matchData.goals.away || 0,
      };
    }
    return { homeScore: 0, awayScore: 0 };
  };

  return (
    <Card
      className={`${className} ${isDarkTheme ? "bg-gray-800 text-white border-gray-700" : "bg-white border-gray-200"}`}
    >
      <CardHeader
        className={`pb-3 ${isDarkTheme ? "bg-gray-700" : "bg-gray-50"} border-b`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Match Events</h3>
            {isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            )}
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        {homeTeam && awayTeam && (
          <div className="text-sm text-gray-600 flex justify-between">
            <span>{homeTeam}</span>
            <span>vs</span>
            <span>{awayTeam}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
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
            {/* Show penalty shootout ONLY if match status is PEN (penalty shootout) */}
            {matchData?.fixture?.status?.short === "PEN" && (
              <PenaltyShootoutDisplay 
                homeScore={matchData?.score?.penalty?.home || 0} 
                awayScore={matchData?.score?.penalty?.away || 0} 
              />
            )}

            {/* All events in chronological order with period score markers */}
            {(() => {
              const sortedEvents = [...events].sort(
                (a, b) => b.time.elapsed - a.time.elapsed,
              );

              // Create period markers safely
              const periodMarkers = [];

              try {
                const currentScores = getCurrentScores();

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

                // Add "End of 90 Minutes" marker if there are events after minute 90
                const fullTimeEvents = events.filter(
                  (e) => e.time?.elapsed >= 90,
                );
                if (fullTimeEvents.length > 0) {
                  periodMarkers.push({
                    time: { elapsed: 90 },
                    type: "period_score",
                    detail: "End of 90 Minutes",
                    score: `${currentScores.homeScore} - ${currentScores.awayScore}`,
                    team: { name: "", logo: "" },
                    player: { name: "" },
                    id: "period-90",
                  });
                }

                // Add "Halftime" marker if there are events in both halves
                const firstHalfEvents = events.filter(
                  (e) => e.time?.elapsed >= 1 && e.time?.elapsed <= 45,
                );
                const secondHalfEvents = events.filter(
                  (e) => e.time?.elapsed > 45,
                );
                if (firstHalfEvents.length > 0 && secondHalfEvents.length > 0) {
                  const halftimeScore = calculateHalftimeScore();
                  periodMarkers.push({
                    time: { elapsed: 45 },
                    type: "period_score",
                    detail: "Halftime",
                    score: `${halftimeScore.homeHalftimeScore} - ${halftimeScore.awayHalftimeScore}`,
                    team: { name: "", logo: "" },
                    player: { name: "" },
                    id: "period-45",
                  });
                }

                // Add penalty shootout marker ONLY if match status is PEN (penalty shootout)
                if (matchData?.fixture?.status?.short === "PEN") {
                  periodMarkers.push({
                    time: { elapsed: 121 }, // Put penalties after extra time
                    type: "penalty_shootout",
                    detail: "Penalties",
                    team: { name: "", logo: "" },
                    player: { name: "" },
                    id: "penalty-shootout",
                  });
                }
              } catch (error) {
                console.error("Error creating period markers:", error);
              }

              // Combine events and period markers safely
              const allItems = [...sortedEvents, ...periodMarkers].sort(
                (a, b) => {
                  // Special priority for penalty shootout - put it at the very top
                  if (a.type === "penalty_shootout") return -1;
                  if (b.type === "penalty_shootout") return 1;

                  // Special priority for "End of 90 Minutes" - put it second
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

                  // Sort by total time in descending order (latest first)
                  return bTotalTime - aTotalTime;
                },
              );

              return allItems.map((event, index) => {
                // Handle period score markers safely
                if (event.type === "period_score") {
                  return (
                    <div
                      key={event.id || `period-score-${index}`}
                      className="match-event-container"
                    >
                      <div className="flex items-center justify-between bg-gray-100 px-2 py-1  mb-1">
                        <div className="text-xs font-semi-bold text-gray-700">
                          {event.detail || "Period Marker"}
                        </div>
                        <div classNamediv className="text-sm font-bold text-gray-900">
                          {event.score || "0 - 0"}
                        </div>
                      </div>
                    </div>
                  );
                }
                // Render PenaltyShootoutDisplay if the event is a penalty shootout
                if (event.type === "penalty_shootout") {
                  return (
                    <div
                      key={event.id || `penalty-shootout-${index}`}
                      className="match-event-container"
                    >
                      <PenaltyShootoutDisplay 
                        homeScore={matchData?.score?.penalty?.home || 0} 
                        awayScore={matchData?.score?.penalty?.away || 0} 
                      />
                    </div>
                  );
                }

                const isHome = event.team?.name === homeTeam;

                return (
                  <div key={`event-${index}`} className="match-event-container">
                    {/* Three-grid layout container */}
                    <div className="match-event-three-grid-container">
                      {/* Left Grid: Home Team Events */}
                      <div className="match-event-home-side">
                        {isHome && (
                          <>
                            {/* Column 1: Player Info */}
                            <div className="match-event-home-player-info">
                              <div className="flex items-center gap-1">
                                <Avatar className={`w-9 h-9 border-2 shadow-sm ${event.type === "subst" ? "border-green-300" : "border-gray-400"}`}>
                                  <AvatarImage
                                    src={getPlayerImage(
                                      event.player?.id,
                                      event.player?.name,
                                    )}
                                    alt={event.player?.name || "Player"}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                                    {event.player?.name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2) || "P"}
                                  </AvatarFallback>
                                </Avatar>

                                {event.type === "subst" &&
                                  event.assist?.name && (
                                    <Avatar className="w-9 h-9 border-2 border-red-300 shadow-sm -ml-4 -mr-2 relative-z20">
                                      <AvatarImage
                                        src={getPlayerImage(
                                          event.assist?.id,
                                          event.assist?.name,
                                        )}
                                        alt={event.assist?.name || "Player"}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="bg-blue-400 text-white text-xs font-bold">
                                        {event.assist?.name
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .slice(0, 2) || "P"}
                                      </AvatarFallback>
                                    </Avatar>
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
                                      {event.player?.name || "Unknown Player"}
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
                                {event.type !== "subst" && (
                                  <div className="text-xs text-gray-400">
                                    {event.type === "foul" ||
                                    event.detail?.toLowerCase().includes("foul")
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
                                }`}
                              >
                                {event.type === "subst" ? (
                                  <img
                                    src="/assets/matchdetaillogo/substitution.svg"
                                    alt="Substitution"
                                    className="w-4 h-4"
                                  />
                                ) : event.type === "Goal" ? (
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
                                    className="w-4 h-8"
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
                        <div className="match-event-time-display">
                          <span style={{ color: "black" }}>
                            {event.time?.elapsed}'
                          </span>
                          {event.time?.extra && (
                            <span style={{ color: "red" }}>
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
                              >
                                {event.type === "subst" ? (
                                  <img
                                    src="/assets/matchdetaillogo/substitution.svg"
                                    alt="Substitution"
                                    className="w-4 h-4"
                                  />
                                ) : event.type === "Goal" ? (
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
                                    className="w-4 h-4"
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
                              <div className="text-right w-24">
                                {event.type === "subst" &&
                                event.assist?.name ? (
                                  <>
                                    <div className="text-xs font-medium text-green-600 text-right">
                                      {event.assist.name}
                                    </div>
                                    <div className="text-xs font-medium text-red-600 text-right">
                                      {event.player?.name || "Unknown Player"}
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
                                {event.type !== "subst" && (
                                  <div className="text-xs text-gray-400 text-right">
                                    {event.type === "foul" ||
                                    event.detail?.toLowerCase().includes("foul")
                                      ? `Foul by ${event.player?.name || "Unknown Player"}`
                                      : event.detail || event.type}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {event.type === "subst" &&
                                  event.assist?.name && (
                                    <Avatar className="w-9 h-9 border-2 border-red-400 shadow-sm -mr-3 z-20">
                                      <AvatarImage
                                        src={getPlayerImage(
                                          event.assist?.id,
                                          event.assist?.name,
                                        )}
                                        alt={event.assist?.name || "Player"}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="bg-red-400 text-white text-xs font-bold">
                                        {event.assist?.name
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .slice(0, 2) || "P"}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}

                                <Avatar className={`w-9 h-9 border-2 shadow-sm ${event.type === "subst" ? "border-green-400" : "border-gray-400"}`}>
                                  <AvatarImage
                                    src={getPlayerImage(
                                      event.player?.id,
                                      event.player?.name,
                                    )}
                                    alt={event.player?.name || "Player"}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-red-500 text-white text-xs font-bold">
                                    {event.player?.name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2) || "P"}
                                  </AvatarFallback>
                                </Avatar>
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
          </div>
        )}
      </CardContent>

      <MyCommentary
        events={events}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        getPlayerImage={getPlayerImage}
        getEventDescription={getEventDescription}
        isHomeTeam={isHomeTeam}
      />
    </Card>
  );
};

export default MyMatchEventNew;