
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

interface MyEnhancedColoredBarProps {
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

const MyEnhancedColoredBar: React.FC<MyEnhancedColoredBarProps> = ({
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
    <>
      <div className="w-full h-full flex justify-between relative">
        {/* Home team colored bar and logo */}
        <div
          className="h-full w-[calc(50%-16px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative"
          style={{
            background: `linear-gradient(135deg, ${getTeamColor(homeTeam.id)}, ${getTeamColor(homeTeam.id)}dd)`,
            transition: "all 0.3s ease-in-out",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle overlay for depth */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
              mixBlendMode: "hard-light",
            }}
          />
          {homeTeam && (
            <div
              className="absolute z-20 w-[64px] h-[64px]"
              style={{
                cursor: "pointer",
                top: "calc(50% - 32px)",
                left: "-32px",
              }}
              onClick={onClick}
            >
              <MyWorldTeamLogo
                teamName={homeTeam.name || "Home Team"}
                teamLogo={homeTeam.logo}
                alt={homeTeam.name || "Home Team"}
                size="64px"
                className="w-full h-full object-contain"
                leagueContext={{
                  name: league?.country || "League",
                  country: league?.country || "World",
                }}
              />
            </div>
          )}
        </div>

        <div
          className="absolute text-white uppercase text-center max-w-[160px] truncate md:max-w-[240px]"
          style={{
            top: "calc(50% - 13px)",
            left: "120px",
            fontSize: "1.24rem",
            fontWeight: "500",
            fontFamily: '"365 Sans", Roboto, Heebo, system-ui, sans-serif',
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            letterSpacing: "0.5px",
          }}
        >
          {homeTeam.name || "TBD"}
        </div>

        {/* VS circle */}
        <div
          className="absolute text-white font-bold text-sm rounded-full h-[63px] w-[63px] flex items-center justify-center z-30 border-2 border-white overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #a00000, #cc0000)",
            left: "calc(50% - 32px)",
            top: "calc(50% - 31px)",
            minWidth: "52px",
            boxShadow: "0 4px 12px rgba(160,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            fontFamily: '"365 Sans", Roboto, Heebo, system-ui, sans-serif',
            fontWeight: "500",
          }}
        >
          <span 
            className="vs-text font-bold"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              fontSize: "0.875rem",
            }}
          >
            VS
          </span>
        </div>

        {/* Away team colored bar and logo */}
        <div
          className="h-full w-[calc(50%-26px)] mr-[87px] transition-all duration-500 ease-in-out opacity-100 relative"
          style={{
            background: `linear-gradient(135deg, ${getTeamColor(awayTeam.id)}, ${getTeamColor(awayTeam.id)}dd)`,
            transition: "all 0.3s ease-in-out",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle overlay for depth */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
              mixBlendMode: "hard-light",
            }}
          />
        </div>

        <div
          className="absolute text-white uppercase text-center max-w-[120px] truncate md:max-w-[200px]"
          style={{
            top: "calc(50% - 13px)",
            right: "130px",
            fontSize: "1.24rem",
            fontWeight: "500",
            fontFamily: '"365 Sans", Roboto, Heebo, system-ui, sans-serif',
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            letterSpacing: "0.5px",
          }}
        >
          {awayTeam.name || "Away Team"}
        </div>

        <div
          className="absolute z-20 w-[64px] h-[64px]"
          style={{
            cursor: "pointer",
            top: "calc(50% - 32px)",
            right: "87px",
            transform: "translateX(50%)",
          }}
          onClick={onClick}
        >
          <MyWorldTeamLogo
            teamName={awayTeam.name || "Away Team"}
            teamLogo={awayTeam.logo}
            alt={awayTeam.name || "Away Team"}
            size="64px"
            className="w-full h-full object-contain"
            leagueContext={{
              name: league?.country || "League",
              country: league?.country || "World",
            }}
          />
        </div>
      </div>
    </>
  );
};

export default MyEnhancedColoredBar;
