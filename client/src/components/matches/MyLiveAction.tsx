import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MyHighlights from "./MyHighlights";
import "../../styles/liveaction.css";
import "../../styles/365scores-live-action.css";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";
import MyCircularFlag from "@/components/common/MyCircularFlag";
import { isNationalTeam } from "@/lib/teamLogoSources";

interface MyLiveActionProps {
  matchId?: number;
  homeTeam?: any;
  awayTeam?: any;
  status?: string;
  className?: string;
}

interface PlayByPlayEvent {
  id: string;
  minute: number;
  team: "home" | "away";
  type:
    | "goal"
    | "substitution"
    | "card"
    | "corner"
    | "freekick"
    | "offside"
    | "foul"
    | "shot"
    | "save"
    | "attempt"
    | "attack";
  player: string;
  description: string;
  timestamp: number;
  isRecent?: boolean;
  x?: number;
  y?: number;
  playerOut?: string;
  playerIn?: string;
}

interface AttackZone {
  id: string;
  team: "home" | "away";
  type: "attacking" | "ball_safe" | "dangerous_attack";
  opacity: number;
  timestamp: number;
}

interface TeamStats {
  corners: { home: number; away: number };
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  fouls: { home: number; away: number };
  lastFiveMatches: {
    home: ("W" | "L" | "D")[];
    away: ("W" | "L" | "D")[];
  };
  previousMeetings: {
    homeWins: number;
    draws: number;
    awayWins: number;
  };
}

interface LiveCommentary {
  id: string;
  minute: number;
  text: string;
  team?: "home" | "away";
  timestamp: number;
  isImportant?: boolean;
}

