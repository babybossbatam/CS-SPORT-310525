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
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>{format(parseISO(fixture.fixture.date), 'EEE, MMM d')}</span>
          <span className="mx-2">•</span>
          <Clock className="h-3 w-3 mr-1" />
          <span>{format(parseISO(fixture.fixture.date), 'HH:mm')}</span>
        </div>

        <div className="grid grid-cols-7 items-center min-h-[64px]">
          <div className="col-span-3 flex items-center justify-end gap-3 min-w-[200px]">
            <span className="font-medium text-right line-clamp-1">{fixture.teams.home.name}</span>
            <div className="w-[40px] flex justify-center">
              <img 
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
                }}
              />
            </div>
          </div>

          <div className="col-span-1 flex justify-center w-[80px]">
            <span className={cn(
              "px-3 py-1 rounded min-w-[60px] text-center",
              fixture.fixture.status.short === "NS" ? "bg-gray-100" : 
              fixture.fixture.status.short === "LIVE" ? "bg-red-600 text-white" :
              "bg-gray-800 text-white"
            )}>
              {fixture.fixture.status.short === "NS" 
                ? "vs"
                : `${fixture.goals.home} - ${fixture.goals.away}`
              }
            </span>
          </div>

          <div className="col-span-3 flex items-center gap-3 min-w-[200px]">
            <div className="w-[40px] flex justify-center">
              <img 
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
                }}
              />
            </div>
            <span className="font-medium line-clamp-1">{fixture.teams.away.name}</span>
          </div>
        </div>

        {fixture.fixture.venue.name && (
          <div className="mt-2 text-xs text-gray-500">
            {fixture.fixture.venue.name}, {fixture.fixture.venue.city}
          </div>
        )}
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
        <CardContent className="p-0">
        <Tabs defaultValue="fixtures" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="fixtures">Upcoming</TabsTrigger>
            <TabsTrigger value="results">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="fixtures">
            <div className="divide-y divide-gray-100">
              {upcomingFixtures.length > 0 ? (
                upcomingFixtures.map(renderFixture)
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No upcoming fixtures
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results">
            <div className="divide-y divide-gray-100">
              {completedFixtures.length > 0 ? (
                [...completedFixtures]
                  .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
                  .slice(0, 5)
                  .map(renderFixture)
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No completed matches
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      </Card>
    </div>
  );
};

export default MatchFixturesCard;