
import React from "react";
import MatchEndedDetailsCard from "./MatchEndedDetailsCard";
import MatchLiveDetailsCard from "./MatchLiveDetailsCard";
import MatchUpcomingDetailsCard from "./MatchUpcomingDetailsCard";

interface MatchDetailCardProps {
  match: any;
  className?: string;
}

const MatchDetailCard: React.FC<MatchDetailCardProps> = ({
  match,
  className = "",
}) => {
  if (!match) {
    return null;
  }

  const getMatchStatus = () => {
    const status = match.fixture?.status?.short;
    
    // Live match statuses
    if (["LIVE", "1H", "2H", "HT", "ET", "BT", "P", "INT"].includes(status)) {
      return "Live";
    }
    
    // Ended match statuses
    if (["FT", "AET", "PEN", "PST", "CANC", "ABD", "SUSP", "AWD", "WO"].includes(status)) {
      return "Ended";
    }
    
    // Upcoming match statuses (including NS - Not Started)
    if (["NS", "TBD", "SUSP"].includes(status) || !status) {
      return "Upcoming";
    }
    
    // Default to upcoming for unknown statuses
    return "Upcoming";
  };

  const matchStatus = getMatchStatus();
  const homeTeam = match.teams?.home?.name || "Home Team";
  const awayTeam = match.teams?.away?.name || "Away Team";
  const homeTeamLogo = match.teams?.home?.logo;
  const awayTeamLogo = match.teams?.away?.logo;

  const renderStatusCard = () => {
    switch (matchStatus) {
      case "Ended":
        return (
          <MatchEndedDetailsCard
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamLogo={homeTeamLogo}
            awayTeamLogo={awayTeamLogo}
          />
        );
      
      case "Live":
        return (
          <MatchLiveDetailsCard
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamLogo={homeTeamLogo}
            awayTeamLogo={awayTeamLogo}
          />
        );
      
      case "Upcoming":
      default:
        return (
          <MatchUpcomingDetailsCard
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamLogo={homeTeamLogo}
            awayTeamLogo={awayTeamLogo}
          />
        );
    }
  };

  return (
    <div className={`match-detail-card ${className}`}>
      {renderStatusCard()}
    </div>
  );
};

export default MatchDetailCard;
