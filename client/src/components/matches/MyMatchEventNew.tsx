import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

import { Clock, RefreshCw, AlertCircle } from "lucide-react";

import "@/styles/MyPlayer.css";
import "@/styles/MyMatchEventNew.css";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

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
}) => {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [commentaryExpanded, setCommentaryExpanded] = useState(false);
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

  const getEventIcon = (eventType: string, detail: string) => {
    if (!eventType) return "📝";

    switch (eventType.toLowerCase()) {
      case "goal":
        return detail?.toLowerCase().includes("penalty") ? "⚽(P)" : "⚽";
      case "card":
        return detail?.toLowerCase().includes("yellow") ? "🟨" : "🟥";
      case "subst":
        return "🔄";
      case "var":
        return "📺";
      default:
        return "📝";
    }
  };

  const formatTime = (elapsed: number, extra?: number) => {
    if (extra) {
      return `${elapsed}+${extra}'`;
    }
    return `${elapsed}'`;
  };

  const getEventDescription = (event: MatchEvent) => {
    const playerName = event.player?.name || "Unknown Player";
    const teamName = event.team?.name || "Unknown Team";
    const assistName = event.assist?.name;
    const detail = event.detail || "";

    if (!event.type) return `${playerName} (${teamName})`;

    switch (event.type.toLowerCase()) {
      case "goal":
        if (detail.toLowerCase().includes("penalty")) {
          return `${playerName} (${teamName}) - Penalty Goal${assistName ? `, assist: ${assistName}` : ""}`;
        } else if (detail.toLowerCase().includes("own goal")) {
          return `${playerName} (${teamName}) - Own Goal`;
        } else {
          return `${playerName} (${teamName}) - Goal${assistName ? `, assist: ${assistName}` : ""}`;
        }
      case "card":
        if (detail.toLowerCase().includes("yellow")) {
          return `${playerName} (${teamName}) - Yellow Card`;
        } else if (detail.toLowerCase().includes("red")) {
          return `${playerName} (${teamName}) - Red Card`;
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
        if (event.type.toLowerCase() === "foul" || detail.toLowerCase().includes("foul")) {
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
      case "goal":
        if (event.detail?.toLowerCase().includes("penalty")) {
          return `${playerName} (${teamName}) converts the penalty kick ${timingContext}${assistName ? `, with the assist credited to ${assistName}` : ""}.`;
        } else if (event.detail?.toLowerCase().includes("own goal")) {
          return `Own goal! ${playerName} (${teamName}) accidentally puts the ball into his own net ${timingContext}.`;
        } else {
          const goalTypes = [
            `Goal! Brilliant finish by ${playerName} (${teamName}) ${timingContext}`,
            `Goal! ${playerName} (${teamName}) finds the back of the net ${timingContext}`,
            `Goal! What a strike from ${playerName} (${teamName}) ${timingContext}`,
            `Goal! ${playerName} (${teamName}) breaks the deadlock ${timingContext}`
          ];
          const randomGoal = goalTypes[Math.floor(Math.random() * goalTypes.length)];
          return `${randomGoal}${assistName ? `. Assist by ${assistName}` : ""}.`;
        }

      case "card":
        if (event.detail?.toLowerCase().includes("yellow")) {
          const yellowReasons = [
            "for a reckless challenge",
            "for dissent",
            "for unsporting behavior", 
            "for delaying the restart",
            "for a tactical foul"
          ];
          const reason = yellowReasons[Math.floor(Math.random() * yellowReasons.length)];
          return `${playerName} (${teamName}) is booked ${reason}.`;
        } else {
          const redReasons = [
            "for serious foul play",
            "for violent conduct", 
            "for a second bookable offense",
            "for denying an obvious goal-scoring opportunity"
          ];
          const reason = redReasons[Math.floor(Math.random() * redReasons.length)];
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
          "reviewing a potential red card incident"
        ];
        const varReason = varReasons[Math.floor(Math.random() * varReasons.length)];
        return `VAR Review: The referee is ${varReason} involving ${playerName} (${teamName}).`;

      default:
        // Handle other event types with detailed descriptions
        if (event.type?.toLowerCase() === "foul" || detail.toLowerCase().includes("foul")) {
          const foulTypes = [
            "commits a foul",
            "is penalized for a foul",
            "makes an illegal challenge",
            "commits an infringement"
          ];
          const foulType = foulTypes[Math.floor(Math.random() * foulTypes.length)];
          return `${playerName} (${teamName}) ${foulType} ${timingContext}${detail ? `. ${detail}` : ""}.`;
        } else if (detail.toLowerCase().includes("offside")) {
          return `Offside! ${playerName} (${teamName}) is caught in an offside position ${timingContext}.`;
        } else if (detail.toLowerCase().includes("corner")) {
          return `Corner kick awarded to ${teamName} ${timingContext}.`;
        } else if (detail.toLowerCase().includes("free kick")) {
          return `Free kick to ${teamName}. ${playerName} prepares to take it ${timingContext}.`;
        } else if (detail.toLowerCase().includes("throw")) {
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
                  ) : (event.type === "goal" || (event.type === "goal" && event.detail?.toLowerCase().includes("penalty"))) ? (
                                  <img
                                    src="/assets/matchdetaillogo/soccer-goal.svg"
                                    alt={event.detail?.toLowerCase().includes("penalty") ? "Penalty Goal" : "Goal"}
                                    className="w-4 h-4"
                                  />
                                ) : (
                    <span className="text-sm flex">
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
        <div className="flex-1 pl-4">
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
                  ) : (event.type === "goal" || (event.type === "goal" && event.detail?.toLowerCase().includes("penalty"))) ? (
                                  <img
                                    src="/assets/matchdetaillogo/soccer-goal.svg"
                                    alt={event.detail?.toLowerCase().includes("penalty") ? "Penalty Goal" : "Goal"}
                                    className="w-4 h-4"
                                  />
                                ) : (
                    <span className="text-sm">
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

  const PenaltyShootoutDisplay = ({ homeScore, awayScore }: { homeScore: number, awayScore: number }) => (
    <div className="penalty-shootout-container">
      {/* Home team penalties */}
      <div className="penalty-home-side">
        {/* Example penalty data - replace with actual penalty events */}
        {[
          { player: "Damion Downs", result: "scored" },
          { player: "John Tolkin", result: "scored" },
          { player: "Alex Freeman", result: "missed" },
          { player: "Sebastian Berhalter", result: "scored" },
          { player: "Malik Tillman", result: "missed" },
        ].map((penalty, index) => (
          <div key={index} className="penalty-row penalty-row-home">
            <div className="penalty-player-info penalty-player-info-home">
              <Avatar className="w-8 h-8 border-2 border-gray-300">
                <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
                  {penalty.player.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="penalty-player-name">{penalty.player}</span>
            </div>
            <div className={`penalty-result ${penalty.result}`}>
              {penalty.result === "scored" ? "⚽" : penalty.result === "missed" ? "❌" : "🥅"}
            </div>
          </div>
        ))}
      </div>

      {/* Center score */}
      <div className="penalty-score-center">
        <div className="penalty-score-display">{homeScore} - {awayScore}</div>
        <div className="penalty-label">Penalties</div>
      </div>

      {/* Away team penalties */}
      <div className="penalty-away-side">
        {/* Example penalty data - replace with actual penalty events */}
        {[
          { player: "Andy Rojas", result: "scored" },
          { player: "Francisco Calvo", result: "scored" },
          { player: "Jefferson Brenes", result: "scored" },
          { player: "Santiago van der Putten", result: "scored" },
          { player: "Juan Pablo Vargas", result: "scored" },
        ].map((penalty, index) => (
          <div key={index} className="penalty-row penalty-row-away">
            <div className={`penalty-result ${penalty.result}`}>
              {penalty.result === "scored" ? "⚽" : penalty.result === "missed" ? "❌" : "🥅"}
            </div>
            <div className="penalty-player-info penalty-player-info-away">
              <Avatar className="w-8 h-8 border-2 border-gray-300">
                <AvatarFallback className="bg-red-500 text-white text-xs font-bold">
                  {penalty.player.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="penalty-player-name">{penalty.player}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
          <div className="space-y-4">
            {/* Show penalty shootout if match ended with penalties */}
            {events.some(event => event.type === "penalty") && (
              <PenaltyShootoutDisplay homeScore={4} awayScore={3} />
            )}

            {/* All events in chronological order without period separators */}
            {events
              .sort((a, b) => b.time.elapsed - a.time.elapsed) // Sort by time, most recent first
              .map((event, index) => {
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
                                <Avatar className="w-9 h-9 border-2 border-green-300 shadow-sm">
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

                                {event.type === "subst" && event.assist?.name && (
                                  <Avatar className="w-9 h-9 border-2 border-red-300 shadow-sm -ml-4 relative-z20">
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

                              <div className="text-right">
                                {event.type === "subst" && event.assist?.name ? (
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
                                {event.type === "goal" && event.assist?.name && (
                                  <div className="text-xs text-gray-600">
                                    (Assist: {event.assist.name})
                                  </div>
                                )}
                                {event.type !== "subst" && (
                                  <div className="text-xs text-gray-400">
                                    {event.type === "foul" || event.detail?.toLowerCase().includes("foul") 
                                      ? `Foul by ${event.player?.name || "Unknown Player"}` 
                                      : (event.detail || event.type)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Column 2: Event Icon */}
                            <div className="match-event-home-icon-column">
                              <div
                                className={`match-event-icon ${
                                  event.type === "goal" ? "goal" : 
                                  event.type === "card" ? "card" : 
                                  "substitution"
                                }`}
                              >
                                {event.type === "subst" ? (
                                  <img
                                    src="/assets/matchdetaillogo/substitution.svg"
                                    alt="Substitution"
                                    className="w-4 h-4"
                                  />
                                ) : (event.type === "goal" || (event.type === "goal" && event.detail?.toLowerCase().includes("penalty"))) ? (
                                  <img
                                    src="/assets/matchdetaillogo/soccer-goal.svg"
                                    alt={event.detail?.toLowerCase().includes("penalty") ? "Penalty Goal" : "Goal"}
                                    className="w-4 h-4"
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
                        {/* Middle: Time display */}
                        <div className="match-event-time-display">
                          {event.time?.elapsed}'
                          {event.time?.extra && ` +${event.time.extra}`}
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
                                  event.type === "goal" ? "goal" : 
                                  event.type === "card" ? "card" : 
                                  "substitution"
                                }`}
                              >
                                {event.type === "subst" ? (
                                  <img
                                    src="/assets/matchdetaillogo/substitution.svg"
                                    alt="Substitution"
                                    className="w-4 h-4"
                                  />
                                ) : (event.type === "goal" || (event.type === "goal" && event.detail?.toLowerCase().includes("penalty"))) ? (
                                  <img
                                    src="/assets/matchdetaillogo/soccer-goal.svg"
                                    alt={event.detail?.toLowerCase().includes("penalty") ? "Penalty Goal" : "Goal"}
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
                              <div className="text-left">
                                {event.type === "subst" && event.assist?.name ? (
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
                                {event.type === "goal" && event.assist?.name && (
                                  <div className="text-xs text-gray-600">
                                    (Assist: {event.assist.name})
                                  </div>
                                )}
                                {event.type !== "subst" && (
                                  <div className="text-xs text-gray-400">
                                    {event.type === "foul" || event.detail?.toLowerCase().includes("foul") 
                                      ? `Foul by ${event.player?.name || "Unknown Player"}` 
                                      : (event.detail || event.type)}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {event.type === "subst" && event.assist?.name && (
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

                                <Avatar className="w-9 h-9 border-2 border-green-400 shadow-sm">
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
              })}
          </div>
        )}
      </CardContent>

      <div className="p-2 border-t flex justify-center items-center">
        <img 
          src="/assets/matchdetaillogo/clock.png" 
          alt="Match Clock" 
          className="w-4 h-4 opacity-80"
        />
      </div>
      {/* 365Scores-inspired Expandable Commentary Section */}
      <div className="expandable-commentary-container">
        <div 
          className="expandable-commentary-header"
          onClick={() => setCommentaryExpanded(!commentaryExpanded)}
        >
          <div className="expandable-commentary-title">
            Match Commentary
          </div>
          <div className="expandable-commentary-toggle">
            <span className="commentary-show-more-text">
              {commentaryExpanded ? 'See Less' : 'See More'}
            </span>
            <svg 
              className={`expandable-commentary-arrow ${commentaryExpanded ? 'expanded' : ''}`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </div>
        </div>

        <div className={`expandable-commentary-content ${commentaryExpanded ? 'expanded' : ''}`}>
          <div className="expandable-commentary-timeline">
            {events
              .sort((a, b) => b.time.elapsed - a.time.elapsed)
              .slice(0, commentaryExpanded ? events.length : 5)
              .map((event, index) => {
                const timeDisplay = `${event.time.elapsed}'${event.time.extra ? `+${event.time.extra}` : ''}`;
                const eventDescription = getEventDescription(event);
                const isImportant = event.type === "goal" || (event.type === "card" && event.detail?.toLowerCase().includes("red"));

                return (
                  <div key={`commentary-${index}`} className={`commentary-event-item ${isImportant ? 'commentary-event-important' : ''}`}>
                    <div className="commentary-time-badge">
                      {timeDisplay}
                    </div>

                    <div className="commentary-event-content">
                      <div className="commentary-event-text">
                        {event.type === "goal" && (
                          <span className="inline-flex items-center gap-1 mr-2">
                            <img 
                              src="/assets/matchdetaillogo/soccer-ball.svg" 
                              alt="Goal" 
                              className="w-4 h-4"
                            />
                          </span>
                        )}
                        {event.type === "card" && (
                          <span className="inline-flex items-center gap-1 mr-2">
                            {event.detail?.toLowerCase().includes("yellow") ? "🟨" : "🟥"}
                          </span>
                        )}
                        {event.type === "subst" && (
                          <span className="inline-flex items-center gap-1 mr-2">
                            <img 
                              src="/assets/matchdetaillogo/substitution.svg" 
                              alt="Substitution" 
                              className="w-4 h-4"
                            />
                          </span>
                        )}
                        {eventDescription}
                      </div>
                      <div className="commentary-event-meta">
                        {generateCommentaryText(event)}
                      </div>
                    </div>
                  </div>
                );
              })}

            {!commentaryExpanded && events.length > 5 && (
              <div className="text-center mt-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCommentaryExpanded(true);
                  }}
                  className="commentary-show-more-button"
                >
                  <span className="commentary-show-more-text">
                    Show {events.length - 5} more events
                  </span>
                  <svg className="expandable-commentary-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MyMatchEventNew;