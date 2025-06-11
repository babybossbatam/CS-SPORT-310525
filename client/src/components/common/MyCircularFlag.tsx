import React from "react";
import { getCountryCode } from "@/lib/flagUtils";

interface MyCircularFlagProps {
  teamName: string;
  fallbackUrl?: string;
  alt?: string;
  size?: string;
  className?: string;
}

const MyCircularFlag: React.FC<MyCircularFlagProps> = ({
  teamName,
  fallbackUrl,
  alt,
  size = "64px",
  className = "",
}) => {
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

  return (
    <div
      className={`flag-circle ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={getCircleFlagUrl(teamName, fallbackUrl)}
        alt={alt || teamName}
        className="team-logo"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.includes("/assets/fallback-logo.svg")) {
            target.src = fallbackUrl || "/assets/fallback-logo.svg";
          }
        }}
      />
      <div className="gloss"></div>
    </div>
  );
};

export default MyCircularFlag;
