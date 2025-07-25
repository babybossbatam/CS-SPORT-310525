import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import MyAvatarInfo from "./MyAvatarInfo";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";
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

interface MyCommentaryProps {
  events: MatchEvent[];
  homeTeam?: string;
  awayTeam?: string;
  getEventDescription: (event: MatchEvent) => string;
  isHomeTeam: (event: MatchEvent) => boolean;
}

const MyCommentary: React.FC<MyCommentaryProps> = ({
  events,
  homeTeam,
  awayTeam,
  getEventDescription,
  isHomeTeam,
}) => {
  // Function to calculate the score at a given time
  const calculateScoreAtTime = (time: number) => {
    let homeScore = 0;
    let awayScore = 0;

    // Get all goal events that happened before or at the given time (including extra time)
    const goalEvents = events.filter(
      (e) =>
        (e.type?.toLowerCase() === "goal" ||
          e.type?.toLowerCase() === "Goal") &&
        e.time.elapsed + (e.time.extra || 0) <= time,
    );

    // Process each goal event
    goalEvents.forEach((event) => {
      const isOwnGoal = event.detail?.toLowerCase().includes("own goal");
      const eventIsHomeTeam = isHomeTeam(event);

      console.log("Goal event debug:", {
        player: event.player?.name,
        team: event.team?.name,
        detail: event.detail,
        isOwnGoal,
        eventIsHomeTeam,
        homeTeam,
        awayTeam,
        time: event.time.elapsed + (event.time.extra || 0),
      });

      if (isOwnGoal) {
        // Own goal: award to the opposing team
        if (eventIsHomeTeam) {
          awayScore++; // Home team own goal gives away team a point
          console.log("Own goal by home team player, awayScore++", {
            awayScore,
            player: event.player?.name,
          });
        } else {
          homeScore++; // Away team own goal gives home team a point
          console.log("Own goal by away team player, homeScore++", {
            homeScore,
            player: event.player?.name,
          });
        }
      } else {
        // Regular goal: award to the scoring team
        if (eventIsHomeTeam) {
          homeScore++;
          console.log("Regular goal by home team, homeScore++", {
            homeScore,
            player: event.player?.name,
          });
        } else {
          awayScore++;
          console.log("Regular goal by away team, awayScore++", {
            awayScore,
            player: event.player?.name,
          });
        }
      }
    });

    return { homeScore, awayScore };
  };

  return (
    <>
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
      <div className=" ">
        <div className="p-4 space-y-2 max-h-200 overflow-y-auto">
          {/* Simplified Timeline - Events Only */}
          {(() => {
            // Create array with events and period markers
            const allCommentaryItems = [...events];

            // Add period markers based on existing events
            const hasEventsInFirstHalf = events.some(
              (e) => e.time.elapsed >= 1 && e.time.elapsed <= 45,
            );
            const hasEventsInSecondHalf = events.some(
              (e) => e.time.elapsed >= 45,
            );

            // Check for penalty shootout events
            const penaltyShootoutEvents = events.filter((e) => {
              const detail = e.detail?.toLowerCase() || "";
              const type = e.type?.toLowerCase() || "";
              return (
                (detail.includes("penalty") || type === "penalty") &&
                e.time.elapsed > 110
              );
            });

            const hasPenaltyShootout = penaltyShootoutEvents.length > 0;

            if (hasEventsInFirstHalf) {
              // Add "First Half begins" marker
              allCommentaryItems.push({
                time: { elapsed: 1 },
                type: "period_start",
                detail: "First Half begins",
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);
            }

            // Add "Half Time" marker if there are events in both halves
            if (hasEventsInFirstHalf && hasEventsInSecondHalf) {
              allCommentaryItems.push({
                time: { elapsed: 45 },
                type: "half_time",
                detail: "Half Time",
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);
            }

            // Add "Second Half begins" marker if there are events in both halves
            if (hasEventsInFirstHalf && hasEventsInSecondHalf) {
              allCommentaryItems.push({
                time: { elapsed: 46 },
                type: "period_start",
                detail: "Second Half begins",
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);
            }

            // Add "90 minutes" period marker if there are events in the second half and the latest event is close to or after 90 minutes
            const secondHalfEvents = events.filter((e) => e.time.elapsed > 45);

            const latestEvent =
              events.length > 0
                ? events.reduce((latest, current) =>
                    current.time.elapsed + (current.time.extra || 0) >
                    latest.time.elapsed + (latest.time.extra || 0)
                      ? current
                      : latest,
                  )
                : null;

            const shouldShow90Marker =
              secondHalfEvents.length > 0 &&
              latestEvent &&
              latestEvent.time.elapsed > 70;

            if (shouldShow90Marker) {
              // Find the actual end time of the match (latest event time)
              const finalMatchEvent = events.reduce((latest, current) => {
                const currentTotal =
                  current.time.elapsed + (current.time.extra || 0);
                const latestTotal =
                  latest.time.elapsed + (latest.time.extra || 0);
                return currentTotal > latestTotal ? current : latest;
              });

              const finalElapsed = finalMatchEvent.time.elapsed;
              const finalExtra = finalMatchEvent.time.extra || 0;

              allCommentaryItems.push({
                time: {
                  elapsed: finalElapsed,
                  extra: finalExtra > 0 ? finalExtra : undefined,
                },
                type: "period_end",
                detail: "Full Time",
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);
            }

            // Add "Penalty Shootout begins" marker if there are penalty events
            if (hasPenaltyShootout) {
              // Find the time when penalty shootout should begin (after full time)
              const fullTimeEvents = events.filter((e) => e.time.elapsed <= 120);
              const lastRegularEvent = fullTimeEvents.length > 0 
                ? fullTimeEvents.reduce((latest, current) => {
                    const currentTotal = current.time.elapsed + (current.time.extra || 0);
                    const latestTotal = latest.time.elapsed + (latest.time.extra || 0);
                    return currentTotal > latestTotal ? current : latest;
                  })
                : { time: { elapsed: 120, extra: 0 } };

              const penaltyStartTime = Math.max(lastRegularEvent.time.elapsed, 120);
              const scoreAtPenaltyStart = calculateScoreAtTime(penaltyStartTime + (lastRegularEvent.time.extra || 0));

              // Add "Second Half begins" section before penalty shootout
              const halftimeEvents = events.filter((e) => e.time.elapsed <= 45);
              const lastFirstHalfEvent = halftimeEvents.length > 0
                ? halftimeEvents.reduce((latest, current) => {
                    const currentTotal = current.time.elapsed + (current.time.extra || 0);
                    const latestTotal = latest.time.elapsed + (latest.time.extra || 0);
                    return currentTotal > latestTotal ? current : latest;
                  })
                : { time: { elapsed: 45, extra: 0 } };

              const halftimeEndTime = Math.max(lastFirstHalfEvent.time.elapsed, 45) + 
                (lastFirstHalfEvent.time.elapsed >= 45 ? lastFirstHalfEvent.time.extra || 0 : 0);
              const halftimeScore = calculateScoreAtTime(halftimeEndTime);

              allCommentaryItems.push({
                time: { elapsed: penaltyStartTime - 1 },
                type: "penalty_second_half_begins",
                detail: "Second Half begins",
                score: `${halftimeScore.homeScore} - ${halftimeScore.awayScore}`,
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);

              allCommentaryItems.push({
                time: { elapsed: penaltyStartTime },
                type: "penalty_start",
                detail: "Penalty Shootout begins",
                score: `${scoreAtPenaltyStart.homeScore} - ${scoreAtPenaltyStart.awayScore}`,
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);
            }

            // Add period score markers
            const periodMarkers = [];

            // Add "Full Time" marker for ended matches
            const hasEndedEvents = events.some(
              (event) =>
                event.time.elapsed > 90 &&
                event.time.extra &&
                event.time.extra > 0,
            );

            if (hasEndedEvents) {
              // Find the event with the highest total time (elapsed + extra)
              const eventsWithTotalTime = events.map((e) => ({
                ...e,
                totalTime: e.time.elapsed + (e.time.extra || 0),
              }));

              const finalEvent = eventsWithTotalTime.reduce(
                (latest, current) =>
                  current.totalTime > latest.totalTime ? current : latest,
              );

              const finalScore = calculateScoreAtTime(finalEvent.totalTime);

              periodMarkers.push({
                time: {
                  elapsed: finalEvent.time.elapsed,
                  extra:
                    finalEvent.time.extra && finalEvent.time.extra > 0
                      ? finalEvent.time.extra
                      : undefined,
                },
                type: "period_score",
                detail: "Full Time",
                score: `${finalScore.homeScore} - ${finalScore.awayScore}`,
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);
            }

            // Removed halftime score marker to clean up display

            // Add period markers to the commentary items
            allCommentaryItems.push(...periodMarkers);

            return allCommentaryItems
              .sort((a, b) => {
                // Special handling for Half Time marker - always put it above all first half events
                if (a.type === "half_time") {
                  // Half Time marker goes above all events from first half (elapsed <= 45)
                  if (b.time.elapsed <= 45) return -1;
                  // But below second half events
                  return 1;
                }
                if (b.type === "half_time") {
                  // Half Time marker goes above all events from first half (elapsed <= 45)
                  if (a.time.elapsed <= 45) return 1;
                  // But below second half events
                  return -1;
                }

                // Put Full Time marker at the top after Half Time
                if (a.type === "period_end" && a.detail === "Full Time")
                  return -1;
                if (b.type === "period_end" && b.detail === "Full Time")
                  return 1;

                // Period score markers should appear before penalty shootout events
                if (a.type === "period_score" && b.time.elapsed > 110) return -1;
                if (b.type === "period_score" && a.time.elapsed > 110) return 1;

                // First sort by elapsed time (descending)
                if (a.time.elapsed !== b.time.elapsed) {
                  return b.time.elapsed - a.time.elapsed;
                }

                // If elapsed time is the same, sort by extra time (descending)
                const aExtra = a.time.extra || 0;
                const bExtra = b.time.extra || 0;

                if (aExtra !== bExtra) {
                  return bExtra - aExtra;
                }

                // For events at the same exact time, prioritize card order: Yellow before Red
                if (a.type === "Card" && b.type === "Card" && 
                    a.player?.name === b.player?.name) {
                  const aIsYellow = a.detail?.toLowerCase().includes("yellow");
                  const bIsYellow = b.detail?.toLowerCase().includes("yellow");
                  const aIsRed = a.detail?.toLowerCase().includes("red");
                  const bIsRed = b.detail?.toLowerCase().includes("red");

                  // If one is yellow and other is red for same player, red comes first (top), yellow below
                  if (aIsYellow && bIsRed) return 1;  // Yellow goes below red
                  if (aIsRed && bIsYellow) return -1; //
                }

                // For events at the same time, prioritize period markers to appear first
                const aPriority =
                  a.type === "period_end" || a.type === "period_marker" || a.type === "period_score" ? 1 : 0;
                const bPriority =
                  b.type === "period_end" || b.type === "period_marker" || b.type === "period_score" ? 1 : 0;
                return bPriority - aPriority;
              }) // Sort by time, most recent first, then by extra time
              .map((event, index) => {
                const timeDisplay = `${event.time.extra ? `+${event.time.extra}` : ""}`;

                // Handle penalty shootout event numbering
                let displayTime = event.time.elapsed;
                if (event.time.elapsed > 110) {
                  // This is a penalty shootout event, show sequential numbering
                  const penaltyIndex = penaltyShootoutEvents.findIndex(p => 
                    p.time.elapsed === event.time.elapsed && 
                    p.player?.name === event.player?.name
                  );
                  if (penaltyIndex !== -1) {
                    displayTime = penaltyIndex + 1;
                  }
                }

                // Handle period score markers - removed display
                if (event.type === "period_score") {
                  return null;
                }

                // Handle period markers
                if (
                  event.type === "period_start" ||
                  event.type === "period_end" ||
                  event.type === "period_marker" ||
                  event.type === "half_time" ||
                  event.type === "penalty_start"
                ) {
                  // Handle "First Half begins" / "Kick Off"
                  if (event.detail === "First Half begins") {
                    return (
                      <div
                        key={`period-${index}`}
                        className="commentary-event-container"
                      >
                        <div className="flex gap-3">
                          {/* Time Column */}
                          <div className="flex flex-col items-center min-w-[45px]">
                            <div className="w-4 h-6 flex items-center justify-center">
                              <img
                                src="/assets/matchdetaillogo/i mark.svg"
                                alt="Kick Off"
                                className="w-4 h-4"
                              />
                            </div>
                            {index < allCommentaryItems.length - 1 && (
                              <div className="w-0.5 h-16 bg-gray-800 ml-1"></div>
                            )}
                          </div>

                          {/* Content Column */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 -ml-3 text-sm text-gray-700 leading-relaxed mt-0.5">
                              <img
                                src="/assets/matchdetaillogo/clock.png"
                                alt="Kick Off"
                                className="w-4 h-4"
                              />
                              <div>
                                <div>Kick Off</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1 -ml-3">
                              First Half begins.
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Handle "Second Half begins" before penalty shootout
                  if (event.type === "penalty_second_half_begins") {
                    return (
                      <div
                        key={`period-${index}`}
                        className="commentary-event-container"
                      >
                        <div className="flex gap-3">
                          {/* Time Column */}
                          <div className="flex flex-col items-center min-w-[45px]">
                            <div className="w-4 h-6 flex items-center justify-center">
                              <img
                                src="/assets/matchdetaillogo/i mark.svg"
                                alt="Second Half"
                                className="w-4 h-4"
                              />
                            </div>
                            {index < allCommentaryItems.length - 1 && (
                              <div className="w-0.5 h-4 bg-gray-800 ml-1"></div>
                            )}
                          </div>

                          {/* Content Column */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 -ml-3 text-sm text-gray-700 leading-relaxed mt-0.5">
                              <div>Second Half begins</div>
                              <span>
                                {homeTeam}: {(event as any).score?.split(' - ')[0]},{" "}
                                {awayTeam}: {(event as any).score?.split(' - ')[1]}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Handle "Penalty Shootout begins"
                  if (event.detail === "Penalty Shootout begins") {
                    return (
                      <div
                        key={`period-${index}`}
                        className="commentary-event-container"
                      >
                        <div className="flex gap-3">
                          {/* Time Column */}
                          <div className="flex flex-col items-center min-w-[45px]">
                            <div className="w-4 h-6 flex items-center justify-center">
                              <img
                                src="/assets/matchdetaillogo/penalty.svg"
                                alt="Penalty Shootout"
                                className="w-4 h-4"
                              />
                            </div>
                            {index < allCommentaryItems.length - 1 && (
                              <div className="w-0.5 h-4 bg-gray-800 ml-1"></div>
                            )}
                          </div>

                          {/* Content Column */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 -ml-3 text-sm text-gray-700 leading-relaxed mt-0.5">
                              <div>Penalty Shootout begins</div>
                              <span>
                                {homeTeam}: {(event as any).score?.split(' - ')[0]},{" "}
                                {awayTeam}: {(event as any).score?.split(' - ')[1]}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Handle "Second Half begins"
                  if (event.detail === "Second Half begins") {
                    // Calculate halftime score (45 minutes + any extra time from first half)
                    const halftimeEvents = events.filter(
                      (e) => e.time.elapsed <= 45,
                    );
                    const lastFirstHalfEvent =
                      halftimeEvents.length > 0
                        ? halftimeEvents.reduce((latest, current) => {
                            const currentTotal =
                              current.time.elapsed + (current.time.extra || 0);
                            const latestTotal =
                              latest.time.elapsed + (latest.time.extra || 0);
                            return currentTotal > latestTotal
                              ? current
                              : latest;
                          })
                        : { time: { elapsed: 45, extra: 0 } };

                    const halftimeEndTime =
                      Math.max(lastFirstHalfEvent.time.elapsed, 45) +
                      (lastFirstHalfEvent.time.elapsed >= 45
                        ? lastFirstHalfEvent.time.extra || 0
                        : 0);
                    const halftimeScore = calculateScoreAtTime(halftimeEndTime);

                    return (
                      <div
                        key={`period-${index}`}
                        className="commentary-event-container"
                      >
                        <div className="flex gap-3">
                          {/* Time Column */}
                          <div className="flex flex-col items-center min-w-[45px]">
                            <div className="w-4 h-6 flex items-center justify-center">
                              <img
                                src="/assets/matchdetaillogo/i mark.svg"
                                alt="Second Half"
                                className="w-4 h-4"
                              />
                            </div>
                            {index < allCommentaryItems.length - 1 && (
                              <div className="w-0.5 h-4 bg-gray-800 ml-1"></div>
                            )}
                          </div>

                          {/* Content Column */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 -ml-3 text-sm text-gray-700 leading-relaxed mt-0.5">
                              <div>Second Half begins</div>
                              <span>
                                {homeTeam}: {halftimeScore.homeScore},{" "}
                                {awayTeam}: {halftimeScore.awayScore}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Handle "Half Time"
                  if (event.detail === "Half Time") {
                    // Calculate Half Time period end (45 minutes + any extra time)
                    const halftimeEvents = events.filter(
                      (e) => e.time.elapsed <= 45,
                    );
                    const lastFirstHalfEvent =
                      halftimeEvents.length > 0
                        ? halftimeEvents.reduce((latest, current) => {
                            const currentTotal =
                              current.time.elapsed + (current.time.extra || 0);
                            const latestTotal =
                              latest.time.elapsed + (latest.time.extra || 0);
                            return currentTotal > latestTotal
                              ? current
                              : latest;
                          })
                        : { time: { elapsed: 45, extra: 0 } };

                    // Use the time from the last event in first half or default to 45 minutes
                    const halftimeEndTime = {
                      elapsed: Math.max(lastFirstHalfEvent.time.elapsed, 45),
                      extra:
                        lastFirstHalfEvent.time.elapsed >= 45
                          ? lastFirstHalfEvent.time.extra || 0
                          : 0,
                    };

                    const halftimeScore = calculateScoreAtTime(
                      halftimeEndTime.elapsed + halftimeEndTime.extra,
                    );

                    return (
                      <div
                        key={`period-${index}`}
                        className="commentary-event-container"
                      >
                        <div className="flex gap-3">
                          {/* Time Column */}
                          <div className="flex flex-col items-center min-w-[50px]">
                            {/* Extra time display at top if present */}
                            {halftimeEndTime.extra > 0 && (
                              <div className="text-xs font-medium text-red-500 leading-tight">
                                +{halftimeEndTime.extra}'
                              </div>
                            )}
                            <div className="text-gray-800 text-sm font-medium leading-tight">
                              {halftimeEndTime.elapsed}'
                            </div>
                            {index < allCommentaryItems.length - 1 && (
                              <div className="w-0.5 h-4 bg-gray-600"></div>
                            )}
                          </div>

                          {/* Content Column */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 -ml-3 -mt-1.5 text-xs font-medium">
                              <img
                                src="/assets/matchdetaillogo/clock.png"
                                alt="Half Time"
                                className="w-4 h-4 opacity-80 flex-shrink-0"
                              />
                              <span className="text-lg font-bold text-gray-900">
                                {halftimeScore.homeScore} -{" "}
                                {halftimeScore.awayScore}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`period-${index}`}
                      className="commentary-event-container"
                    >
                      <div className="flex gap-1">
                        {/* Time Column */}
                        <div className="flex flex-col items-center min-w-[45px]">
                          {/* Elapsed time */}
                          {event.detail === "Full Time" ? (
                            <>
                              {/* Show extra time above elapsed time if present */}
                              {event.time.extra && event.time.extra > 0 && (
                                <div className="text-xs font-medium text-red-500 leading-tight">
                                  +{event.time.extra}'
                                </div>
                              )}
                              <div className="text-gray-800 text-sm font-medium leading-tight">
                                {event.time.elapsed}'
                              </div>
                            </>
                          ) : (
                            <div className="w-4 h-6  flex items-center justify-center ">
                              {event.type === "period_start" ? (
                                <img
                                  src="/assets/matchdetaillogo/i mark.svg"
                                  alt="Period Start"
                                  className="w-4 h-4 ml-1 mb-2"
                                />
                              ) : (
                                <span className="text-white text-xs font-semi-bold mt-3.5 ">
                                  <img
                                    src="/assets/matchdetaillogo/i mark.svg"
                                    alt="Half Time"
                                    className="w-4 h-4 ml-0.5 mb-4"
                                  />
                                </span>
                              )}
                            </div>
                          )}

                          {index < allCommentaryItems.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-800 ml-1 "></div>
                          )}
                        </div>

                        {/* Content Column */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-md text-gray-600 leading-relaxed"></div>
                            {event.detail === "Full Time" && (
                              <div className="flex items-center gap-2">
                                <img
                                  src="/assets/matchdetaillogo/clock.png"
                                  alt="Full Time"
                                  className="w-4 h-4 opacity-80 flex-shrink-0 -ml-2"
                                />
                                <div className="text-sm font-bold text-gray-900">
                                  {(() => {
                                    const finalScore = calculateScoreAtTime(
                                      event.time.elapsed +
                                        (event.time.extra || 0),
                                    );
                                    return `${finalScore.homeScore} - ${finalScore.awayScore}`;
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Handle regular period markers (like "90 minutes")
                if (event.detail === "90 minutes") {
                  return (
                    <div
                      key={`period-${index}`}
                      className="commentary-event-container"
                    >
                      <div className="flex gap-1">
                        {/* Time Column */}
                        <div className="flex flex-col items-center min-w-[45px]">
                          <div className="w-3 h-6 flex items-center justify-center">
                            <span className="text-white text-xs font-semi-bold">
                              ⏱️
                            </span>
                          </div>

                          {index < allCommentaryItems.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-800 ml-1"></div>
                          )}
                        </div>

                        {/* Content Column */}
                        <div className="flex-1">
                          <div className="text-xs font-md text-gray-600 leading-relaxed">
                            {event.detail}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Handle Full Time period marker with clock icon and score
                if (event.detail === "Full Time") {
                  const finalScore = calculateScoreAtTime(
                    event.time.elapsed + (event.time.extra || 0),
                  );

                  return (
                    <div
                      key={`period-${index}`}
                      className="commentary-event-container"
                    >
                      <div className="flex gap-3">
                        {/* Time Column */}
                        <div className="flex flex-col items-center min-w-[50px]">
                          {/* Extra time display at top if present */}
                          {event.time.extra && (
                            <div className="text-xs font-medium text-red-500 leading-tight">
                              +{event.time.extra}'
                            </div>
                          )}
                          <div className="text-gray-800 text-sm font-medium leading-tight">
                            {event.time.elapsed}'
                          </div>
                          {index < allCommentaryItems.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-600"></div>
                          )}
                        </div>

                        {/* Content Column */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 -ml-3 -mt-1.5 text-xs font-medium">
                            <img
                              src="/assets/matchdetaillogo/clock.png"
                              alt="Full Time"
                              className="w-4 h-4 opacity-80 flex-shrink-0"
                            />
                            <span className="text-lg font-bold text-gray-900">
                              {finalScore.homeScore} - {finalScore.awayScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Use event description for regular events
                const eventDescription = getEventDescription(event);

                return (
                  <div
                    key={`commentary-${index}`}
                    className="commentary-event-container"
                  >
                    <div className="flex gap-3">
                      {/* Time Column */}
                      <div className="flex flex-col items-center min-w-[50px]">
                        {/* Extra time display at top if present */}
                        {event.time.extra && (
                          <div className="text-xs font-medium text-red-500 leading-tight">
                            +{event.time.extra}'
                          </div>
                        )}

                        {/* Elapsed time */}
                        <div
                          className="text-gray-800 text-sm font-medium leading-tight"
                          style={{
                            marginTop: event.time.extra ? "1px" : "0",
                            marginBottom: "2px",
                          }}
                        >
                          {event.time.elapsed > 110 ? displayTime : `${displayTime}'`}
                        </div>

                        {index < allCommentaryItems.length - 1 && (
                          <div className="w-0.5 h-28 bg-gray-600  "></div>
                        )}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1">
                        {event.type === "Goal" ? (
                          <div className="flex flex-col gap-3">
                            {/* Enhanced Goal Header with Animation */}
                            <div className="flex items-center gap-2 -ml-3 -mt-1  px-1 text-xs font-bold bg-gradient-to-r from-green-50 to-blue-50 -mb-2">
                              {(() => {
                                const detail =
                                  event.detail?.toLowerCase() || "";
                                if (detail.includes("penalty")) {
                                  if (detail.includes("missed")) {
                                    return (
                                      <>
                                        <img
                                          src="/assets/matchdetaillogo/missed-penalty.svg"
                                          alt="Missed Penalty"
                                          className="w-5 h-5 opacity-90 "
                                        />
                                        <span className="text-red-600 font-medium text-xs tracking-wider">
                                          Penalty Missed!
                                        </span>
                                      </>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <img
                                          src="/assets/matchdetaillogo/penalty.svg"
                                          alt="Penalty Goal"
                                          className="w-5 h-5 opacity-90 "
                                        />
                                        <span className="text-green-600 font-medium  text-xs tracking-wider">
                                          Penalty
                                        </span>
                                      </>
                                    );
                                  }
                                } else if (detail.includes("own goal")) {
                                  return (
                                    <>
                                      <img
                                        src="/assets/matchdetaillogo/soccer-logo.svg"
                                        alt="Own Goal"
                                        className="w-4 h-4 opacity-90 "
                                      />
                                      <span className="text-red-600 font-medium text-xs tracking-wider">
                                        Own Goal
                                      </span>
                                    </>
                                  );
                                } else {
                                  return (
                                    <>

                                      <img
                                        src="/assets/matchdetaillogo/blue ball.svg"
                                        alt="Goal"
                                        className="w-4 h-4 opacity-90 "
                                      />
                                      <span className="text-green-500 font-bold text-sm tracking-wider">
                                        Goal
                                      </span>

                                      <span className="text-lg font-bold text-green-400">
                                        {(() => {
                                          const scoreAfterGoal = calculateScoreAtTime(
                                            event.time.elapsed +
                                              (event.time.extra || 0),
                                          );
                                          return `${scoreAfterGoal.homeScore} - ${scoreAfterGoal.awayScore}`;
                                        })()}
                                     </span>
                                    </>
                                  );
                                }
                              })()}
                              <div className="ml-auto flex items-center gap-2">

                                <MyWorldTeamLogo
                                  teamName={event.team?.name || ""}
                                  teamLogo={`/api/team-logo/square/${event.team?.id || "fallback"}?size=24`}
                                  alt={event.team?.name}
                                  size="24px"
                                  className="w-6 h-6 rounded-sm border border-gray-200"
                                />
                              </div>
                            </div>

                            {/* Enhanced Player Section */}
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2 -ml-3    text-xs font-medium bg-stone-200  -mb-1">
                                <MyAvatarInfo
                                  playerId={event.player?.id}
                                  playerName={event.player?.name}
                                  size="md-commentary"
                                  className="border-2 border-blue-400 shadow-lg flex-shrink-0"
                                />
                                <div className="flex flex-col">
                                  <span className="text-gray-800 font-bold text-sm">
                                    {event.player?.name || "Unknown Player"}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {event.team?.name}
                                  </span>
                                </div>

                              </div>

                              {/* Enhanced Commentary Description */}
                              

                              {/* Enhanced Assist section */}
                              {event.assist?.name && (
                                <>
                                  <div className="flex items-center gap-2 -ml-3 text-xs font-medium py-1">
                                    <img
                                      src="/assets/matchdetaillogo/assist.svg"
                                      alt="Assist"
                                      className="w-4 h-4 opacity-80 flex-shrink-0"
                                    />
                                    <span className="text-gray-600 font-bold  text-xs tracking-wider">
                                      Assist 
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 -ml-3 pl-1  text-xs font-medium bg-stone-200">
                                    <MyAvatarInfo
                                      playerId={event.assist?.id}
                                      playerName={event.assist?.name}
                                      size="md-commentary"
                                      className="border-indigo-400 shadow-lg flex-shrink-0"
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-gray-700 font-bold text-sm">
                                        {event.assist.name}
                                      </span>
                                      <span className="text-gray-500 text-xs">
                                        {event.team?.name}

                                      </span>
                                    </div>

                                  </div>

                                  <div className="text-sm text-gray-700 leading-relaxed -ml-3    ">
                                    🎨 Brilliant setup from {event.assist.name}!
                                    The vision and execution to create this
                                    scoring opportunity was absolutely perfect.
                                    Great teamwork between {event.assist.name}{" "}
                                    and {event.player?.name || "the goalscorer"}
                                    !
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : event.type === "Card" ? (
                          <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 -ml-3 -mt-1 -mb-1  px-1 text-xs font-medium bg-gradient-to-r from-green-50 to-blue-50 ">
                              {event.detail
                                ?.toLowerCase()
                                .includes("yellow") ? (
                                <img
                                  src="/assets/matchdetaillogo/card-icon.svg"
                                  alt="Yellow Card"
                                  className="w-4 h-4 opacity-80 flex-shrink-0"
                                />
                              ) : (
                                <img
                                  src="/assets/matchdetaillogo/red-card-icon.svg"
                                  alt="Red Card"
                                  className="w-4 h-4 opacity-80 flex-shrink-0"
                                />
                              )}
                              <span className="text-gray-700 font-medium">
                                {event.detail || "Card"}
                              </span>
                                <div className="ml-auto flex items-center gap-2">

                                  <MyWorldTeamLogo
                                    teamName={event.team?.name || ""}
                                    teamLogo={`/api/team-logo/square/${event.team?.id || "fallback"}?size=24`}
                                    alt={event.team?.name}
                                    size="24px"
                                    className="w-6 h-6"
                                  />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 -ml-3  text-xs font-medium bg-stone-200">
                              <MyAvatarInfo
                                playerId={event.player?.id}
                                playerName={event.player?.name}
                                size="md-commentary"
                                className="border-2 shadow-sm flex-shrink-0"
                              />
                              <span className="text-gray-700 font-medium -ml-1">
                                {event.player?.name || "Unknown Player"}
                              </span>
                            </div>
                            <div className=" flex text-sm text-gray-700 leading-relaxed -ml-3">
                              {`${event.player?.name || "Unknown Player"} (${event.team?.name || "Unknown Team"}) is shown the ${event.detail?.toLowerCase().includes("yellow") ? "yellow" : "red"} card${event.detail?.toLowerCase().includes("foul") ? " for a foul" : ""}.`}
                              {event.comments &&
                                event.comments.trim().length > 0 && (
                                  <div className="text-xs text-gray-600 italic ml-1">
                                    {event.comments}
                                  </div>
                                )}
                            </div>
                          </div>
                        ) : event.type === "subst" ? (
                          <div className="flex flex-col gap-1">
                            {/* Substitution Header */}
                            <div className="flex items-center gap-2 -ml-3 -mt-1  px-1 text-xs font-medium bg-gradient-to-r from-green-50 to-blue-50 ">
                              <img
                                src="/assets/matchdetaillogo/substitution.svg"
                                alt="Substitution"
                                className="w-4 h-4 opacity-80 flex-shrink-0"
                              />
                              <span className="text-gray-700 font-medium">
                                Substitution
                              </span>
                              <div className="ml-auto flex items-center gap-2">

                                <MyWorldTeamLogo
                                  teamName={event.team?.name || ""}
                                  teamLogo={`/api/team-logo/square/${event.team?.id || "fallback"}?size=24`}
                                  alt={event.team?.name}
                                  size="24px"
                                  className="w-6 h-6"
                                />
                              </div>
                            </div>

                            {/* Player coming in (assist = player in) */}
                            {event.assist?.name && (
                              <div className="flex items-center gap-2 -ml-3  text-xs font-medium bg-stone-200 ">
                                <MyAvatarInfo
                                  playerId={event.assist?.id}
                                  playerName={event.assist?.name}
                                  size="md-commentary"
                                  className="border-2 border-green-400 shadow-sm flex-shrink-0"
                                />
                                <span className="text-gray-700 font-medium -ml-1">
                                  {event.assist?.name || "Unknown Player"}
                                </span>
                              </div>
                            )}

                            {/* Player going out (player = player out) */}
                            <div className="flex items-center gap-2 -ml-3  text-xs font-medium bg-stone-200 ">
                              <MyAvatarInfo
                                playerId={event.player?.id}
                                playerName={event.player?.name}
                                size="md-commentary"
                                className="border-2 border-red-400 shadow-sm flex-shrink-0"
                              />
                              <span className="text-gray-700 font-medium -ml-1">
                                {event.player?.name || "Unknown Player"}
                              </span>
                            </div>

                            {/* Additional comments if any */}
                            {event.comments && (
                              <div className="text-xs text-gray-600 leading-relaxed -ml-3 italic mt-1">
                                ```text
                                {event.comments}
                              </div>
                            )}

                            {/* Detailed substitution description */}
                            <div className="text-sm text-gray-700 leading-relaxed -ml-3 mb-4">
                              {event.assist?.name && event.player?.name
                                ? `Substitution, ${event.team?.name || "Team"}. ${event.assist.name} replaces ${event.player.name}.`
                                : eventDescription}
                            </div>
                          </div>
                        ) : event.type === "Var" ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 -ml-3 py-1 text-xs font-medium">
                              <img
                                src="/assets/matchdetaillogo/missed-penalty.svg"
                                alt="VAR"
                                className="w-4 h-4 opacity-80 flex-shrink-0"
                              />
                              <span className="text-gray-700 font-medium">
                                {event.detail?.includes("Goal")
                                  ? "Goal Disallowed"
                                  : `VAR ${event.detail || "Review"}`}
                              </span>
                            </div>
                            {event.player?.name && (
                              <div className="flex items-center gap-2 -ml-3 py-1 text-xs font-medium bg-stone-200">
                                <MyAvatarInfo
                                  playerId={event.player?.id}
                                  playerName={event.player?.name}
                                  size="md-commentary"
                                  className="border-2 shadow-sm flex-shrink-0"
                                />
                                <span className="text-gray-700 font-medium -ml-1">
                                  {event.player?.name || "Unknown Player"}
                                </span>
                              </div>
                            )}
                            <div className="text-sm text-gray-700 leading-relaxed -ml-3">
                              {(() => {
                                // Enhanced VAR description based on event details
                                if (
                                  event.detail
                                    ?.toLowerCase()
                                    .includes("goal") &&
                                  event.detail
                                    ?.toLowerCase()
                                    .includes("overturned")
                                ) {
                                  return `GOAL OVERTURNED BY VAR: ${event.player?.name || "Player"} (${event.team?.name || "Team"}) scores but the goal is ruled out after a VAR review.`;
                                } else if (
                                  event.detail
                                    ?.toLowerCase()
                                    .includes("no goal")
                                ) {
                                  return `VAR Decision: No Goal ${event.team?.name || "Team"}.`;
                                } else if (
                                  event.detail
                                    ?.toLowerCase()
                                    .includes("penalty")
                                ) {
                                  return `VAR Review: Penalty decision for ${event.team?.name || "Team"}.`;
                                } else {
                                  return eventDescription;
                                }
                              })()}
                            </div>
                            {event.comments && (
                              <div className="text-xs text-gray-600 leading-relaxed -ml-3 italic mt-1">
                                {event.comments}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 -ml-3 py-1 text-xs font-medium">
                              <img
                                src="/assets/matchdetaillogo/soccer-ball.svg"
                                alt="Event"
                                className="w-4 h-4 opacity-80 flex-shrink-0"
                              />
                              <span className="text-gray-700 font-medium">
                                {event.type} - {event.detail || "Match Event"}
                              </span>
                            </div>
                            {event.player?.name && (
                              <div className="flex items-center gap-2 -ml-3 py-1 text-xs font-medium bg-gray-200">
                                <MyAvatarInfo
                                  playerId={event.player?.id}
                                  playerName={event.player?.name}
                                  size="md-commentary"
                                  className="border-2 shadow-sm flex-shrink-0"
                                />
                                <span className="text-gray-700 font-medium -ml-1">
                                  {event.player?.name || "Unknown Player"}
                                </span>
                              </div>
                            )}
                            {event.comments && (
                              <div className="text-xs text-gray-600 leading-relaxed -ml-3 italic">
                                {event.comments}
                              </div>
                            )}
                            <div className="text-sm text-gray-700 leading-relaxed -ml-3">
                              {eventDescription}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
          })()}
        </div>
      </div>
    </>
  );
};

export default MyCommentary;