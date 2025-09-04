import React, { useState, useEffect, useCallback } from "react";
import { getCountryCode as getLibCountryCode } from "@/lib/flagUtils"; // Renamed to avoid conflict
import {
  isNationalTeam,
  getTeamLogoSources,
  createTeamLogoErrorHandler,
} from "@/lib/teamLogoSources";
import { getCountryCodeForTeam, getCountryInfoForTeam } from '@/lib/internationalTeamMapping';
import LazyImage from "./LazyImage";


interface MyCircularFlagProps {
  teamName: string;
  teamId?: number | string;
  fallbackUrl?: string;
  alt?: string;
  size?: string | number;
  className?: string;
  countryName?: string;
  leagueContext?: {
    name?: string;
    country?: string;
  };
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
  countryName,
  leagueContext
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [nextMatch, setNextMatch] = useState(nextMatchInfo);

  // Clean team name for better matching
  const cleanedTeamName = teamName
    .replace(/\s+u\d+$/i, '') // Remove U21, U20, etc.
    .replace(/\s+(women?|w)$/i, '') // Remove Women, W
    .replace(/\s+national\s+team$/i, '') // Remove "National Team"
    .trim();

  console.log(`🔍 [MyCircularFlag] Original: "${teamName}" -> Cleaned: "${cleanedTeamName}"`);

  // Use international team mapping to get country code
  let countryCode = getCountryCodeForTeam(teamName);

  // If no direct match, try with cleaned name
  if (!countryCode) {
    countryCode = getCountryCodeForTeam(cleanedTeamName);
  }

  // If still no match, try with provided countryName
  if (!countryCode && countryName) {
    countryCode = getCountryCodeForTeam(countryName);
  }

  // Get additional country information
  const countryInfo = getCountryInfoForTeam(teamName) || getCountryInfoForTeam(cleanedTeamName) || (countryName ? getCountryInfoForTeam(countryName) : null);

  if (countryCode) {
    console.log(`🎯 [MyCircularFlag] Using country code ${countryCode.toUpperCase()} for ${teamName} (cleaned: ${cleanedTeamName})`, {
      countryInfo: countryInfo ? { name: countryInfo.name, code: countryInfo.code } : null,
      leagueContext: leagueContext
    });
  } else {
    console.log(`❌ [MyCircularFlag] No country code found for ${teamName} (cleaned: ${cleanedTeamName})`, {
      leagueContext: leagueContext
    });
  }

  // Check if this is a national team or club team
  const isNational = isNationalTeam({ name: teamName });

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

  // For club teams, use team logo sources
  const getLogoUrl = () => {
    // Determine if we should use a circular flag
    const useCircularFlag = isNational && !isKnownClubTeam;

    // If it's a friendly international match, always use circular flag
    if (leagueContext?.name === "Friendlies International") {
      console.log(`⚽ [MyCircularFlag] Detected Friendlies International for ${teamName}. Using circular flag.`);
      return getCircleFlagUrl(teamName, fallbackUrl, countryInfo, leagueContext);
    }

    // If it's a national team in any other context (but not a known club team that pretends to be national), use circular flag
    if (useCircularFlag) {
      return getCircleFlagUrl(teamName, fallbackUrl, countryInfo, leagueContext);
    }

    // For club teams, use team logo sources
    // Always prioritize team ID based logos for club teams
    if (teamId) {
      // Try server proxy first for club teams
      return `/api/team-logo/square/${teamId}?size=64`;
    }

    // Fallback for teams without ID
    return getCircleFlagUrl(teamName, fallbackUrl, countryInfo, leagueContext); // Fallback to flag if no teamId
  };

  // Function to get the circular flag URL
  const getCircleFlagUrl = (
    teamName: string,
    fallbackUrl?: string,
    countryInfo?: any,
    leagueContext?: any,
  ): string => {
    // Check if teamName is valid
    if (!teamName || typeof teamName !== "string") {
      return fallbackUrl || "/assets/fallback-logo.svg";
    }

    let codeToUse = countryCode;

    // If league is "Friendlies Clubs" and it's a national team, change context to "Friendlies International"
    if (leagueContext?.name === "Friendlies Clubs" && isNationalTeam({ name: teamName })) {
      console.log(`🔄 [MyCircularFlag] Context changed: "Friendlies Clubs" -> "Friendlies International" for ${teamName}`);
      // The actual change of league context is handled by the caller. Here we just determine the flag.
    }

    // Use the country code derived from international team mapping
    if (codeToUse) {
      console.log(`🚩 [MyCircularFlag] Using mapped country code: ${codeToUse.toUpperCase()}`);
      return `https://hatscripts.github.io/circle-flags/flags/${codeToUse.toLowerCase()}.svg`;
    }

    // Fallback to the locally defined getCountryCode (from original implementation)
    const localCountryCode = getCountryCodeFromLocalMap(teamName);
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

    // Try to find a pattern match in the team name (from original implementation)
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


  // Helper function for the old local map (kept for completeness if needed)
  const getCountryCodeFromLocalMap = (name: string): string => {
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
    return countryMap[name] || "XX";
  };

  // Keep the old teamCountryPatterns for fallback in getCircleFlagUrl
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
    Morocco: "ma",
    Myanmar: "mm",
    Nepal: "np",
    Nigeria: "ng",
    Pakistan: "pk",
    Palestine: "ps",
    Philippines: "ph",
    Qatar: "qa",
    "Saudi Arabia": "sa",
    Singapore: "sg",
    "Sri Lanka": "lk",
    "South Korea": "kr",
    Syria: "sy",
    Thailand: "th",
    Vietnam: "vn",
    Yemen: "ye",
    Iraq: "iq",
    Iran: "ir",
    Israel: "il",
    Kuwait: "kw",
    Lebanon: "lb",
    Oman: "om",
    "United Arab Emirates": "ae",
    Japan: "jp",
    "North Korea": "kp",
    Indonesia: "id",
    "Hong Kong": "hk",
    China: "cn",
    Australia: "au",
    "New Zealand": "nz",
    // African teams
    Egypt: "eg",
    Ghana: "gh",
    Senegal: "sn",
    Tunisia: "tn",
    Cameroon: "cm",
    "Ivory Coast": "ci",
    "Burkina Faso": "bf",
    Kenya: "ke",
    Ethiopia: "et",
    Uganda: "ug",
    Rwanda: "rw",
    Zambia: "zm",
    Zimbabwe: "zw",
    Botswana: "bw",
    Namibia: "na",
    Libya: "ly",
    Sudan: "sd",
    "South Sudan": "ss",
    // North American teams
    "United States": "us",
    USA: "us",
    Canada: "ca",
    "Costa Rica": "cr",
    Jamaica: "jm",
    Panama: "pa",
    Honduras: "hn",
    "El Salvador": "sv",
    Guatemala: "gt",
    Nicaragua: "ni",
    "Trinidad and Tobago": "tt",
  };


  // Fetch next match info if not provided
  useEffect(() => {
    if (!nextMatchInfo && isNationalTeam({ name: teamName })) {
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

  // Determine whether to use LazyImage or MyCircularFlag
  const isClub = !isNational || isKnownClubTeam;
  const isFriendlyInternational = leagueContext?.name === "Friendlies International";
  const isFriendliesClubs = leagueContext?.name === "Friendlies Clubs";

  const shouldUseCircularFlag = (isNational && !isKnownClubTeam) || isFriendlyInternational || (isFriendliesClubs && isNational);


  // Determine the source URL based on the logic
  let sourceUrl: string;
  if (shouldUseCircularFlag) {
    sourceUrl = getCircleFlagUrl(teamName, fallbackUrl, countryInfo, leagueContext);
  } else if (teamId) {
    sourceUrl = `/api/team-logo/square/${teamId}?size=64`;
  } else {
    // Fallback to LazyImage if no flag and no teamId
    sourceUrl = fallbackUrl || "/assets/fallback-logo.svg";
  }

  // Render MyCircularFlag for national teams and LazyImage for club teams
  return (
    <>
      {shouldUseCircularFlag ? (
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
            src={sourceUrl}
            alt={alt || teamName}
            className="team-logo"
            style={{
              width: size,
              height: size,
              objectFit: "cover",
              borderRadius: "50%",
              position: "relative",
              zIndex: 1,
              filter: isNational ? "contrast(255%) brightness(68%) saturate(110%) hue-rotate(-10deg)" : "none", // No filter for club logos
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.warn(
                `⚠️ [MyCircularFlag] Image error for ${teamName}:`,
                target.src,
              );

              // Enhanced fallback logic for club teams
              if (teamId && (!isNational || isKnownClubTeam)) {
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

              // For national teams, ensure we're using the correct flag
              if (isNational && !isKnownClubTeam && !target.src.includes('circle-flags')) {
                const flagUrl = getCircleFlagUrl(teamName, fallbackUrl, countryInfo, leagueContext);
                if (flagUrl !== target.src) {
                  console.log(`🔄 [MyCircularFlag] Trying correct flag: ${flagUrl}`);
                  target.src = flagUrl;
                  return;
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
      ) : (
        <LazyImage
          src={sourceUrl}
          alt={alt || teamName}
          className={className}
          style={{ width: size, height: size, objectFit: "contain" }}
        />
      )}
    </>
  );
};

export default MyCircularFlag;