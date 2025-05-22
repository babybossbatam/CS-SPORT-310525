
import { format, parseISO } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '@/lib/utils';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const futureFixtures = fixtures.filter(fixture => 
    fixture.fixture.status.short === "NS" || 
    fixture.fixture.status.short === "TBD"
  );

  const completedFixtures = fixtures.filter(fixture => 
    fixture.fixture.status.short === "FT" || 
    fixture.fixture.status.short === "AET" || 
    fixture.fixture.status.short === "PEN"
  );

  const renderFixture = (fixture: any) => (
    <div 
      key={fixture.fixture.id}
      onClick={() => onMatchClick(fixture.fixture.id)}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="p-4">
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{format(parseISO(fixture.fixture.date), 'EEE, MMM d')}</span>
          <span className="mx-2">•</span>
          <Clock className="h-3 w-3 mr-1" />
          <span>{format(parseISO(fixture.fixture.date), 'HH:mm')}</span>
        </div>
        
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
        
        {fixture.fixture.venue.name && (
          <div className="mt-2 text-xs text-gray-500">
            {fixture.fixture.venue.name}, {fixture.fixture.venue.city}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-0">
        <Tabs defaultValue="fixtures" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fixtures">
            <div className="divide-y divide-gray-100">
              {futureFixtures.length > 0 ? (
                futureFixtures.map(renderFixture)
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
                  .slice(0, 20)
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
  );
};

export default MatchFixturesCard;
