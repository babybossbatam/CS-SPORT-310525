
import React from "react";
import { format, parseISO } from "date-fns";
import MyWorldTeamLogo from "../common/MyWorldTeamLogo";

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Fixture {
  date: string;
  venue?: {
    name: string;
    city: string;
  };
}

interface MyColoredBarNewProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  fixture: Fixture;
  onClick?: () => void;
  getTeamColor: (teamId: number) => string;
  className?: string;
  league?: {
    country: string;
  };
}

const MyColoredBarNew: React.FC<MyColoredBarNewProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  fixture,
  onClick,
  getTeamColor,
  className = "",
  league,
}) => {
  return (
    <div
      className={`flex items-center h-16 rounded-lg overflow-hidden shadow-lg relative ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Home team section - 45% width */}
      <div
        className="flex items-center justify-between h-full flex-1 px-4 relative"
        style={{
          background: `linear-gradient(135deg, ${getTeamColor(homeTeam.id)}, ${getTeamColor(homeTeam.id)}dd)`,
          width: "45%",
        }}
      >
        {/* Home team logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0">
            <MyWorldTeamLogo
              teamName={homeTeam.name || "Home Team"}
              teamLogo={homeTeam.logo}
              alt={homeTeam.name || "Home Team"}
              size="40px"
              className="w-full h-full object-contain"
              leagueContext={{
                name: league?.country || "League",
                country: league?.country || "World",
              }}
            />
          </div>
          <span className="text-white font-bold text-sm truncate max-w-[120px]">
            {homeTeam.name || "TBD"}
          </span>
        </div>
        
        {/* Home score */}
        {(homeScore !== null && homeScore !== undefined) && (
          <div className="text-white font-bold text-xl">
            {homeScore}
          </div>
        )}
      </div>

      {/* VS section - 10% width */}
      <div
        className="flex items-center justify-center h-full bg-gray-800 text-white font-bold text-xs relative z-10"
        style={{ width: "10%" }}
      >
        <span>VS</span>
      </div>

      {/* Away team section - 45% width */}
      <div
        className="flex items-center justify-between h-full flex-1 px-4 relative"
        style={{
          background: `linear-gradient(225deg, ${getTeamColor(awayTeam.id)}, ${getTeamColor(awayTeam.id)}dd)`,
          width: "45%",
          flexDirection: "row-reverse",
        }}
      >
        {/* Away team logo */}
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="w-10 h-10 flex-shrink-0">
            <MyWorldTeamLogo
              teamName={awayTeam.name || "Away Team"}
              teamLogo={awayTeam.logo}
              alt={awayTeam.name || "Away Team"}
              size="40px"
              className="w-full h-full object-contain"
              leagueContext={{
                name: league?.country || "League",
                country: league?.country || "World",
              }}
            />
          </div>
          <span className="text-white font-bold text-sm truncate max-w-[120px] text-right">
            {awayTeam.name || "Away Team"}
          </span>
        </div>
        
        {/* Away score */}
        {(awayScore !== null && awayScore !== undefined) && (
          <div className="text-white font-bold text-xl">
            {awayScore}
          </div>
        )}
      </div>

      {/* Status indicator - positioned at bottom */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-t">
        {status === "NS" ? (
          (() => {
            try {
              return format(parseISO(fixture.date), "HH:mm");
            } catch {
              return "TBD";
            }
          })()
        ) : status === "FT" ? (
          "FT"
        ) : ["1H", "2H", "HT", "LIVE"].includes(status) ? (
          <span className="animate-pulse text-red-400">LIVE</span>
        ) : (
          status
        )}
      </div>
    </div>
  );
};

export default MyColoredBarNew;
