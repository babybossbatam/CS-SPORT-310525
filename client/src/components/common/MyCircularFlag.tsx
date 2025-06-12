
import React from "react";
import { getCountryCode } from "@/lib/flagUtils";
import { isNationalTeam } from "@/lib/teamLogoSources";

interface MyCircularFlagProps {
  teamName: string;
  fallbackUrl?: string;
  alt?: string;
  size?: string;
  className?: string;
  moveLeft?: boolean;
  leagueContext?: {
    name: string;
    country: string;
  };
}

const MyCircularFlag: React.FC<MyCircularFlagProps> = ({
  teamName,
  fallbackUrl,
  alt,
  size = "64px",
  className = "",
  moveLeft = false,
  leagueContext,
}) => {
  // Check if this is a national team
  const isNational = isNationalTeam({ name: teamName }, leagueContext);

  const getCircleFlagUrl = (teamName: string, fallbackUrl?: string) => {
    // Extract country from team name or use direct country mapping
    const countryCode = getCountryCode(teamName);

    if (countryCode) {
      // Use Circle Flags from hatscripts.github.io
      return `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`;
    }

    // If no country code found, try to extract from team name patterns
    const teamCountryPatterns: { [key: string]: string } = {
      // European teams
      Portugal: "pt",
      France: "fr",
      Spain: "es",
      Italy: "it",
      Germany: "de",
      England: "gb-eng",
      Netherlands: "nl",
      Belgium: "be",
      Croatia: "hr",
      Poland: "pl",
      Ukraine: "ua",
      Turkey: "tr",
      Türkiye: "tr",
      Switzerland: "ch",
      Austria: "at",
      "Czech Republic": "cz",
      Denmark: "dk",
      Sweden: "se",
      Norway: "no",
      Finland: "fi",
      Russia: "ru",
      Serbia: "rs",
      // South American teams
      Brazil: "br",
      Argentina: "ar",
      Colombia: "co",
      Peru: "pe",
      Chile: "cl",
      Uruguay: "uy",
      Paraguay: "py",
      Bolivia: "bo",
      Ecuador: "ec",
      Venezuela: "ve",
      // Others
      Afghanistan: "af",
      Kyrgyzstan: "kg",
      Turkmenistan: "tm",
      Uzbekistan: "uz",
      Mexico: "mx",
      "United States": "us",
      Canada: "ca",
      Japan: "jp",
      Australia: "au",
    };

    // Try to find a pattern match in the team name
    for (const [country, code] of Object.entries(teamCountryPatterns)) {
      if (teamName.toLowerCase().includes(country.toLowerCase())) {
        return `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;
      }
    }

    // Final fallback
    return fallbackUrl || "/assets/fallback-logo.svg";
  };

  // If not a national team, render regular team logo
  if (!isNational) {
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
        <img
          src={fallbackUrl || "/assets/fallback-logo.svg"}
          alt={alt || teamName}
          className="team-logo"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "8px",
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes("/assets/fallback-logo.svg")) {
              target.src = "/assets/fallback-logo.svg";
            }
          }}
        />
      </div>
    );
  }

  // For national teams, use the circular flag format
  return (
    <div
      className={`flag-circle ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        left: moveLeft ? "-16px" : "4px",
      }}
    >
      <img
        src={getCircleFlagUrl(teamName, fallbackUrl)}
        alt={alt || teamName}
        className="team-logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%",
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.includes("/assets/fallback-logo.svg")) {
            target.src = fallbackUrl || "/assets/fallback-logo.svg";
          }
        }}
      />
      <div className="gloss" style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
        pointerEvents: "none"
      }}></div>
    </div>
  );
};

export default MyCircularFlag;
