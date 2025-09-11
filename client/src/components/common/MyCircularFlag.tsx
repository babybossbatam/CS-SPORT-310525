import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCountryCode as getLibCountryCode } from "@/lib/flagUtils"; // Renamed to avoid conflict
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

  // Enhanced national team detection with more comprehensive patterns and league context
  const isNational = useMemo(() => {
    if (!teamName) return false;

    // CRITICAL: Always check the main isNationalTeam function first
    const mainDetection = isNationalTeam({ name: teamName });

    // Specific check for European microstates
    const isMicrostate = ['andorra', 'san marino', 'monaco', 'liechtenstein', 'vatican city', 'malta']
      .includes(teamName.toLowerCase());

    const finalResult = mainDetection || isMicrostate;

    // Debug logging for problematic teams
    if (teamName.toLowerCase().includes('andorra') || teamName.toLowerCase().includes('san marino')) {
      console.log(`🚨 [MyCircularFlag] MICROSTATE DEBUG for ${teamName}:`, {
        mainDetection,
        isMicrostate,
        finalResult,
        teamName
      });
    }

    console.log(`🔍 [MyCircularFlag] National team detection for ${teamName}:`, {
      mainDetection,
      isMicrostate,
      finalResult,
      teamName
    });

    return finalResult;
  }, [teamName]);

  // Additional check for known club teams that should never use circular flags
  const isKnownClubTeam =
    !isNational &&
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
      // Ireland mappings
      "Republic of Ireland": "IE",
      "republic of ireland": "IE",
      "Rep. of Ireland": "IE",
      "Rep of Ireland": "IE",
    };

    return countryMap[country] || "XX";
  }, []);

  // For club teams, use team logo sources
  const getLogoUrl = () => {
    // Force England to use correct circular flag first
    if (teamName?.toLowerCase() === "england") {
      return "https://hatscripts.github.io/circle-flags/flags/gb-eng.svg";
    }

    // For national teams, ALWAYS prioritize circular flag - NEVER use square logos
    if (isNational && !isKnownClubTeam) {
      console.log(
        `🏳️ [MyCircularFlag] Using circular flag for national team: ${teamName}`,
      );
      return getCircleFlagUrl(teamName, fallbackUrl);
    }

    // ONLY for confirmed club teams, use team ID based logos
    if (teamId && isKnownClubTeam) {
      console.log(
        `⚽ [MyCircularFlag] Using team logo for club team: ${teamName}`,
      );
      return `/api/team-logo/square/${teamId}?size=64`;
    }

    // Fallback: if we can't determine team type clearly, try flag first
    console.log(
      `❓ [MyCircularFlag] Uncertain team type for ${teamName}, defaulting to flag`,
    );
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
    Georgia: "us-ga",
    England: "gb-eng",
    Netherlands: "nl",
    "North Macedonia": "mk",
    Belgium: "be",
    Croatia: "hr",
    Cyprus: "cy",
    Poland: "pl",
    Romania: "ro",
    Ukraine: "ua",
    Turkey: "tr",
    Türkiye: "tr",
    Switzerland: "ch",
    Austria: "at",
    Andorra: "ad",
    "Czech Republic": "cz",

    Denmark: "dk",
    Sweden: "se",
    Scotland: "gb-sct",
    Slovakia: "sk",
    Montenegro: "me",
    Malta: "mt",
    Norway: "no",
    "Northern Ireland": "gb-nir",
    Finland: "fi",
    "San Marino": "sm",
    "san marino": "sm",
    Russia: "ru",
    Serbia: "rs",
    // Ireland specific mappings
    "Republic of Ireland": "ie",
    "republic of ireland": "ie",
    "Rep. of Ireland": "ie",
    "Rep of Ireland": "ie",
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
    "Faroe Islands": "fo",
    Hungary: "hu",
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
    Macao: "mo",
    Malaysia: "my",
    Myanmar: "mm",
    Moldova: "md",
    Nepal: "np",
    "North Korea": "kp",
    "Northern Mariana": "mp",
    Oman: "om",
    Korea: "kr",
    Kosovo: "xk",
    Palestine: "ps",
    Philippines: "ph",
    Thailand: "th",
    Indonesia: "id",
    Iceland: "is",
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
    Slovenia: "si",
    Australia: "au",
    Zambia: "zm",
    Zimbabwe: "zw",
  };

  const getCircleFlagUrl = (teamName: string, fallbackUrl?: string) => {
    // Check if teamName is valid
    if (!teamName || typeof teamName !== "string") {
      return fallbackUrl || "/assets/fallback-logo.svg";
    }

    // Special case for England first
    if (teamName.toLowerCase() === "england") {
      console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 [MyCircularFlag] Using England flag: gb-eng`);
      return "https://hatscripts.github.io/circle-flags/flags/gb-eng.svg";
    }

    // Use the locally defined getCountryCode first
    const localCountryCode = getCountryCode(teamName);
    if (localCountryCode !== "XX") {
      console.log(
        `🎯 [MyCircularFlag] Using local country code ${localCountryCode} for ${teamName}`,
      );
      return `https://hatscripts.github.io/circle-flags/flags/${localCountryCode.toLowerCase()}.svg`;
    }

    // Fallback to the imported getCountryCode from flagUtils
    const libCountryCode = getLibCountryCode(teamName);

    if (libCountryCode) {
      console.log(
        `🎯 [MyCircularFlag] Using library country code ${libCountryCode} for ${teamName}`,
      );
      // Use Circle Flags from hatscripts.github.io
      return `https://hatscripts.github.io/circle-flags/flags/${libCountryCode.toLowerCase()}.svg`;
    }

    // Try to find a pattern match in the team name
    for (const [country, code] of Object.entries(teamCountryPatterns)) {
      if (teamName.toLowerCase().includes(country.toLowerCase())) {
        console.log(
          `🔍 [MyCircularFlag] Pattern match: ${country} -> ${code} for ${teamName}`,
        );
        return `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;
      }
    }

    console.log(
      `❌ [MyCircularFlag] No match found for ${teamName}, using fallback`,
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

          // For national teams, NEVER fall back to square logos - only try other flag sources
          if (isNational && !isKnownClubTeam) {
            console.log(
              `🏳️ [MyCircularFlag] National team error handling for ${teamName}`,
            );

            // Try alternative flag sources first
            if (!target.src.includes("circle-flags")) {
              const flagUrl = getCircleFlagUrl(teamName, fallbackUrl);
              if (flagUrl !== target.src && !flagUrl.includes("fallback")) {
                console.log(
                  `🔄 [MyCircularFlag] Trying circle flag: ${flagUrl}`,
                );
                target.src = flagUrl;
                return;
              }
            }

            // For national teams, use national team fallback, not square logos
            if (!target.src.includes("/assets/fallback-logo.svg")) {
              console.log(
                `🏳️ [MyCircularFlag] Using national team fallback for ${teamName}`,
              );
              target.src = "/assets/fallback-logo.svg";
            }
            return;
          }

          // Enhanced fallback logic ONLY for confirmed club teams
          if (teamId && isKnownClubTeam) {
            console.log(
              `⚽ [MyCircularFlag] Club team error handling for ${teamName}`,
            );

            // Try different sizes and sources for club teams only
            if (target.src.includes("size=64")) {
              const smallerUrl = `/api/team-logo/square/${teamId}?size=32`;
              console.log(
                `🔄 [MyCircularFlag] Trying smaller size: ${smallerUrl}`,
              );
              target.src = smallerUrl;
              return;
            }

            if (!target.src.includes("/api/team-logo/")) {
              const apiUrl = `/api/team-logo/square/${teamId}?size=32`;
              console.log(`🔄 [MyCircularFlag] Trying API endpoint: ${apiUrl}`);
              target.src = apiUrl;
              return;
            }

            // Try team logo sources as final attempt for club teams
            const logoSources = getTeamLogoSources(
              { id: teamId, name: teamName },
              false,
            );
            const nextSource = logoSources.find(
              (source) =>
                source.url !== target.src &&
                !source.url.includes("/assets/fallback-logo.svg"),
            );

            if (nextSource) {
              console.log(
                `🔄 [MyCircularFlag] Trying source: ${nextSource.source} - ${nextSource.url}`,
              );
              target.src = nextSource.url;
              return;
            }
          }

          // Final fallback only if we've exhausted all options
          if (!target.src.includes("/assets/fallback-logo.svg")) {
            console.log(
              `🚫 [MyCircularFlag] Using final fallback for ${teamName}`,
            );
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