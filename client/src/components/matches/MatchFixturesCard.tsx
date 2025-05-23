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
          <div className="text-sm font-medium text-gray-700">
            {fixture.league.name}
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
            fixture.fixture.status.short === "FT" ? "text-gray-900" : "text-gray-500"
          )}>
            {fixture.fixture.status.short === "FT" 
              ? `${fixture.goals.home} - ${fixture.goals.away}`
              : "-"
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

      <div className="text-xs text-gray-500 text-right px-4 mt-1">
        {fixture.fixture.status.short === "FT" ? "Ended" : format(parseISO(fixture.fixture.date), 'HH:mm')}
      </div>
    </div>
  );

  // Group fixtures by league
  return (
    <div className="space-y-4 pt-10">
      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Match Schedule</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-gray-600" />
              <span className="font-semibold text-gray-800">Popular Football Leagues</span>
            </div>
          </div>
        </CardHeader>
        <div className="p-4">
          <div className="space-y-4">
            <div>
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
                            {todayFixtures.slice(0, 2).map((fixture: any) => renderFixture(fixture))}
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
                            {todayFixtures.slice(0, 2).map((fixture: any) => renderFixture(fixture))}
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
        </div>
      </Card>

      <div className="space-y-4">
        {Object.values(fixturesByLeague).map((leagueGroup: any) => {
          const filteredFixtures = leagueGroup.fixtures.filter((fixture: any) => {
            const fixtureDate = new Date(fixture.fixture.date);
            return new Date(selectedDate).toDateString() === fixtureDate.toDateString();
          });

          if (filteredFixtures.length === 0) {
            return null;
          }

          return (
            <Card key={leagueGroup.league.id} className="bg-white shadow-md">
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MatchFixturesCard;