import React from "react";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyHighlights from "@/components/matches/MyHighlights";
import MyLiveAction from "@/components/matches/MyLiveAction";
import MyMatchEvents from "@/components/matches/MyMatchEvents";

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
  const isEnded = ["FT", "AET", "PEN"].includes(matchStatus);

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

      {/* Show MyHighlights for ended matches */}
      {isEnded && (
        <MyHighlights
          homeTeam={currentFixture?.teams?.home?.name}
          awayTeam={currentFixture?.teams?.away?.name}
          leagueName={currentFixture?.league?.name}
          matchStatus={currentFixture?.fixture?.status?.short}
        />
      )}
    </>
  );
};

export default MyDetailsLayout;