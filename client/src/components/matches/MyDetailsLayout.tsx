import React, { useState } from "react";
import ScoreDetailsCard from "@/components/matches/ScoreDetailsCard";
import MyLiveAction from "@/components/matches/MyLiveAction";
import MyMatchEvents from "@/components/matches/MyMatchEvents";
import MyDetailsTabCard from "@/components/matches/MyDetailsTabCard";
import MyDetailsFixture from "@/components/matches/MyDetailsFixture"; // Assuming this component exists
import { useDeviceInfo, useMobileViewport } from "@/hooks/use-mobile";

interface MyDetailsLayoutProps {
  currentFixture: any;
}

const MyDetailsLayout: React.FC<MyDetailsLayoutProps> = ({ currentFixture }) => {
  const [featuredMatchSelector, setFeaturedMatchSelector] = useState<((matchId: number) => void) | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  
  const { isMobile, isTablet, isPortrait } = useDeviceInfo();
  useMobileViewport();

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
    <div className={`
      w-full
      ${isMobile ? 'px-2 py-1' : 'px-4 py-2'}
      ${isPortrait && isMobile ? 'space-y-2' : 'space-y-4'}
      min-h-screen
      bg-gray-50
    `}>
      {/* Show MyLiveAction for live matches */}
      {isLive && (
        <div className={`
          ${isMobile ? 'rounded-lg' : 'rounded-xl'}
          overflow-hidden
          shadow-sm
          ${isMobile ? 'mb-2' : 'mb-4'}
        `}>
          <MyLiveAction
            matchId={currentFixture?.fixture?.id}
            homeTeam={currentFixture?.teams?.home}
            awayTeam={currentFixture?.teams?.away}
            status={currentFixture?.fixture?.status?.short}
          />
        </div>
      )}

      {/* Add MyDetailsTabCard component with featured match ID */}
      <div className={`
        ${isMobile ? 'rounded-lg' : 'rounded-xl'}
        bg-white
        shadow-sm
        overflow-hidden
        ${isMobile ? 'min-h-[60vh]' : 'min-h-[70vh]'}
      `}>
        <MyDetailsTabCard 
          fixtures={[currentFixture]} 
          featuredMatchId={featuredMatchId}
          onFeaturedMatchSelect={(selector) => setFeaturedMatchSelector(() => selector)}
        />
      </div>

      {/* Mobile-optimized spacing */}
      {isMobile && <div className="pb-20" />}
    </div>
  );
};

export default MyDetailsLayout;