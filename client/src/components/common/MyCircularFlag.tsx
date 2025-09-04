import React, { useState, useEffect, useCallback } from "react";
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

  // Get country code for the team
  const getCountryCode = useCallback((country: string): string => {
    const countryMap: { [key: string]: string } = {
      'Iraq': 'IQ',
      'Hong Kong': 'HK',
      'Syria': 'SY',
      'Finland': 'FI',
      'San Marino': 'SM',
      'Belarus': 'BY',
      'Belgium': 'BE',
      'Malaysia': 'MY',
      'Singapore': 'SG',
      'Saudi Arabia': 'SA',
      'North Macedonia': 'MK',
      'FYR Macedonia': 'MK',
      'Macedonia': 'MK',
      'United Arab Emirates': 'AE',
      'UAE': 'AE',
      'Pakistan': 'PK',
      'Australia': 'AU',
      'Yemen': 'YE',
      'Lebanon': 'LB',
      'Kuwait': 'KW',
      'Myanmar': 'MM',
      'Uzbekistan': 'UZ',
      'Sri Lanka': 'LK',
      'Vietnam': 'VN',
      'Bangladesh': 'BD',
      'Afghanistan': 'AF',
      'India': 'IN',
      'Iran': 'IR',
      'Japan': 'JP',
      'Thailand': 'TH',
      'Mongolia': 'MN',
      'Indonesia': 'ID',
      'Laos': 'LA',
      'Philippines': 'PH',
      'Turkmenistan': 'TM',
      'Chinese Taipei': 'TW',
      'Palestine': 'PS',
      'Kyrgyz Republic': 'KG',
      'Bahrain': 'BH',
      'Jordan': 'JO',
      'Bhutan': 'BT',
      'Tajikistan': 'TJ',
      'Nepal': 'NP',
      'Qatar': 'QA',
      'Brunei': 'BN',
      'Guam': 'GU'
    };

    return countryMap[country] || 'XX';
  }, []);

  // For club teams, use team logo sources
  const getLogoUrl = () => {
    if ((!isNational || isKnownClubTeam) && teamId) {
      const logoSources = getTeamLogoSources(
        { id: teamId, name: teamName },
        false,
      );
      return logoSources[0]?.url || fallbackUrl || "/assets/fallback-logo.svg";
    }

    // Force England to use correct circular flag
    if (teamName?.toLowerCase() === "england") {
      return "https://hatscripts.github.io/circle-flags/flags/gb-eng.svg";
    }

    // For national teams, prioritize circular flag over team logo
    if (isNational && !isKnownClubTeam) {
      return getCircleFlagUrl(teamName, fallbackUrl);
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
    "Cape Verde": "au-nsw",
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

    // Special case for England first
    if (teamName.toLowerCase() === "england") {
      console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 [MyCircularFlag] Using England flag: gb-eng`);
      return "https://hatscripts.github.io/circle-flags/flags/gb-eng.svg";
    }

    // Use the locally defined getCountryCode first
    const localCountryCode = getCountryCode(teamName);
    if (localCountryCode !== 'XX') {
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

          if (
            !isNational &&
            teamId &&
            !target.src.includes("/api/team-logo/")
          ) {
            // Try server proxy for club teams
            const fallbackUrl = `/api/team-logo/square/${teamId}?size=32`;
            console.log(
              `🔄 [MyCircularFlag] Trying server proxy: ${fallbackUrl}`,
            );
            target.src = fallbackUrl;
          } else if (!target.src.includes("/assets/fallback-logo.svg")) {
            // Final fallback
            console.log(
              `🚫 [MyCircularFlag] Using final fallback for ${teamName}`,
            );
            target.src = fallbackUrl || "/assets/fallback-logo.svg";
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