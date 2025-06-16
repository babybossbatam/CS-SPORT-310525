
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

  // FIFA Club World Cup teams are always club teams, never national teams
  const isFifaClubWorldCup = leagueContext?.name?.toLowerCase().includes("fifa club world cup") ||
                            leagueContext?.name?.toLowerCase().includes("club world cup");
  
  // List of known club teams that should never use circular flags
  const knownClubTeams = [
    "palmeiras", "fc porto", "botafogo", "seattle sounders", 
    "real madrid", "manchester city", "bayern munich", "psg",
    "chelsea", "arsenal", "liverpool", "barcelona", "juventus",
    "inter miami", "monterrey", "al hilal", "urawa red diamonds"
  ];
  
  const isKnownClubTeam = knownClubTeams.some(club => 
    teamName?.toLowerCase().includes(club)
  );

  // Use MyCircularFlag for national teams and youth teams, but NOT for FIFA Club World Cup or known club teams
  if ((isActualNationalTeam || isYouthTeam) && !isFifaClubWorldCup && !isKnownClubTeam) {
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
