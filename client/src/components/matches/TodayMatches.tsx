import { useLocation } from 'wouter';
import { format, parseISO, isToday, differenceInHours, addHours } from 'date-fns';
import { FixtureResponse } from '../../../../server/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

// Same league list as UpcomingMatchesScoreboard
const POPULAR_LEAGUES = [
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  135, // Serie A (Italy)
];

const TodayMatches = () => {
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [filterByTime, setFilterByTime] = useState(false);
  
  // Format date for API request
  const formattedSelectedDate = selectedDate ? 
    format(selectedDate, 'yyyy-MM-dd') : 
    format(new Date(), 'yyyy-MM-dd');
  
  // Get fixture data for the selected date
  const { data: selectedDateFixtures = [], isLoading: isSelectedDateFixturesLoading } = useQuery({
    queryKey: ['/api/fixtures/date', formattedSelectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/fixtures/date/${formattedSelectedDate}`);
      return response.json();
    }
  });
  
  // Get live matches
  const { data: liveFixtures = [], isLoading: isLiveLoading } = useQuery({
    queryKey: ['/api/fixtures/live'],
    queryFn: async () => {
      const response = await fetch('/api/fixtures/live');
      return response.json();
    }
  });
  
  // Helper to check if a match is live
  const isLiveMatch = (status: string): boolean => {
    return ['LIVE', '1H', '2H', 'HT'].includes(status);
  };
  
  // Format date for match display (Today, Tomorrow, or date)
  const formatMatchDate = (dateString: string): string => {
    const date = parseISO(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM dd');
    }
  };
  
  // Format time from timestamp (HH:MM format)
  const formatMatchTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return format(date, 'HH:mm');
  };
  
  // Get the current time in seconds (unix timestamp)
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Function to check if a match is "recent" (finished within last 8 hours)
  const isRecentFinishedMatch = (fixture: FixtureResponse): boolean => {
    if (fixture.fixture.status.short !== 'FT') return false;
    const fixtureTime = new Date(fixture.fixture.timestamp * 1000);
    const currentTime = new Date();
    const hoursDifference = differenceInHours(currentTime, fixtureTime);
    return hoursDifference <= 8;
  };

  // Combine fixtures from the selected date and live fixtures
  const allFixtures = [...selectedDateFixtures, ...liveFixtures];

  // Filter fixtures based on time filter and league
  const filteredFixtures = allFixtures
    // Remove duplicates by fixture ID
    .filter((fixture, index, self) => 
      index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
    )
    // Apply time filter if enabled (only show matches finished within last 8 hours)
    .filter(fixture => !filterByTime || isRecentFinishedMatch(fixture))
    // Filter to only include our priority leagues
    .filter(fixture => POPULAR_LEAGUES.includes(fixture.league.id))
    // Sort by timestamp (nearest first)
    .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

  // Take the first 5 fixtures for the today matches display
  const todayMatches = filteredFixtures.slice(0, 5);
  
  // Display loading state
  if (isSelectedDateFixturesLoading || isLiveLoading) {
    return (
      <div className="animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-12" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Display empty state
  if (todayMatches.length === 0) {
    return (
      <div className="text-center p-3 text-gray-500">
        No matches scheduled for today.
      </div>
    );
  }
  
  return (
    <div>
      {/* Filter controls */}
      <div className="flex items-center justify-between mb-3 mx-1">
        <div className="flex items-center">
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8 gap-1 border-gray-300"
              >
                <span className="whitespace-nowrap">{selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Today'}</span>
                {showCalendar ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date || new Date());
                  setShowCalendar(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {!isToday(selectedDate || new Date()) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-8 text-xs"
              onClick={() => setSelectedDate(new Date())}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Today
            </Button>
          )}
        </div>
        
        <Button 
          variant={filterByTime ? "default" : "outline"}
          size="sm" 
          className={`text-xs h-8 gap-1 ${filterByTime ? 'bg-blue-600' : 'border-gray-300'}`}
          onClick={() => setFilterByTime(!filterByTime)}
        >
          <Clock className="h-3 w-3" />
          by time
        </Button>
      </div>
      
      {/* Main content */}
      <div className="space-y-1">
        {/* Display today's fixtures */}
        {todayMatches.map((match) => (
          <div 
            key={match.fixture.id}
            className="flex flex-col px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
            onClick={() => navigate(`/match/${match.fixture.id}`)}
          >
            <div className="flex items-center justify-between mb-1">
              <img 
                src={match.teams.home.logo} 
                alt={match.teams.home.name} 
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                }}
              />
              <div className="text-center text-xs flex flex-col">
                <div className="flex items-center justify-center">
                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-gray-500">{formatMatchDate(match.fixture.date)}</span>
                </div>
                <span className="font-semibold">{formatMatchTime(match.fixture.timestamp)}</span>
              </div>
              <img 
                src={match.teams.away.logo} 
                alt={match.teams.away.name} 
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm w-[40%] text-left truncate">{match.teams.home.name}</span>
              <div className="text-xs text-gray-500 text-center">
                {match.league.name}
              </div>
              <span className="text-sm w-[40%] text-right truncate">{match.teams.away.name}</span>
            </div>
          </div>
        ))}
        
        {/* Link to Champions League page */}
        <div className="mt-2 text-center">
          <a 
            href="#" 
            className="text-xs text-blue-600 hover:underline block py-2"
            onClick={(e) => {
              e.preventDefault();
              navigate('/leagues/2');
            }}
          >
            UEFA Champions League Bracket &gt;
          </a>
        </div>
      </div>
    </div>
  );
};

export default TodayMatches;