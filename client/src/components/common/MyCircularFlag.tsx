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
  showNextMatchOverlay?: boolean;
}

const MyCircularFlag: React.FC<MyCircularFlagProps> = ({
  teamName,
  fallbackUrl,
  alt,
  size = "64px",
  className = "",
  moveLeft = false,
  nextMatchInfo,
  showNextMatchOverlay = false,
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
      onMouseEnter={() => showNextMatchOverlay && setIsHovered(true)}
      onMouseLeave={() => showNextMatchOverlay && setIsHovered(false)}
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
          position: "relative",
          zIndex: 1,
          filter: "contrast(255%) brightness(68%) saturate(110%) hue-rotate(-10deg)"
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.includes("/assets/fallback-logo.svg")) {
            target.src = fallbackUrl || "/assets/fallback-logo.svg";
          }
        }}
      />
      <div className="gloss"></div>
      
      {/* Next Match Tooltip - External popup */}
      {showNextMatchOverlay && isHovered && nextMatch && (
        <div 
          className="absolute bg-black text-white text-xs rounded-md px-2 py-1 shadow-xl z-[9999] whitespace-nowrap border border-gray-500"
          style={{
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "10px",
            minWidth: "120px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          <div className="text-center">
            <div className="font-bold text-white text-[10px]">
              vs {nextMatch.opponent}
            </div>
            <div className="text-gray-200 mt-0.5 text-[9px]">
              {formatDate(nextMatch.date)}
            </div>
          </div>
          {/* Tooltip arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid black",
              marginTop: "0px"
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default MyCircularFlag;
