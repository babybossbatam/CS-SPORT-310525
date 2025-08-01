import React, { useState } from "react";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyLiveAction from "@/components/matches/MyLiveAction";
import MyMatchEvents from "@/components/matches/MyMatchEvents";
import MyDetailsTabCard from "@/components/matches/MyDetailsTabCard";
import MyDetailsFixture from "@/components/matches/MyDetailsFixture"; // Assuming this component exists

interface MyDetailsLayoutProps {
  currentFixture: any;
}

const MyDetailsLayout: React.FC<MyDetailsLayoutProps> = ({ currentFixture }) => {
  const [featuredMatchSelector, setFeaturedMatchSelector] = useState<((matchId: number) => void) | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

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

  // Use currentFixture ID as the featured match ID to highlight it
  const featuredMatchId = currentFixture?.fixture?.id;

  const handleMatchCardClick = (matchId: number) => {
    setSelectedMatchId(matchId);
  };

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

      {/* Add MyDetailsTabCard component with featured match ID */}
      <MyDetailsTabCard 
        fixtures={[currentFixture]} 
        featuredMatchId={featuredMatchId}
        onFeaturedMatchSelect={(selector) => setFeaturedMatchSelector(() => selector)}
      />

      {/* Display fixtures filtered by the current league */}
      {/* Assuming MyDetailsFixture is meant to be rendered here and needs these props */}
      
    </>
  );
};

export default MyDetailsLayout;