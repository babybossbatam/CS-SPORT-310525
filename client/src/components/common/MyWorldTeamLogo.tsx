
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
  const isYouthTeam = teamName?.includes("U17") || 
                     teamName?.includes("U19") ||
                     teamName?.includes("U20") || 
                     teamName?.includes("U21") ||
                     teamName?.includes("U23");

  // Check if this is FIFA Club World Cup (club competition, not national teams)
  const isFifaClubWorldCup = leagueContext?.name?.toLowerCase().includes("fifa club world cup");
  
  // Check if this is Friendlies Club (club competition, not national teams)
  const isFriendliesClub = leagueContext?.name?.toLowerCase().includes("friendlies clubs");

  // Check if this is a Brazilian league (treat as club teams, not national teams)
  const isBrazilianLeague = leagueContext?.country?.toLowerCase() === "brazil";

  // Use MyCircularFlag for ONLY actual national teams and youth teams, but NOT for club competitions or Brazilian leagues
  if ((isActualNationalTeam || isYouthTeam) && !isFifaClubWorldCup && !isFriendliesClub && !isBrazilianLeague) {
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
      <LazyImage
        src={teamLogo || "/assets/fallback-logo.svg"}
        alt={alt || teamName}
        title={teamName}
        className="team-logo"
        style={{ 
          backgroundColor: "transparent",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: "0%"
        }}
        fallbackSrc="/assets/fallback-logo.svg"
      />
    </div>
  );
};

export default MyWorldTeamLogo;
