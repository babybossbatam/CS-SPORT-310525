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
      className={`flex items-center px-4   ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        height: "44px",
      }}
    >
      {/* Home team section - 50% width */}
      <div
        className="flex items-center justify-start h-full flex-1 relative z-0"
        style={{
          background: `linear-gradient(135deg, ${getTeamColor(homeTeam.id)}, ${getTeamColor(homeTeam.id)}dd)`,
          width: "calc(50% + 15px)",
          clipPath: "polygon(0 0, calc(100% - 15px) 0, calc(100% - 30px) 100%, 0 100%)",
          marginRight: "-15px",
        }}
      >
        {/* Home team name */}
        <div className="flex items-center gap-3 ml-4">
          <span className="text-white font-md uppercase text-sm truncate max-w-[200px]">
            {homeTeam.name || "TBD"}
          </span>
        </div>
      </div>

      {/* VS section - positioned at the connection point */}
      <div
        className="flex items-center justify-center h-full text-white font-bold text-lg absolute z-10 bg-transparent"
        style={{
          width: "30px",
          left: "calc(50% - 15px)",
          borderRadius: "50%",
        }}
      >
        <span>VS</span>
      </div>

      {/* Away team section - 50% width */}
      <div
        className="flex items-center justify-end h-full flex-1 relative z-0"
        style={{
          background: `linear-gradient(225deg, ${getTeamColor(awayTeam.id)}, ${getTeamColor(awayTeam.id)}dd)`,
          width: "calc(50% + 15px)",
          clipPath: "polygon(30px 0, 100% 0, 100% 100%, 15px 100%)",
          marginLeft: "-15px",
        }}
      >
        {/* Away team name */}
        <div className="flex items-center gap-3 mr-4">
          <span className="text-white font-md uppercase text-sm truncate max-w-[200px] text-right">
            {awayTeam.name || "Away Team"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MyColoredBarNew;
