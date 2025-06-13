import React, { useState, useEffect } from "react";
import { getCountryCode } from "@/lib/flagUtils";
import { isNationalTeam } from "@/lib/teamLogoSources";

interface MyCircularFlagProps {
  teamName: string;
  fallbackUrl?: string;
  alt?: string;
  size?: string;
  className?: string;
  moveLeft?: boolean;
  nextMatchInfo?: {
    opponent: string;
    date: string;
    venue?: string;
  };
}

const MyCircularFlag: React.FC<MyCircularFlagProps> = ({
  teamName,
  fallbackUrl,
  alt,
  size = "64px",
  className = "",
  moveLeft = false,
  nextMatchInfo,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [nextMatch, setNextMatch] = useState(nextMatchInfo);
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

  // Fetch next match info if not provided
  useEffect(() => {
    if (!nextMatchInfo && isNationalTeam(teamName)) {
      // Fetch next match from API
      const fetchNextMatch = async () => {
        try {
          const response = await fetch(`/api/teams/next-match/${encodeURIComponent(teamName)}`);
          if (response.ok) {
            const data = await response.json();
            setNextMatch(data);
          }
        } catch (error) {
          console.log("Could not fetch next match info:", error);
        }
      };
      fetchNextMatch();
    }
  }, [teamName, nextMatchInfo]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      
      {/* Next Match Overlay */}
      {isHovered && nextMatch && (
        <div 
          className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-80 rounded-full text-white text-xs font-medium z-10"
          style={{
            fontSize: parseInt(size) > 40 ? "10px" : "8px",
            padding: "2px",
          }}
        >
          <div className="text-center leading-tight">
            <div className="font-semibold truncate">
              vs {nextMatch.opponent}
            </div>
            <div className="text-[10px] opacity-90">
              {formatDate(nextMatch.date)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCircularFlag;
