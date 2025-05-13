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
// Removed LiveMatchPlayer import
import { shouldExcludeFixture } from '@/lib/exclusionFilters';

// Expanded list of popular leagues
const POPULAR_LEAGUES = [
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  39,  // Premier League (England)
  140, // La Liga (Spain)
  135, // Serie A (Italy)
  78,  // Bundesliga (Germany)
  61,  // Ligue 1 (France)
  48,  // Eredivisie (Netherlands)
  94,  // Primeira Liga (Portugal)
  88,  // Belgian Pro League (Belgium)
  144, // Saudi Pro League (Saudi Arabia)
  203, // English Championship (England)
  207, // Super League (Switzerland)
  179  // MLS (USA)
];

const TodayMatches = () => {
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterByTime, setFilterByTime] = useState(true); // Default to showing today's ended matches
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  // Removed selectedLiveMatch state
  
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
  
  // We're now using real live data from the API

  // Get live matches from the API
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
    // First filter out youth leagues and other unwanted categories
    .filter(fixture => {
      if (!fixture.league || !fixture.teams) return false;
      
      const leagueName = fixture.league.name || '';
      const homeTeamName = fixture.teams.home.name || '';
      const awayTeamName = fixture.teams.away.name || '';
      
      // Use our centralized exclusion filter that also excludes South American leagues
      return !shouldExcludeFixture(leagueName, homeTeamName, awayTeamName);
    })
    
    // Then filter for popular leagues
    .filter(fixture => {
      // Check if it's in our priority league list by ID
      if (POPULAR_LEAGUES.includes(fixture.league.id)) return true;
      
      // Otherwise check league name for popular keywords
      const leagueName = fixture.league.name ? fixture.league.name.toLowerCase() : '';
      const popularNames = [
        'premier', 'bundesliga', 'la liga', 'serie a', 'ligue 1', 'champions league', 
        'europa', 'uefa', 'world cup', 'euro', 'copa del rey', 'fa cup', 'copa america',
        'mls', 'eredivisie', 'primeira liga', 'championship', 'super league', 'pro league'
      ];
      
      // Check for country name of major football countries
      const country = fixture.league.country ? fixture.league.country.toLowerCase() : '';
      const popularCountries = [
        'england', 'spain', 'italy', 'germany', 'france', 'netherlands', 
        'portugal', 'belgium', 'saudi arabia', 'usa', 'brazil', 'argentina'
      ];
      
      // More strict filtering - must have both a popular league name AND be from a popular country
      return (popularNames.some(name => leagueName.includes(name)) && 
             popularCountries.some(name => country.includes(name)));
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

  // Return null if no matches
  if (filteredFixtures.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4">

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
                  
                  // Removed live match player selection
                } else {
                  // If turning off live filter
                  // Removed live match clearing
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
        {/* Matches display */}

        {/* Display the fixtures in the new format */}
        {todayMatches
          // Show matches from all popular leagues instead of just Europa League
          .map((match) => (
            <div 
              key={match.fixture.id}
              className="flex flex-col px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
              onClick={(e) => {
                // Always navigate to match details (removed live player feature)
                navigate(`/match/${match.fixture.id}`);
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
                    className="h-5 w-5 mr-2 object-contain drop-shadow-md"
                    onError={(e) => {
                      // Try first the livescore URL
                      (e.target as HTMLImageElement).src = `https://static.livescore.com/i/team/${match.teams.home.id}.png`;
                      
                      // Add a second error handler for complete fallback
                      (e.target as HTMLImageElement).onerror = () => {
                        (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/team/default.png';
                        (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                      };
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
                    className="h-5 w-5 ml-2 object-contain drop-shadow-md"
                    onError={(e) => {
                      // Try first the livescore URL
                      (e.target as HTMLImageElement).src = `https://static.livescore.com/i/team/${match.teams.away.id}.png`;
                      
                      // Add a second error handler for complete fallback
                      (e.target as HTMLImageElement).onerror = () => {
                        (e.target as HTMLImageElement).src = 'https://static.livescore.com/i/team/default.png';
                        (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                      };
                    }}
                  />
                </div>
              </div>
              
              {/* Aggregate Score - only show for tournament matches with aggregate scoring */}
              {match.league.id === 2 || match.league.id === 3 ? (
                <div className="text-xs text-gray-500 text-center mt-0.5">
                  {match.fixture.status.short === 'FT' ? 
                    `${match.teams.home.winner ? 'Home' : match.teams.away.winner ? 'Away' : 'Draw'} on aggregate` : 
                    `${match.league.round}`
                  }
                </div>
              ) : null}
            </div>
          ))}
          


      </div>
  );
};

export default TodayMatches;