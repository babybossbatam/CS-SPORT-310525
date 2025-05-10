import { useLocation } from 'wouter';
import { 
  format, 
  parseISO, 
  isToday,
  isSameDay,
  isYesterday,
  isTomorrow,
  differenceInHours, 
  subDays,
  addDays
} from 'date-fns';
import { FixtureResponse } from '../../../../server/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, CalendarIcon, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DayPicker } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [filterByTime, setFilterByTime] = useState(true); // Default to showing today's ended matches
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
  
  // Mock data for live matches (for testing as requested)
  const mockLiveFixtures = [
    {
      fixture: {
        id: 1000001,
        referee: "Mike Dean",
        timezone: "UTC",
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'+00:00'"),
        timestamp: Math.floor(Date.now() / 1000),
        periods: { first: 1746750000, second: 1746753600 },
        venue: { id: 5555, name: "Santiago Bernabéu", city: "Madrid" },
        status: { long: "First Half", short: "1H", elapsed: 32 }
      },
      league: {
        id: 2, // Champions League
        name: "UEFA Champions League",
        country: "World",
        logo: "https://media.api-sports.io/football/leagues/2.png",
        flag: null,
        season: 2024,
        round: "Quarter-finals"
      },
      teams: {
        home: {
          id: 541,
          name: "Real Madrid",
          logo: "https://media.api-sports.io/football/teams/541.png",
          winner: null
        },
        away: {
          id: 489,
          name: "AC Milan",
          logo: "https://media.api-sports.io/football/teams/489.png",
          winner: null
        }
      },
      goals: { home: 2, away: 1 },
      score: {
        halftime: { home: 1, away: 1 },
        fulltime: { home: null, away: null },
        extratime: { home: null, away: null },
        penalty: { home: null, away: null }
      }
    },
    {
      fixture: {
        id: 1000002,
        referee: "Anthony Taylor",
        timezone: "UTC",
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'+00:00'"),
        timestamp: Math.floor(Date.now() / 1000),
        periods: { first: 1746750000, second: 1746753600 },
        venue: { id: 550, name: "Anfield", city: "Liverpool" },
        status: { long: "Second Half", short: "2H", elapsed: 67 }
      },
      league: {
        id: 2, // Champions League
        name: "UEFA Champions League",
        country: "World",
        logo: "https://media.api-sports.io/football/leagues/2.png",
        flag: null,
        season: 2024,
        round: "Quarter-finals"
      },
      teams: {
        home: {
          id: 40,
          name: "Liverpool",
          logo: "https://media.api-sports.io/football/teams/40.png",
          winner: null
        },
        away: {
          id: 212,
          name: "FC Porto",
          logo: "https://media.api-sports.io/football/teams/212.png",
          winner: null
        }
      },
      goals: { home: 1, away: 0 },
      score: {
        halftime: { home: 0, away: 0 },
        fulltime: { home: null, away: null },
        extratime: { home: null, away: null },
        penalty: { home: null, away: null }
      }
    }
  ];

  // Get live matches from the API
  const { data: liveFixtures = [], isLoading: isLiveLoading } = useQuery({
    queryKey: ['/api/fixtures/live'],
    queryFn: async () => {
      // Using real API data for production
      const useMockData = false; // Use real data from API
      
      if (useMockData) {
        // For testing live match functionality without real live matches
        return mockLiveFixtures;
      }
      
      // For real data:
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
  
  // Check if the match should display scores instead of time (only for today's matches)
  const shouldShowScores = (dateString: string): boolean => {
    const date = parseISO(dateString);
    const today = new Date();
    
    // Only show scores for today's matches
    return date.toDateString() === today.toDateString();
  };
  
  // Get the current time in seconds (unix timestamp)
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Function to check if a match is "recent" (finished within last 8 hours)
  const isRecentFinishedMatch = (fixture: FixtureResponse): boolean => {
    // Check for all finished match statuses (FT=full time, AET=after extra time, PEN=penalties)
    if (!['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)) return false;
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
    // Apply both filters independently
    .filter(fixture => {
      const isLive = ['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'INT'].includes(fixture.fixture.status.short);
      const isRecentlyFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short) && isRecentFinishedMatch(fixture);
      
      // Apply filters
      if (showLiveOnly && filterByTime) {
        // If both filters are enabled, show both live and recent
        return isLive || isRecentlyFinished;
      } else if (showLiveOnly) {
        // Only show live matches
        return isLive;
      } else if (filterByTime) {
        // Only show recently finished matches
        return isRecentlyFinished;
      }
      
      // No filters - show all matches
      return true;
    })
    // Filter to only include our priority leagues - but only if we have data for these leagues
    .filter(fixture => {
      // If we don't have any fixtures in our popular leagues, show all leagues
      const hasPopularLeagueFixtures = allFixtures.some(f => POPULAR_LEAGUES.includes(f.league.id));
      
      // Either show all fixtures if no popular ones are available, or filter to popular ones
      return !hasPopularLeagueFixtures || POPULAR_LEAGUES.includes(fixture.league.id);
    })
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
  
  // Show an empty state instead of disappearing
  if (todayMatches.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
          <CalendarIcon className="h-10 w-10 text-gray-300" />
          <h3 className="text-sm font-medium">No matches found</h3>
          <p className="text-xs text-gray-400">
            There are no matches available from the selected leagues today.
          </p>
        </div>
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
        {/* Top row with filters and date picker centered */}
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
                  // Don't turn off time filter - keep them independent
                  
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
          
          {/* Date picker moved to center, styled like DateNavigator */}
          <div className="flex-1 mx-1 flex justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative flex items-center justify-center space-x-2 mx-auto"
                >
                  <span className="text-sm font-medium">
                    {selectedDate && !isSameDay(selectedDate, new Date()) 
                      ? format(selectedDate, 'MMMM d, yyyy') 
                      : "Today's Matches"}
                  </span>
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setShowLiveOnly(false);
                  }}
                  weekStartsOn={1}
                  showOutsideDays
                  fixedWeeks
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="ghost"
              size="sm" 
              className={`text-xs h-7 gap-1 flex items-center ${filterByTime ? 'text-blue-600' : 'text-gray-500'}`}
              onClick={() => {
                setFilterByTime(!filterByTime);
                // No longer turn off live filter when time filter is enabled
              }}
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              today ended
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="space-y-1">
        {/* Popular Leagues Header */}
        <div className="px-3 py-2 font-medium">
          Popular Football Leagues
        </div>

        {/* League header with star icon */}
        <div className="px-3 py-1 flex items-center space-x-2">
          <span className="text-blue-400">
            <Star className="h-4 w-4" />
          </span>
          <div className="flex items-center">
            <img 
              src="https://media.api-sports.io/football/leagues/2.png"
              alt="Popular Football Leagues"
              className="h-5 w-5 mr-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Popular Football Leagues</span>
              <span className="text-xs text-gray-500">Champions, Europa, Serie A</span>
            </div>
          </div>
        </div>

        {/* Display the fixtures in the new format */}
        {todayMatches
          // Show matches from all popular leagues instead of just Europa League
          .map((match) => (
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
              {/* Match Status */}
              <div className="text-xs text-gray-500 text-right mb-0.5">
                {['FT', 'AET', 'PEN'].includes(match.fixture.status.short) && "Ended"}
              </div>
              
              {/* Teams and Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center w-[38%]">
                  <img 
                    src={match.teams.home.logo} 
                    alt={match.teams.home.name}
                    className="h-5 w-5 mr-2 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
                    }}
                  />
                  <span className="text-sm font-medium text-left truncate">{match.teams.home.name}</span>
                </div>
                <div className="flex items-center justify-center space-x-1 w-[24%]">
                  <span className="font-bold text-base">{match.goals.home}</span>
                  <span className="text-gray-400 font-bold">-</span>
                  <span className="font-bold text-base">{match.goals.away}</span>
                </div>
                <div className="flex items-center justify-end w-[38%]">
                  <span className="text-sm font-medium text-right truncate">{match.teams.away.name}</span>
                  <img 
                    src={match.teams.away.logo} 
                    alt={match.teams.away.name}
                    className="h-5 w-5 ml-2 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
                    }}
                  />
                </div>
              </div>
              
              {/* Aggregate Score */}
              <div className="text-xs text-gray-500 text-center mt-0.5">
                {/* Add aggregate score if available (mocked for demo) */}
                Aggregate {match.fixture.id % 2 === 0 ? "7 - 1" : "1 - 5"}
              </div>
            </div>
          ))}
          
        {/* Tottenham match example */}
        <div className="px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
          <div className="text-xs text-gray-500 text-right mb-0.5">
            Ended
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium w-[38%] text-left truncate">Bodø Glimt</span>
            <div className="flex items-center justify-center space-x-1 w-[24%]">
              <span className="font-bold text-base">0</span>
              <span className="text-gray-400 font-bold">-</span>
              <span className="font-bold text-base">2</span>
            </div>
            <span className="text-sm font-medium w-[38%] text-right truncate">Tottenham</span>
          </div>
          <div className="text-xs text-gray-500 text-center mt-0.5">
            Aggregate 1 - 5
          </div>
        </div>
        
        {/* Link to Europa League Bracket */}
        <div className="px-3 py-2 text-right">
          <a 
            href="#" 
            className="text-xs text-blue-600 hover:underline inline-flex items-center"
            onClick={(e) => {
              e.preventDefault();
              navigate('/leagues/3');
            }}
          >
            UEFA Europa League Bracket <ChevronRight className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default TodayMatches;