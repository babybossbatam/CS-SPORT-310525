
import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import MyWorldTeamLogo from '../common/MyWorldTeamLogo';
import { MySmartTimeFilter } from '@/lib/MySmartTimeFilter';

interface VirtualizedMatchListProps {
  matches: any[];
  onMatchClick?: (match: any) => void;
  starredMatches: Set<number>;
  onToggleStar: (matchId: number) => void;
  halftimeFlashMatches: Set<number>;
  fulltimeFlashMatches: Set<number>;
  goalFlashMatches: Set<number>;
  leagueContext: {
    name: string;
    country: string;
  };
  selectedDate: string;
  shortenTeamName: (name: string) => string;
}

const VirtualizedMatchList: React.FC<VirtualizedMatchListProps> = memo(({
  matches,
  onMatchClick,
  starredMatches,
  onToggleStar,
  halftimeFlashMatches,
  fulltimeFlashMatches,
  goalFlashMatches,
  leagueContext,
  selectedDate,
  shortenTeamName,
}) => {
  const MatchItem = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const match = matches[index];
    if (!match) return null;

    const DEBUG = process.env.NODE_ENV !== 'production';

    return (
      <div style={style}>
        <div
          className={`match-card-container group ${
            halftimeFlashMatches.has(match.fixture.id) ? 'halftime-flash' : ''
          } ${
            fulltimeFlashMatches.has(match.fixture.id) ? 'fulltime-flash' : ''
          } ${
            goalFlashMatches.has(match.fixture.id) ? 'goal-flash' : ''
          }`}
          onClick={() => {
            if (DEBUG) {
              console.log(`🔍 [MATCH DEBUG] Clicked match:`, {
                fixtureId: match.fixture.id,
                fixtureDate: match.fixture.date,
                teams: `${match.teams.home.name} vs ${match.teams.away.name}`,
                selectedDate,
                status: match.fixture.status.short,
                dataSource: 'VirtualizedMatchList'
              });
            }
            onMatchClick?.(match);
          }}
          style={{
            cursor: onMatchClick ? "pointer" : "default",
          }}
        >
          {/* Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(match.fixture.id);
            }}
            className="match-star-button"
            title="Add to favorites"
            onMouseEnter={(e) => {
              e.currentTarget.closest(".group")?.classList.add("disable-hover");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.closest(".group")?.classList.remove("disable-hover");
            }}
          >
            <Star
              className={`match-star-icon ${
                starredMatches.has(match.fixture.id) ? "starred" : ""
              }`}
            />
          </button>

          {/* Three-grid layout container */}
          <div className="match-three-grid-container">
            {/* Top grid for match status */}
            <div className="match-status-top">
              {(() => {
                const status = match.fixture.status.short;
                const elapsed = match.fixture.status.elapsed;
                const matchDateTime = new Date(match.fixture.date);
                const hoursOld = (Date.now() - matchDateTime.getTime()) / (1000 * 60 * 60);
                const isStaleFinishedMatch =
                  (["FT", "AET", "PEN"].includes(status) && hoursOld > 4) ||
                  (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status) && hoursOld > 4) ||
                  (hoursOld > 4 && ["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(status));

                if (
                  !["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status) &&
                  !isStaleFinishedMatch &&
                  hoursOld <= 4 &&
                  ["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)
                ) {
                  let displayText = "";
                  let statusClass = "status-live-elapsed";

                  if (status === "HT") {
                    displayText = "Halftime";
                    statusClass = "status-halftime";
                  } else if (status === "P") {
                    displayText = "Penalties";
                  } else if (status === "ET") {
                    if (elapsed) {
                      const extraTime = elapsed - 90;
                      displayText = extraTime > 0 ? `90' + ${extraTime}'` : `${elapsed}'`;
                    } else {
                      displayText = "Extra Time";
                    }
                  } else if (status === "BT") {
                    displayText = "Break Time";
                  } else if (status === "INT") {
                    displayText = "Interrupted";
                  } else {
                    displayText = elapsed ? `${elapsed}'` : "LIVE";
                  }

                  return (
                    <div className={`match-status-label ${statusClass}`}>
                      {displayText}
                    </div>
                  );
                }

                if (["PST", "CANC", "ABD", "SUSP", "AWD", "WO"].includes(status)) {
                  return (
                    <div className="match-status-label status-postponed">
                      {status === "PST" ? "Postponed" : status === "CANC" ? "Cancelled" : status}
                    </div>
                  );
                }

                if (status === "NS" || status === "TBD") {
                  const matchTime = new Date(match.fixture.date);
                  const now = new Date();
                  const hoursAgo = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);

                  if (hoursAgo > 2) {
                    return (
                      <div className="match-status-label status-postponed">
                        Postponed
                      </div>
                    );
                  }

                  if (status === "TBD") {
                    return (
                      <div className="match-status-label status-upcoming">
                        Time TBD
                      </div>
                    );
                  }
                  return null;
                }

                if (
                  ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status) ||
                  isStaleFinishedMatch
                ) {
                  return (
                    <div className="match-status-label status-ended">
                      {status === "FT" || isStaleFinishedMatch ? "Ended" : status}
                    </div>
                  );
                }

                return null;
              })()}
            </div>

            {/* Middle Grid: Main match content */}
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
                {shortenTeamName(match.teams.home.name) || "Unknown Team"}
              </div>

              {/* Home team logo */}
              <div className="home-team-logo-container">
                <MyWorldTeamLogo
                  teamName={match.teams.home.name || ""}
                  teamId={match.teams.home.id}
                  teamLogo={
                    match.teams.home.id
                      ? `/api/team-logo/square/${match.teams.home.id}?size=32`
                      : "/assets/fallback-logo.svg"
                  }
                  alt={match.teams.home.name}
                  size="34px"
                  className="popular-leagues-size"
                  leagueContext={leagueContext}
                />
              </div>

              {/* Score/Time Center */}
              <div className="match-score-container">
                {(() => {
                  const status = match.fixture.status.short;
                  const fixtureDate = parseISO(match.fixture.date);

                  if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                    return (
                      <div className="match-score-display">
                        <span className="score-number">{match.goals.home ?? 0}</span>
                        <span className="score-separator">-</span>
                        <span className="score-number">{match.goals.away ?? 0}</span>
                      </div>
                    );
                  }

                  if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
                    const homeScore = match.goals.home;
                    const awayScore = match.goals.away;
                    const hasValidScores =
                      homeScore !== null && homeScore !== undefined &&
                      awayScore !== null && awayScore !== undefined &&
                      !isNaN(Number(homeScore)) && !isNaN(Number(awayScore));

                    if (hasValidScores) {
                      return (
                        <div className="match-score-display">
                          <span className="score-number">{homeScore}</span>
                          <span className="score-separator">-</span>
                          <span className="score-number">{awayScore}</span>
                        </div>
                      );
                    }
                  }

                  return (
                    <div className="match-time-display" style={{ fontSize: "0.882em" }}>
                      {status === "TBD" ? "TBD" : format(fixtureDate, "HH:mm")}
                    </div>
                  );
                })()}
              </div>

              {/* Away team logo */}
              <div className="away-team-logo-container">
                <MyWorldTeamLogo
                  teamName={match.teams.away.name || ""}
                  teamId={match.teams.away.id}
                  teamLogo={
                    match.teams.away.id
                      ? `/api/team-logo/square/${match.teams.away.id}?size=32`
                      : "/assets/fallback-logo.svg"
                  }
                  alt={match.teams.away.name}
                  size="34px"
                  className="popular-leagues-size"
                  leagueContext={leagueContext}
                />
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
                {shortenTeamName(match.teams.away.name) || "Unknown Team"}
              </div>
            </div>

            {/* Bottom Grid: Penalty Result Status */}
            <div className="match-penalty-bottom">
              {(() => {
                const status = match.fixture.status.short;
                const isPenaltyMatch = status === "PEN";
                const penaltyHome = match.score?.penalty?.home;
                const penaltyAway = match.score?.penalty?.away;
                const hasPenaltyScores =
                  penaltyHome !== null && penaltyHome !== undefined &&
                  penaltyAway !== null && penaltyAway !== undefined;

                if (isPenaltyMatch && hasPenaltyScores) {
                  const winnerText =
                    penaltyHome > penaltyAway
                      ? `${shortenTeamName(match.teams.home.name)} won ${penaltyHome}-${penaltyAway} on penalties`
                      : `${shortenTeamName(match.teams.away.name)} won ${penaltyAway}-${penaltyHome} on penalties`;

                  return (
                    <div className="penalty-result-display">
                      <span className="penalty-winner" style={{ backgroundColor: 'transparent' }}>
                        {winnerText}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  });

  if (!matches.length) return null;

  return (
    <List
      height={Math.min(matches.length * 80, 400)} // 80px per item, max 400px
      itemCount={matches.length}
      itemSize={80}
      width="100%"
      style={{ 
        background: "inherit",
        animation: "slideDown 0.3s ease-out"
      }}
    >
      {MatchItem}
    </List>
  );
});

VirtualizedMatchList.displayName = 'VirtualizedMatchList';

export default VirtualizedMatchList;
