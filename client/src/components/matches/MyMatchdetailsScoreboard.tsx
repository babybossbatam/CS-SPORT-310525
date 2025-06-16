import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Trophy } from "lucide-react";
import { format } from "date-fns";
import MyCircularFlag from "@/components/common/MyCircularFlag";
import { isNationalTeam } from "@/lib/teamLogoSources";
interface MyMatchdetailsScoreboardProps {
  match?: any;
  className?: string;
  onClose?: () => void;
}

const MyMatchdetailsScoreboard = ({
  match,
  className = "",
  onClose,
}: MyMatchdetailsScoreboardProps) => {
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

    const statusConfig = {
      NS: { label: "Upcoming", variant: "default" as const },
      LIVE: { label: "Live", variant: "destructive" as const },
      FT: { label: getFinishedLabel(), variant: "default" as const },
      AET: { label: getFinishedLabel(), variant: "default" as const },
      PEN: { label: getFinishedLabel(), variant: "default" as const },
      "1H": { label: "First Half", variant: "destructive" as const },
      "2H": { label: "Second Half", variant: "destructive" as const },
      HT: { label: "Half Time", variant: "outline" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "default" as const,
    };

    // Apply gray-900 color for finished matches
    const isFinished = ["FT", "AET", "PEN"].includes(status);
    const badgeClassName = isFinished
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
      className={`w-full ${className} p-0 bg-gradient-to-br from-pink-70 via-orange-80 to-pink-110`}
    >
      <CardHeader className="text-center relative ">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500  text-xl font-semi-bold w-8 h-8 flex items-center justify-center "
            aria-label="Close"
          >
            x
          </button>
        )}
        <CardTitle className="text-md font-normal text-gray-900">
          {displayMatch.teams.home.name} vs {displayMatch.teams.away.name}
        </CardTitle>
        <div className="text-xs text-gray-400 font-normal">
          {displayMatch.league.country}, {displayMatch.league.name}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Teams Section */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            {isNationalTeam(displayMatch.teams.home, displayMatch.league) ? (
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
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {getStatusBadge(displayMatch.fixture.status.short)}
                </div>
                <div className="text-lg font-bold text-gray-600">Tomorrow</div>
                <div className="text-sm text-gray-500">03:00</div>
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
                <div className="text-sm text-gray-900 font-bold">
                  {format(new Date(displayMatch.fixture.date), "dd/MM")}
                </div>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            {isNationalTeam(displayMatch.teams.away, displayMatch.league) ? (
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
        <div className="flex space-x-1 pt-4 border-t">
          <button className="flex-1 py-2 px-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50">
            Match
          </button>
          <button className="flex-1 py-2 px-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            Stats
          </button>
          <button className="flex-1 py-2 px-3 text-sm font-medium text-gray-500 hover:text-gray-700 relative">
            🔥 Trends
          </button>
          <button className="flex-1 py-2 px-3 text-sm font-medium text-gray-500 hover:text-gray-700">
            Head to Head
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyMatchdetailsScoreboard;
