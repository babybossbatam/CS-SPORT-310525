import { useLocation } from 'wouter';
import { 
  format, 
  parseISO, 
  isToday, 
  isYesterday, 
  isTomorrow, 
  addDays, 
  differenceInHours, 
  subDays 
} from 'date-fns';
import { FixtureResponse } from '../../../../server/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import LiveMatchPlayer from './LiveMatchPlayer';

// Same league list as UpcomingMatchesScoreboard
const POPULAR_LEAGUES = [
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  135, // Serie A (Italy)
];

const TodayMatches = () => {
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterByTime, setFilterByTime] = useState(false);
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [selectedLiveMatch, setSelectedLiveMatch] = useState<FixtureResponse | null>(null);
  
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
  
  // Check if the match should display scores instead of time
  const shouldShowScores = (dateString: string): boolean => {
    const date = parseISO(dateString);
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    return date.toDateString() === today.toDateString() || 
           date.toDateString() === yesterday.toDateString();
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

  // Filter fixtures based on filters and league
  const filteredFixtures = allFixtures
    // Remove duplicates by fixture ID
    .filter((fixture, index, self) => 
      index === self.findIndex(f => f.fixture.id === fixture.fixture.id)
    )
    // Apply live filter if enabled
    .filter(fixture => {
      if (showLiveOnly) {
        return ['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'INT'].includes(fixture.fixture.status.short);
      }
      return true;
    })
    // Apply time filter if enabled (only show matches finished within last 8 hours)
    .filter(fixture => {
      if (filterByTime && !showLiveOnly) {
        return fixture.fixture.status.short === 'FT' && isRecentFinishedMatch(fixture);
      }
      return true;
    })
    // Filter to only include our priority leagues
    .filter(fixture => POPULAR_LEAGUES.includes(fixture.league.id))
    // Sort by timestamp (nearest first)
    .sort((a, b) => {
      // Always prioritize live matches when using live filter
      if (showLiveOnly) {
        const aIsLive = ['1H', '2H', 'HT', 'LIVE'].includes(a.fixture.status.short);
        const bIsLive = ['1H', '2H', 'HT', 'LIVE'].includes(b.fixture.status.short);
        if (aIsLive && !bIsLive) return -1;
        if (!aIsLive && bIsLive) return 1;
      }
      return a.fixture.timestamp - b.fixture.timestamp;
    });

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
      {/* Show LiveMatchPlayer when a live match is selected */}
      {selectedLiveMatch && (
        <LiveMatchPlayer 
          fixture={selectedLiveMatch} 
          onClose={() => {
            setSelectedLiveMatch(null);
            setShowLiveOnly(false);
          }}
        />
      )}

      {/* Filter controls based on the provided image */}
      <div className="flex flex-col mb-3 mx-1 border-b pb-3">
        {/* Top row - LIVE and by time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost"
              size="sm" 
              className={`text-xs h-7 font-medium px-3 ${showLiveOnly ? 'bg-red-500 text-white hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => {
                // Toggle live matches filter
                setShowLiveOnly(!showLiveOnly);
                
                // If turning on live filter
                if (!showLiveOnly) {
                  setFilterByTime(false);
                  
                  // Select the first live match if available (for the video player)
                  const liveMatches = filteredFixtures.filter(fixture => 
                    ['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'INT'].includes(fixture.fixture.status.short)
                  );
                  
                  if (liveMatches.length > 0) {
                    setSelectedLiveMatch(liveMatches[0]);
                  }
                } else {
                  // If turning off live filter, clear selected match
                  setSelectedLiveMatch(null);
                }
              }}
            >
              LIVE
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="ghost"
              size="sm" 
              className={`text-xs h-7 gap-1 flex items-center ${filterByTime ? 'text-blue-600' : 'text-gray-500'}`}
              onClick={() => {
                setFilterByTime(!filterByTime);
                // If turning on time filter, turn off live filter
                if (!filterByTime) setShowLiveOnly(false);
              }}
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              by time
            </Button>
          </div>
        </div>

        {/* Day picker controls */}
        <div className="flex items-center space-x-1 mt-1">
          <Button 
            variant="ghost"
            size="sm" 
            className={`text-xs py-1 px-2 h-6 font-medium ${isYesterday(selectedDate || new Date()) ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
            onClick={() => {
              const yesterday = subDays(new Date(), 1);
              setSelectedDate(yesterday);
              setShowLiveOnly(false);
            }}
          >
            Yesterday
          </Button>
          <Button 
            variant="ghost"
            size="sm" 
            className={`text-xs py-1 px-2 h-6 font-medium ${isToday(selectedDate || new Date()) ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
            onClick={() => {
              setSelectedDate(new Date());
              setShowLiveOnly(false);
            }}
          >
            Today
          </Button>
          <Button 
            variant="ghost"
            size="sm" 
            className={`text-xs py-1 px-2 h-6 font-medium ${isTomorrow(selectedDate || new Date()) ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
            onClick={() => {
              const tomorrow = addDays(new Date(), 1);
              setSelectedDate(tomorrow);
              setShowLiveOnly(false);
            }}
          >
            Tomorrow
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="space-y-1">
        {/* Display today's fixtures */}
        {todayMatches.map((match) => (
          <div 
            key={match.fixture.id}
            className="flex flex-col px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
            onClick={(e) => {
              // If it's a live match and live filter is on, show the video player
              if (showLiveOnly && ['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'INT'].includes(match.fixture.status.short)) {
                e.stopPropagation();
                setSelectedLiveMatch(match);
              } else {
                // Otherwise navigate to match details
                navigate(`/match/${match.fixture.id}`);
              }
            }}
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
                {['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'INT'].includes(match.fixture.status.short) ? (
                  /* Show live scores with indicator for live matches */
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="font-bold text-sm">{match.goals.home ?? 0}</span>
                      <span className="text-gray-400">:</span>
                      <span className="font-bold text-sm">{match.goals.away ?? 0}</span>
                    </div>
                    <div className="flex items-center mt-0.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                      <span className="text-red-500 font-medium text-[10px]">
                        {match.fixture.status.short === 'HT' ? 'HALF TIME' : 
                         match.fixture.status.short === '1H' ? '1ST HALF' : 
                         match.fixture.status.short === '2H' ? '2ND HALF' : 
                         match.fixture.status.short === 'ET' ? 'EXTRA TIME' : 
                         match.fixture.status.short === 'P' ? 'PENALTY' : 'LIVE'}
                      </span>
                    </div>
                  </div>
                ) : shouldShowScores(match.fixture.date) && match.fixture.status.short === 'FT' ? (
                  /* Show scores for today's or yesterday's finished matches */
                  <div className="flex items-center justify-center space-x-1">
                    <span className="font-bold text-sm">{match.goals.home ?? 0}</span>
                    <span className="text-gray-400">:</span>
                    <span className="font-bold text-sm">{match.goals.away ?? 0}</span>
                  </div>
                ) : (
                  /* Show date and time for other matches */
                  <>
                    <div className="flex items-center justify-center">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-gray-500">{formatMatchDate(match.fixture.date)}</span>
                    </div>
                    <span className="font-semibold">{formatMatchTime(match.fixture.timestamp)}</span>
                  </>
                )}
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