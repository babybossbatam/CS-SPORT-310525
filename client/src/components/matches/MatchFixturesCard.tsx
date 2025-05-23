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
                      onError={React.useCallback((e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.dataset.errored) {
                          img.dataset.errored = 'true';
                          img.src = 'https://via.placeholder.com/24?text=Team';
                        }
                      }, [])}
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

  const [selectedDate, setSelectedDate] = React.useState(new Date());
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

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-3">
        <h2 className="text-lg font-semibold text-gray-900">Today's Matches</h2>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {Object.entries(fixturesByLeague).map(([leagueId, { league, fixtures }]) => (
            <div key={leagueId} className="py-3 px-4">
              <div className="font-medium text-sm text-gray-900 mb-2">{league.name}</div>
              <div className="space-y-2">
                {fixtures.map((fixture) => (
                  <div
                    key={fixture.fixture.id}
                    className="flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 cursor-pointer"
                    onClick={() => onMatchClick(fixture.fixture.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">{fixture.teams.home.name}</span>
                      <span className="text-xs text-gray-500">vs</span>
                      <span className="text-sm font-medium text-gray-700">{fixture.teams.away.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(parseISO(fixture.fixture.date), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchFixturesCard;