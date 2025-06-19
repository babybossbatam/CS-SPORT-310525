import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MatchEndedDetailsCard from "./MatchEndedDetailsCard";
import MatchLiveDetailsCard from "./MatchLiveDetailsCard";
import MatchUpcomingDetailsCard from "./MatchUpcomingDetailsCard";

interface MatchPredictionsCardProps {
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  matchStatus?: string;
}

const MatchPredictionsCard: React.FC<MatchPredictionsCardProps> = ({
  homeTeam,
  awayTeam,
  homeTeamLogo,
  awayTeamLogo,
  matchStatus = "NS",
}) => {

  // Helper function to determine match status type
  const getMatchStatusType = (status: string) => {
    const endedStatuses = ['FT', 'AET', 'PEN', 'FT_PEN', 'CANC', 'ABD', 'AWD', 'WO'];
    const liveStatuses = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P', 'INT'];
    const upcomingStatuses = ['NS', 'TBD', 'SUSP', 'PST'];

    if (endedStatuses.includes(status)) {
      return "ENDED";
    } else if (liveStatuses.includes(status)) {
      return "LIVE";
    } else {
      return "UPCOMING";
    }
  };

  const statusType = getMatchStatusType(matchStatus);

  // Render appropriate card based on match status
  switch (statusType) {
    case "ENDED":
      return (
        <MatchEndedDetailsCard
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeTeamLogo={homeTeamLogo}
          awayTeamLogo={awayTeamLogo}
        />
      );
    case "LIVE":
      return (
        <MatchLiveDetailsCard
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeTeamLogo={homeTeamLogo}
          awayTeamLogo={awayTeamLogo}
        />
      );
    case "UPCOMING":
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

export default MatchPredictionsCard;