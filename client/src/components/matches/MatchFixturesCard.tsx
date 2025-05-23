import React from 'react';
import { format, isToday, isYesterday, isTomorrow, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ChevronDown, Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Calendar as DatePicker } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const renderFixture = (fixture: any) => (
    <div 
      key={fixture.fixture.id}
      onClick={() => onMatchClick(fixture.fixture.id)}
      className="hover:bg-gray-50 cursor-pointer border-b last:border-b-0 py-4"
    >
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="text-sm">
            {fixture.fixture.status.short === "NS" ? (
              format(parseISO(fixture.fixture.date), 'HH:mm')
            ) : (
              <span className="text-gray-500">
                {fixture.fixture.status.short === "FT" ? "Ended" : fixture.fixture.status.short}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {fixture.fixture.venue.name ? "Neutral venue" : ""}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 items-center px-4 mt-2">
        <div className="col-span-3 flex items-center justify-end space-x-3">
          <span className="font-medium text-right">{fixture.teams.home.name}</span>
          <img 
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            className="h-6 w-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
            }}
          />
        </div>

        <div className="col-span-1 flex justify-center font-semibold">
          <span className={cn(
            "px-3 rounded",
            fixture.fixture.status.short === "NS" ? "" : ""
          )}>
            {fixture.fixture.status.short === "NS" 
              ? "-"
              : `${fixture.goals.home} - ${fixture.goals.away}`
            }
          </span>
        </div>

        <div className="col-span-3 flex items-center space-x-3">
          <img 
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            className="h-6 w-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
            }}
          />
          <span className="font-medium">{fixture.teams.away.name}</span>
        </div>
      </div>
    </div>
  );

  // Group fixtures by league
  const fixturesByLeague = fixtures.reduce((acc: any, fixture: any) => {
    const leagueId = fixture.league.id;
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: fixture.league,
        fixtures: []
      };
    }
    acc[leagueId].fixtures.push(fixture);
    return acc;
  }, {});

  const [selectedDate, setSelectedDate] = React.useState(new Date());

  return (
    <div className="space-y-4 pt-10">
      <Card className="bg-white shadow-md">
        <CardContent className="p-4 h-[120px] flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {isToday(selectedDate) 
                      ? "Today's Matches"
                      : isYesterday(selectedDate)
                      ? "Yesterday's Matches"
                      : isTomorrow(selectedDate)
                      ? "Tomorrow's Matches"
                      : "Matches for " + format(selectedDate, "EEEE, do MMM")}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <DatePicker
                  mode="single"
                  className="rounded-md border"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date)}
                />
              </PopoverContent>
            </Popover>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="bg-white shadow-md">
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-gray-600" />
                <span className="font-semibold text-gray-800">Popular Football Leagues</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">European Competitions</h3>
                <div className="flex flex-col space-y-4">
                  {[
                    { id: 2, name: 'Champions League', country: 'Europe' },
                    { id: 3, name: 'Europa League', country: 'Europe' }
                  ].map((league) => {
                    const leagueFixtures = Object.values(fixturesByLeague)
                      .find((group: any) => group.league.id === league.id)?.fixtures || [];
                    const todayFixtures = leagueFixtures.filter((f: any) => {
                      const fixtureDate = new Date(f.fixture.date);
                      return new Date(selectedDate).toDateString() === fixtureDate.toDateString();
                    });

                    return (
                      <Card key={league.id} className="shadow-sm">
                        <CardHeader className="p-3 pb-0">
                          <div className="font-medium">{league.name}</div>
                          <div className="text-sm text-gray-500">{league.country}</div>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                          {todayFixtures.length > 0 ? (
                            <div className="space-y-2">
                              {todayFixtures.slice(0, 2).map((fixture: any) => (
                                <div key={fixture.fixture.id} className="text-sm">
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                      <Star className="h-4 w-4 text-gray-400" />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{league.name}</span>
                                        <span className="text-sm text-gray-500">{league.country}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="px-4 py-2">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <img 
                                          src={fixture.teams.home.logo} 
                                          alt={fixture.teams.home.name}
                                          className="w-6 h-6 object-contain"
                                        />
                                        <span className="font-medium">{fixture.teams.home.name}</span>
                                      </div>
                                      <div className="w-16 text-center">
                                        <span className="font-semibold">
                                          {format(parseISO(fixture.fixture.date), 'HH:mm')}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium">{fixture.teams.away.name}</span>
                                        <img 
                                          src={fixture.teams.away.logo} 
                                          alt={fixture.teams.away.name}
                                          className="w-6 h-6 object-contain"
                                        />
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-500 text-center">
                                      {fixture.fixture.venue.name ? 'Title Race Clash' : 'League Match'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No matches today</div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">National Leagues</h3>
                <div className="flex flex-col space-y-4">
                  {[
                    { id: 39, name: 'Premier League', country: 'England' },
                    { id: 140, name: 'La Liga', country: 'Spain' },
                    { id: 135, name: 'Serie A', country: 'Italy' },
                    { id: 78, name: 'Bundesliga', country: 'Germany' }
                  ].map((league) => {
                    const leagueFixtures = Object.values(fixturesByLeague)
                      .find((group: any) => group.league.id === league.id)?.fixtures || [];
                    const todayFixtures = leagueFixtures.filter((f: any) => {
                      const fixtureDate = new Date(f.fixture.date);
                      return new Date(selectedDate).toDateString() === fixtureDate.toDateString();
                    });

                    return (
                      <Card key={league.id} className="shadow-sm">
                        <CardHeader className="p-3 pb-0">
                          <div className="font-medium">{league.name}</div>
                          <div className="text-sm text-gray-500">{league.country}</div>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                          {todayFixtures.length > 0 ? (
                            <div className="space-y-2">
                              {todayFixtures.slice(0, 2).map((fixture: any) => (
                                <div key={fixture.fixture.id} className="text-sm">
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                      <Star className="h-4 w-4 text-gray-400" />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{league.name}</span>
                                        <span className="text-sm text-gray-500">{league.country}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="px-4 py-2">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <img 
                                          src={fixture.teams.home.logo} 
                                          alt={fixture.teams.home.name}
                                          className="w-6 h-6 object-contain"
                                        />
                                        <span className="font-medium">{fixture.teams.home.name}</span>
                                      </div>
                                      <div className="w-16 text-center">
                                        <span className="font-semibold">
                                          {format(parseISO(fixture.fixture.date), 'HH:mm')}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium">{fixture.teams.away.name}</span>
                                        <img 
                                          src={fixture.teams.away.logo} 
                                          alt={fixture.teams.away.name}
                                          className="w-6 h-6 object-contain"
                                        />
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-500 text-center">
                                      {fixture.fixture.venue.name ? 'Title Race Clash' : 'League Match'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No matches today</div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.values(fixturesByLeague).map((leagueGroup: any) => (
          <Card key={leagueGroup.league.id} className="bg-white shadow-md">
            <CardContent>
              <div className="divide-y divide-gray-100">
                {(() => {
                  const filteredFixtures = leagueGroup.fixtures.filter((fixture: any) => {
                    const fixtureDate = new Date(fixture.fixture.date);
                    const isSelectedDate = new Date(selectedDate).toDateString() === fixtureDate.toDateString();
                    return isSelectedDate;
                  });

                  if (filteredFixtures.length === 0) {
                    return null;
                  }

                  return (
                    <div key={leagueGroup.league.id} className="mb-6 last:mb-0">
                      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50">
                        <img
                          src={leagueGroup.league.logo}
                          alt={leagueGroup.league.name}
                          className="h-6 w-6 object-contain"
                        />
                        <div>
                          <div className="font-medium">{leagueGroup.league.name}</div>
                          <div className="text-sm text-gray-500">{leagueGroup.league.country}</div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {filteredFixtures.map(renderFixture)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MatchFixturesCard;