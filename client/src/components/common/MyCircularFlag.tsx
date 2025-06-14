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
  showFifaWorldCupFixtures?: boolean;
  fifaFixtures?: Array<{
    id: number;
    date: string;
    homeTeam: string;
    awayTeam: string;
    status: string;
    venue?: string;
  }>;
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
  showFifaWorldCupFixtures = false,
  fifaFixtures = [],
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [nextMatch, setNextMatch] = useState(nextMatchInfo);
  const [teamFifaFixtures, setTeamFifaFixtures] = useState(fifaFixtures);
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
      "Kyrgyz Repu": "kg",
      Uruguay: "uy",
      Paraguay: "py",
      "S. Africa": "za",
      Tajikistan: "tj",
      Bolivia: "bo",
      Ecuador: "ec",
      Venezuela: "ve",
      // Others
      Angola: "ao",
      Afghanistan: "af",
      Dominican: "do",
      Kyrgyzstan: "kg",
      Turkmenistan: "tm",
      Uzbekistan: "uz",
      Mali: "ml",
      Madagascar: "mg",
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

    // Fetch FIFA World Cup fixtures if needed
    if (showFifaWorldCupFixtures && teamFifaFixtures.length === 0) {
      const fetchFifaFixtures = async () => {
        try {
          const response = await fetch('/api/fifa-world-cup-fixtures');
          if (response.ok) {
            const data = await response.json();
            // Filter fixtures for this specific team
            const teamFixtures = data.filter((fixture: any) => 
              fixture.homeTeam === teamName || fixture.awayTeam === teamName
            );
            setTeamFifaFixtures(teamFixtures);
          }
        } catch (error) {
          console.log("Could not fetch FIFA fixtures:", error);
        }
      };
      fetchFifaFixtures();
    }
  }, [teamName, nextMatchInfo, showFifaWorldCupFixtures, teamFifaFixtures.length]);

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
      onMouseEnter={() => {
        if (showNextMatchOverlay || showFifaWorldCupFixtures) {
          console.log('🏆 [FIFA] Mouse enter for', teamName, 'FIFA fixtures:', teamFifaFixtures.length);
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (showNextMatchOverlay || showFifaWorldCupFixtures) {
          console.log('🏆 [FIFA] Mouse leave for', teamName);
          setIsHovered(false);
        }
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
          position: "relative",
          zIndex: 1,
          filter:
            "contrast(255%) brightness(68%) saturate(110%) hue-rotate(-10deg)",
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
      {showNextMatchOverlay && isHovered && nextMatch && !showFifaWorldCupFixtures && (
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

      {/* FIFA World Cup Fixtures Tooltip */}
      {showFifaWorldCupFixtures && isHovered && (teamFifaFixtures.length > 0 || fifaFixtures.length > 0) && (
        <div
          className="absolute bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-2xl z-[9999] border border-gray-600 transition-opacity duration-200"
          style={{
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "10px",
            minWidth: "200px",
            maxWidth: "300px",
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="text-center mb-2">
            <div className="font-semibold text-yellow-400 text-[11px] mb-1">
              🏆 FIFA Club World Cup Schedule
            </div>
          </div>
          <div className="space-y-1">
            {(teamFifaFixtures.length > 0 ? teamFifaFixtures : fifaFixtures).slice(0, 5).map((fixture, index) => (
              <div key={fixture.id} className="text-left border-b border-gray-600 pb-1 last:border-b-0">
                <div className="text-white text-[10px] font-medium">
                  <span className="text-blue-300">{fixture.homeTeam}</span>
                  <span className="text-gray-400 mx-1">vs</span>
                  <span className="text-orange-300">{fixture.awayTeam}</span>
                </div>
                <div className="text-gray-300 text-[9px]">
                  📅 {formatDate(fixture.date)}
                </div>
                {fixture.venue && (
                  <div className="text-gray-400 text-[8px]">
                    📍 {fixture.venue}
                  </div>
                )}
              </div>
            ))}</div>
            {(teamFifaFixtures.length > 0 ? teamFifaFixtures : fifaFixtures).length > 5 && (
              <div className="text-gray-400 text-[9px] text-center pt-1">
                +{(teamFifaFixtures.length > 0 ? teamFifaFixtures : fifaFixtures).length - 5} more matches...
              </div>
            )}
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
