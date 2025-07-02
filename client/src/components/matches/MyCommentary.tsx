
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
  getPlayerImage: (playerId: number | undefined, playerName: string | undefined) => string;
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

    // Get all goal events that happened before the given time
    const homeGoals = events.filter(
      (e) =>
        isHomeTeam(e) &&
        e.type === "goal" &&
        e.time.elapsed <= time,
    );
    const awayGoals = events.filter(
      (e) =>
        !isHomeTeam(e) &&
        e.type === "goal" &&
        e.time.elapsed <= time,
    );

    homeScore = homeGoals.length;
    awayScore = awayGoals.length;

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
      <div className="border-t ">
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
              (e) => e.time.elapsed > 45,
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

              // Add "Half Time" marker if there are events after minute 45
              if (hasEventsInSecondHalf) {
                allCommentaryItems.push({
                  time: { elapsed: 45 },
                  type: "period_end",
                  detail: "Half Time",
                  team: { name: "", logo: "" },
                  player: { name: "" },
                } as any);
              }
            }

            // Add period score markers
            const periodMarkers = [];
            
            // Add "Halftime" marker if there are events in both halves
            if (hasEventsInFirstHalf && hasEventsInSecondHalf) {
              const halftimeScore = calculateScoreAtTime(45);
              periodMarkers.push({
                time: { elapsed: 45 },
                type: "period_score", 
                detail: "Halftime",
                score: `${halftimeScore.homeScore} - ${halftimeScore.awayScore}`,
                team: { name: "", logo: "" },
                player: { name: "" },
              } as any);
            }

            // Add period markers to the commentary items
            allCommentaryItems.push(...periodMarkers);

            return allCommentaryItems
              .sort((a, b) => b.time.elapsed - a.time.elapsed) // Sort by time, most recent first
              .map((event, index) => {
                const timeDisplay = `${event.time.extra ? `+${event.time.extra}` : ""}`;

                // Handle period score markers
                if (event.type === "period_score") {
                  return (
                    <div
                      key={`period-score-${index}`}
                      className="commentary-event-container"
                    >
                      <div className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-lg mb-3">
                        <div className="text-sm font-semibold text-gray-700">
                          {event.detail}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {event.score}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Handle period markers
                if (
                  event.type === "period_start" ||
                  event.type === "period_end"
                ) {
                  // For Half Time, show Second Half begins with team names and scores
                  const displayText =
                    event.detail === "Half Time"
                      ? `Second Half begins ${homeTeam || "Home"} ${events.filter((e) => isHomeTeam(e) && e.type === "goal").length}, ${awayTeam || "Away"} ${events.filter((e) => !isHomeTeam(e) && e.type === "goal").length}`
                      : event.detail;

                  return (
                    <div
                      key={`period-${index}`}
                      className="commentary-event-container"
                    >
                      <div className="flex gap-1">
                        {/* Time Column */}
                        <div className="flex flex-col items-center min-w-[45px]">
                          <div className="w-3 h-6  flex items-center justify-center">
                            {event.detail === "Half Time" ? (
                              <img
                                src="/assets/matchdetaillogo/i mark.svg"
                                alt="Half Time"
                                className="w-4 h-4 ml-1"
                              />
                            ) : (
                              <span className="text-white text-xs font-semi-bold">
                                {event.type === "period_start" ? "🏁" : "⏱️"}
                              </span>
                            )}
                          </div>
                          {index < allCommentaryItems.length - 1 && (
                            <div className="w-0.5 h-5 bg-gray-800 ml-1"></div>
                          )}
                        </div>

                        {/* Content Column */}
                        <div className="flex-1">
                          <div className="text-xs font-md ml-4 text-gray-600 leading-relaxed">
                            {displayText}
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
                        <div className=" text-xs font-md text-red-500">
                          {timeDisplay}
                        </div>
                        <div
                          className=" text-gray-800"
                          style={{ marginTop: "-1px", marginBottom: "2px" }}
                        >
                          {event.time.elapsed}'
                        </div>

                        {index < allCommentaryItems.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-600 mb-0 "></div>
                        )}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1">
                        {event.type === "Goal" ? (
                          <div className="flex flex-col gap-2">
                            
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium">
                              <img
                                src="/assets/matchdetaillogo/blue ball.svg"
                                alt="Goal"
                                className="w-4 h-4 opacity-80 flex-shrink-0"
                              />
                              <span>Score: {(() => {
                                const scoreAtGoal = calculateScoreAtTime(event.time.elapsed);
                                return `${scoreAtGoal.homeScore}-${scoreAtGoal.awayScore}`;
                              })()}</span>
                              <span>
                                
                              </span>
                            </div>
                            <div className="flex flex-col gap-2">

                              <div className="flex items-center gap-2 px-2 py-1  text-xs font-medium bg-gray-200">
                                <Avatar className="w-8 h-8 border-2  shadow-sm flex-shrink-0">
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
                                <span className="text-gray-700 font-medium">
                                  {event.player?.name || "Unknown Player"}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                             
                              <div className="goal-event-wrapper ">
                                <div className="text-xs font-bold text-gray-900 leading-relaxed">
                                  {eventDescription}
                                </div>
       
                              </div>
                            </div>
                          </div>
                        ) : event.type === "Card" ? (
                          <div className="flex items-start gap-1 ml-6">
                    
                            <div className="text-sm text-gray-700 leading-relaxed">
                              {eventDescription}
                            </div>
                          </div>
                        ) : event.type === "Subst" ? (
                          <div className="text-sm text-gray-700 leading-relaxed" style={{ marginLeft: '6px' }}>
                            {eventDescription}
                          </div>
                        ) : event.type === "Var" ? (
                          <div className="flex items-start gap-1">
                            <span className="text-xs mt-0.5">📺</span>
                            <div className="text-xs text-gray-700 leading-relaxed">
                              {eventDescription}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 leading-relaxed ml-6">
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
