import React, { useState } from 'react';
import { Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectTrigger } from '../ui/select';
import { Calendar } from '../ui/calendar';

interface FixtureProps {
  fixtures: any[];
  onMatchClick: (matchId: number) => void;
}

export const MatchFixturesCard = ({ fixtures, onMatchClick }: FixtureProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Today's Matches");

  const renderFixture = (fixture: any) => {
    return (
      <div 
        key={fixture.fixture.id}
        onClick={() => onMatchClick(fixture.fixture.id)}
        className="hover:bg-gray-50 cursor-pointer border-b last:border-b-0 py-4"
      >
        <div className="grid grid-cols-7 items-center px-4">
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
            <span className="px-3 rounded text-gray-500">
              {fixture.goals 
                ? `${fixture.goals.home} - ${fixture.goals.away}`
                : fixture.fixture.status.short === "NS" 
                  ? fixture.fixture.date.slice(11, 16)
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
      </div>
    );
  };

  return (
    <div className="space-y-4 pt-10">
      <Card className="bg-white shadow-md">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 mb-2">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between h-9">
                <button className="p-2 hover:bg-gray-100 rounded-r-full flex items-center -ml-4">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="relative h-full flex items-center">
                  <Select>
                    <SelectTrigger className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded-md h-full border-0 bg-transparent">
                      <span className="font-medium">{selectedFilter}</span>
                    </SelectTrigger>
                    <SelectContent align="start" className="w-[280px] p-0">
                      <Calendar
                        mode="single"
                        selected={new Date()}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedFilter(date.toDateString());
                          }
                        }}
                        className="rounded-md"
                      />
                    </SelectContent>
                  </Select>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-l-full flex items-center -mr-4">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button className="flex items-center gap-1 px-1.5 py-0.5 bg-neutral-800 text-white rounded-full text-xs font-medium w-fit">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Live
                </button>
                <button className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-gray-100 rounded-full text-xs font-medium w-fit">
                  <Clock className="h-3.5 w-3.5" />
                  By time
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {fixtures.map((fixture) => (
        <Card key={fixture.fixture.id} className="bg-white shadow-md">
          <CardHeader className="p-4 border-b border-gray-100">
            <div className="flex items-center">
              <img
                src={fixture.league.logo}
                alt={fixture.league.name}
                className="h-6 w-6 mr-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                }}
              />
              <span className="font-semibold text-gray-800">{fixture.league.name}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {renderFixture(fixture)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchFixturesCard;