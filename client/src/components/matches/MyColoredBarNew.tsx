
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
      className={`flex items-center relative ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        height: "54px",
        width: "100%",
      }}
    >
      {/* Home team section - extends from center (50%) to 75% (middle of logo area) */}
      <div
        className="flex items-center justify-start h-full absolute z-0"
        style={{
          background: `linear-gradient(135deg, ${getTeamColor(homeTeam.id)}, ${getTeamColor(homeTeam.id)}dd)`,
          width: "75%",
          left: "0%",
          clipPath: "polygon(0 0, calc(100% - 12px) 0, calc(100% - 24px) 100%, 0 100%)",
        }}
      >
        <span className="flex items-center text-white font-md uppercase text-lg ml-8 truncate max-w-[60%]">
          {homeTeam.name || "TBD"}
        </span>
      </div>

      {/* VS section - positioned at the center */}
      <div
        className="flex items-center justify-center h-full text-white font-semibold text-xl absolute z-10"
        style={{
          width: "60px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderRadius: "50%",
        }}
      >
        <span>VS</span>
      </div>

      {/* Away team section - extends from center (50%) to 75% (middle of logo area) */}
      <div
        className="flex items-center justify-end h-full absolute z-0"
        style={{
          background: `linear-gradient(225deg, ${getTeamColor(awayTeam.id)}, ${getTeamColor(awayTeam.id)}dd)`,
          width: "75%",
          right: "0%",
          clipPath: "polygon(12px 0, 100% 0, 100% 100%, 24px 100%)",
        }}
      >
        <span className="flex items-center text-white font-md uppercase text-lg mr-8 truncate max-w-[60%]">
          {awayTeam.name || "TBD"}
        </span>
      </div>
    </div>
  );
};

export default MyColoredBarNew;
