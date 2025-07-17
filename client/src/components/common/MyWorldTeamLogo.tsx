
import React, { useMemo } from "react";
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

const MyWorldTeamLogo: React.FC<MyWorldTeamLogoProps> = React.memo(({
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
  // Memoize team type checks to prevent recalculation
  const teamTypeChecks = useMemo(() => {
    const isActualNationalTeam = isNationalTeam({ name: teamName }, leagueContext);
    const isYouthTeam = teamName?.includes("U17") || 
                       teamName?.includes("U19") ||
                       teamName?.includes("U20") || 
                       teamName?.includes("U21") ||
                       teamName?.includes("U23");

    const leagueName = leagueContext?.name?.toLowerCase() || "";
    const isFifaClubWorldCup = leagueName.includes("fifa club world cup");
    const isFriendliesClub = leagueName.includes("friendlies clubs");
    const isUefaEuropaLeague = leagueName.includes("uefa europa league") || 
                              leagueName.includes("europa league");
    const isUefaConferenceLeague = leagueName.includes("uefa europa conference league") || 
                                  leagueName.includes("europa conference league");
    const isUefaChampionsLeague = leagueName.includes("uefa champions league") || 
                                 leagueName.includes("champions league");
    const isConmebolSudamericana = leagueName.includes("conmebol sudamericana") ||
                                  leagueName.includes("copa sudamericana");
    const isBrazilianLeague = leagueContext?.country?.toLowerCase() === "brazil";
    const isBrazilianTeam = isBrazilianLeague || teamName?.toLowerCase().includes("brazil");

    return {
      isActualNationalTeam,
      isYouthTeam,
      isFifaClubWorldCup,
      isFriendliesClub,
      isUefaEuropaLeague,
      isUefaConferenceLeague,
      isUefaChampionsLeague,
      isConmebolSudamericana,
      shouldUseCircularFlag: (isActualNationalTeam || isYouthTeam) && 
                            !isFifaClubWorldCup && 
                            !isFriendliesClub && 
                            !isUefaEuropaLeague && 
                            !isUefaConferenceLeague && 
                            !isUefaChampionsLeague && 
                            !isConmebolSudamericana
    };
  }, [teamName, leagueContext]);

  // Memoize container style to prevent object recreation
  const containerStyle = useMemo(() => ({
    width: size,
    height: size,
    position: "relative" as const,
    left: moveLeft ? "-16px" : "4px",
  }), [size, moveLeft]);

  // Memoize image style to prevent object recreation
  const imageStyle = useMemo(() => ({ 
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
    borderRadius: "0%"
  }), []);

  if (teamTypeChecks.shouldUseCircularFlag) {
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
});

MyWorldTeamLogo.displayName = 'MyWorldTeamLogo';

export default MyWorldTeamLogo;
