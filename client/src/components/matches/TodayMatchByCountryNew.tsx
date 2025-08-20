import React from "react";
import { LazyImage } from "@/common/LazyImage";
import { MyCircularFlag } from "@/common/MyCircularFlag";
import { MyWorldTeamLogo } from "@/common/MyWorldTeamLogo";

export const TodayMatchByCountryNew = ({ fixture, matches, setMatches }) => {
  const handleMatchClick = (clickedMatch) => {
    // If matches state is empty or the clicked match is not already selected,
    // set the clicked match as the selected one.
    if (!matches || matches.length === 0 || matches[0]?.fixture?.id !== clickedMatch?.fixture?.id) {
      setMatches([clickedMatch]);
    } else {
      // If the clicked match is already selected, clear the selection.
      setMatches([]);
    }
  };

  return (
    <div
      key={fixture.fixture.id}
      onClick={() => handleMatchClick(fixture)}
      className={`today-match-by-country-new ${
        matches && matches.length > 0 && matches[0]?.fixture?.id === fixture.fixture.id
          ? "selected-match"
          : ""
      }`}
    >
      <div className="match-info">
        <div className="team-logos-container">
          {/* Home team logo */}
          <div
            className="home-team-logo-container"
            style={{ padding: "0 0.5rem" }}
          >
            <MyWorldTeamLogo
              teamName={fixture.teams.home.name}
              teamId={fixture.teams.home.id}
              teamLogo={
                fixture.teams.home.logo ||
                (fixture.teams.home.id
                  ? `/api/team-logo/square/${fixture.teams.home.id}?size=32`
                  : "/assets/matchdetaillogo/fallback.png")
              }
              alt={fixture.teams.home.name}
              size="34px"
              className="popular-leagues-size"
              leagueContext={{
                name: fixture.league.name,
                country: fixture.league.country,
              }}
            />
          </div>

          {/* Away team logo */}
          <div
            className="away-team-logo-container"
            style={{ padding: "0 0.5rem" }}
          >
            <MyWorldTeamLogo
              teamName={fixture.teams.away.name}
              teamId={fixture.teams.away.id}
              teamLogo={
                fixture.teams.away.logo ||
                (fixture.teams.away.id
                  ? `/api/team-logo/square/${fixture.teams.away.id}?size=32`
                  : "/assets/matchdetaillogo/fallback.png")
              }
              alt={fixture.teams.away.name}
              size="34px"
              className="popular-leagues-size"
              leagueContext={{
                name: fixture.league.name,
                country: fixture.league.country,
              }}
            />
          </div>
        </div>

        <div className="team-names">
          <span className="home-team-name">{fixture.teams.home.name}</span>
          <span className="away-team-name">{fixture.teams.away.name}</span>
        </div>

        <div className="match-score">
          <span className="home-team-score">{fixture.score.home || "-"}</span>
          <span className="score-separator">-</span>
          <span className="away-team-score">{fixture.score.away || "-"}</span>
        </div>

        <div className="match-details">
          <span className="league-name">{fixture.league.name}</span>
          <span className="country-name">{fixture.league.country}</span>
          <span className="match-time">{fixture.fixture.time}</span>
        </div>
      </div>
    </div>
  );
};