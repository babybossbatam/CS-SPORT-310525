import React, { useState, useEffect, useCallback } from "react";
import { getCountryCode as getLibCountryCode } from "@/lib/flagUtils"; // Renamed to avoid conflict
import { ALL_COUNTRIES } from "@/lib/constants/countriesAndLeagues";
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

  // Enhanced national team detection including U21, youth teams, and specific patterns
  const isNational = isNationalTeam({ name: teamName });
  
  // Additional patterns for national teams (including youth teams)
  const isYouthNationalTeam = teamName?.toLowerCase().match(/\b(u\d+|u-\d+|under[-\s]?\d+)\b/) && 
    !teamName?.toLowerCase().includes("club") && 
    !teamName?.toLowerCase().includes("fc") &&
    !teamName?.toLowerCase().includes("united");

  // Check for specific national team patterns
  const hasNationalPattern = teamName && (
    teamName.toLowerCase().includes("national") ||
    teamName.toLowerCase().match(/\b(republic|democratic|federation|kingdom)\b/) ||
    // Check against known countries from our constants
    ALL_COUNTRIES.some(country => 
      teamName.toLowerCase().includes(country.name.toLowerCase()) ||
      teamName.toLowerCase().includes(country.name.toLowerCase().replace(/\s+/g, ''))
    )
  );

  // Combined national team detection
  const isActualNationalTeam = isNational || isYouthNationalTeam || hasNationalPattern;

  // Additional check for known club teams that should never use circular flags
  const isKnownClubTeam =
    !isActualNationalTeam &&
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

  // Get country code for the team
  const getCountryCode = useCallback((country: string): string => {
    const countryMap: { [key: string]: string } = {
      Iraq: "IQ",
      "Hong Kong": "HK",
      Syria: "SY",
      Finland: "FI",
      "San Marino": "SM",
      Belarus: "BY",
      Belgium: "BE",
      Malaysia: "MY",
      Singapore: "SG",
      "Saudi Arabia": "SA",
      "North Macedonia": "MK",
      "FYR Macedonia": "MK",
      Macedonia: "MK",
      "United Arab Emirates": "AE",
      UAE: "AE",
      Pakistan: "PK",
      Australia: "AU",
      Yemen: "YE",
      Lebanon: "LB",
      Kuwait: "KW",
      Myanmar: "MM",
      Uzbekistan: "UZ",
      "Sri Lanka": "LK",
      Vietnam: "VN",
      Bangladesh: "BD",
      Afghanistan: "AF",
      India: "IN",
      Iran: "IR",
      Japan: "JP",
      Thailand: "TH",
      Mongolia: "MN",
      Indonesia: "ID",
      Laos: "LA",
      Philippines: "PH",
      Turkmenistan: "TM",
      "Chinese Taipei": "TW",
      Palestine: "PS",
      "Kyrgyz Republic": "KG",
      Bahrain: "BH",
      Jordan: "JO",
      Bhutan: "BT",
      Tajikistan: "TJ",
      Nepal: "NP",
      Qatar: "QA",
      Brunei: "BN",
      Guam: "GU",
    };

    return countryMap[country] || "XX";
  }, []);

  // Enhanced logo URL logic with better national team handling
  const getLogoUrl = () => {
    // Force England to use correct circular flag
    if (teamName?.toLowerCase() === "england") {
      return "https://hatscripts.github.io/circle-flags/flags/gb-eng.svg";
    }

    // For national teams (including youth teams), always prioritize circular flag
    if (isActualNationalTeam && !isKnownClubTeam) {
      console.log(`🏴 [MyCircularFlag] Using circular flag for national team: ${teamName}`);
      return getCircleFlagUrl(teamName, fallbackUrl);
    }

    // For club teams, use team logo sources
    if (teamId && (!isActualNationalTeam || isKnownClubTeam)) {
      // Try server proxy first for club teams
      return `/api/team-logo/square/${teamId}?size=64`;
    }

    // Fallback for teams without ID
    if (teamId) {
      return `/api/team-logo/square/${teamId}?size=64`;
    }

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
    "San Marino": "sm",
    "san marino": "sm",
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
    Bolivia: "bo",
    Ecuador: "ec",
    Venezuela: "ve",
    // Asian teams (enhanced)
    Iraq: "iq",
    Pakistan: "pk",
    Afghanistan: "af",
    Azerbaijan: "az",
    Bahrain: "bh",
    Bangladesh: "bd",
    Brunei: "bn",
    Cambodia: "kh",
    China: "cn",
    "Cape Verde": "cv",
    India: "in",
    Iran: "ir",
    Jordan: "jo",
    Kyrgyzstan: "kg",
    "Kyrgyz Republic": "kg",
    Lebanon: "lb",
    Tajikistan: "tj",
    UAE: "ae",
    Laos: "la",
    Mongolia: "mn",
    Malaysia: "my",
    Myanmar: "mm",
    Nepal: "np",
    "North Korea": "kp",
    "Northern Mariana": "mp",
    Oman: "om",
    Korea: "kr",
    Palestine: "ps",
    Philippines: "ph",
    Thailand: "th",
    Indonesia: "id",
    Singapore: "sg",
    Syria: "sy",
    "Hong Kong": "hk",
    "Chinese Taipei": "tw",
    Vietnam: "vn",
    Uzbekistan: "uz",
    Turkmenistan: "tm",
    "Timor-Leste": "tl",
    Guam: "gu",
    "Northern Mariana Islands": "mp",
    "Sri Lanka": "lk",
    Yemen: "ye",
    Kuwait: "kw",
    Qatar: "qa",
    Bhutan: "bt",
    // Others
    Algeria: "dz",
    Angola: "ao",
    Belarus: "by",
    Dominican: "do",
    Estonia: "ee",
    Guadeloupe: "gp",
    Latvia: "lv",
    Lithuania: "lt",
    "Saudi Arabia": "sa",
    Tanzania: "tz",
    Mali: "ml",
    Madagascar: "mg",
    Mexico: "mx",
    Maldives: "mv",
    Malawi: "mw",
    Mauritania: "mr",
    "New South Wales": "au-nsw",
    Nigeria: "ng",
    Namibia: "na",
    "United States": "us",
    "United States of America": "us",
    Usa: "us",
    Africa: "za",
    Canada: "ca",
    Japan: "jp",
    Senegal: "sn",
    Australia: "au",
    Zambia: "zm",
    Zimbabwe: "zw",
  };

  const getCircleFlagUrl = (teamName: string, fallbackUrl?: string) => {
    // Check if teamName is valid
    if (!teamName || typeof teamName !== "string") {
      return fallbackUrl || "/assets/fallback-logo.svg";
    }

    // Clean team name for youth teams (remove U21, U19, etc.)
    const cleanedName = teamName.replace(/\s*(U\d+|U-\d+|Under[-\s]?\d+)\s*/gi, '').trim();
    
    // Special case for England first
    if (cleanedName.toLowerCase() === "england" || teamName.toLowerCase().includes("england")) {
      console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 [MyCircularFlag] Using England flag: gb-eng`);
      return "https://hatscripts.github.io/circle-flags/flags/gb-eng.svg";
    }

    // Try with cleaned name first for youth teams
    let targetName = cleanedName || teamName;
    
    // Use the locally defined getCountryCode first
    const localCountryCode = getCountryCode(targetName);
    if (localCountryCode !== "XX") {
      console.log(
        `🎯 [MyCircularFlag] Using local country code ${localCountryCode} for ${teamName} (cleaned: ${targetName})`,
      );
      return `https://hatscripts.github.io/circle-flags/flags/${localCountryCode.toLowerCase()}.svg`;
    }

    // Fallback to the imported getCountryCode from flagUtils
    const libCountryCode = getLibCountryCode(targetName);
    if (libCountryCode) {
      console.log(
        `🎯 [MyCircularFlag] Using library country code ${libCountryCode} for ${teamName} (cleaned: ${targetName})`,
      );
      return `https://hatscripts.github.io/circle-flags/flags/${libCountryCode.toLowerCase()}.svg`;
    }

    // Try to find a pattern match in the team name (try both original and cleaned)
    for (const [country, code] of Object.entries(teamCountryPatterns)) {
      if (targetName.toLowerCase().includes(country.toLowerCase()) || 
          teamName.toLowerCase().includes(country.toLowerCase())) {
        console.log(
          `🔍 [MyCircularFlag] Pattern match: ${country} -> ${code} for ${teamName}`,
        );
        return `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;
      }
    }

    // Special handling for common youth team patterns
    const youthPatterns = {
      "kosovo": "xk",
      "faroe islands": "fo", 
      "republic of ireland": "ie",
      "northern ireland": "gb-nir",
      "scotland": "gb-sct",
      "wales": "gb-wls"
    };

    for (const [country, code] of Object.entries(youthPatterns)) {
      if (targetName.toLowerCase().includes(country) || teamName.toLowerCase().includes(country)) {
        console.log(
          `🔍 [MyCircularFlag] Youth team pattern match: ${country} -> ${code} for ${teamName}`,
        );
        return `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;
      }
    }

    console.log(
      `❌ [MyCircularFlag] No match found for ${teamName} (cleaned: ${targetName}), using fallback`,
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
          borderRadius: isNational ? "50%" : "50%", // Keep circular for both, but club logos will show as regular logos
          position: "relative",
          zIndex: 1,
          filter: isNational
            ? "contrast(255%) brightness(68%) saturate(110%) hue-rotate(-10deg)"
            : "none", // No filter for club logos
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          console.warn(
            `⚠️ [MyCircularFlag] Image error for ${teamName}:`,
            target.src,
          );

          // Enhanced fallback logic for club teams
          if (teamId && (!isActualNationalTeam || isKnownClubTeam)) {
            // Try different sizes and sources
            if (target.src.includes('size=64')) {
              const smallerUrl = `/api/team-logo/square/${teamId}?size=32`;
              console.log(`🔄 [MyCircularFlag] Trying smaller size: ${smallerUrl}`);
              target.src = smallerUrl;
              return;
            }

            if (!target.src.includes('/api/team-logo/')) {
              const apiUrl = `/api/team-logo/square/${teamId}?size=32`;
              console.log(`🔄 [MyCircularFlag] Trying API endpoint: ${apiUrl}`);
              target.src = apiUrl;
              return;
            }

            // Try team logo sources as final attempt
            const logoSources = getTeamLogoSources({ id: teamId, name: teamName }, false);
            const nextSource = logoSources.find(source => 
              source.url !== target.src && 
              !source.url.includes('/assets/fallback-logo.svg')
            );

            if (nextSource) {
              console.log(`🔄 [MyCircularFlag] Trying source: ${nextSource.source} - ${nextSource.url}`);
              target.src = nextSource.url;
              return;
            }
          }

          // For national teams, try alternative flag sources
          if (isActualNationalTeam && !isKnownClubTeam) {
            if (!target.src.includes('circle-flags')) {
              const flagUrl = getCircleFlagUrl(teamName, fallbackUrl);
              if (flagUrl !== target.src && !flagUrl.includes('/assets/fallback-logo.svg')) {
                console.log(`🔄 [MyCircularFlag] Trying correct flag: ${flagUrl}`);
                target.src = flagUrl;
                return;
              }
            }
            
            // Try alternative flag sources for national teams
            if (target.src.includes('circle-flags')) {
              // Try with cleaned name for youth teams
              const cleanedName = teamName.replace(/\s*(U\d+|U-\d+|Under[-\s]?\d+)\s*/gi, '').trim();
              if (cleanedName && cleanedName !== teamName) {
                const alternativeFlag = getCircleFlagUrl(cleanedName, fallbackUrl);
                if (alternativeFlag !== target.src && !alternativeFlag.includes('/assets/fallback-logo.svg')) {
                  console.log(`🔄 [MyCircularFlag] Trying alternative flag with cleaned name: ${alternativeFlag}`);
                  target.src = alternativeFlag;
                  return;
                }
              }
            }
          }

          // Final fallback only if we've exhausted all options
          if (!target.src.includes("/assets/fallback-logo.svg")) {
            console.log(`🚫 [MyCircularFlag] Using final fallback for ${teamName}`);
            target.src = "/assets/fallback-logo.svg";
          }
        }}
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