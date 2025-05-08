import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Timer,
  Activity,
} from 'lucide-react';
import { format, parseISO, compareAsc } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  getTeamGradient, 
  formatMatchDateFn, 
  formatExactDateTime,
  getCountdownTimer,
  isLiveMatch
} from '@/lib/utils';

// Define types locally
interface Team {
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
    home: Team;
    away: Team;
  };
  goals: Goals;
  score: Score;
}

// Popular football league IDs (most followed globally)
const POPULAR_LEAGUES = [
  39,  // Premier League (England)
  140, // La Liga (Spain)
  135, // Serie A (Italy)
  78,  // Bundesliga (Germany)
  2,   // Champions League
  71,  // Serie A (Brazil)
];

function LiveScoreboardPage() {
  const [, navigate] = useLocation();
  const [filteredFixtures, setFilteredFixtures] = useState<FixtureResponse[]>([]);
  const [currentFixtureIndex, setCurrentFixtureIndex] = useState(0);
  const [countdown, setCountdown] = useState('');
  
  // Get selected filter from Redux
  const selectedCountry = useSelector((state: any) => state.ui.selectedFilter);
  const popularLeagues = useSelector((state: any) => state.leagues.popularLeagues);
  const countryLeagueMap = useSelector((state: any) => state.leagues.countryLeagueMap || {});
  
  // Get tomorrow's date for upcoming fixtures
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = format(tomorrow, 'yyyy-MM-dd');
  
  // Fetch live fixtures
  const liveFixturesQuery = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 30000, // 30 seconds
  });
  
  // Fetch upcoming fixtures for tomorrow
  const upcomingFixturesQuery = useQuery<FixtureResponse[]>({
    queryKey: [`/api/fixtures/date/${tomorrowFormatted}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Process fixtures when data is available
  useEffect(() => {
    const liveFixtures = liveFixturesQuery.data || [];
    const upcomingFixtures = upcomingFixturesQuery.data || [];
    
    // Only run if we have data
    if (liveFixtures.length === 0 && upcomingFixtures.length === 0) {
      return;
    }
    
    // Combine fixtures
    const allFixtures = [...liveFixtures, ...upcomingFixtures];
    
    // Filter by popular leagues first
    const popularFixtures = allFixtures.filter(fixture => 
      POPULAR_LEAGUES.includes(fixture.league.id)
    );
    
    // Default to popular fixtures if we have any
    let fixtures = popularFixtures.length > 0 ? popularFixtures : allFixtures;
    
    // Filter by country if selected
    if (selectedCountry && selectedCountry !== 'all' && countryLeagueMap) {
      const countryLeagueIds = countryLeagueMap[selectedCountry] || [];
      
      if (countryLeagueIds.length > 0) {
        const countryFixtures = fixtures.filter(fixture => 
          countryLeagueIds.includes(fixture.league.id)
        );
        
        if (countryFixtures.length > 0) {
          fixtures = countryFixtures;
        }
      }
    }
    
    // Sort fixtures (live first, then by date)
    fixtures.sort((a, b) => {
      if (isLiveMatch(a.fixture.status.short) && !isLiveMatch(b.fixture.status.short)) {
        return -1;
      }
      if (!isLiveMatch(a.fixture.status.short) && isLiveMatch(b.fixture.status.short)) {
        return 1;
      }
      return compareAsc(parseISO(a.fixture.date), parseISO(b.fixture.date));
    });
    
    setFilteredFixtures(fixtures);
    // Reset to first fixture when the list changes
    setCurrentFixtureIndex(0);
  }, [liveFixturesQuery.data, upcomingFixturesQuery.data, selectedCountry, countryLeagueMap]);
  
  // Handle navigation
  const previousFixture = () => {
    setCurrentFixtureIndex((prevIndex) => {
      if (prevIndex > 0) return prevIndex - 1;
      return filteredFixtures.length - 1; // Wrap to end
    });
  };
  
  const nextFixture = () => {
    setCurrentFixtureIndex((prevIndex) => {
      if (prevIndex < filteredFixtures.length - 1) return prevIndex + 1;
      return 0; // Wrap to beginning
    });
  };
  
  // Update countdown timer
  useEffect(() => {
    if (filteredFixtures.length === 0 || currentFixtureIndex >= filteredFixtures.length) {
      return;
    }
    
    const featured = filteredFixtures[currentFixtureIndex];
    
    // Only set up timer for upcoming matches
    if (isLiveMatch(featured.fixture.status.short) || featured.fixture.status.short === 'FT') {
      setCountdown('');
      return;
    }
    
    // Initial countdown
    setCountdown(getCountdownTimer(featured.fixture.date));
    
    // Update countdown every second
    const intervalId = setInterval(() => {
      setCountdown(getCountdownTimer(featured.fixture.date));
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [filteredFixtures, currentFixtureIndex]);
  
  // Loading state
  if (liveFixturesQuery.isLoading || upcomingFixturesQuery.isLoading) {
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
  
  // Get the featured match
  const featured = filteredFixtures[currentFixtureIndex];
  
  return (
    <div className="mx-2 my-4">
      {/* Status display - without navigation controls */}
      <div className="mb-2 text-center">
        {filteredFixtures.length > 0 ? (
          <div className="flex items-center justify-center gap-2">
            {isLiveMatch(featured.fixture.status.short) ? (
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                <span className="text-lg font-bold">LIVE MATCH</span>
              </div>
            ) : featured.fixture.status.short === 'FT' ? (
              <span className="text-lg font-bold">MATCH ENDED</span>
            ) : (
              <div className="flex items-center">
                {countdown && (
                  <div className="text-sm font-semibold text-blue-600">
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
    
      {/* Featured match card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 relative">
        {/* Featured Match badge */}
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-md z-30 font-semibold">
          FEATURED MATCH
        </div>
        
        {/* Tournament info */}
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
        
        {/* Match status */}
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
        
        {/* Teams with gradients */}
        <div className="flex rounded-md overflow-hidden relative h-16">
          <div className="absolute bottom-0 left-0 right-0 flex items-center" style={{ height: '40px' }}>
            {/* Previous match button */}
            <button 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 h-7 w-7 bg-white/70 hover:bg-white rounded-full shadow flex items-center justify-center"
              onClick={previousFixture}
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
            
            {/* Home team logo */}
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
            
            {/* Home team gradient - with rounded right edge */}
            <div className={`h-full w-1/2 ${getTeamGradient(featured.teams.home.name, 'to-r')} flex items-center rounded-r-lg`}>
              <div className="ml-20 text-white font-bold text-lg uppercase">{featured.teams.home.name}</div>
            </div>
            
            {/* VS label */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xl bg-black/70 rounded-full h-8 w-8 flex items-center justify-center z-20">
              VS
            </div>
            
            {/* Away team gradient - with rounded left edge */}
            <div className={`h-full w-1/2 ${getTeamGradient(featured.teams.away.name, 'to-l')} flex items-center justify-end rounded-l-lg`}>
              <div className="mr-20 text-white font-bold text-lg uppercase text-right">{featured.teams.away.name}</div>
            </div>
            
            {/* Away team logo */}
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
            
            {/* Next match button */}
            <button 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 h-7 w-7 bg-white/70 hover:bg-white rounded-full shadow flex items-center justify-center"
              onClick={nextFixture}
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
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
}

export default LiveScoreboardPage;