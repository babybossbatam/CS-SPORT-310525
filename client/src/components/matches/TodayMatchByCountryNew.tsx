import React from "react";
import MyWorldTeamLogo from "./MyWorldTeamLogo";
import MyCircularFlag from "./MyCircularFlag";
import LazyImage from "./LazyImage";

const TodayMatch = ({ fixture, leagueContext }) => {
  const isHomeTeamClub = fixture.teams?.home?.isClub;
  const isAwayTeamClub = fixture.teams?.away?.isClub;

  return (
    <div className="today-match-wrapper">
      <div className="today-match-team home">
        <div className="today-match-team-logo">
          {isHomeTeamClub ? (
            <LazyImage
              src={
                fixture.teams.home.id
                  ? `/api/team-logo/square/${fixture.teams.home.id}?size=32`
                  : "/assets/fallback-logo.svg"
              }
              alt={fixture.teams.home.name || ""}
              className="team-logo popular-leagues-size"
              style={{ width: "34px", height: "34px" }}
              useTeamLogo={true}
              teamId={fixture.teams.home.id}
              teamName={fixture.teams.home.name}
              leagueContext={leagueContext}
              priority="medium"
            />
          ) : (
            <MyCircularFlag
              countryId={fixture.teams.home.id}
              countryName={fixture.teams.home.name}
              flagSize="34px"
            />
          )}
        </div>
        <div className="today-match-team-name">
          {fixture.teams.home.name || "N/A"}
        </div>
      </div>

      <div className="today-match-score">
        {fixture.time}
        <br />
        {fixture.score}
      </div>

      <div className="today-match-team away">
        <div className="today-match-team-logo">
          {isAwayTeamClub ? (
            <LazyImage
              src={
                fixture.teams.away.id
                  ? `/api/team-logo/square/${fixture.teams.away.id}?size=32`
                  : "/assets/fallback-logo.svg"
              }
              alt={fixture.teams.away.name || ""}
              className="team-logo popular-leagues-size"
              style={{ width: "34px", height: "34px" }}
              useTeamLogo={true}
              teamId={fixture.teams.away.id}
              teamName={fixture.teams.away.name}
              leagueContext={leagueContext}
              priority="medium"
            />
          ) : (
            <MyCircularFlag
              countryId={fixture.teams.away.id}
              countryName={fixture.teams.away.name}
              flagSize="34px"
            />
          )}
        </div>
        <div className="today-match-team-name">
          {fixture.teams.away.name || "N/A"}
        </div>
      </div>
    </div>
  );
};

export default TodayMatch;