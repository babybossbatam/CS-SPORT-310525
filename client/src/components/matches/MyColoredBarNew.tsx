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
      className={`flex items-center px-4  overflow relative ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default", height: "54px" }}
    >
      {/* Home team section - 50% width */}
      <div
        className="flex items-left justify-between h-full flex-1 relative"
        style={{
          background: `linear-gradient(135deg, ${getTeamColor(homeTeam.id)}, ${getTeamColor(homeTeam.id)}dd)`,
          width: "50%",
          clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 100%, 15px 100%)",
        }}
      >
        {/* Home team logo */}
        <div className="flex items-center gap-3">
          <div className=" -ml-4 w-15 h-18 flex-shrink-0 ">
            <MyWorldTeamLogo
              teamName={homeTeam.name || "Home Team"}
              teamLogo={homeTeam.logo}
              alt={homeTeam.name || "Home Team"}
              size="65px"
              className="w-full h-full object-contain "
              leagueContext={{
                name: league?.country || "League",
                country: league?.country || "World",
              }}
            />
          </div>
          <span className="text-white font-md uppercase text-sm truncate max-w-[120px]">
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
        className="flex justify-between h-full  flex-1 mr-1 relative"
        style={{
          background: `linear-gradient(225deg, ${getTeamColor(awayTeam.id)}, ${getTeamColor(awayTeam.id)}dd)`,
          width: "50%",
          flexDirection: "row-reverse",
          clipPath: "polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)",
        }}
      >
        {/* Away team logo */}
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="-mr-2 w-15 h-15 flex-shrink-0">
            <MyWorldTeamLogo
              teamName={awayTeam.name || "Away Team"}
              teamLogo={awayTeam.logo}
              alt={awayTeam.name || "Away Team"}
              size="55px"
              className="w-full h-full object-contain"
              leagueContext={{
                name: league?.country || "League",
                country: league?.country || "World",
              }}
            />
          </div>
          <span className="text-white font-md uppercase text-sm truncate max-w-[65px] text-right">
            {awayTeam.name || "Away Team"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MyColoredBarNew;
