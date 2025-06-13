
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { isNationalTeam } from "../../lib/teamLogoSources";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import "../../styles/MyLogoPositioning.css";

interface LazyMatchItemProps {
  match: any;
  onMatchClick?: (match: any) => void;
}

const LazyMatchItem: React.FC<LazyMatchItemProps> = ({ match, onMatchClick }) => {
  const [isStarred, setIsStarred] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStarred(!isStarred);
  };

  const handleMatchClick = () => {
    if (onMatchClick) {
      onMatchClick(match);
    }
  };

  const formatMatchTime = (dateString: string) => {
    try {
      if (!dateString) return "TBD";
      const date = parseISO(dateString);
      if (!isValid(date)) return "TBD";
      return format(date, "HH:mm");
    } catch (error) {
      return "TBD";
    }
  };

  const getWinnerClass = (isHome: boolean) => {
    if (match.fixture.status.short !== "FT") return "";
    
    const homeScore = match.goals?.home || 0;
    const awayScore = match.goals?.away || 0;
    
    if (homeScore === awayScore) return "";
    
    if (isHome && homeScore > awayScore) return "winner";
    if (!isHome && awayScore > homeScore) return "winner";
    
    return "";
  };

  // Add null checking to prevent runtime errors
  if (!match?.teams?.home || !match?.teams?.away) {
    return (
      <Card className="league-card-spacing">
        <CardContent className="p-4 text-center text-gray-500">
          Invalid match data
        </CardContent>
      </Card>
    );
  }

  const homeIsNational = isNationalTeam(match.teams.home.name);
  const awayIsNational = isNationalTeam(match.teams.away.name);

  return (
    <Card className="league-card-spacing">
      <CardContent className="p-0">
        <div 
          className={`match-card-container ${isHoveringCard ? "" : "disable-hover"}`}
          onClick={handleMatchClick}
          onMouseEnter={() => setIsHoveringCard(true)}
          onMouseLeave={() => setIsHoveringCard(false)}
        >
          {/* Star button slide-in */}
          <button
            className="match-star-button"
            onClick={handleStarClick}
            onMouseEnter={() => setIsHoveringCard(false)}
            onMouseLeave={() => setIsHoveringCard(true)}
          >
            <Star 
              className={`match-star-icon ${isStarred ? "starred" : ""}`}
              fill={isStarred ? "currentColor" : "none"}
            />
          </button>

          {/* Three-grid container */}
          <div className="match-three-grid-container">
            {/* Top grid - Match status */}
            <div className="match-status-top">
              {(() => {
                const status = match.fixture.status.short;

                // Finished matches status - check this FIRST and RETURN immediately
                if (
                  [
                    "FT",
                    "AET", 
                    "PEN",
                    "AWD",
                    "WO",
                    "CANC",
                    "ABD",
                    "SUSP",
                  ].includes(status)
                ) {
                  return (
                    <div className="match-status-label status-ended">
                      {status === "FT" ? "Ended" : status}
                    </div>
                  );
                }

                // Live matches status - only check if NOT finished
                if (
                  [
                    "LIVE",
                    "1H", 
                    "HT",
                    "2H",
                    "ET",
                    "BT",
                    "P",
                    "INT",
                  ].includes(status)
                ) {
                  return (
                    <div className="match-status-label status-live">
                      {match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : "LIVE"}
                    </div>
                  );
                }

                // Postponed matches status
                if (status === "PST") {
                  return (
                    <div className="match-status-label status-postponed">
                      Postponed
                    </div>
                  );
                }

                // Upcoming matches - show time
                return (
                  <div className="match-status-label status-upcoming">
                    {formatMatchTime(match.fixture.date)}
                  </div>
                );
              })()}
            </div>

            {/* Main content - Grid layout */}
            <div className="match-content-container">
              {/* Home team name */}
              <div className={`home-team-name ${getWinnerClass(true)}`}>
                {match.teams.home.name}
              </div>

              {/* Home team logo */}
              <div className="home-team-logo-container">
                {homeIsNational ? (
                  <MyCircularFlag
                    teamName={match.teams.home.name}
                    size="34px"
                    className="popular-leagues-size"
                  />
                ) : (
                  <LazyImage
                    src={`/api/team-logo/square/${match.teams.home.id}`}
                    alt={match.teams.home.name}
                    className="team-logo"
                    style={{
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))"
                    }}
                    fallbackSrc="/assets/fallback-logo.svg"
                  />
                )}
              </div>

              {/* Score/Time center */}
              <div className="match-score-container">
                {match.fixture.status.short === "NS" ? (
                  <div className="match-time-display">
                    {formatMatchTime(match.fixture.date)}
                  </div>
                ) : (
                  <div className="match-score-display">
                    <span className="score-number">{match.goals?.home || 0}</span>
                    <span className="score-separator">-</span>
                    <span className="score-number">{match.goals?.away || 0}</span>
                  </div>
                )}
              </div>

              {/* Away team logo */}
              <div className="away-team-logo-container">
                {awayIsNational ? (
                  <MyCircularFlag
                    teamName={match.teams.away.name}
                    size="34px"
                    className="popular-leagues-size"
                  />
                ) : (
                  <LazyImage
                    src={`/api/team-logo/square/${match.teams.away.id}`}
                    alt={match.teams.away.name}
                    className="team-logo"
                    style={{
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))"
                    }}
                    fallbackSrc="/assets/fallback-logo.svg"
                  />
                )}
              </div>

              {/* Away team name */}
              <div className={`away-team-name ${getWinnerClass(false)}`}>
                {match.teams.away.name}
              </div>
            </div>

            {/* Bottom grid - Penalty results */}
            <div className="match-penalty-bottom">
              {match.score?.penalty && (
                <div className="penalty-result-display">
                  <div className="penalty-text">
                    Penalties: {match.score.penalty.home} - {match.score.penalty.away}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LazyMatchItem;
