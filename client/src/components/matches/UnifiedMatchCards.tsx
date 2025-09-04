import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { isNationalTeam } from "../../lib/teamLogoSources";
import LazyImage from "../common/LazyImage";
import LazyMatchItem from "./LazyMatchItem";
import "../../styles/MyLogoPositioning.css";

interface UnifiedMatchCardsProps {
  liveMatches?: any[];
  popularLeagueMatches?: any[];
  title?: string;
  showStars?: boolean;
  maxMatches?: number;
}

const UnifiedMatchCards: React.FC<UnifiedMatchCardsProps> = ({
  liveMatches = [],
  popularLeagueMatches = [],
  title = "All Matches",
  showStars = true,
  maxMatches,
}) => {
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  const toggleStarMatch = (fixtureId: number) => {
    const newStarred = new Set(starredMatches);
    if (newStarred.has(fixtureId)) {
      newStarred.delete(fixtureId);
    } else {
      newStarred.add(fixtureId);
    }
    setStarredMatches(newStarred);
  };

  // Combine and deduplicate matches from all sources
  const allMatches = useMemo(() => {
    const matchMap = new Map();

    // Add live matches first (higher priority)
    liveMatches.forEach(match => {
      if (match.fixture?.id) {
        matchMap.set(match.fixture.id, {
          ...match,
          source: 'live',
          priority: 1
        });
      }
    });

    // Add popular league matches (lower priority, won't overwrite live matches)
    popularLeagueMatches.forEach(match => {
      if (match.fixture?.id && !matchMap.has(match.fixture.id)) {
        matchMap.set(match.fixture.id, {
          ...match,
          source: 'popular',
          priority: 2
        });
      }
    });

    return Array.from(matchMap.values());
  }, [liveMatches, popularLeagueMatches]);

  // Sort matches by priority and status
  const sortedMatches = useMemo(() => {
    return allMatches.sort((a, b) => {
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;
      const aDate = parseISO(a.fixture.date);
      const bDate = parseISO(b.fixture.date);

      // Ensure valid dates
      if (!isValid(aDate) || !isValid(bDate)) {
        return 0;
      }

      const aTime = aDate.getTime();
      const bTime = bDate.getTime();
      const now = new Date().getTime();

      // Check if matches are live
      const aIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
      const bIsLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);

      // Check if matches are finished
      const aIsFinished = ["FT", "AET", "PEN"].includes(aStatus);
      const bIsFinished = ["FT", "AET", "PEN"].includes(bStatus);

      // Live matches first
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      if (aIsLive && bIsLive) {
        const aElapsed = Number(a.fixture.status.elapsed) || 0;
        const bElapsed = Number(b.fixture.status.elapsed) || 0;
        return aElapsed - bElapsed;
      }

      // Recently finished matches next
      if (aIsFinished && !bIsFinished) return -1;
      if (!aIsFinished && bIsFinished) return 1;
      if (aIsFinished && bIsFinished) {
        return bTime - aTime;
      }

      // Upcoming matches last
      return aTime - bTime;
    });
  }, [allMatches]);

  // Apply max matches limit if specified
  const displayMatches = maxMatches ? sortedMatches.slice(0, maxMatches) : sortedMatches;

  if (!displayMatches.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No matches available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        {title}
      </CardHeader>

      {/* Single consolidated card with all matches */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-0">
            {displayMatches.map((match, index) => (
                <div key={`${match.fixture.id}-${index}`} className="match-card-container group">
                  {/* Star Button */}
                  {showStars && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarMatch(match.fixture.id);
                      }}
                      className="match-star-button"
                      title="Add to favorites"
                      onMouseEnter={(e) => {
                        e.currentTarget
                          .closest(".group")
                          ?.classList.add("disable-hover");
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget
                          .closest(".group")
                          ?.classList.remove("disable-hover");
                      }}
                    >
                      <Star
                        className={`match-star-icon ${
                          starredMatches.has(match.fixture.id) ? "starred" : ""
                        }`}
                      />
                    </button>
                  )}

                  <div className="match-content-container">
                    {/* Home Team Name */}
                    <div
                      className={`home-team-name ${
                        match.goals.home !== null &&
                        match.goals.away !== null &&
                        match.goals.home > match.goals.away
                          ? "winner"
                          : ""
                      }`}
                    >
                      {match.teams.home.name || "Unknown Team"}
                    </div>

                    {/* Home team logo */}
                    <div className="home-team-logo-container">
                      {isNationalTeam(match.teams.home, match.league) ? (
                        <div className="flag-circle">
                          <LazyImage
                            src={
                              match.teams.home.id
                                ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.home.name}
                            title={match.teams.home.name}
                            className="team-logo"
                            style={{ backgroundColor: "transparent" }}
                          />
                          <div className="gloss"></div>
                        </div>
                      ) : (
                        <LazyImage
                          src={
                            match.teams.home.id
                              ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                              : "/assets/fallback-logo.svg"
                          }
                          alt={match.teams.home.name}
                          title={match.teams.home.name}
                          className="team-logo"
                          style={{ backgroundColor: "transparent" }}
                        />
                      )}
                    </div>

                    {/* Score/Time Center */}
                    <div className="match-score-container">
                      {(() => {
                        const status = match.fixture.status.short;
                        const fixtureDate = parseISO(match.fixture.date);

                        // Live matches
                        if (
                          ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)
                        ) {
                          return (
                            <div className="relative">
                              <div className="match-score-display">
                                <span className="score-number">
                                  {match.goals.home ?? 0}
                                </span>
                                <span className="score-separator">-</span>
                                <span className="score-number">
                                  {match.goals.away ?? 0}
                                </span>
                              </div>
                              <div className="match-status-label status-live">
                                {status === "HT"
                                  ? "Halftime"
                                  : `${match.fixture.status.elapsed || 0}'`}
                              </div>
                            </div>
                          );
                        }

                        // Finished matches
                        if (
                          ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)
                        ) {
                          const homeScore = match.goals.home;
                          const awayScore = match.goals.away;
                          const hasValidScores =
                            homeScore !== null &&
                            homeScore !== undefined &&
                            awayScore !== null &&
                            awayScore !== undefined &&
                            !isNaN(Number(homeScore)) &&
                            !isNaN(Number(awayScore));

                          if (hasValidScores) {
                            return (
                              <div className="relative">
                                <div className="match-score-display">
                                  <span className="score-number">{homeScore}</span>
                                  <span className="score-separator">-</span>
                                  <span className="score-number">{awayScore}</span>
                                </div>
                                <div className="match-status-label status-ended">
                                  {status === "FT" ? "Ended" : status}
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="relative">
                                <div className="text-sm font-medium text-gray-900">
                                  {format(fixtureDate, "HH:mm")}
                                </div>
                                <div className="match-status-label status-postponed">
                                  {status === "FT" ? "No Score" : status}
                                </div>
                              </div>
                            );
                          }
                        }

                        // Upcoming matches
                        return (
                          <div className="relative flex items-center justify-center h-full">
                            <div className="match-time-display">
                              {status === "TBD" ? "TBD" : format(fixtureDate, "HH:mm")}
                            </div>
                            {status === "TBD" && (
                              <div className="match-status-label status-upcoming">
                                Time TBD
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Away team logo */}
                    <div className="away-team-logo-container">
                      {isNationalTeam(match.teams.away, match.league) ? (
                        <div className="flag-circle">
                          <LazyImage
                            src={
                              match.teams.away.id
                                ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                                : "/assets/fallback-logo.svg"
                            }
                            alt={match.teams.away.name}
                            title={match.teams.away.name}
                            className="team-logo"
                            style={{ backgroundColor: "transparent" }}
                          />
                          <div className="gloss"></div>
                        </div>
                      ) : (
                        <LazyImage
                          src={
                            match.teams.away.id
                              ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                              : "/assets/fallback-logo.svg"
                          }
                          alt={match.teams.away.name}
                          title={match.teams.away.name}
                          className="team-logo"
                          style={{ backgroundColor: "transparent" }}
                        />
                      )}
                    </div>

                    {/* Away Team Name */}
                    <div
                      className={`away-team-name ${
                        match.goals.home !== null &&
                        match.goals.away !== null &&
                        match.goals.away > match.goals.home
                          ? "winner"
                          : ""
                      }`}
                    >
                      {match.teams.away.name || "Unknown Team"}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default UnifiedMatchCards;