
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

  // Use MyCircularFlag for all national teams and youth teams
  if (isActualNationalTeam || isYouthTeam) {
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
