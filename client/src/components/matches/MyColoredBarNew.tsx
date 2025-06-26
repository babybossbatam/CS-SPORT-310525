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
        height: "54px",
      }}
    >
      {/* Home team section - expanded to middle of VS */}
      <div
        className="flex items-left justify-between h-full flex-1 "
        style={{
          background: `linear-gradient(135deg, ${getTeamColor(homeTeam.id)}, ${getTeamColor(homeTeam.id)}dd)`,
          width: "calc(50% - 25px)",
          clipPath: "polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%)",
          marginLeft: "-45px",
          marginRight: "-9px",
        }}
      >
        {/* Home team logo */}

        <span className=" flex items-center text-white font-md uppercase text-lg ml-8 truncate max-w-[250px]">
          {homeTeam.name || "TBD"}
        </span>
      </div>

      {/* VS section - positioned at the connection point */}
      <div
        className="flex items-center justify-center h-full text-white font-semi-bold text-2xl absolute z-10 bg-transparent"
        style={{
          width: "calc(50% - 16px",
          left: "55px",

          borderRadius: "50%",
        }}
      >
        <span>VS</span>
      </div>

      {/* Away team section - expanded to middle of VS */}
      <div
        className="flex justify-between h-full  flex-1 mr-4 relative z-0"
        style={{
          background: `linear-gradient(225deg, ${getTeamColor(awayTeam.id)}, ${getTeamColor(awayTeam.id)}dd)`,
          width: "calc(50% - 115px)",
          flexDirection: "row-reverse",
          clipPath: "polygon(8px 0, 100% 0, calc(100% - 0px) 100%, 0 100%)",
          marginLeft: "-25px",
          marginRight: "-52px",
        }}
      >
        <span className=" flex items-center text-white font-md uppercase text-lg mr-8 truncate max-w-[250px]">
          {awayTeam.name || "TBD"}
        </span>
      </div>
    </div>
  );
};

export default MyColoredBarNew;
