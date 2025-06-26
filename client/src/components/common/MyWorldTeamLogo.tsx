
import React from "react";
import { isNationalTeam } from "@/lib/teamLogoSources";
import MyCircularFlag from "./MyCircularFlag";
import LazyImage from "./LazyImage";

interface MyWorldTeamLogoProps {
  teamName: string;
  teamLogo: string;
  alt?: string;
  size?: string;
  className?: string;
  moveLeft?: boolean;
  leagueContext?: {
    name: string;
    country: string;
  };
  nextMatchInfo?: {
    opponent: string;
    date: string;
    venue?: string;
  };
  showNextMatchOverlay?: boolean;
}

const MyWorldTeamLogo: React.FC<MyWorldTeamLogoProps> = ({
  teamName,
  teamLogo,
  alt,
  size = "64px",
  className = "",
  moveLeft = false,
  leagueContext,
  nextMatchInfo,
  showNextMatchOverlay = false,
}) => {
  // Check if this is a national team
  const isActualNationalTeam = isNationalTeam({ name: teamName }, leagueContext);
  
  // Check for youth teams
  const isYouthTeam = teamName?.includes("U20") || 
                     teamName?.includes("U21") ||
                     teamName?.includes("U19") ||
                     teamName?.includes("U23");

  // Check if this is FIFA Club World Cup (club competition, not national teams)
  const isFifaClubWorldCup = leagueContext?.name?.toLowerCase().includes("fifa club world cup");

  // Use MyCircularFlag for national teams and youth teams, but NOT for club competitions like FIFA Club World Cup
  if ((isActualNationalTeam || isYouthTeam) && !isFifaClubWorldCup) {
    return (
      <MyCircularFlag
        teamName={teamName}
        fallbackUrl={teamLogo}
        alt={alt || teamName}
        size={size}
        className={className}
        moveLeft={moveLeft}
        nextMatchInfo={nextMatchInfo}
        showNextMatchOverlay={showNextMatchOverlay}
      />
    );
  }

  // For non-national teams (club teams), use regular LazyImage
  return (
    <div
      className={`team-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        left: moveLeft ? "-16px" : "4px",
      }}
    >
    </div>
  );
};

export default MyWorldTeamLogo;
