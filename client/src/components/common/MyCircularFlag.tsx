import React, { useState, useEffect } from "react";
import { getCountryCode } from "@/lib/flagUtils";
import { isNationalTeam, getTeamLogoSources, createTeamLogoErrorHandler } from "@/lib/teamLogoSources";

interface MyCircularFlagProps {
  teamName: string;
  teamId?: number | string;
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
  teamId,
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
  
  // Check if this is a national team or club team
  const isNational = isNationalTeam({ name: teamName });
  
  // For club teams, use team logo sources
  const getLogoUrl = () => {
    if (!isNational && teamId) {
      const logoSources = getTeamLogoSources({ id: teamId, name: teamName }, false);
      return logoSources[0]?.url || fallbackUrl || "/assets/fallback-logo.svg";
    }
    return getCircleFlagUrl(teamName, fallbackUrl);
  };
  const getCircleFlagUrl = (teamName: string, fallbackUrl?: string) => {
    // Check if teamName is valid
    if (!teamName || typeof teamName !== "string") {
      return fallbackUrl || "/assets/fallback-logo.svg";
    }

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
      Romania: "ro",
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
      "Kyrgyz Repu": "kg",
      Uruguay: "uy",
      Paraguay: "py",
      "S. Africa": "za",
      Tajikistan: "tj",
      Bolivia: "bo",
      Ecuador: "ec",
      Venezuela: "ve",
      // Others
      Algeria: "dz",
      Angola: "ao",
      Afghanistan: "af",
      Azerbaijan: "az",
      Belarus: "by",
      Bhutan: "bt",
      Bahrain: "bh",
      Bangladesh: "bd",
      Brunei: "bn",
      Cambodia: "kh",
      Dominican: "do",
      Estonia: "ee",
      Guadeloupe: "gp",
      India: "in",
      Jordan: "jo",
      Kyrgyzstan: "kg",
      Lebanon: "lb",
      Latvia: "lv",
      Lithuania: "lt",
      Tanzania: "tz",
      Turkmenistan: "tm",
      "Timor-Leste": "tl",
      Uzbekistan: "uz",
      UAE: "ae",
      Laos: "la",
      Mali: "ml",
      Madagascar: "mg",
      Mongolia: "mn",
      Mexico: "mx",
      Maldives: "mv",
      Malawi: "mw",
      Malaysia: "my",
      Mauritania: "mr",
       Myanmar: "mm",
      Nigeria: "ng",
      Nepal: "np",
      Namibia: "na",
      Pakistan: "pk",
      Palestine: "ps",
      Philippines: "ph",
      Thailand: "th",
      Indonesia: "id",
      "United States": "us",
      Africa: "za",
      Canada: "ca",
      Japan: "jp",
      Singapore: "sg",
      Senegal: "sn",
      "Hong Kong": "hk",
      Australia: "au",
      "Chinese Taipei": "tw",
      Zambia: "zm",
      Zimbabwe: "zw",
      Vietnam: "vn",
    };

    // Special case for Valencia (COTIF tournament)
    if (teamName.toLowerCase().includes("valencia")) {
      // Use the uploaded Valencia flag image
      return "/attached_assets/valencia-flag.png";
    }

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
          const response = await fetch(
            `/api/teams/next-match/${encodeURIComponent(teamName)}`,
          );
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
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
        src={getLogoUrl()}
        alt={alt || teamName}
        className="team-logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: isNational ? "50%" : "50%", // Keep circular for both, but club logos will show as regular logos
          position: "relative",
          zIndex: 1,
          filter: isNational 
            ? "contrast(255%) brightness(68%) saturate(110%) hue-rotate(-10deg)"
            : "none", // No filter for club logos
        }}
        onError={
          !isNational && teamId 
            ? createTeamLogoErrorHandler({ id: teamId, name: teamName }, false)
            : (e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("/assets/fallback-logo.svg")) {
                  target.src = fallbackUrl || "/assets/fallback-logo.svg";
                }
              }
        }
      />
      <div className="gloss"></div>

      {/* Next Match Tooltip - External popup */}
      {showNextMatchOverlay && isHovered && nextMatch && (
        <div
          className="absolute bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-2xl z-[9999] whitespace-nowrap border border-gray-600 transition-opacity duration-200"
          style={{
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "11px",
            minWidth: "140px",
            maxWidth: "200px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="text-center">
            <div className="font-semibold text-white text-[11px] mb-1">
              vs {nextMatch.opponent}
            </div>
            <div className="text-gray-300 text-[10px]">
              {formatDate(nextMatch.date)}
            </div>
          </div>
          {/* Tooltip arrow */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #374151",
              marginTop: "0px",
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default MyCircularFlag;