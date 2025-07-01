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
    const assistName = event.assist?.name;

    if (!event.type) return playerName;

    switch (event.type.toLowerCase()) {
      case "goal":
        return `${playerName}${assistName ? ` (assist: ${assistName})` : ""}`;
      case "card":
        return `${playerName}`;
      case "subst":
        return `${playerName}`;
      default:
        return `${playerName}`;
    }
  };

  const generateCommentaryText = (event: MatchEvent) => {
    const playerName = event.player?.name || "Unknown Player";
    const teamName = event.team?.name || "Unknown Team";
    const assistName = event.assist?.name;
    const homeTeamName = homeTeam || "Home Team";
    const awayTeamName = awayTeam || "Away Team";

    // Determine if this is a home or away team goal for score display
    const isHomeTeamEvent = event.team?.name?.toLowerCase() === homeTeam?.toLowerCase();
    const currentHomeScore = events.filter(e => 
      e.type === "goal" && 
      e.team?.name?.toLowerCase() === homeTeam?.toLowerCase() && 
      e.time.elapsed <= event.time.elapsed
    ).length;
    const currentAwayScore = events.filter(e => 
      e.type === "goal" && 
      e.team?.name?.toLowerCase() === awayTeam?.toLowerCase() && 
      e.time.elapsed <= event.time.elapsed
    ).length;

    switch (event.type?.toLowerCase()) {
      case "goal":
        if (event.detail?.toLowerCase().includes("penalty")) {
          return `Goal! ${homeTeamName} ${currentHomeScore}, ${awayTeamName} ${currentAwayScore}. ${playerName} (${teamName}) converts the penalty kick to the bottom right corner.`;
        } else if (assistName) {
          const shotTypes = ["header from very close range", "right footed shot from the centre of the box", "left footed shot from outside the box", "header from the left side of the six yard box", "right footed shot from the right side of the box"];
          const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];
          const corners = ["bottom right corner", "bottom left corner", "top right corner", "top left corner", "centre of the goal"];
          const corner = corners[Math.floor(Math.random() * corners.length)];
          return `Goal! ${homeTeamName} ${currentHomeScore}, ${awayTeamName} ${currentAwayScore}. ${playerName} (${teamName}) ${shotType} to the ${corner}. Assisted by ${assistName}.`;
        } else {
          const shotTypes = ["header from very close range", "right footed shot from the centre of the box", "left footed shot from outside the box", "header from the left side of the six yard box", "right footed shot from the right side of the box"];
          const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];
          const corners = ["bottom right corner", "bottom left corner", "top right corner", "top left corner", "centre of the goal"];
          const corner = corners[Math.floor(Math.random() * corners.length)];
          return `Goal! ${homeTeamName} ${currentHomeScore}, ${awayTeamName} ${currentAwayScore}. ${playerName} (${teamName}) ${shotType} to the ${corner}.`;
        }

      case "card":
        const cardType = event.detail?.toLowerCase().includes("yellow") ? "Yellow card" : "Red card";
        const cardReasons = ["unsporting behaviour", "dissent by word or action", "persistent fouling", "delaying the restart of play", "failure to respect the required distance", "entering or re-entering the field of play without the referee's permission"];
        const cardReason = cardReasons[Math.floor(Math.random() * cardReasons.length)];
        return `${cardType}, ${teamName}. ${playerName} is shown the ${cardType.toLowerCase()} for ${cardReason}.`;

      case "subst":
        if (assistName) {
          return `Substitution, ${teamName}. ${assistName} replaces ${playerName} because of tactical reasons.`;
        } else {
          return `Substitution, ${teamName}. ${playerName} comes on for tactical reasons.`;
        }

      case "var":
        return `VAR Review: ${event.detail || "Decision under review"} - ${teamName}. The referee is checking a potential incident.`;

      case "foul":
        const foulTypes = ["holding", "pushing", "tripping", "kicking", "jumping into"];
        const foulType = foulTypes[Math.floor(Math.random() * foulTypes.length)];
        return `Foul by ${playerName} (${teamName}). ${playerName} commits a foul for ${foulType} an opponent.`;

      case "freekick":
        const freeKickAreas = ["in the attacking half", "in the defensive half", "on the right wing", "on the left wing", "in a dangerous position"];
        const freeKickArea = freeKickAreas[Math.floor(Math.random() * freeKickAreas.length)];
        return `${playerName} (${teamName}) wins a free kick ${freeKickArea}.`;

      case "offside":
        return `Offside, ${teamName}. ${playerName} is caught offside and the flag is raised by the assistant referee.`;

      case "corner":
        return `Corner, ${teamName}. Conceded by ${assistName || "a defender"} after the ball goes out of play.`;

      case "attempt":
        if (event.detail?.toLowerCase().includes("saved")) {
          const saveTypes = ["brilliant save", "comfortable save", "diving save", "reflex save", "easy save"];
          const saveType = saveTypes[Math.floor(Math.random() * saveTypes.length)];
          return `Attempt saved. ${playerName} (${teamName}) shot is saved by the goalkeeper with a ${saveType}.`;
        } else if (event.detail?.toLowerCase().includes("missed")) {
          const missTypes = ["goes wide", "goes over the bar", "hits the post", "hits the crossbar"];
          const missType = missTypes[Math.floor(Math.random() * missTypes.length)];
          return `Attempt missed. ${playerName} (${teamName}) shot ${missType} from close range.`;
        } else if (event.detail?.toLowerCase().includes("blocked")) {
          return `Attempt blocked. ${playerName} (${teamName}) shot is blocked by a defender in the penalty area.`;
        } else {
          const attemptTypes = ["a shot", "a header", "a volley", "a curled effort", "a powerful drive"];
          const attemptType = attemptTypes[Math.floor(Math.random() * attemptTypes.length)];
          return `${playerName} (${teamName}) attempts ${attemptType} from outside the penalty area.`;
        }

      case "delay":
        const delayReasons = ["due to an injury", "due to a VAR check", "due to crowd trouble", "due to weather conditions"];
        const delayReason = event.detail || delayReasons[Math.floor(Math.random() * delayReasons.length)];
        return `Delay in match ${delayReason}. The referee has stopped play temporarily.`;

      case "injury":
        return `Delay in match because of an injury to ${playerName} (${teamName}). Medical staff are attending to the player.`;

      default:
        if (event.comments) {
          return event.comments;
        }
        // Enhanced default case to handle more event types
        if (event.detail?.toLowerCase().includes("foul")) {
          return `Foul by ${playerName} (${teamName}). The referee awards a free kick to the opposing team.`;
        } else if (event.detail?.toLowerCase().includes("free kick")) {
          return `${playerName} (${teamName}) wins a free kick in a promising position.`;
        } else if (event.detail?.toLowerCase().includes("offside")) {
          return `Offside, ${teamName}. ${playerName} is caught offside by the assistant referee.`;
        } else if (event.detail?.toLowerCase().includes("corner")) {
          return `Corner kick awarded to ${teamName}. The ball went out of play off a defending player.`;
        } else if (event.detail?.toLowerCase().includes("attempt")) {
          return `${playerName} (${teamName}) ${event.detail} but fails to find the target.`;
        } else {
          return `${event.detail || event.type} involving ${playerName} from ${teamName}.`;
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
                                    {event.detail || event.type}
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
                                    {event.detail || event.type}
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
      <div className="p-2 border-t flex justify-center items-center text-xs">
        <span>Commentary</span>
      </div>

      {/* Commentary Events Section */}
      <div className="border-t ">
        <div className="p-4 space-y-3 max-h-280 overflow-y-auto">
          {/* Real-time Commentary Events */}
          {events.map((event, index) => {
            const timeDisplay = `${event.time.elapsed}'${event.time.extra ? `+${event.time.extra}` : ''}`;
            const commentaryText = generateCommentaryText(event);

            return (
            <div key={`commentary-${index}`} className="commentary-event-container">
              <div className="flex gap-3">
                {/* Time Column */}
                <div className="flex flex-col items-center min-w-[50px]">
                  <div className="text-xs font-md text-red-500">
                    {timeDisplay}
                  </div>
                  <div className="text-xs text-gray-800 ">
                    {event.time.elapsed}
                  </div>
                  {index < events.length - 0 && (
                    <div className="w-0.5 h-4 bg-gray-800 mt-1"></div>
                  )}
                </div>

                {/* Content Column */}
                <div className="flex-1">
                  {event.type === "goal" ? (
                    <div className="flex items-start gap-2">
                      <img 
                        src="/assets/matchdetaillogo/soccer-ball.svg" 
                        alt="Goal" 
                        className="w-5 h-5 opacity-80 mt-0.5"
                      />
                      <div className="text-sm font-bold text-gray-900 leading-relaxed">
                        {commentaryText}
                      </div>
                    </div>
                  ) : event.type === "card" ? (
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">
                        {event.detail?.toLowerCase().includes("yellow") ? "🟨" : "🟥"}
                      </span>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {commentaryText}
                      </div>
                    </div>
                  ) : event.type === "subst" ? (
                    <div className="flex items-start gap-2">
                      <img 
                        src="/assets/matchdetaillogo/substitution.svg" 
                        alt="Substitution" 
                        className="w-4 h-4 opacity-60 mt-0.5"
                      />
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {commentaryText}
                      </div>
                    </div>
                  ) : event.type === "var" ? (
                    <div className="flex items-start gap-2">
                      <span className="text-xs mt-0.5">📺</span>
                      <div className="text-xs text-gray-700 leading-relaxed">
                        {commentaryText}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 leading-relaxed ml-6">
                      {commentaryText}
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default MyMatchEventNew;