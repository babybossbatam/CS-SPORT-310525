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
  // Simple checks without excessive memoization
  const isActualNationalTeam = isNationalTeam({ name: teamName }, leagueContext);
  const isYouthTeam = teamName?.includes("U17") || 
                     teamName?.includes("U19") ||
                     teamName?.includes("U20") || 
                     teamName?.includes("U21") ||
                     teamName?.includes("U23");

  // Specific teams that should ALWAYS use club logos instead of circular flags
  const forceClubLogo = teamName === "ADH Brazil" || teamName === "Valencia";

  const leagueName = leagueContext?.name?.toLowerCase() || "";
  const leagueId = leagueContext?.country
  const isFifaClubWorldCup = leagueName.includes("fifa club world cup");

  // More specific friendlies detection
  const isFriendliesClub = leagueName.includes("friendlies clubs") || 
                          leagueName.includes("friendlies club") ||
                          leagueName.includes("club friendlies");

  // Friendlies International (league ID 10) should be treated as national team competition
  const isFriendliesInternational = leagueName === "friendlies international" ||
                                   leagueName === "international friendlies" ||
                                   (leagueName.includes("friendlies") && 
                                    leagueName.includes("international")) ||
                                   (leagueName === "friendlies" && !isFriendliesClub);

  const isUefaEuropaLeague = leagueName.includes("uefa europa league") || 
                            leagueName.includes("europa league");
  const isUefaConferenceLeague = leagueName.includes("uefa europa conference league") || 
                                leagueName.includes("europa conference league");
  const isUefaChampionsLeague = leagueName.includes("uefa champions league") || 
                               leagueName.includes("champions league");
  const isConmebolSudamericana = leagueName.includes("conmebol sudamericana") ||
                                leagueName.includes("copa sudamericana");

  const isUefaNationsLeague = leagueName.includes("uefa nations league") || 
                             leagueName.includes("nations league");

  // Debug logging for forced club logo teams
  if (forceClubLogo) {
    console.log("🔍 [MyWorldTeamLogo] Forcing club logo for:", {
      teamName,
      leagueName,
      willUseClubLogo: true
    });
  }

  // Debug logging for Friendlies International
  if (leagueName.includes("friendlies")) {
    console.log("🔍 [MyWorldTeamLogo] Friendlies Detection:", {
      teamName,
      leagueName,
      leagueId,
      isFriendliesInternational,
      isFriendliesClub,
      isActualNationalTeam,
      isYouthTeam
    });
  }

  // Use circular flag for national teams in international competitions
  // BUT: Force ADH Brazil and Valencia to ALWAYS use club logos regardless of league context
  const shouldUseCircularFlag = !forceClubLogo && 
                              (isActualNationalTeam || isYouthTeam || isFriendliesInternational || isUefaNationsLeague) && 
                              !isFifaClubWorldCup && 
                              !isFriendliesClub && 
                              !isUefaEuropaLeague && 
                              !isUefaConferenceLeague && 
                              !isUefaChampionsLeague && 
                              !isConmebolSudamericana;

  // Simple inline styles without memoization
  const containerStyle = {
    width: size,
    height: size,
    position: "relative" as const,
    left: moveLeft ? "-16px" : "4px",
  };

  const imageStyle = { 
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    borderRadius: "0%"
  };

  if (shouldUseCircularFlag) {
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
      style={containerStyle}
    >
      <LazyImage
        src={teamLogo || "/assets/fallback-logo.svg"}
        alt={alt || teamName}
        title={teamName}
        className="team-logo"
        style={imageStyle}
        fallbackSrc="/assets/fallback-logo.svg"
      />
    </div>
  );
};

MyWorldTeamLogo.displayName = 'MyWorldTeamLogo';

export default MyWorldTeamLogo;