const MyLiveAction: React.FC<MyLiveActionProps> = ({
  matchId,
  homeTeam,
  awayTeam,
  status,
  className = "",
}) => {
  const [liveData, setLiveData] = useState<any>(null);
  const [playByPlayEvents, setPlayByPlayEvents] = useState<PlayByPlayEvent[]>(
    [],
  );
  const [liveCommentary, setLiveCommentary] = useState<LiveCommentary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<PlayByPlayEvent | null>(
    null,
  );
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [attackZones, setAttackZones] = useState<AttackZone[]>([]);
  const [ballPossession, setBallPossession] = useState<"home" | "away" | null>(
    "home",
  );
  const [teamStats, setTeamStats] = useState<TeamStats>({
    corners: { home: 0, away: 0 },
    possession: { home: 50, away: 50 },
    shots: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    lastFiveMatches: {
      home: ["W", "W", "L", "W", "W"],
      away: ["W", "W", "W", "W", "D"],
    },
    previousMeetings: { homeWins: 16, draws: 16, awayWins: 11 },
  });
  const [currentView, setCurrentView] = useState<
    "event" | "stats" | "history" | "corners" | "shotmap" | "commentary"
  >("event");
  const [ballTarget, setBallTarget] = useState({ x: 50, y: 50 });
  const [shotEvents, setShotEvents] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      team: "home" | "away";
      isGoal: boolean;
      timestamp: number;
    }>
  >([]);
  const [matchIntensity, setMatchIntensity] = useState<
    "low" | "medium" | "high"
  >("medium");

  // Determine if match is currently live
  const displayMatch = liveData;
  const currentStatus = status || displayMatch?.fixture?.status?.short;
  const isLive =
    currentStatus &&
    ["1H", "2H", "LIVE", "LIV", "HT", "ET", "P", "INT"].includes(currentStatus);
  const elapsed = displayMatch?.fixture?.status?.elapsed || 0;

  // Debug logging for status detection
  console.log(`🔍 [Live Action] Match ${matchId} status check:`, {
    currentStatus,
    isLive,
    elapsed,
    fixtureStatus: displayMatch?.fixture?.status,
  });

  // Fetch initial match data and set up real-time updates
  useEffect(() => {
    if (!matchId) {
      console.log("❌ [Live Action] No match ID provided");
      return;
    }

    let mounted = true;
    let updateInterval: NodeJS.Timeout;

    const fetchMatchData = async () => {
      try {
        setIsLoading(true);

        const liveResponse = await fetch(`/api/fixtures/live?_t=${Date.now()}`);
        if (liveResponse.ok && mounted) {
          const liveFixtures = await liveResponse.json();
          const liveMatch = liveFixtures.find(
            (fixture: any) => fixture.fixture.id === matchId,
          );

          if (liveMatch && mounted) {
            setLiveData(liveMatch);
            await generatePlayByPlayEvents(liveMatch);
            setIsLoading(false);
            return liveMatch;
          }
        }

        const matchResponse = await fetch(`/api/fixtures?ids=${matchId}`);
        if (matchResponse.ok && mounted) {
          const matchData = await matchResponse.json();
          if (matchData.length > 0) {
            const match = matchData[0];
            setLiveData(match);
            await generatePlayByPlayEvents(match);
            setIsLoading(false);
            return match;
          }
        }

        setIsLoading(false);
        return null;
      } catch (error) {
        if (mounted) {
          console.error("❌ [Live Action] Error fetching match data:", error);
          setIsLoading(false);
        }
        return null;
      }
    };

    fetchMatchData().then((match) => {
      if (match && mounted) {
        const status = match.fixture?.status?.short;
        const isLive = [
          "1H",
          "2H",
          "LIVE",
          "LIV",
          "HT",
          "ET",
          "P",
          "INT",
        ].includes(status);

        if (isLive) {
          updateInterval = setInterval(() => {
            generateDynamicEvent();
            updateLiveCommentary();
          }, 30000); // Slower updates to reduce flickering
        }
      }
    });

    return () => {
      mounted = false;
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      setLiveData(null);
      setPlayByPlayEvents([]);
      setCurrentEvent(null);
      setAttackZones([]);
      setLiveCommentary([]);
    };
  }, [matchId]);

  // Event-driven ball movement with purposeful patterns
  const [ballTrail, setBallTrail] = useState<
    Array<{ x: number; y: number; timestamp: number }>
  >([]);
  const [currentBallEvent, setCurrentBallEvent] = useState<string | null>(null);
  const [ballMovementActive, setBallMovementActive] = useState(false);

  useEffect(() => {
    if (!isLive || !ballMovementActive) return;

    const ballInterval = setInterval(() => {
      setBallPosition((prev) => {
        // Move towards target in straight line with fast, precise movement
        const deltaX = ballTarget.x - prev.x;
        const deltaY = ballTarget.y - prev.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // If close to target, snap to it and stop movement
        if (distance < 1.5) {
          setBallMovementActive(false);
          setCurrentBallEvent(null);
          return { x: ballTarget.x, y: ballTarget.y };
        }

        const moveSpeed = 2; // Faster movement for 365scores style

        // Calculate precise direction vector (no randomness)
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;

        let newX = prev.x + directionX * moveSpeed;
        let newY = prev.y + directionY * moveSpeed;

        // Keep ball within field bounds
        newX = Math.max(10, Math.min(90, newX));
        newY = Math.max(20, Math.min(80, newY));

        // Update possession based on ball position and event type
        if (currentBallEvent === "dangerous_attack") {
          setBallPossession(newX > 50 ? "away" : "home");
        } else if (currentBallEvent === "ball_safe") {
          setBallPossession(newX < 50 ? "home" : "away");
        } else {
          setBallPossession(
            newX < 35
              ? "home"
              : newX > 65
                ? "away"
                : Math.random() > 0.5
                  ? "home"
                  : "away",
          );
        }

        // Add to trail for straight line visualization
        setBallTrail((currentTrail) => {
          const newTrail = [
            ...currentTrail,
            { x: newX, y: newY, timestamp: Date.now() },
          ];
          return newTrail.slice(-15); // Longer trail like in the image
        });

        return { x: newX, y: newY };
      });
    }, 60); // Smoother movement

    return () => clearInterval(ballInterval);
  }, [isLive, ballTarget, ballMovementActive, currentBallEvent]);

  // Event-driven ball target setting
  const triggerBallMovement = (eventType: string, team: "home" | "away") => {
    // Clear previous trail when starting a new event and add current ball position
    setBallTrail([{ x: ballPosition.x, y: ballPosition.y, timestamp: Date.now() }]);

    let targetPosition;

    switch (eventType) {
      case "dangerous_attack":
        // Move toward opponent's goal area
        targetPosition =
          team === "home"
            ? { x: 85, y: 45 + Math.random() * 10 } // Attack right goal
            : { x: 15, y: 45 + Math.random() * 10 }; // Attack left goal
        break;

      case "shot":
        // Move directly toward goal
        targetPosition =
          team === "home"
            ? { x: 92, y: 48 + Math.random() * 4 } // Shot at right goal
            : { x: 8, y: 48 + Math.random() * 4 }; // Shot at left goal
        break;

      case "corner":
        // Move to actual corner flag positions (outside penalty box)
        const corners =
          team === "home"
            ? [
                { x: 98, y: 10 },
                { x: 98, y: 90 },
              ] // Right corners - outside penalty area
            : [
                { x: 2, y: 10 },
                { x: 2, y: 90 },
              ]; // Left corners - outside penalty area
        targetPosition = corners[Math.floor(Math.random() * corners.length)];
        break;

      case "goalkick":
        // Move to goal area
        targetPosition =
          team === "home"
            ? { x: 8, y: 50 } // Home goal
            : { x: 92, y: 50 }; // Away goal
        break;
      case "foul":
        // Move to a random position in the middle of the field
        targetPosition = { x: 50 + Math.random() * 20 - 10, y: 50 + Math.random() * 20 - 10 };
        break;

      case "freekick":
        // Move to a position closer to the opponent's goal
        targetPosition =
          team === "home"
            ? { x: 70 + Math.random() * 20, y: 30 + Math.random() * 40 }
            : { x: 10 + Math.random() * 20, y: 30 + Math.random() * 40 };
        break;

      case "throwin":
        // Move to a position on the side of the field
        targetPosition =
          team === "home"
            ? { x: 90, y: 20 + Math.random() * 60 }
            : { x: 10, y: 20 + Math.random() * 60 };
        break;

      case "ball_safe":
        // Move to midfield or defensive areas
        targetPosition =
          team === "home"
            ? { x: 25 + Math.random() * 20, y: 35 + Math.random() * 30 } // Home half
            : { x: 55 + Math.random() * 20, y: 35 + Math.random() * 30 }; // Away half
        break;

      default:
        // Default attacking movement
        targetPosition =
          team === "home"
            ? { x: 70 + Math.random() * 15, y: 35 + Math.random() * 30 } // Forward movement
            : { x: 15 + Math.random() * 15, y: 35 + Math.random() * 30 }; // Forward movement
    }

    setCurrentBallEvent(eventType);
    setBallTarget(targetPosition);
    setBallMovementActive(true);
  };

  // Update live commentary like 365scores
  const updateLiveCommentary = () => {
    const commentaryTexts = [
      "Great passing sequence in midfield",
      "Player making a run down the wing",
      "Defensive clearance from danger",
      "Quick counter-attack developing",
      "Good defensive positioning",
      "Ball played wide to create space",
      "Team pressing high up the pitch",
      "Tactical substitution being prepared",
      "Players calling for the ball",
      "Good ball control under pressure",
      "Foul committed, free kick awarded",
      "Throw-in opportunity for the team",
    ];

    const newCommentary: LiveCommentary = {
      id: `commentary_${Date.now()}`,
      minute: elapsed,
      text: commentaryTexts[Math.floor(Math.random() * commentaryTexts.length)],
      team: Math.random() > 0.5 ? "home" : "away",
      timestamp: Date.now(),
      isImportant: Math.random() > 0.8,
    };

    setLiveCommentary((prev) => [newCommentary, ...prev.slice(0, 9)]);
  };

  // Clean up old events and effects
  useEffect(() => {
    const cleanup = setInterval(() => {
      // Don't auto-clear ball trail - only clear when new event starts

      setShotEvents((current) =>
        current.filter((event) => Date.now() - event.timestamp < 4000),
      );

      setLiveCommentary(
        (current) =>
          current.filter((comment) => Date.now() - comment.timestamp < 300000), // Keep for 5 minutes
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  // State for various effects
  const [goalKickEvents, setGoalKickEvents] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      team: "home" | "away";
      timestamp: number;
    }>
  >([]);
  const [cornerKickEvents, setCornerKickEvents] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      team: "home" | "away";
      timestamp: number;
      corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    }>
  >([]);
  const [substitutionEvents, setSubstitutionEvents] = useState<
    Array<{
      id: string;
      team: "home" | "away";
      playerOut: string;
      playerIn: string;
      timestamp: number;
    }>
  >([]);

  // Generate dynamic events
  const generateDynamicEvent = () => {
    const teams = ["home", "away"];
    const randomTeam = teams[Math.floor(Math.random() * teams.length)] as
      | "home"
      | "away";

    // Determine event type and intensity based on current game flow
    let randomType: "attacking" | "ball_safe" | "dangerous_attack";
    let eventType:
      | "attack"
      | "shot"
      | "goal"
      | "goalkick"
      | "corner"
      | "substitution"
      | "foul"
      | "freekick"
      | "throwin" = "attack";

    // Generate events based on probability and game situation
    const eventProbability = Math.random();

    if (eventProbability > 0.93) {
      // Foul (7% chance)
      eventType = "foul";
      randomType = "ball_safe";
      setMatchIntensity("medium");
      triggerBallMovement("foul", randomTeam);
    } else if (eventProbability > 0.88) {
      // Dangerous attack (5% chance)
      eventType = Math.random() > 0.7 ? "shot" : "attack";
      randomType = "dangerous_attack";
      setMatchIntensity("high");

      if (eventType === "shot") {
        // Create shot event
        const shotEvent = {
          id: `shot_${Date.now()}`,
          x:
            randomTeam === "home"
              ? 80 + Math.random() * 10
              : 10 + Math.random() * 10,
          y: 40 + Math.random() * 20,
          team: randomTeam,
          isGoal: Math.random() > 0.87, // 13% chance of goal
          timestamp: Date.now(),
        };

        setShotEvents((prev) => [...prev.slice(-9), shotEvent]);

        setTeamStats((prev) => ({
          ...prev,
          shots: {
            ...prev.shots,
            [randomTeam]: prev.shots[randomTeam] + 1,
          },
        }));
      }

      // Trigger ball movement for dangerous attack
      triggerBallMovement("dangerous_attack", randomTeam);
    } else if (eventProbability > 0.78) {
      // Corner kick (10% chance)
      eventType = "corner";
      randomType = "attacking";
      setMatchIntensity("medium");

      const cornerPositions = [
        { corner: "top-left" as const, x: 2, y: 10 },
        { corner: "top-right" as const, x: 98, y: 10 },
        { corner: "bottom-left" as const, x: 2, y: 90 },
        { corner: "bottom-right" as const, x: 98, y: 90 },
      ];

      const selectedCorner =
        cornerPositions[Math.floor(Math.random() * cornerPositions.length)];

      const cornerKickEvent = {
        id: `corner_${Date.now()}`,
        x: selectedCorner.x,
        y: selectedCorner.y,
        team: randomTeam,
        corner: selectedCorner.corner,
        timestamp: Date.now(),
      };

      setCornerKickEvents((prev) => [...prev.slice(-4), cornerKickEvent]);
      triggerBallMovement("corner", randomTeam);
    } else if (eventProbability > 0.68) {
      // Goal kick (10% chance)
      eventType = "goalkick";
      randomType = "ball_safe";
      setMatchIntensity("low");

      const goalKickEvent = {
        id: `goalkick_${Date.now()}`,
        x: randomTeam === "home" ? 8 : 92,
        y: 50,
        team: randomTeam,
        timestamp: Date.now(),
      };

      setGoalKickEvents((prev) => [...prev.slice(-4), goalKickEvent]);
      triggerBallMovement("goalkick", randomTeam);
    } else if (eventProbability > 0.63) {
      // Free kick (5% chance)
      eventType = "freekick";
      randomType = "attacking";
      setMatchIntensity("medium");
      triggerBallMovement("freekick", randomTeam);
    } else if (eventProbability > 0.58) {
      // Throw in (5% chance)
      eventType = "throwin";
      randomType = "ball_safe";
      setMatchIntensity("low");
      triggerBallMovement("throwin", randomTeam);
    } else if (eventProbability > 0.53) {
      // Ball safe / possession (5% chance)
      eventType = "attack";
      randomType = "ball_safe";
      setMatchIntensity("low");

      triggerBallMovement("ball_safe", randomTeam);
    } else {
      // Regular attack (5% chance)
      eventType = "attack";
      randomType = "attacking";
      setMatchIntensity("medium");
      triggerBallMovement("attack", randomTeam);
    }

    // Create attack zone
    const newZone: AttackZone = {
      id: `zone_${Date.now()}`,
      team: randomTeam,
      type: randomType,
      opacity:
        matchIntensity === "high"
          ? 0.4
          : matchIntensity === "medium"
            ? 0.3
            : 0.2,
      timestamp: Date.now(),
    };

    setAttackZones((prev) => [newZone, ...prev.slice(0, 1)]);

    // Create corresponding event
    const eventDescriptions = {
      attacking:
        eventType === "shot"
          ? "Shot Attempt"
          : eventType === "corner"
            ? "Corner kick"
            : eventType === "freekick"
              ? "Free kick"
              : "Attacking Move",
      ball_safe:
        eventType === "goalkick"
          ? "Goal kick"
          : eventType === "throwin"
            ? "Throw-in"
            : "Safe Possession",
      dangerous_attack:
        eventType === "goal"
          ? "GOAL!"
          : eventType === "shot"
            ? "Shot on Target"
            : "Dangerous Attack",
    };

    const newEvent: PlayByPlayEvent = {
      id: `event_${Date.now()}`,
      minute: elapsed,
      team: randomTeam,
      type: eventType as any,
      player:
        randomTeam === "home"
          ? homeTeamData?.name || "Home Team"
          : awayTeamData?.name || "Away Team",
      description: eventDescriptions[randomType] || "Match Event",
      timestamp: Date.now(),
      isRecent: true,
    };

    setCurrentEvent(newEvent);
    setPlayByPlayEvents((prev) => [newEvent, ...prev.slice(0, 4)]);

    // Cycle through different views including commentary
    setTimeout(() => {
      const views: (
        | "event"
        | "stats"
        | "history"
        | "corners"
        | "shotmap"
        | "commentary"
      )[] = ["stats", "history", "corners", "shotmap", "commentary"];
      const randomView = views[Math.floor(Math.random() * views.length)];
      setCurrentView(randomView);
    }, 3500);

    // Clear zone and reset view
    setTimeout(() => {
      setAttackZones((prev) => prev.filter((z) => z.id !== newZone.id));
      setCurrentView("event");
      setCurrentEvent(null);
    }, 7000);
  };

  const generatePlayByPlayEvents = async (matchData: any) => {
    try {
      const response = await fetch(
        `/api/fixtures/${matchData.fixture.id}/events`,
      );
      let realEvents: any[] = [];

      if (response.ok) {
        realEvents = await response.json();
      }

      const homeTeam = matchData.teams?.home;
      const awayTeam = matchData.teams?.away;
      const elapsed = matchData.fixture?.status?.elapsed || 0;
      const events: PlayByPlayEvent[] = [];

      if (realEvents.length > 0) {
        const recentEvents = realEvents
          .filter((event) => event.time?.elapsed <= elapsed)
          .slice(-3)
          .reverse();

        recentEvents.forEach((event, index) => {
          const isHomeTeam = event.team?.id === homeTeam?.id;
          const team = isHomeTeam ? "home" : "away";

          let eventType = "attempt";
          let description = event.detail || "Match event";

          if (event.type === "Goal") {
            eventType = "goal";
            description = "Goal scored";
          } else if (event.detail?.toLowerCase().includes("corner")) {
            eventType = "corner";
            description = "Corner kick";
          } else if (event.detail?.toLowerCase().includes("foul")) {
            eventType = "foul";
            description = "Foul committed";
          } else if (event.detail?.toLowerCase().includes("free kick")) {
            eventType = "freekick";
            description = "Free kick";
          } else if (event.detail?.toLowerCase().includes("throw-in")) {
            eventType = "throwin";
            description = "Throw-in";
          }

          events.push({
            id: `real_event_${event.time?.elapsed}_${index}`,
            minute: event.time?.elapsed || elapsed,
            team,
            type: eventType as any,
            player: event.player?.name || "Player",
            description,
            timestamp: Date.now() - index * 10000,
            isRecent: index === 0,
          });
        });

        // Update team stats from real events
        const homeCorners = realEvents.filter(
          (e) =>
            e.team?.id === homeTeam?.id &&
            e.detail?.toLowerCase().includes("corner"),
        ).length;
        const awayCorners = realEvents.filter(
          (e) =>
            e.team?.id === awayTeam?.id &&
            e.detail?.toLowerCase().includes("corner"),
        ).length;

        setTeamStats((prev) => ({
          ...prev,
          corners: { home: homeCorners, away: awayCorners },
        }));
      }

      setPlayByPlayEvents(events);
    } catch (error) {
      console.error("❌ [Live Action] Error fetching real events:", error);
    }
  };

  const homeTeamData = homeTeam || displayMatch?.teams?.home;
  const awayTeamData = awayTeam || displayMatch?.teams?.away;

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-800 text-sm font-semibold">
                Live Action
              </span>
            </div>
          </div>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-green-500 mx-auto mb-2"></div>
              <p>Loading live action...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything for finished matches - check both current status and fixture status
  const fixtureStatus = displayMatch?.fixture?.status?.short;
  const isFinished = [
    "FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"
  ].includes(currentStatus) || [
    "FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"
  ].includes(fixtureStatus);

  if (isFinished) {
    console.log(
      `🏁 [Live Action] Match ${matchId} is finished (status: ${currentStatus} / fixture: ${fixtureStatus}), not rendering Live Action`,
    );
    return null;
  }

  if (!displayMatch) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 text-sm font-semibold">
              Live Action
            </span>
          </div>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="mb-1 font-medium">Match data not available</p>
              <p className="text-xs opacity-60 mb-2">
                {homeTeamData?.name || homeTeam?.name || homeTeam} vs{" "}
                {awayTeamData?.name || awayTeamData?.name || awayTeam}
              </p>
              <p className="text-xs text-gray-400">
                Live tracking is only available during active matches
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-gray-800 text-sm font-semibold">
              Live Action
            </span>
          </div>
          <div className="h-80 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="mb-1 font-medium">Match not live</p>
              <p className="text-xs opacity-60 mb-2">
                {homeTeamData?.name} vs {awayTeamData?.name}
              </p>
              <p className="text-xs text-gray-400">
                Status: {currentStatus || "Unknown"} • Live action will appear
                when match is in progress
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getMatchResult = (result: "W" | "L" | "D") => {
    const colors = {
      W: "bg-blue-500 text-white",
      L: "bg-red-500 text-white",
      D: "bg-gray-400 text-white",
    };
    return colors[result];
  };

  const getIntensityColor = () => {
    switch (matchIntensity) {
      case "high":
        return "border-red-500 bg-red-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      case "low":
        return "border-green-500 bg-green-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  return (
    <div
      className={`w-full ${className} professional-live-action`}
      style={{ zIndex: 1, position: "relative" }}
    >
      <div
        className={`bg-white rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-300 ${getIntensityColor()}`}
      >
        {/* Simplified Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <span className="text-gray-800 text-sm font-semibold">
              Live Action
            </span>
          </div>
        </div>

        {/* Professional Football Field */}
        <div
          className="relative h-96 overflow-hidden"
          style={{
            backgroundImage: `url('/assets/matchdetaillogo/field.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            minHeight: "400px",
          }}
        >
          {/* Enhanced attack zones with 365scores style */}
          {attackZones.map((zone) => (
            <div key={zone.id} className="absolute inset-0 pointer-events-none">
              <div
                className={`absolute transition-all duration-1000 attack-zone ${
                  zone.type === "dangerous_attack"
                    ? zone.team === "home"
                      ? "bg-gradient-to-r from-blue-600/70 via-blue-700/80 to-blue-500/50"
                      : "bg-gradient-to-l from-red-600/70 via-red-700/80 to-red-500/50"
                    : zone.team === "home"
                      ? "bg-gradient-to-r from-blue-500/50 via-blue-600/60 to-transparent"
                      : "bg-gradient-to-l from-red-500/50 via-red-600/60 to-transparent"
                }`}
                style={{
                  top: zone.type === "dangerous_attack" ? "10%" : "15%",
                  bottom: zone.type === "dangerous_attack" ? "10%" : "15%",
                  left:
                    zone.team === "home"
                      ? zone.type === "dangerous_attack"
                        ? "0%"
                        : "5%"
                      : "30%",
                  right:
                    zone.team === "home"
                      ? "30%"
                      : zone.type === "dangerous_attack"
                        ? "0%"
                        : "5%",
                  clipPath:
                    zone.team === "home"
                      ? zone.type === "dangerous_attack"
                        ? "polygon(0% 0%, 80% 0%, 85% 50%, 80% 100%, 0% 100%)"
                        : "polygon(0% 0%, 70% 0%, 75% 50%, 70% 100%, 0% 100%)"
                      : zone.type === "dangerous_attack"
                        ? "polygon(20% 0%, 100% 0%, 100% 100%, 20% 100%, 15% 50%)"
                        : "polygon(30% 0%, 100% 0%, 100% 100%, 30% 100%, 25% 50%)",
                  opacity: zone.opacity,
                }}
              />
            </div>
          ))}

          {/* Enhanced ball trail that connects to ball properly */}
          {ballTrail.length > 1 && (
            <svg
              className="absolute inset-0 w-full h-full z-35 pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {ballTrail.slice(0, -1).map((pos, index) => {
                const nextPos = ballTrail[index + 1];
                const isLastSegment = index === ballTrail.length - 2;
                
                // Calculate trail opacity and width based on position in trail
                const opacity = Math.max(0.1, 1 - (index / ballTrail.length) * 1.2);
                const strokeWidth = Math.max(0.4, 1.8 - (index / ballTrail.length) * 0.9);
                
                // For the last segment, connect to ball center but stop just before it
                let endX = nextPos.x;
                let endY = nextPos.y;
                
                if (isLastSegment) {
                  // Calculate direction vector from current to next position
                  const dx = nextPos.x - pos.x;
                  const dy = nextPos.y - pos.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  
                  if (distance > 0) {
                    // Stop the trail 2% short of the ball center to avoid overlap
                    const shortenBy = 2;
                    const normalizedDx = dx / distance;
                    const normalizedDy = dy / distance;
                    endX = nextPos.x - (normalizedDx * shortenBy);
                    endY = nextPos.y - (normalizedDy * shortenBy);
                  }
                }
                
                return (
                  <g key={`trail-${index}`}>
                    {/* Main trail line */}
                    <line
                      x1={pos.x}
                      y1={pos.y}
                      x2={endX}
                      y2={endY}
                      stroke="#d1d5db"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      opacity={opacity}
                    />
                    {/* Inner glow effect */}
                    <line
                      x1={pos.x}
                      y1={pos.y}
                      x2={endX}
                      y2={endY}
                      stroke="#ffffff"
                      strokeWidth={strokeWidth * 0.4}
                      strokeLinecap="round"
                      opacity={opacity * 0.4}
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Enhanced professional ball with 365scores style */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-30 ease-out z-50"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="relative">
              {/* Sharp ball shadow */}
              <div
                className="absolute w-6 h-2.5 bg-black/40 rounded-full"
                style={{ left: "-12px", top: "18px" }}
              ></div>
              {/* Professional ball - sharp and crisp */}
              <div className="w-4 h-4 relative">
                <img
                  src="/assets/matchdetaillogo/shot-event.svg"
                  alt="Ball"
                  className="w-full h-full object-contain filter contrast-125 brightness-110"
                  style={{ imageRendering: "crisp-edges" }}
                />
              </div>

              {/* Sharp possession ping effect */}
              {ballPossession && (
                <div className="absolute -inset-4">
                  <div
                    className={`w-14 h-14 rounded-full animate-ping opacity-60 ${
                      ballPossession === "home" ? "bg-blue-400" : "bg-red-400"
                    }`}
                  ></div>
                </div>
              )}
            </div>
          </div>
        {/* Enhanced bottom statistics panel - 365scores style - moved inside field */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-200">
            {currentView === "stats" && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    Possession
                  </span>
                  <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                    {elapsed}'
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                    <span className="text-sm font-bold">
                      {homeTeamData?.name?.slice(0, 3)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-blue-500 text-2xl font-bold">
                      {teamStats.possession.home}%
                    </span>
                    <div className="w-16 h-16 relative">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#e5e7eb"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#3b82f6"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${(teamStats.possession.home / 100) * 175.9} 175.9`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold">⚽</span>
                      </div>
                    </div>
                    <span className="text-red-500 text-2xl font-bold">
                      {teamStats.possession.away}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {awayTeamData?.name?.slice(0, 3)}
                    </span>
                    <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  </div>
                </div>
              </div>
            )}

            {currentView === "history" && (
              <div className="p-4">
                <div className="text-center mb-3">
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    Last 5 Matches
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                    <div className="flex gap-1">
                      {teamStats.lastFiveMatches.home.map((result, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${getMatchResult(result)}`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {teamStats.lastFiveMatches.away.map((result, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${getMatchResult(result)}`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                    <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  </div>
                </div>
              </div>
            )}

            {currentView === "corners" && (
              <div className="p-4">
                <div className="text-center mb-3">
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    Corners
                  </span>
                </div>
                <div className="flex items-center justify-center gap-12">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                    <span className="text-blue-500 text-3xl font-bold">
                      {teamStats.corners.home}
                    </span>
                  </div>
                  <div className="w-24 h-1 bg-gray-200 rounded relative">
                    <div
                      className="h-full bg-blue-500 rounded transition-all duration-1000"
                      style={{
                        width: `${teamStats.corners.home > 0 ? (teamStats.corners.home / (teamStats.corners.home + teamStats.corners.away)) * 100 : 50}%`,
                      }}
                    ></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 text-3xl font-bold">
                      {teamStats.corners.away}
                    </span>
                    <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  </div>
                </div>
              </div>
            )}

            {currentView === "shotmap" && (
              <div className="p-4">
                <div className="text-center mb-3">
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                    Shot Map
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                    <span className="text-blue-500 text-xl font-bold">
                      {teamStats.shots.home}
                    </span>
                    <span className="text-xs text-gray-500">shots</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Goal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Home Shot</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Away Shot</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">shots</span>
                    <span className="text-red-500 text-xl font-bold">
                      {teamStats.shots.away}
                    </span>
                    <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  </div>
                </div>

                {/* Enhanced mini shot map */}
                <div className="relative h-20 bg-green-600 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-green-500 to-green-700 opacity-95">
                    {/* Mini field markings */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-10 border border-white/60"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-10 border border-white/60"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60"></div>

                    {/* Shot markers on mini map */}
                    {shotEvents.slice(-15).map((shot) => (
                      <div
                        key={`mini-${shot.id}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${shot.x}%`,
                          top: `${((shot.y - 20) / 60) * 100}%`,
                        }}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            shot.isGoal
                              ? "bg-green-400 ring-2 ring-green-200"
                              : shot.team === "home"
                                ? "bg-blue-400"
                                : "bg-red-400"
                          }`}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced shot events visualization */}
        {shotEvents.map((shot) => (
          <div
            key={shot.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-45 pointer-events-none"
            style={{
              left: `${shot.x}%`,
              top: `${shot.y}%`,
            }}
          >
            <div
              className={`w-4 h-4 rounded-full ${
                shot.isGoal
                  ? "bg-green-500 ring-4 ring-green-300 ring-opacity-60"
                  : shot.team === "home"
                    ? "bg-blue-500 ring-4 ring-blue-300 ring-opacity-60"
                    : "bg-red-500 ring-4 ring-red-300 ring-opacity-60"
              } animate-ping`}
              style={{ animationDuration: "2s" }}
            ></div>
          </div>
        ))}

        {/* Current event display - enhanced 365scores style */}
        {currentEvent && currentView === "event" && currentStatus !== "P" && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <div className="text-center text-white">
              <div className="text-3xl font-bold mb-2 drop-shadow-2xl text-shadow-lg">
                {currentEvent.description}
              </div>
              <div className="text-lg font-semibold opacity-90 drop-shadow-lg">
                {currentEvent.team === "home"
                  ? homeTeamData?.name?.toUpperCase()
                  : awayTeamData?.name?.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Live Commentary Overlay on Field */}
        {currentView === "commentary" && (
          <div className="absolute bottom-16 left-4 right-4 z-30 bg-black/80 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-xs font-medium uppercase tracking-wide">
                  Live Commentary
                </span>
                <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                  {elapsed}'
                </div>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto commentary-scroll">
                {liveCommentary.slice(0, 4).map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="text-blue-400 font-semibold min-w-0">
                      {comment.minute}'
                    </div>
                    <div
                      className={`flex-1 ${comment.isImportant ? "font-medium text-white" : "text-gray-200"}`}
                    >
                      {comment.text}
                    </div>
                    {comment.team && (
                      <div
                        className={`w-2 h-2 rounded-full ${comment.team === "home" ? "bg-blue-400" : "bg-red-400"}`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
        
    </div>
  );
};

export default MyLiveAction;