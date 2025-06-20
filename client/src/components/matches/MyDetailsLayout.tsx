import React from "react";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";
import MyLiveAction from "@/components/matches/MyLiveAction";
import MyHighlights from "@/components/matches/MyHighlights";

interface MyDetailsLayoutProps {
  currentFixture: any;
}

const MyDetailsLayout: React.FC<MyDetailsLayoutProps> = ({ currentFixture }) => {
  // Assuming isLive is derived from currentFixture, add a check here
  const isLive = currentFixture?.fixture?.status?.short === "LIVE";

  return (
    <div>
      {/* Main content area with scoreboard and match info */}
      <div className="flex-1">
        {/* Match Scoreboard */}
        <MyMatchdetailsScoreboard
          match={currentFixture}
          className="mb-6"
        />

        {/* Live Action Component - moved below scoreboard */}
        {isLive && (
          <MyLiveAction
            matchId={currentFixture?.fixture?.id}
            homeTeam={currentFixture?.teams?.home}
            awayTeam={currentFixture?.teams?.away}
            status={currentFixture?.fixture?.status?.short}
            className="mb-6"
          />
        )}

        {/* Match Highlights - moved below scoreboard */}
        <MyHighlights
          homeTeam={currentFixture?.teams?.home?.name}
          awayTeam={currentFixture?.teams?.away?.name}
          leagueName={currentFixture?.league?.name}
          matchStatus={currentFixture?.fixture?.status?.short}
        />
      </div>
    </div>
  );
};

export default MyDetailsLayout;