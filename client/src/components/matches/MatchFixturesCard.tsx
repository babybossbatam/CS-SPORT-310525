import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ChevronDown, Star } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
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
                      {format(selectedDate, "MMMM d, yyyy")}
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

      <Card className="bg-white shadow-md">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Popular Football Leagues</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.values(fixturesByLeague).map((leagueGroup: any) => {
              // Filter fixtures based on date and status
              const filteredFixtures = leagueGroup.fixtures.filter((fixture: any) => {
                const fixtureDate = new Date(fixture.fixture.date);
                const isToday = new Date().toDateString() === fixtureDate.toDateString();
                const isSelectedDate = new Date(selectedDate).toDateString() === fixtureDate.toDateString();

                // Show score only if match is finished and it's today's match
                return isSelectedDate && (isToday ? 
                  ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short) :
                  true);
              });

              if (filteredFixtures.length === 0) return null;

              return (
                <div key={leagueGroup.league.id} className="mb-6 last:mb-0">
                  <div className="flex items-center space-x-2 px-4 mb-2">
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
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchFixturesCard;