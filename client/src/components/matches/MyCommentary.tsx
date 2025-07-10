import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

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
  getPlayerImage: (
    playerId: number | undefined,
    playerName: string | undefined,
  ) => string;
  getEventDescription: (event: MatchEvent) => string;
  isHomeTeam: (event: MatchEvent) => boolean;
}

const MyCommentary: React.FC<MyCommentaryProps> = ({
  events,
  homeTeam,
  awayTeam,
  getPlayerImage,
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
          // Away team own goal gives home team a point
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
      {/* End of Match Indicator */}
      {(() => {
        // Check if match has ended based on events
        const hasEndedEvents = events.some(
          (event) =>
            event.time.elapsed >= 90 &&
            event.time.extra &&
            event.time.extra > 0,
        );

        if (hasEndedEvents) {
          // Find the event with the highest total time (elapsed + extra)
          const eventsWithTotalTime = events.map((e) => ({
            ...e,
            totalTime: e.time.elapsed + (e.time.extra || 0),
          }));

          const finalEvent = eventsWithTotalTime.reduce((latest, current) =>
            current.totalTime > latest.totalTime ? current : latest,
          );

          const finalScore = calculateScoreAtTime(finalEvent.totalTime);
          console.log("Final score calculation:", finalScore);

          return (
            <div className="border-t flex items-center ">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-800 mb-1"></div>
                <div className="ml-8 text-xs text-red-500 text-center">
                  {finalEvent.time.extra && finalEvent.time.extra > 0
                    ? ` +${finalEvent.time.extra}'`
                    : ""}
                </div>
                <div className="ml-8 text-xs text-gray-600">
                  {finalEvent.time.elapsed}'
                </div>
              </div>
              <img
                src="/assets/matchdetaillogo/clock.png"
                alt="Goal"
                className="ml-4 w-4 h-4 opacity-80 flex-shrink-0"
              />
              <div className="ml-2 text-sm font-bold text-black-800 ">
                {finalScore.homeScore}-{finalScore.awayScore}
              </div>
            </div>
          );
        }
        return null;
      })()}

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

            if (hasEventsInFirstHalf) {
              // Add "First Half begins" marker
              allCommentaryItems.push({
                time: { elapsed: 1 },
                type: "period_start",
                detail: "First Half begins",
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);

              // Add "45 minutes" period marker with score
              const halftimeScore = calculateScoreAtTime(45);
              allCommentaryItems.push({
                time: { elapsed: 45 },
                type: "period_marker",
                detail: `Second Half begins (${homeTeam || "Home"} ${halftimeScore.homeScore} - ${halftimeScore.awayScore} ${awayTeam || "Away"})`,
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);

              // Add "Half Time" marker if there are events after minute 45
              if (hasEventsInSecondHalf) {
                allCommentaryItems.push({
                  time: { elapsed: 45 },
                  type: "half time",
                  detail: "Half Time",
                  team: { name: "", logo: "" },
                  player: { name: "" },
                } as any);
              }
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
              // Find the highest extra time played in events at or after 90 minutes
              const eventsAt90Plus = events.filter((e) => e.time.elapsed > 90);
              const maxExtraTime =
                eventsAt90Plus.length > 0
                  ? Math.max(
                      ...eventsAt90Plus
                        .filter((e) => e.time.extra)
                        .map((e) => e.time.extra || 0),
                      0,
                    )
                  : 0;

              const ninetyMinDetail =
                maxExtraTime > 0 ? `Full Time` : "Full Time";

              allCommentaryItems.push({
                time: {
                  elapsed: 90,
                  extra: maxExtraTime > 0 ? maxExtraTime : undefined,
                },
                type: "period_end",
                detail: ninetyMinDetail,
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
                  extra: finalEvent.time.extra && finalEvent.time.extra > 0 ? finalEvent.time.extra : "",
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
                // First sort by elapsed time (descending)
                if (a.time.elapsed !== b.time.elapsed) {
                  return b.time.elapsed - a.time.elapsed;
                  
                }

                // If elapsed time is the same, sort by extra time (descending)
                // Events with higher extra time should appear first
                const aExtra = a.time.extra || 0;
                const bExtra = b.time.extra || 0;

                if (aExtra !== bExtra) {
                  return bExtra - aExtra;
                  
                }

                // For events at the same time, prioritize period markers to appear first
                const aPriority =
                  a.type === "period_end" || a.type === "period_marker" ? 1 : 0;
                const bPriority =
                  b.type === "period_end" || b.type === "period_marker" ? 1 : 0;
                return bPriority - aPriority;
              }) // Sort by time, most recent first, then by extra time
              .map((event, index) => {
                const timeDisplay = `${event.time.extra ? `+${event.time.extra}` : ""}`;

                // Handle period score markers
                if (event.type === "period_score") {
                  return (
                    <div
                      key={`period-score-${index}`}
                      className="commentary-event-container"
                    >
                      <div className="flex items-center    py-1  mb-1">
                        <div className="text-sm font-semibold text-gray-700 ml-4">
                          +{event.time.extra}
                          {event.time.elapsed}'
                        </div>
                        <div className="text-lg font-bold text-gray-900 ml-4">
                          
                          <img
                            src="/assets/matchdetaillogo/clock.png"
                            alt="clock"
                            className=" w-4 h-4 opacity-80 flex-shrink-0 "
                          />
                        </div>
                        <span className="text-lg font-bold text-gray-900 ml-2">
                          {event.score}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Handle period markers
                if (
                  event.type === "period_start" ||
                  event.type === "period_end" ||
                  event.type === "period_marker"
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
                              <div className="w-0.5 h-5 bg-gray-800 ml-1"></div>
                            )}
                          </div>

                          {/* Content Column */}
                          <div className="flex-1"> 
                            <div className="text-sm text-gray-700 leading-relaxed mt-1">
                              <img
                                src="/assets/matchdetaillogo/clock.png"
                                alt="Kick Off"
                                className="w-4 h-4 "
                              /> 
                              <div>
                                
                                Kick Off</div>
                              <div className="text-xs text-gray-600 mt-1">
                                First Half begins.
                              </div>
                              
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Handle "Half Time" / "Second Half begins"
                  if (event.detail === "Half Time") {
                    const halftimeScore = calculateScoreAtTime(45);
                    return (
                      <div
                        key={`period-${index}`}
                        className="commentary-event-container"
                      >
                        <div className="flex gap-3">
                          {/* Time Column */}
                          <div className="flex flex-col items-center min-w-[50px]">
                            <div className="text-gray-800 text-sm font-medium leading-tight">
                              45'
                            </div>
                            {index < allCommentaryItems.length - 1 && (
                              <div className="w-0.5 h-12 bg-gray-600"></div>
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
                                {halftimeScore.homeScore} - {halftimeScore.awayScore}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Handle "Second Half begins" with score display
                  if (event.detail.includes("Second Half begins")) {
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
                              <div className="w-0.5 h-5 bg-gray-800 ml-1"></div>
                            )}
                          </div>

                          {/* Content Column */}
                          <div className="flex-1">
                            <div className="text-sm text-gray-700 leading-relaxed">
                              {event.detail}
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
                          {/* Show extra time above elapsed time for Full Time marker */}
                          {event.detail === "Full Time" && event.time.extra && event.time.extra > 0 && (
                            <div className="text-xs font-medium text-red-500 leading-tight">
                              +{event.time.extra}'
                            </div>
                          )}

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
                            <div className="w-0.5 h-5 bg-gray-800 ml-1 "></div>
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
                            <div className="w-0.5 h-5 bg-gray-800 ml-1"></div>
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
                            <div className="w-0.5 h-12 bg-gray-600"></div>
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
                    className="commentary-event-container "
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
                          {event.time.elapsed}'
                        </div>

                        {index < allCommentaryItems.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-600  "></div>
                        )}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1">
                        {event.type === "Goal" ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1 -ml-3 -mt-1 py-1 rounded-md text-xs font-medium">
                              {(() => {
                                const detail =
                                  event.detail?.toLowerCase() || "";
                                if (detail.includes("penalty")) {
                                  if (detail.includes("missed")) {
                                    return (
                                      <img
                                        src="/assets/matchdetaillogo/missed-penalty.svg"
                                        alt="Missed Penalty"
                                        className="w-4 h-4 opacity-80 flex-shrink-0"
                                      />
                                    );
                                  } else {
                                    return (
                                      <img
                                        src="/assets/matchdetaillogo/penalty.svg"
                                        alt="Penalty Goal"
                                        className="w-4 h-4 opacity-80 flex-shrink-0"
                                      />
                                    );
                                  }
                                } else if (detail.includes("own goal")) {
                                  return (
                                    <img
                                      src="/assets/matchdetaillogo/soccer-logo.svg"
                                      alt="Own Goal"
                                      className="w-4 h-4 opacity-80 flex-shrink-0"
                                    />
                                  );
                                } else {
                                  return (
                                    <img
                                      src="/assets/matchdetaillogo/blue ball.svg"
                                      alt="Goal"
                                      className="w-4 h-4 opacity-80 flex-shrink-0"
                                    />
                                  );
                                }
                              })()}
                              <span>
                                Score:{" "}
                                {(() => {
                                  // Calculate score including this goal event
                                  const scoreAfterGoal = calculateScoreAtTime(
                                    event.time.elapsed +
                                      (event.time.extra || 0),
                                  );
                                  return `${scoreAfterGoal.homeScore}-${scoreAfterGoal.awayScore}`;
                                })()}
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 -ml-3 py-1  text-xs font-medium bg-gray-200">
                                <Avatar className="w-8 h-8 border-2  shadow-sm flex-shrink-0 ">
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
                                <span className="text-gray-700 font-medium -ml-1">
                                  {event.player?.name || "Unknown Player"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 -ml-3">
                              <div className="goal-event-wrapper ">
                                <div className="text-xs font-bold text-gray-900 leading-relaxed">
                                  {eventDescription}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : event.type === "Card" ? (
                          <div className="flex items-start gap-1 -ml-3 ">
                            <div className="text-sm text-gray-700 leading-relaxed">
                              {eventDescription}
                            </div>
                          </div>
                        ) : event.type === "Subst" ? (
                          <div className="text-sm text-gray-700 leading-relaxed -ml-18 ">
                            {eventDescription}
                          </div>
                        ) : event.type === "Var" ? (
                          <div className="flex items-start gap-1 -ml-3">
                            <span className="text-xs mt-0.5">
                              <img
                                src="/assets/matchdetaillogo/missed-penalty.svg"
                                alt="Missed Penalty"
                                className="w-4 h-4 opacity-80 flex-shrink-0"
                              />
                            </span>
                            <div className="text-xs text-gray-700 leading-relaxed">
                              {eventDescription}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 leading-relaxed -ml-2">
                            {eventDescription}
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
