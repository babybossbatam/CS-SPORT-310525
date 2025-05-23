import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Calendar as DatePicker } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const upcomingFixtures = fixtures.filter(fixture => 
    fixture.fixture.status.short === "NS" || 
    fixture.fixture.status.short === "TBD"
  ).slice(0, 5);

  const completedFixtures = fixtures.filter(fixture => 
    fixture.fixture.status.short === "FT" || 
    fixture.fixture.status.short === "AET" || 
    fixture.fixture.status.short === "PEN"
  ).slice(0, 5);

  const renderFixture = (fixture: any) => (
    <div 
      key={fixture.fixture.id}
      onClick={() => onMatchClick(fixture.fixture.id)}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="p-4">
        

        <div className="grid grid-cols-7 items-center">
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
              "px-3 py-1 rounded",
              fixture.fixture.status.short === "NS" ? "bg-gray-100" : "bg-gray-800 text-white"
            )}>
              {fixture.fixture.status.short === "NS" 
                ? "vs"
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
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <h2 className="text-lg font-semibold">Today's Matches</h2>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <DatePicker
                  mode="single"
                  className="rounded-md border"
                  selected={new Date()}
                  onSelect={(date) => console.log(date)}
                />
              </PopoverContent>
            </Popover>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex gap-2 px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-gray-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Live
              </div>
              <div className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                By time
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Popular Football Leagues - Completed Matches</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {fixtures.length > 0 ? (
              [...fixtures]
                .filter(fixture => [2, 3, 39, 140, 135, 78].includes(fixture.league.id)) // Filter popular leagues
                .filter(fixture => ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)) // Show only completed matches
                .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()) // Most recent first
                .slice(0, 5)
                .map(renderFixture)
            ) : (
              <div className="p-4 text-center text-gray-500">
                No fixtures available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchFixturesCard;