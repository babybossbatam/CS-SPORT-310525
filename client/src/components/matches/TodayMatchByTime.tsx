

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

interface TodayMatchByTimeProps {
  selectedDate?: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
  fixtures?: any[]; // Receive fixtures data from parent
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
  fixtures = [],
}) => {
  // Use current date if selectedDate is not provided
  const currentDate = selectedDate || new Date().toISOString().slice(0, 10);

  // Group and sort fixtures by league name A-Z
  const sortedFixturesByLeague = useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];

    // Group fixtures by league
    const groupedByLeague = fixtures.reduce((acc, fixture) => {
      const leagueName = fixture.league?.name || "Unknown League";
      if (!acc[leagueName]) {
        acc[leagueName] = [];
      }
      acc[leagueName].push(fixture);
      return acc;
    }, {});

    // Sort leagues alphabetically A-Z and sort matches within each league
    return Object.keys(groupedByLeague)
      .sort((a, b) => a.localeCompare(b))
      .map(leagueName => ({
        leagueName,
        fixtures: groupedByLeague[leagueName].sort((a, b) => {
          // Sort by match time first, then by home team name
          const timeA = new Date(a.fixture.date).getTime();
          const timeB = new Date(b.fixture.date).getTime();
          if (timeA !== timeB) {
            return timeA - timeB;
          }
          return (a.teams?.home?.name || "").localeCompare(b.teams?.home?.name || "");
        })
      }));
  }, [fixtures]);

  const formatMatchTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const getStatusDisplay = (status: string) => {
    if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
      return "LIVE";
    }
    if (status === "FT") return "FT";
    if (status === "NS" || status === "TBD") return "vs";
    return status;
  };

  return (
    <>
      {/* Header Section */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        Popular Leagues by Time
      </CardHeader>

      {/* Single Card with All Matches */}
      <Card className="border bg-card text-card-foreground shadow-md overflow-hidden mb-4">
        <CardContent className="p-0">
          {sortedFixturesByLeague.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No matches available for this date</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedFixturesByLeague.map((league, leagueIndex) => (
                <div key={leagueIndex}>
                  {/* League Header */}
                  <div className="p-3 bg-gray-50 border-b">
                    <div className="flex items-center">
                      <img 
                        src={league.fixtures[0]?.league?.logo || "/assets/fallback-logo.svg"}
                        alt={league.leagueName}
                        className="w-5 h-5 mr-2"
                        onError={(e) => {
                          e.currentTarget.src = "/assets/fallback-logo.svg";
                        }}
                      />
                      <span className="font-medium text-sm text-gray-800">
                        {league.leagueName}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({league.fixtures.length} {league.fixtures.length === 1 ? 'match' : 'matches'})
                      </span>
                    </div>
                  </div>

                  {/* League Matches */}
                  {league.fixtures.map((fixture, matchIndex) => (
                    <div 
                      key={fixture.fixture.id} 
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        {/* Time and Status */}
                        <div className="flex items-center text-xs text-gray-600 min-w-[60px]">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatMatchTime(fixture.fixture.date)}</span>
                        </div>

                        {/* Teams */}
                        <div className="flex-1 mx-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center flex-1">
                              <img 
                                src={fixture.teams?.home?.logo || "/assets/fallback-logo.svg"}
                                alt={fixture.teams?.home?.name}
                                className="w-4 h-4 mr-2"
                                onError={(e) => {
                                  e.currentTarget.src = "/assets/fallback-logo.svg";
                                }}
                              />
                              <span className="truncate">
                                {fixture.teams?.home?.name || "Home Team"}
                              </span>
                            </div>
                            
                            <div className="mx-2 text-xs font-medium">
                              {getStatusDisplay(fixture.fixture.status?.short)}
                            </div>
                            
                            <div className="flex items-center flex-1 justify-end">
                              <span className="truncate">
                                {fixture.teams?.away?.name || "Away Team"}
                              </span>
                              <img 
                                src={fixture.teams?.away?.logo || "/assets/fallback-logo.svg"}
                                alt={fixture.teams?.away?.name}
                                className="w-4 h-4 ml-2"
                                onError={(e) => {
                                  e.currentTarget.src = "/assets/fallback-logo.svg";
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Score */}
                        {fixture.goals && (fixture.goals.home !== null || fixture.goals.away !== null) && (
                          <div className="text-xs font-medium min-w-[40px] text-center">
                            {fixture.goals.home || 0} - {fixture.goals.away || 0}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default TodayMatchByTime;

