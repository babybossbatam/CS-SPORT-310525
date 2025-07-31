import React from "react";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyLiveAction from "@/components/matches/MyLiveAction";
import MyMatchEvents from "@/components/matches/MyMatchEvents";
import MyDetailsTabCard from "@/components/matches/MyDetailsTabCard";

interface MyDetailsLayoutProps {
  currentFixture: any;
}

const MyDetailsLayout: React.FC<MyDetailsLayoutProps> = ({ currentFixture }) => {
  const matchStatus = currentFixture?.fixture?.status?.short;
  const isLive = [
    "1H",
    "2H",
    "LIVE",
    "LIV",
    "HT",
    "ET",
    "P",
    "INT",
    "SUSP",
    "BT"
  ].includes(matchStatus);
  const isEnded = ["FT", "AET", "PEN", "AWD", "WO", "ABD", "PST", "CANC", "SUSP"].includes(matchStatus);
  
  console.log(`🔍 [MyDetailsLayout] Match ${currentFixture?.fixture?.id} status detection:`, {
    matchStatus,
    isLive,
    isEnded,
    fixtureStatus: currentFixture?.fixture?.status
  });

  return (
    <>
      {/* Show MyLiveAction for live matches */}
      {isLive && (
        <MyLiveAction
          matchId={currentFixture?.fixture?.id}
          homeTeam={currentFixture?.teams?.home}
          awayTeam={currentFixture?.teams?.away}
          status={currentFixture?.fixture?.status?.short}
        />
      )}

      {/* Add MyDetailsTabCard component */}
      <MyDetailsTabCard fixtures={[]} />
    </>
  );
};

export default MyDetailsLayout;