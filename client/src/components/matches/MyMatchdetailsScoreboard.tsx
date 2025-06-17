import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import MyCircularFlag from "@/components/common/MyCircularFlag";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";
import { isNationalTeam } from "@/lib/teamLogoSources";
interface MyMatchdetailsScoreboardProps {
  match?: any;
  className?: string;
  onClose?: () => void;
  onMatchCardClick?: (match: any) => void;
}

const MyMatchdetailsScoreboard = ({
  match,
  className = "",
  onClose,
  onMatchCardClick,
}: MyMatchdetailsScoreboardProps) => {
  const [liveElapsed, setLiveElapsed] = useState<number | null>(null);
  // Sample match data for demonstration
  const sampleMatch = {
    fixture: {
      id: 1100311,
      date: "2025-06-11T21:00:00+00:00",
      status: { short: "NS", long: "Not Started" },
      venue: { name: "Estadio Nacional de Lima", city: "Lima" },
      referee: "Andres Rojas, Colombia",
    },
    league: {
      id: 135,
      name: "World Cup - Qualification South America",
      country: "World",
      round: "Group Stage - 16",
    },
    teams: {
      home: {
        id: 2382,
        name: "Portugal U21",
        logo: "https://media.api-sports.io/football/teams/2382.png",
      },
      away: {
        id: 768,
        name: "France U21",
        logo: "https://media.api-sports.io/football/teams/768.png",
      },
    },
    goals: {
      home: null,
      away: null,
    },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: null, away: null },
    },
  };

  const displayMatch = match || sampleMatch;

  // Real-time update effect for live matches
  useEffect(() => {
    if (!displayMatch) return;

    const status = displayMatch.fixture.status.short;
    const isLiveMatch = ["1H", "2H", "LIVE"].includes(status);

    if (isLiveMatch) {
      // Initialize with current elapsed time from API
      setLiveElapsed(displayMatch.fixture.status.elapsed || 0);

      // Update every minute for live matches
      const timer = setInterval(() => {
        setLiveElapsed((prev) => (prev !== null ? prev + 1 : prev));
      }, 60000);

      return () => clearInterval(timer);
    } else {
      setLiveElapsed(null);
    }
  }, [displayMatch, displayMatch?.fixture?.status?.short, displayMatch?.fixture?.status?.elapsed]);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMM dd, yyyy, h:mm:ss a");
    } catch (error) {
      return "Date TBD";
    }
  };

  const getStatusBadge = (status: string) => {
    // Check if it's a finished match and determine the appropriate label
    const getFinishedLabel = () => {
      if (!["FT", "AET", "PEN"].includes(status)) return "Finished";

      try {
        const matchDate = new Date(displayMatch.fixture.date);
        const now = new Date();
        const hoursElapsed =
          (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);

        // If finished less than 1 hour ago, show "Just Finished"
        return hoursElapsed <= 1 ? "Just Finished" : "Ended";
      } catch (error) {
        return "Ended";
      }
    };

    // For live matches, show elapsed time with pulse animation
    const isLiveMatch = ["LIVE", "1H", "2H"].includes(status);
    if (isLiveMatch) {
      // Use live elapsed time if available, otherwise fall back to API elapsed time
      const elapsed = liveElapsed !== null ? liveElapsed : (displayMatch.fixture.status.elapsed || 0);
      const timeLabel =
        status === "1H"
          ? `${elapsed}'`
          : status === "2H"
            ? `${elapsed}'`
            : "LIVE";

      return (
        <Badge
          variant="destructive"
          className="bg-red-500 text-white font-normal text-[11px] animate-pulse"
        >
          {timeLabel}
        </Badge>
      );
    }

    const statusConfig = {
      NS: { label: "Upcoming", variant: "default" as const },
      FT: { label: getFinishedLabel(), variant: "default" as const },
      AET: { label: getFinishedLabel(), variant: "default" as const },
      PEN: { label: getFinishedLabel(), variant: "default" as const },
      HT: { label: "Half Time", variant: "outline" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "default" as const,
    };

    // Apply gray color for finished matches and upcoming matches
    const isFinished = ["FT", "AET", "PEN"].includes(status);
    const isUpcoming = status === "NS";
    const badgeClassName = isFinished
      ? "bg-gray-500 text-white font-normal text-[11px]"
      : isUpcoming
        ? "bg-gray-500 text-white font-normal text-[11px]"
        : "";

    return (
      <Badge variant={config.variant} className={badgeClassName}>
        {config.label}
      </Badge>
    );
  };
  return (
    <Card
      className={`w-full ${className} p-0 bg-gradient-to-br from-pink-50 via-orange-50 to-pink-50 relative cursor-pointer transition-all duration-200 hover:shadow-lg`}
      onClick={() => onMatchCardClick?.(displayMatch)}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 text-xl font-semi-bold w-6 h-6 flex items-center justify-center z-10"
          aria-label="Close"
        >
          x
        </button>
      )}
      <CardTitle className="text-md font-normal text-gray-900 text-center pt-2">
        {displayMatch.teams.home.name} vs {displayMatch.teams.away.name}
        <div className="text-xs text-gray-400 font-normal text-center">
          {displayMatch.league.country}, {displayMatch.league.name}
        </div>
      </CardTitle>
      <CardHeader className="text-center"></CardHeader>

      <CardContent className="p-0 m-0">
        {/* Teams Section */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex flex-col items-center space-y-4 flex-1">
            {displayMatch.league.country === "World" ||
            displayMatch.league.country === "International" ? (
              <MyWorldTeamLogo
                teamName={displayMatch.teams.home.name}
                teamLogo={displayMatch.teams.home.logo}
                alt={displayMatch.teams.home.name}
                size="56px"
                leagueContext={{
                  name: displayMatch.league.name,
                  country: displayMatch.league.country,
                }}
              />
            ) : isNationalTeam(displayMatch.teams.home, displayMatch.league) ? (
              <MyCircularFlag
                teamName={displayMatch.teams.home.name}
                fallbackUrl={displayMatch.teams.home.logo}
                alt={displayMatch.teams.home.name}
                size="56px"
              />
            ) : (
              <img
                src={
                  displayMatch.teams.home.logo || "/assets/fallback-logo.png"
                }
                alt={displayMatch.teams.home.name}
                className="w-16 h-16 object-contain"
                style={{
                  filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))",
                }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/fallback-logo.png";
                }}
              />
            )}
            <span className="text-md font-medium text-center">
              {displayMatch.teams.home.name}
            </span>
          </div>

          {/* Score/Time */}
          <div className="flex flex-col items-center space-y-1 px-4">
            {displayMatch.fixture.status.short === "NS" ? (
              <div className="text-center">
                <div className="text-3xl py-1 font-medium text-gray-700 -mt-10">
                  {(() => {
                    try {
                      const matchDate = new Date(displayMatch.fixture.date);
                      const today = new Date();
                      const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);

                      const matchDay = new Date(
                        matchDate.getFullYear(),
                        matchDate.getMonth(),
                        matchDate.getDate(),
                      );
                      const todayDay = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate(),
                      );
                      const tomorrowDay = new Date(
                        tomorrow.getFullYear(),
                        tomorrow.getMonth(),
                        tomorrow.getDate(),
                      );

                      if (matchDay.getTime() === todayDay.getTime()) {
                        return "Today";
                      } else if (matchDay.getTime() === tomorrowDay.getTime()) {
                        return "Tomorrow";
                      } else {
                        const diffTime =
                          matchDay.getTime() - todayDay.getTime();
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24),
                        );
                        if (diffDays > 1 && diffDays <= 7) {
                          return `${diffDays} days`;
                        } else {
                          return format(matchDate, "dd MMM");
                        }
                      }
                    } catch (error) {
                      return "Upcoming";
                    }
                  })()}
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  {(() => {
                    try {
                      const matchDate = new Date(displayMatch.fixture.date);
                      return format(matchDate, "HH:mm");
                    } catch (error) {
                      return "TBD";
                    }
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {getStatusBadge(displayMatch.fixture.status.short)}
                </div>
                <div className="text-3xl font-semi-bold">
                  {displayMatch.goals.home ?? 0} -{" "}
                  {displayMatch.goals.away ?? 0}
                </div>
                <div className="text-sm text-gray-900 font-semi-bold">
                  {format(new Date(displayMatch.fixture.date), "dd/MM")}
                </div>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center space-y-4 flex-1">
            {displayMatch.league.country === "World" ||
            displayMatch.league.country === "International" ? (
              <MyWorldTeamLogo
                teamName={displayMatch.teams.away.name}
                teamLogo={displayMatch.teams.away.logo}
                alt={displayMatch.teams.away.name}
                size="56px"
                leagueContext={{
                  name: displayMatch.league.name,
                  country: displayMatch.league.country,
                }}
              />
            ) : isNationalTeam(displayMatch.teams.away, displayMatch.league) ? (
              <MyCircularFlag
                teamName={displayMatch.teams.away.name}
                fallbackUrl={displayMatch.teams.away.logo}
                alt={displayMatch.teams.away.name}
                size="56px"
              />
            ) : (
              <img
                src={
                  displayMatch.teams.away.logo || "/assets/fallback-logo.png"
                }
                alt={displayMatch.teams.away.name}
                className="w-16 h-16 object-contain"
                style={{
                  filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))",
                }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/fallback-logo.png";
                }}
              />
            )}
            <span className="text-md font-medium text-center">
              {displayMatch.teams.away.name}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 py-2 pb-0 border-t px-0">
          <button className="flex-0 py-0 px-4 text-sm font-normal text-gray-600 border-b border-blue-500 pb-0 ">
            Match
          </button>
          <button className="flex-0 py-0 px-4 text-sm font-normal text-gray-500 hover:text-gray-700 pb-0">
            {displayMatch.fixture.status.short === "NS"
              ? "Probable Lineups"
              : "Lineups"}
          </button>
          <button className="flex-0 py-0 px-4 text-sm font-normal text-gray-500 hover:text-gray-700 pb-0">
            Stats
          </button>
          <button className="flex-0 py-0 px-4 text-sm font-normal text-gray-500 hover:text-gray-700 relative pb-0">
            Trends
          </button>
          <button className="flex-0 py-0 px-4 text-sm font-normal text-gray-500 hover:text-gray-700 pb-0">
            Head to Head
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyMatchdetailsScoreboard;
