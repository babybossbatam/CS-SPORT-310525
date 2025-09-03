import React, { useState, useEffect } from "react";
import { getCountryCode } from "@/lib/flagUtils";
import {
  isNationalTeam,
  getTeamLogoSources,
  createTeamLogoErrorHandler,
} from "@/lib/teamLogoSources";

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
  size = "51px",
  className = "",
  moveLeft = false,
  nextMatchInfo,
  showNextMatchOverlay = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [nextMatch, setNextMatch] = useState(nextMatchInfo);

  // Check if this is a national team or club team with enhanced context awareness
  const isNational = isNationalTeam({ name: teamName });

  // Enhanced detection for CAFA Nations Cup and other international competitions
  const isInternationalCompetition =
    nextMatchInfo?.opponent &&
    // CAFA Nations Cup teams
    ([
      "Oman",
      "Kyrgyzstan",
      "Tajikistan",
      "Afghanistan",
      "Bangladesh",
      "India",
      "Maldives",
      "Nepal",
      "Pakistan",
      "Sri Lanka",
    ].includes(teamName) ||
      // Other known national team patterns
      isNational);

  // Additional check for known club teams that should never use circular flags
  const isKnownClubTeam =
    !isInternationalCompetition &&
    (teamName?.toLowerCase().includes("fc") ||
      teamName?.toLowerCase().includes("cf") ||
      teamName?.toLowerCase().includes("united") ||
      teamName?.toLowerCase().includes("city") ||
      teamName?.toLowerCase().includes("athletic") ||
      teamName?.toLowerCase().includes("real") ||
      teamName?.toLowerCase().includes("barcelona") ||
      teamName?.toLowerCase().includes("valencia") ||
      teamName?.toLowerCase().includes("alboraya") ||
      teamName?.toLowerCase().includes("club") ||
      teamName?.toLowerCase().includes("ud "));

  // Enhanced logo URL resolution
  const getLogoUrl = () => {
    // Always use circular flags for international competitions
    if (isInternationalCompetition) {
      // Force England to use correct circular flag
      if (teamName?.toLowerCase() === "england") {
        return "https://hatscripts.github.io/circle-flags/flags/gb-eng.svg";
      }
      return getCircleFlagUrl(teamName, fallbackUrl);
    }

    // For club teams, use team logo sources
    if (isKnownClubTeam && teamId) {
      const logoSources = getTeamLogoSources(
        { id: teamId, name: teamName },
        false,
      );
      return logoSources[0]?.url || fallbackUrl || "/assets/fallback-logo.svg";
    }

    // Default to circular flag for national teams
    return getCircleFlagUrl(teamName, fallbackUrl);
  };

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
    Uruguay: "uy",
    Paraguay: "py",
    Bolivia: "bo",
    Ecuador: "ec",
    Venezuela: "ve",
    // CAFA Nations Cup teams
    "Kyrgyz Repu": "kg",
    Kyrgyzstan: "kg",
    Tajikistan: "tj",
    "S. Africa": "za",
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
    China: "cn",
    Dominican: "do",
    Estonia: "ee",
    Guadeloupe: "gp",
    Georgia: "ge",
    Hungary: "hu",
    India: "in",
    Iran: "ir",
    Jordan: "jo",
    Lebanon: "lb",
    Latvia: "lv",
    Lithuania: "lt",
    "Saudi Arabia": "sa",
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
    "New South Wales": "au-nsw",
    "North Korea": "kp",
    Nigeria: "ng",
    Nepal: "np",
    Namibia: "na",
    Korea: "kr",
    Pakistan: "pk",
    Palestine: "ps",
    Philippines: "ph",
    Thailand: "th",
    Indonesia: "id",
    "United States": "us",
    "United States of America": "us",
    Usa: "us",
    Africa: "za",
    Canada: "ca",
    Japan: "jp",
    Singapore: "sg",
    Senegal: "sn",
    Syria: "sy",
    Scotland: "gb-sct",
    "Hong Kong": "hk",
    Australia: "au",
    "Chinese Taipei": "tw",
    Zambia: "zm",
    Zimbabwe: "zw",
    Vietnam: "vn",
  };

  const getCircleFlagUrl = (teamName: string, fallbackUrl?: string) => {
    // Check if teamName is valid
    if (!teamName || typeof teamName !== "string") {
      return fallbackUrl || "/assets/fallback-logo.svg";
    }

    // Clean team name by removing common suffixes for better country matching
    const cleanTeamName = teamName
      .replace(
        /\s+(W|Women|U21|U20|U19|U18|U17|U16|Youth|Reserve|B)(\s|$)/gi,
        " ",
      )
      .replace(/\s+(Under|U)-?\d+/gi, " ")
      .trim();

    console.log(
      `🔍 [MyCircularFlag] Original: "${teamName}" -> Cleaned: "${cleanTeamName}"`,
    );

    // Special case for England first
    if (cleanTeamName.toLowerCase() === "england") {
      console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 [MyCircularFlag] Using England flag: gb-eng`);
      return "https://hatscripts.github.io/circle-flags/flags/gb-eng.svg";
    }

    // Extract country from cleaned team name or use direct country mapping
    const countryCode = getCountryCode(cleanTeamName);

    if (countryCode) {
      console.log(
        `🎯 [MyCircularFlag] Using country code ${countryCode} for ${teamName} (cleaned: ${cleanTeamName})`,
      );
      // Use Circle Flags from hatscripts.github.io
      return `https://hatscripts.github.io/circle-flags/flags/${countryCode.toLowerCase()}.svg`;
    }

    // Try to find a pattern match in the cleaned team name
    for (const [country, code] of Object.entries(teamCountryPatterns)) {
      if (cleanTeamName.toLowerCase().includes(country.toLowerCase())) {
        console.log(
          `🔍 [MyCircularFlag] Pattern match: ${country} -> ${code} for ${teamName} (cleaned: ${cleanTeamName})`,
        );
        return `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;
      }
    }

    // Also try with original team name as fallback
    for (const [country, code] of Object.entries(teamCountryPatterns)) {
      if (teamName.toLowerCase().includes(country.toLowerCase())) {
        console.log(
          `🔍 [MyCircularFlag] Fallback pattern match: ${country} -> ${code} for ${teamName}`,
        );
        return `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;
      }
    }

    console.log(
      `❌ [MyCircularFlag] No match found for ${teamName} (cleaned: ${cleanTeamName}), using fallback`,
    );
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
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius: "50%", // Always circular for this component
          position: "relative",
          zIndex: 1,
          filter: isInternationalCompetition
            ? "contrast(255%) brightness(68%) saturate(110%) hue-rotate(-10deg)"
            : "none", // No filter for club logos
        }}
        onError={
          isKnownClubTeam && teamId
            ? createTeamLogoErrorHandler(
                { id: teamId, name: teamName },
                false,
                "football",
              )
            : (e) => {
                const target = e.target as HTMLImageElement;
                console.log(
                  `🚫 [MyCircularFlag] Image error for ${teamName}, trying fallback`,
                );
                if (!target.src.includes("/assets/fallback.png")) {
                  target.src = fallbackUrl || "/assets/fallback.png";
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
