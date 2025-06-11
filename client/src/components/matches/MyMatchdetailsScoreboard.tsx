import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Trophy } from "lucide-react";
import { format } from "date-fns";

interface MyMatchdetailsScoreboardProps {
  match?: any;
  className?: string;
}

const MyMatchdetailsScoreboard = ({
  match,
  className = "",
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
    const statusConfig = {
      NS: { label: "Upcoming", variant: "secondary" as const },
      LIVE: { label: "Live", variant: "destructive" as const },
      FT: { label: "Finished", variant: "default" as const },
      "1H": { label: "First Half", variant: "destructive" as const },
      "2H": { label: "Second Half", variant: "destructive" as const },
      HT: { label: "Half Time", variant: "outline" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Match Details</CardTitle>
          {getStatusBadge(displayMatch.fixture.status.short)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Teams Section */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            <img
              src={displayMatch.teams.home.logo}
              alt={displayMatch.teams.home.name}
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/fallback-logo.svg";
              }}
            />
            <span className="text-sm font-medium text-center">
              {displayMatch.teams.home.name}
            </span>
          </div>

          {/* Score/Time */}
          <div className="flex flex-col items-center space-y-1 px-4">
            {displayMatch.fixture.status.short === "NS" ? (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">Tomorrow</div>
                <div className="text-sm text-gray-500">03:00</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {displayMatch.goals.home ?? 0} -{" "}
                  {displayMatch.goals.away ?? 0}
                </div>
                <div className="text-xs text-gray-500">
                  {displayMatch.fixture.status.long}
                </div>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            <img
              src={displayMatch.teams.away.logo}
              alt={displayMatch.teams.away.name}
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/fallback-logo.svg";
              }}
            />
            <span className="text-sm font-medium text-center">
              {displayMatch.teams.away.name}
            </span>
          </div>
        </div>

        {/* Match Information */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">
              {formatDateTime(displayMatch.fixture.date)}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">
              {displayMatch.fixture.venue?.name || "Venue TBD"}
            </span>
          </div>

          {displayMatch.fixture.referee && (
            <div className="flex items-center space-x-3 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">
                {displayMatch.fixture.referee}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-3 text-sm">
            <Trophy className="h-4 w-4 text-gray-500" />
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium">
                {displayMatch.league.name}
              </span>
              <span className="text-gray-500 text-xs">
                {displayMatch.league.country}
              </span>
              {displayMatch.league.round && (
                <span className="text-gray-500 text-xs">
                  Round: {displayMatch.league.round}
                </span>
              )}
            </div>
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
