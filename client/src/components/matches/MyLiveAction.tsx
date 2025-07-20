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

  // Initialize ball movement and target
  useEffect(() => {
    if (isLive) {
      // Set initial ball target for immediate movement
      setBallTarget({ x: 45 + Math.random() * 10, y: 45 + Math.random() * 10 });
      setBallMovementActive(true);
    }
  }, [isLive]);

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
  const [ballMovementActive, setBallMovementActive] = useState(true); // Always keep ball moving

  // Continuous ball movement effect
  useEffect(() => {
    if (!isLive) return;

    const ballInterval = setInterval(() => {
      setBallPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        if (ballMovementActive && ballTarget) {
          // Move towards target when active
          const deltaX = ballTarget.x - prev.x;
          const deltaY = ballTarget.y - prev.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance > 1.5) {
            const moveSpeed = 1.8; // Smooth movement speed
            const directionX = deltaX / distance;
            const directionY = deltaY / distance;

            newX = prev.x + directionX * moveSpeed;
            newY = prev.y + directionY * moveSpeed;
          } else {
            // Reached target, generate new random target for continuous movement
            const randomTargets = [
              { x: 25 + Math.random() * 50, y: 25 + Math.random() * 50 },
              { x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 },
              { x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 }
            ];
            setBallTarget(randomTargets[Math.floor(Math.random() * randomTargets.length)]);
          }
        } else {
          // Gentle random movement when no active event
          const drift = 0.3;
          newX = prev.x + (Math.random() - 0.5) * drift;
          newY = prev.y + (Math.random() - 0.5) * drift;
        }

        // Keep ball within field bounds
        newX = Math.max(8, Math.min(92, newX));
        newY = Math.max(8, Math.min(92, newY));

        // Update possession based on ball position
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
                : Math.random() > 0.7
                  ? (Math.random() > 0.5 ? "home" : "away")
                  : ballPossession // Keep current possession more often
          );
        }

        // Always add to trail (never clear it abruptly)
        setBallTrail((currentTrail) => {
          const now = Date.now();
          // Filter out old trail points while adding new one
          const filteredTrail = currentTrail.filter(point => now - point.timestamp < 8000);
          const newTrail = [
            ...filteredTrail,
            { x: prev.x, y: prev.y, timestamp: now },
          ];
          return newTrail.slice(-25); // Longer trail for better visibility
        });

        return { x: newX, y: newY };
      });
    }, 80); // Slightly slower for smoother movement

    return () => clearInterval(ballInterval);
  }, [isLive, ballTarget, ballMovementActive, currentBallEvent, ballPossession]);

  // Event-driven ball target setting
  const triggerBallMovement = (eventType: string, team: "home" | "away") => {
    // Don't clear trail - keep it continuous for better visual flow
    
    let targetPosition;

    switch (eventType) {
      case "dangerous_attack":
        // Move toward opponent's goal area - full field height
        targetPosition =
          team === "home"
            ? { x: 85, y: 5 + Math.random() * 90 } // Attack right goal - full field height
            : { x: 15, y: 5 + Math.random() * 90 }; // Attack left goal - full field height
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
                { x: 95, y: 1 }, // Top-right corner flag
                { x: 95, y: 95 }, // Bottom-right corner flag
              ] // Right corners - at actual corner flags
            : [
                { x: 1, y: 1 }, // Top-left corner flag
                { x: 1, y: 95 }, // Bottom-left corner flag
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

      case "ball_safe":
        // Move to midfield or defensive areas - full field height
        targetPosition =
          team === "home"
            ? { x: 25 + Math.random() * 20, y: 5 + Math.random() * 90 } // Home half - full field height
            : { x: 55 + Math.random() * 20, y: 5 + Math.random() * 90 }; // Away half - full field height
        break;

      default:
        // Default attacking movement - full field height
        targetPosition =
          team === "home"
            ? { x: 70 + Math.random() * 15, y: 5 + Math.random() * 90 } // Forward movement - full field height
            : { x: 15 + Math.random() * 15, y: 5 + Math.random() * 90 }; // Forward movement - full field height
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
      | "substitution" = "attack";

    // Generate events based on probability and game situation
    const eventProbability = Math.random();

    if (eventProbability > 0.3) {
      // Dangerous attack (12% chance)
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
        { corner: "top-left" as const, x: 1, y: 1 },
        { corner: "top-right" as const, x: 95, y: 1 },
        { corner: "bottom-left" as const, x: 1, y: 90 },
        { corner: "bottom-right" as const, x: 95, y: 95 },
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
    } else if (eventProbability > 0.58) {
      // Regular attack (10% chance)
      eventType = "attack";
      randomType = "attacking";
      setMatchIntensity("medium");

      triggerBallMovement("attack", randomTeam);
    } else if (eventProbability > 0.53) {
      // Ball safe / possession (5% chance)
      eventType = "attack";
      randomType = "ball_safe";
      setMatchIntensity("low");

      triggerBallMovement("ball_safe", randomTeam);
    } else if (eventProbability > 0.48) {
      // Substitution (5% chance)
      eventType = "substitution";
      randomType = "ball_safe";
      setMatchIntensity("medium");

      const substitutionEvent = {
        id: `substitution_${Date.now()}`,
        team: randomTeam,
        playerOut: `Player ${Math.floor(Math.random() * 23) + 1}`,
        playerIn: `Player ${Math.floor(Math.random() * 23) + 1}`,
        timestamp: Date.now(),
      };

      setSubstitutionEvents((prev) => [...prev.slice(-4), substitutionEvent]);
    } else {
      // No major event - return early
      return;
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
            : "Attacking Move",
      ball_safe: 
        eventType === "goalkick" 
          ? "Goal kick" 
          : eventType === "substitution"
            ? "Substitution"
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
        eventType === "substitution"
          ? `Player ${Math.floor(Math.random() * 23) + 1}`
          : randomTeam === "home"
            ? homeTeamData?.name || "Home Team"
            : awayTeamData?.name || "Away Team",
      description: eventDescriptions[randomType],
      timestamp: Date.now(),
      isRecent: true,
      playerOut: eventType === "substitution" ? `Player ${Math.floor(Math.random() * 23) + 1}` : undefined,
      playerIn: eventType === "substitution" ? `Player ${Math.floor(Math.random() * 23) + 1}` : undefined,
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

  // Don't render anything for finished matches
  if (
    currentStatus === "FT" ||
    currentStatus === "AET" ||
    currentStatus === "PEN"
  ) {
    console.log(
      `🏁 [Live Action] Match ${matchId} is finished (status: ${currentStatus}), not rendering Live Action`,
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
        {/* Enhanced Header with 365scores style */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="text-gray-800 text-sm font-semibold">
                Live Action
              </span>
              <Badge
                variant="outline"
                className={`text-xs px-2 py-1 ${
                  matchIntensity === "high"
                    ? "bg-red-100 text-red-700 border-red-300"
                    : matchIntensity === "medium"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-green-100 text-green-700 border-green-300"
                }`}
              >
                {matchIntensity.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                {elapsed}'
              </div>
              <div className="text-xs text-gray-600">
                {ballPossession === "home"
                  ? homeTeamData?.name?.slice(0, 3)
                  : awayTeamData?.name?.slice(0, 3)}
              </div>
            </div>
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
          {/* Enhanced attack zones with curved overlays like the reference image */}
          {attackZones.map((zone) => (
            <div key={zone.id} className="absolute inset-0 pointer-events-none">
              {/* Curved organic attack zone overlay */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <radialGradient
                    id={`attackGradient-${zone.id}`}
                    cx="50%"
                    cy="50%"
                    r="60%"
                  >
                    <stop
                      offset="0%"
                      stopColor={
                        zone.team === "home"
                          ? zone.type === "dangerous_attack"
                            ? "#1e40af"
                            : "#3b82f6"
                          : zone.type === "dangerous_attack"
                            ? "#dc2626"
                            : "#ef4444"
                      }
                      stopOpacity={zone.type === "dangerous_attack" ? "0.8" : "0.5"}
                    />
                    <stop
                      offset="70%"
                      stopColor={
                        zone.team === "home"
                          ? zone.type === "dangerous_attack"
                            ? "#1e40af"
                            : "#3b82f6"
                          : zone.type === "dangerous_attack"
                            ? "#dc2626"
                            : "#ef4444"
                      }
                      stopOpacity={zone.type === "dangerous_attack" ? "0.4" : "0.2"}
                    />
                    <stop
                      offset="100%"
                      stopColor="transparent"
                      stopOpacity="0"
                    />
                  </radialGradient>
                </defs>
                
                {/* Curved attack zone shape */}
                <path
                  d={
                    zone.team === "home"
                      ? zone.type === "dangerous_attack"
                        ? "M 5 20 Q 25 10, 45 25 Q 65 15, 85 30 Q 90 50, 85 70 Q 65 85, 45 75 Q 25 90, 5 80 Q 0 50, 5 20 Z"
                        : "M 10 25 Q 20 15, 35 30 Q 50 20, 65 35 Q 70 50, 65 65 Q 50 80, 35 70 Q 20 85, 10 75 Q 5 50, 10 25 Z"
                      : zone.type === "dangerous_attack"
                        ? "M 15 30 Q 35 15, 55 25 Q 75 10, 95 20 Q 100 50, 95 80 Q 75 90, 55 75 Q 35 85, 15 70 Q 10 50, 15 30 Z"
                        : "M 35 35 Q 50 20, 65 30 Q 80 15, 90 25 Q 95 50, 90 75 Q 80 85, 65 70 Q 50 80, 35 65 Q 30 50, 35 35 Z"
                  }
                  fill={`url(#attackGradient-${zone.id})`}
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
          ))}

          {/* Team possession display on field with jerseys */}
          {ballPossession && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded ${
                    ballPossession === "home" ? "bg-blue-500" : "bg-red-500"
                  } flex items-center justify-center text-white text-xs font-bold`}
                >
                  👕
                </div>
                <span className="text-white text-sm font-semibold">
                  Ball Possession
                </span>
                <span className="text-white text-sm font-bold uppercase">
                  {ballPossession === "home"
                    ? homeTeamData?.name?.toUpperCase()
                    : awayTeamData?.name?.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Enhanced ball trail with 365scores precision */}
          {ballTrail.length > 1 && (
            <svg
              className="absolute inset-0 w-full h-full z-35 pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {ballTrail.slice(0, -1).map((pos, index) => {
                const nextPos = ballTrail[index + 1];
                const progress = index / Math.max(ballTrail.length - 1, 1);
                const opacity = 1 - progress * 0.8; // Smoother opacity gradient
                const strokeWidth = 1.5 - progress * 0.8; // Thicker at start, thinner at end
                return (
                  <g key={`trail-${index}-${pos.timestamp}`}>
                    <line
                      x1={pos.x}
                      y1={pos.y}
                      x2={nextPos.x}
                      y2={nextPos.y}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      opacity={opacity}
                    />
                    <line
                      x1={pos.x}
                      y1={pos.y}
                      x2={nextPos.x}
                      y2={nextPos.y}
                      stroke={ballPossession === "home" ? "rgba(59,130,246,0.7)" : "rgba(239,68,68,0.7)"}
                      strokeWidth={strokeWidth * 0.6}
                      strokeLinecap="round"
                      opacity={opacity * 0.8}
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Enhanced professional ball with 365scores style */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-3000 ease-out z-50"
            style={{
              left: `${ballPosition.x}%`,
              top: `${ballPosition.y}%`,
            }}
          >
            <div className="relative">
              {/* Professional ball - sharp and crisp */}
              <div className="w-4 h-4 relative">
                <img
                  src="/assets/matchdetaillogo/shot-event.svg"
                  alt="Ball"
                  className="w-full h-full object-contain filter contrast-125 brightness-110"
                  style={{ imageRendering: "crisp-edges" }}
                />
              </div>

              {/* Sharp possession glow effect */}
              {ballPossession && (
                <div className="absolute -inset-4">
                  <div
                    className={`w-10 h-10 rounded-full animate-ping opacity-50 ${
                      ballPossession === "home" ? "bg-blue-300" : "bg-red-300"
                    }`}
                  ></div>
                  <div
                    className={`absolute inset-1 w-12 h-12 rounded-full animate-pulse opacity-40 ${
                      ballPossession === "home" ? "bg-blue-300" : "bg-red-300"
                    }`}
                  ></div>
                </div>
              )}
            </div>
          </div>
        {/* Statistics and trends display at bottom of field */}
          <div className="absolute bottom-4 left-0 right-0 z-30 px-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-center w-full">
                  <div className="text-xs text-gray-500 mb-1">HEAD TO HEAD RECORD</div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                        👕
                      </div>
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {teamStats.previousMeetings.homeWins} WIN{teamStats.previousMeetings.homeWins !== 1 ? 'S' : ''}
                      </div>
                    </div>
                    <div className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold">
                      {teamStats.previousMeetings.draws} DRAW{teamStats.previousMeetings.draws !== 1 ? 'S' : ''}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {teamStats.previousMeetings.awayWins} WIN{teamStats.previousMeetings.awayWins !== 1 ? 'S' : ''}
                      </div>
                      <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                        👕
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  ? "bg-green-300 ring-4 ring-green-300 ring-opacity-60"
                  : shot.team === "home"
                    ? "bg-blue-300 ring-4 ring-blue-300 ring-opacity-60"
                    : "bg-red-300 ring-4 ring-red-300 ring-opacity-60"
              } animate-ping`}
              style={{ animationDuration: "2s" }}
            ></div>
          </div>
        ))}

        {/* Current event display - enhanced 365scores style */}
        {currentEvent && currentView === "event" && currentStatus !== "P" && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            {currentEvent.type === "substitution" ? (
              /* Substitution banner display */
              <div className="w-96 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                {/* Player Out */}
                <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-600">
                      {currentEvent.minute || elapsed}'
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {currentEvent.playerOut || currentEvent.player}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">➡️</span>
                    <span className="text-xs font-medium text-gray-500 bg-red-50 px-2 py-1 rounded">
                      OFF
                    </span>
                  </div>
                </div>
                
                {/* Replacement Banner */}
                <div className="bg-white px-6 py-4">
                  <div className="text-center">
                    <span className="text-gray-700 font-bold text-lg tracking-wide">
                      SUBSTITUTION
                    </span>
                  </div>
                </div>
                
                {/* Player In */}
                <div className="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 bg-green-50 px-2 py-1 rounded">
                      ON
                    </span>
                    <span className="text-green-500 font-bold">⬅️</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-700">
                      {currentEvent.playerIn || "New Player"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {currentEvent.team === "home" ? homeTeamData?.name?.slice(0, 3) : awayTeamData?.name?.slice(0, 3)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Regular event display */
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
            )}
          </div>
        )}

        {/* Live Commentary Overlay on Field */}
        {currentView === "commentary" && (
          <div className="absolute bottom-6 left-4 right-4 z-30 bg-black/80 backdrop-blur-sm rounded-lg border border-white/20">
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
