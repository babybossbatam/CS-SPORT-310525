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

interface MyColoredBarProps {
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

const MyColoredBar: React.FC<MyColoredBarProps> = ({
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
      className={`flex relative h-[63px] rounded-md mb-8  ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="w-full h-full flex justify-between relative">
        {/* Home team colored bar and logo */}
        <div
          className="h-full w-[calc(50%-16px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative"
          style={{
            background: getTeamColor(homeTeam.id),
            transition: "all 0.3s ease-in-out",
          }}
        >
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
          className="absolute text-white uppercase text-center max-w-[160px] truncate md:max-w-[240px] font-sans"
          style={{
            top: "calc(50% - 13px)",
            left: "120px",
            fontSize: "1.24rem",
            fontWeight: "normal",
          }}
        >
          {homeTeam.name || "TBD"}
        </div>

        {/* VS circle */}
        <div
          className="absolute text-white font-bold text-sm rounded-full h-[63px] w-[63px] flex items-center justify-center z-30 border-2 border-white overflow-hidden"
          style={{
            background: "#a00000",
            left: "calc(50% - 32px)",
            top: "calc(50% - 31px)",
            minWidth: "52px",
          }}
        >
          <span className="vs-text font-bold">VS</span>
        </div>

        {/* Match date and venue - centered below VS <div
          className="absolute text-center text-xs text-black font-medium"
          style={{
            fontSize: "0.875rem",
            whiteSpace: "nowrap",
            overflow: "visible",
            textAlign: "center",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "-25px",
            width: "max-content",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {(() => {
            try {
              const matchDate = parseISO(fixture.date);
              const formattedDate = format(matchDate, "EEEE, do MMM");
              const timeOnly = format(matchDate, "HH:mm");

              return (
                <>
                  {formattedDate} | {timeOnly}
                  {fixture.venue?.name ? ` | ${fixture.venue.name}` : ""}
                </>
              );
            } catch (e) {
              return fixture.venue?.name || "";
            }
          })()}
        </div> */}

        {/* Away team colored bar and logo */}
        <div
          className="h-full w-[calc(50%-26px)] mr-[87px] transition-all duration-500 ease-in-out opacity-100"
          style={{
            background: getTeamColor(awayTeam.id),
            transition: "all 0.3s ease-in-out",
          }}
        ></div>

        <div
          className="absolute text-white uppercase text-center max-w-[120px] truncate md:max-w-[200px] font-sans"
          style={{
            top: "calc(50% - 13px)",
            right: "130px",
            fontSize: "1.24rem",
            fontWeight: "normal",
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
    </div>
  );
};

export default MyColoredBar;
