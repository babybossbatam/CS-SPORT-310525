import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, MapPin, Globe } from "lucide-react";
import { format, parseISO } from "date-fns";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";
import MyCircularFlag from "@/components/common/MyCircularFlag";
import { isNationalTeam } from "@/lib/teamLogoSources";
import { useTodayPopularFixtures } from "@/hooks/useTodayPopularFixtures";

interface WorldCompetitionsCardProps {
  selectedDate: string;
  onMatchCardClick?: (fixture: any) => void;
}

const WorldCompetitionsCard: React.FC<WorldCompetitionsCardProps> = ({
  selectedDate,
  onMatchCardClick,
}) => {
  const { filteredFixtures, isLoading } = useTodayPopularFixtures(selectedDate);

  // Filter for World/International competitions
  const worldFixtures = useMemo(() => {
    return filteredFixtures.filter((fixture) => {
      const country = fixture.league?.country?.toLowerCase();
      return country === "world" || country === "international";
    });
  }, [filteredFixtures]);

  // Group fixtures by league
  const groupedWorldFixtures = useMemo(() => {
    const groups: { [key: string]: any[] } = {};

    worldFixtures.forEach((fixture) => {
      const leagueKey = `${fixture.league.id}-${fixture.league.name}`;
      if (!groups[leagueKey]) {
        groups[leagueKey] = [];
      }
      groups[leagueKey].push(fixture);
    });

    return groups;
  }, [worldFixtures]);

  const getStatusBadge = (status: string, fixtureDate?: string) => {
    // Check if match is stale (live status but started more than 3 hours ago)
    const isStaleMatch = (status: string, date?: string): boolean => {
      if (!date) return false;

      const liveStatuses = ["LIVE", "1H", "2H", "HT", "ET", "BT", "P"];
      if (!liveStatuses.includes(status)) return false;

      try {
        const matchDate = new Date(date);
        const now = new Date();
        const hoursSinceStart = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);

        // Football matches typically last 2 hours max, so anything over 3 hours is stale
        return hoursSinceStart > 3;
      } catch (error) {
        return false;
      }
    };

    // Override stale live matches to show as finished
    const effectiveStatus = isStaleMatch(status, fixtureDate) ? "FT" : status;

    const statusConfig = {
      NS: { label: "Upcoming", variant: "default" as const, color: "bg-gray-500" },
      LIVE: { label: "Live", variant: "destructive" as const, color: "bg-red-500" },
      "1H": { label: "1st Half", variant: "destructive" as const, color: "bg-red-500" },
      "2H": { label: "2nd Half", variant: "destructive" as const, color: "bg-red-500" },
      HT: { label: "Half Time", variant: "outline" as const, color: "bg-yellow-500" },
      FT: { label: "Finished", variant: "default" as const, color: "bg-gray-500" },
      AET: { label: "Finished", variant: "default" as const, color: "bg-gray-500" },
      PEN: { label: "Finished", variant: "default" as const, color: "bg-gray-500" },
    };

    const config = statusConfig[effectiveStatus as keyof typeof statusConfig] || {
      label: effectiveStatus,
      variant: "default" as const,
      color: "bg-gray-500",
    };

    return (
      <Badge 
        variant={config.variant} 
        className={`${config.color} text-white font-normal text-[10px] px-1.5 py-0.5`}
      >
        {config.label}
      </Badge>
    );
  };

  const formatMatchTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "HH:mm");
    } catch (error) {
      return "TBD";
    }
  };

    // Timezone conversion utility (placed outside the component for reusability)
    const TimezoneConverter = {
        getTimezoneAbbreviation: () => {
            try {
                return Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch (error) {
                console.error("Error getting timezone:", error);
                return "UTC"; // Fallback timezone
            }
        },
        convertTimeToLocal: (dateStr: string) => {
            try {
                const date = parseISO(dateStr);
                return format(date, "HH:mm"); // Format to local time
            } catch (error) {
                console.error("Error converting time:", error);
                return "TBD";
            }
        },
    };

  if (isLoading) {
    return (
      <Card className="shadow-md w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            🌍 World Competitions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading world competitions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (Object.keys(groupedWorldFixtures).length === 0) {
    return (
      <Card className="shadow-md w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            🌍 World Competitions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No world competitions on this date</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          🌍 World Competitions
          <Badge variant="outline" className="ml-2">
            {Object.keys(groupedWorldFixtures).length} tournament{Object.keys(groupedWorldFixtures).length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedWorldFixtures).map(([leagueKey, fixtures]) => {
          const league = fixtures[0].league;
          return (
            <div key={leagueKey} className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-purple-50">
              {/* League Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {league.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">
                      {league.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {league.country} • {fixtures.length} match{fixtures.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
                {/* Timezone Display */}
                <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                  <Globe className="h-3 w-3" />
                  {TimezoneConverter.getTimezoneAbbreviation()}
                </div>
              </div>

              {/* Matches */}
              <div className="space-y-2">
                {fixtures.map((fixture) => (
                  <div
                    key={fixture.fixture.id}
                    className="flex items-center justify-between p-2 bg-white rounded border hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => onMatchCardClick?.(fixture)}
                  >
                    {/* Home Team */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {league.country === "World" || league.country === "International" ? (
                        <MyWorldTeamLogo
                          teamName={fixture.teams.home.name}
                          teamLogo={fixture.teams.home.logo}
                          alt={fixture.teams.home.name}
                          size="24px"
                          leagueContext={{
                            name: league.name,
                            country: league.country,
                          }}
                        />
                      ) : isNationalTeam(fixture.teams.home, league) ? (
                        <MyCircularFlag
                          teamName={fixture.teams.home.name}
                          fallbackUrl={fixture.teams.home.logo}
                          alt={fixture.teams.home.name}
                          size="24px"
                        />
                      ) : (
                        <img
                          src={fixture.teams.home.logo || "/assets/fallback-logo.png"}
                          alt={fixture.teams.home.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/assets/fallback-logo.png";
                          }}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {fixture.teams.home.name}
                      </span>
                    </div>

                    {/* Score/Time */}
                    <div className="flex flex-col items-center px-3">
                      {fixture.fixture.status.short === "NS" ? (
                        <div className="text-center">
                          <div className="text-xs text-gray-600 font-medium">
                            {TimezoneConverter.convertTimeToLocal(fixture.fixture.date)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
                          </div>
                          <div className="mt-1">
                            {getStatusBadge(fixture.fixture.status.short, fixture.fixture.date)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-medium text-gray-900 truncate text-right">
                        {fixture.teams.away.name}
                      </span>
                      {league.country === "World" || league.country === "International" ? (
                        <MyWorldTeamLogo
                          teamName={fixture.teams.away.name}
                          teamLogo={fixture.teams.away.logo}
                          alt={fixture.teams.away.name}
                          size="24px"
                          leagueContext={{
                            name: league.name,
                            country: league.country,
                          }}
                        />
                      ) : isNationalTeam(fixture.teams.away, league) ? (
                        <MyCircularFlag
                          teamName={fixture.teams.away.name}
                          fallbackUrl={fixture.teams.away.logo}
                          alt={fixture.teams.away.name}
                          size="24px"
                        />
                      ) : (
                        <img
                          src={fixture.teams.away.logo || "/assets/fallback-logo.png"}
                          alt={fixture.teams.away.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/assets/fallback-logo.png";
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default WorldCompetitionsCard;