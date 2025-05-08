import React, { memo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Clock, ChevronLeft, ChevronRight, Calendar, Timer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';
import { format, formatDistanceToNow, isPast, parseISO, compareAsc, differenceInSeconds, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { getTeamGradient } from '@/lib/utils';
import { useSelector } from 'react-redux';

interface FixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

interface Goals {
  home: number | null;
  away: number | null;
}

interface Score {
  halftime: Goals;
  fulltime: Goals;
  extratime: Goals;
  penalty: Goals;
}

interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
  };
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
}

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

interface FixtureResponse {
  fixture: Fixture;
  league: League;
  teams: {
    home: FixtureTeam;
    away: FixtureTeam;
  };
  goals: Goals;
  score: Score;
}

// Format match date
const formatMatchDateFn = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "EEEE, do MMM | HH:mm");
};

// Format relative time (e.g., "starts in 2 hours" or "3 days ago")
const formatRelativeTime = (dateString: string): string => {
  const date = parseISO(dateString);
  if (isPast(date)) {
    return `${formatDistanceToNow(date)} ago`;
  } else {
    return `starts in ${formatDistanceToNow(date)}`;
  }
};

// Format exact date and time for match
const formatExactDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "EEE, MMM do, yyyy • HH:mm");
};

// Get countdown timer for upcoming match
const getCountdownTimer = (dateString: string): string => {
  const targetDate = new Date(dateString);
  const now = new Date();
  
  // If the date is in the past, return empty string
  if (isPast(targetDate)) {
    return '';
  }
  
  const diffInSeconds = differenceInSeconds(targetDate, now);
  
  // Calculate days, hours, minutes, seconds
  const days = Math.floor(diffInSeconds / (24 * 60 * 60));
  const hours = Math.floor((diffInSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((diffInSeconds % (60 * 60)) / 60);
  const seconds = Math.floor(diffInSeconds % 60);
  
  // Format the countdown string based on how far away the match is
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

// Check if match is live or ended
const isLiveMatch = (status: string): boolean => {
  return ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT'].includes(status);
};

// Popular league IDs to filter by default
const POPULAR_LEAGUE_IDS = [
  // Top European Leagues
  39,  // Premier League (England)
  140, // La Liga (Spain)
  78,  // Bundesliga (Germany)
  135, // Serie A (Italy)
  61,  // Ligue 1 (France)
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  4,   // Euro Championship
  // North/South American Leagues
  71,  // Brazilian Serie A
  128, // MLS (USA)
  132, // Liga MX (Mexico)
  384, // CONMEBOL Libertadores
];

const LiveScoreboard = memo(() => {
  const [, navigate] = useLocation();
  const [filteredFixtures, setFilteredFixtures] = useState<FixtureResponse[]>([]);
  const [currentFixtureIndex, setCurrentFixtureIndex] = useState(0);
  
  // Get the selected country/league filter from Redux
  const selectedCountry = useSelector((state: any) => state.ui.selectedFilter);
  const popularLeagues = useSelector((state: any) => state.leagues.popularLeagues);
  const countryLeagueMap = useSelector((state: any) => state.leagues.countryLeagueMap || {});
  
  // Use React Query to fetch live fixtures with proper caching
  const { data: liveFixtures, isLoading: loadingLive } = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 30000, // 30 seconds
  });
  
  // Get tomorrow's date in YYYY-MM-DD format for upcoming fixtures
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');
  
  // Use React Query to fetch upcoming fixtures with proper caching
  const { data: upcomingFixtures, isLoading: loadingUpcoming } = useQuery<FixtureResponse[]>({
    queryKey: [`/api/fixtures/date/${tomorrowFormatted}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Filter fixtures based on selected country and popular leagues
  useEffect(() => {
    // Only run when we have data
    if (!liveFixtures && !upcomingFixtures) {
      return;
    }
    
    // Get all available fixtures
    const allFixtures = [
      ...(liveFixtures || []), 
      ...(upcomingFixtures || [])
    ];
    
    // First, filter to only include popular leagues
    const popularFixtures = allFixtures.filter(
      fixture => POPULAR_LEAGUE_IDS.includes(fixture.league.id)
    );
    
    // Default to popular fixtures if we have any
    let fixtures = popularFixtures.length > 0 ? popularFixtures : allFixtures;
    
    // If a country is selected, further filter by country's leagues
    if (selectedCountry && countryLeagueMap && Object.keys(countryLeagueMap).length > 0) {
      const countryLeagueIds = countryLeagueMap[selectedCountry] || [];
      
      if (countryLeagueIds.length > 0) {
        const countryFixtures = fixtures.filter(
          fixture => countryLeagueIds.includes(fixture.league.id)
        );
        
        // Only use country fixtures if we found any
        if (countryFixtures.length > 0) {
          fixtures = countryFixtures;
        }
      }
    }
    
    // Sort fixtures by:
    // 1. Live matches first
    // 2. Then upcoming matches by nearest start time
    // 3. Then completed matches by most recent
    fixtures.sort((a, b) => {
      // Live matches go first
      if (isLiveMatch(a.fixture.status.short) && !isLiveMatch(b.fixture.status.short)) {
        return -1;
      }
      if (!isLiveMatch(a.fixture.status.short) && isLiveMatch(b.fixture.status.short)) {
        return 1;
      }
      
      // Sort by match date/time
      return compareAsc(parseISO(a.fixture.date), parseISO(b.fixture.date));
    });
    
    // Update state with filtered and sorted fixtures
    setFilteredFixtures(fixtures);
    setCurrentFixtureIndex(0);
  }, [liveFixtures, upcomingFixtures, selectedCountry, countryLeagueMap]);
  
  // Handle navigation between fixtures
  const handlePreviousFixture = () => {
    if (currentFixtureIndex > 0) {
      setCurrentFixtureIndex(currentFixtureIndex - 1);
    } else {
      // Wrap around to the end if at the beginning
      setCurrentFixtureIndex(filteredFixtures.length - 1);
    }
  };
  
  const handleNextFixture = () => {
    if (currentFixtureIndex < filteredFixtures.length - 1) {
      setCurrentFixtureIndex(currentFixtureIndex + 1);
    } else {
      // Wrap around to the beginning if at the end
      setCurrentFixtureIndex(0);
    }
  };
  
  const isLoading = loadingLive || loadingUpcoming;
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="m-4">
        <CardHeader className="bg-gray-700 text-white p-3">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            <span className="font-semibold">Loading Matches...</span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // No matches state
  if (filteredFixtures.length === 0) {
    return (
      <Card className="m-4">
        <CardHeader className="bg-gray-700 text-white p-3">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            <span className="font-semibold">Featured Matches</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <p>No matches available right now.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Use the current index for the featured match
  const featured = filteredFixtures[currentFixtureIndex];
  
  // Implement countdown timer for upcoming matches
  const [countdown, setCountdown] = useState<string>('');
  
  // Update countdown every second for upcoming matches
  useEffect(() => {
    if (!featured || isLiveMatch(featured.fixture.status.short) || featured.fixture.status.short === 'FT') {
      return;
    }
    
    // Initial countdown
    setCountdown(getCountdownTimer(featured.fixture.date));
    
    // Set up interval for countdown
    const intervalId = setInterval(() => {
      setCountdown(getCountdownTimer(featured.fixture.date));
    }, 1000);
    
    // Cleanup on unmount or when featured match changes
    return () => clearInterval(intervalId);
  }, [featured]);
  
  return (
    <div className="mx-2 my-4">
      {/* Match filter controls with match status */}
      <div className="flex items-center justify-between mb-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={handlePreviousFixture}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="font-medium text-sm">
          {filteredFixtures.length > 0 && featured ? (
            <div className="flex items-center justify-center gap-2">
              {isLiveMatch(featured.fixture.status.short) ? (
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                  <span className="text-lg font-bold">LIVE MATCH</span>
                </div>
              ) : featured.fixture.status.short === 'FT' ? (
                <span className="text-lg font-bold">MATCH ENDED</span>
              ) : (
                <div className="flex flex-col items-center">
                  <h1 className="text-xl font-bold m-0 p-0">UPCOMING MATCH</h1>
                  {countdown && (
                    <div className="text-xs font-semibold text-blue-600 mt-1">
                      Match starts in {countdown}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            "Today's Matches"
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={handleNextFixture}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    
      {/* Featured match card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 relative">
        {/* Featured Match badge - moved to top-right corner with better styling */}
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-md z-30 font-semibold">
          FEATURED MATCH
        </div>
        
        {/* Tournament info - moved before match status */}
        <div className="text-center p-2 flex justify-center items-center gap-2 bg-gray-50">
          <img 
            src={featured.league.logo}
            alt={featured.league.name}
            className="w-5 h-5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16?text=L';
            }}
          />
          <span className="text-sm font-medium">{featured.league.name} - {featured.league.round}</span>
        </div>
        
        {/* Status badge */}
        <div className="text-sm text-center text-gray-700 py-2 border-b border-gray-100">
          {isLiveMatch(featured.fixture.status.short) ? (
            <div className="flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <h1 className="text-xl font-bold">LIVE • {featured.fixture.status.elapsed}′</h1>
            </div>
          ) : featured.fixture.status.short === 'FT' ? (
            <h1 className="text-xl font-bold">MATCH ENDED</h1>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center mb-1">
                <Timer className="h-4 w-4 mr-2 text-blue-600" />
                <h1 className="text-xl font-bold">{formatExactDateTime(featured.fixture.date)}</h1>
              </div>
              {countdown && (
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-blue-700 text-xs font-medium">
                  <span className="animate-pulse mr-1">●</span>
                  Kicks off in {countdown}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Removed scores as requested */}
        
        {/* Teams with dynamic gradients based on team names - equal width meeting in middle */}
        <div className="flex rounded-md overflow-hidden relative h-16">
          {/* Container for both gradients that meet in the middle with same width */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center" style={{ height: '40px' }}>
            {/* Home team logo - original position */}
            <div className="absolute bottom-0 left-0 z-10">
              <img 
                src={featured.teams.home.logo} 
                alt={featured.teams.home.name}
                className="h-16 w-16 transform transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
            
            {/* Home team - original width */}
            <div className={`h-full w-1/2 ${getTeamGradient(featured.teams.home.name, 'to-r')} flex items-center`}>
              <div className="ml-20 text-white font-bold text-lg uppercase">{featured.teams.home.name}</div>
            </div>
            
            {/* VS label (positioned exactly in the center where gradients meet) */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xl bg-black/70 rounded-full h-8 w-8 flex items-center justify-center z-20">
              VS
            </div>
            
            {/* Away team - original width */}
            <div className={`h-full w-1/2 ${getTeamGradient(featured.teams.away.name, 'to-l')} flex items-center justify-end`}>
              <div className="mr-20 text-white font-bold text-lg uppercase text-right">{featured.teams.away.name}</div>
            </div>
            
            {/* Away team logo - original position */}
            <div className="absolute bottom-0 right-0 z-10">
              <img 
                src={featured.teams.away.logo} 
                alt={featured.teams.away.name}
                className="h-16 w-16 transform transition-transform duration-300 hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Team';
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Match details footer */}
        <div className="p-2 text-center text-sm border-t border-gray-100">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>{formatMatchDateFn(featured.fixture.date)}</span>
            {featured.fixture.venue.name && (
              <span> | {featured.fixture.venue.name}</span>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="grid grid-cols-4 border-t border-gray-200">
          <button 
            className="p-2 text-center text-blue-600 hover:bg-blue-50 transition-colors border-r border-gray-200"
            onClick={() => navigate(`/match/${featured.fixture.id}`)}
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="text-xs mt-1">Match Page</div>
            </div>
          </button>
          
          <button 
            className="p-2 text-center text-blue-600 hover:bg-blue-50 transition-colors border-r border-gray-200"
            onClick={() => navigate(`/match/${featured.fixture.id}`)}
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-xs mt-1">Lineups</div>
            </div>
          </button>
          
          <button 
            className="p-2 text-center text-blue-600 hover:bg-blue-50 transition-colors border-r border-gray-200"
            onClick={() => navigate(`/match/${featured.fixture.id}`)}
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="text-xs mt-1">Stats</div>
            </div>
          </button>
          
          <button 
            className="p-2 text-center text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => navigate(`/league/${featured.league.id}`)}
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <div className="text-xs mt-1">Bracket</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
});

export default LiveScoreboard;