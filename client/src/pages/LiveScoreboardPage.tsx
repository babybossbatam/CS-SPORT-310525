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

// Popular football league IDs in the requested order: Europe, England, Spain, Italy, Brazil, Germany
const POPULAR_LEAGUES = [
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  39,  // Premier League (England)
  140, // La Liga (Spain)
  135, // Serie A (Italy)
  71,  // Serie A (Brazil)
  78,  // Bundesliga (Germany)
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
  
  // Top priority leagues that should always be shown first if available
  const topPriorityLeagues = [3, 135, 140]; // UEFA Europa League (3), Serie A (135), La Liga (140)
  
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
    
    // Filter by country if selected
    let fixtures = allFixtures;
    if (selectedCountry && selectedCountry !== 'all' && countryLeagueMap) {
      const countryLeagueIds = countryLeagueMap[selectedCountry] || [];
      
      if (countryLeagueIds.length > 0) {
        const countryFixtures = allFixtures.filter(fixture => 
          countryLeagueIds.includes(fixture.league.id)
        );
        
        if (countryFixtures.length > 0) {
          fixtures = countryFixtures;
        }
      }
    }
    
    // Sort fixtures with complex prioritization
    fixtures.sort((a, b) => {
      // First priority: Live matches
      const aIsLive = isLiveMatch(a.fixture.status.short);
      const bIsLive = isLiveMatch(b.fixture.status.short);
      
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // Second priority: Top priority leagues (Champions League, Europa League, Premier League)
      const aIsTopPriority = topPriorityLeagues.includes(a.league.id);
      const bIsTopPriority = topPriorityLeagues.includes(b.league.id);
      
      if (aIsTopPriority && !bIsTopPriority) return -1;
      if (!aIsTopPriority && bIsTopPriority) return 1;
      
      // If both are top priority, sort by the specific order within top priority leagues
      if (aIsTopPriority && bIsTopPriority) {
        return topPriorityLeagues.indexOf(a.league.id) - topPriorityLeagues.indexOf(b.league.id);
      }
      
      // Third priority: Other popular leagues
      const aIsPopular = POPULAR_LEAGUES.includes(a.league.id);
      const bIsPopular = POPULAR_LEAGUES.includes(b.league.id);
      
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      
      // If both are popular, sort by the specific order in POPULAR_LEAGUES
      if (aIsPopular && bIsPopular) {
        return POPULAR_LEAGUES.indexOf(a.league.id) - POPULAR_LEAGUES.indexOf(b.league.id);
      }
      
      // Final sorting: By match time
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
        
        {/* Tournament info with match timer at the top */}
        <div className="bg-gray-50 relative">
          {/* Match status at top */}
          <div className="text-sm text-center py-2 border-b border-gray-100">
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
          
          {/* League info below timer */}
          <div className="text-center p-2 flex justify-center items-center gap-2">
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
        </div>
        
        {/* Tomorrow label */}
        <div className="text-center my-2">
          <h2 className="text-2xl font-bold">Tomorrow</h2>
        </div>
        
        {/* Teams with match bar - design similar to reference image */}
        <div className="relative mb-3">
          {/* Previous match button */}
          <button 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-30 h-10 w-10 bg-white/70 hover:bg-white rounded-full shadow flex items-center justify-center"
            onClick={previousFixture}
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          
          {/* Match bar with team info */}
          <div className="flex items-center justify-between mx-12">
            {/* Home team logo */}
            <div className="relative z-10 -mr-4">
              <div className="relative">
                {/* Smaller shadow (50% of original size) */}
                <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[3px] transform translate-y-0.5"></div>
                <img 
                  src={featured.teams.home.logo} 
                  alt={featured.teams.home.name}
                  className="h-20 w-20 transform transition-transform duration-300 hover:scale-110 relative z-10 drop-shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
                  }}
                />
              </div>
            </div>
            
            {/* Match bar with two-color dynamic gradient */}
            <div className="flex-1 h-12 rounded-md shadow-md overflow-hidden -mx-5"> {/* Extended 5px on each side */}
              {/* Two-color bar with dynamically determined colors */}
              <div className="flex h-full">
                {/* Single continuous gradient bar with home and away team colors */}
                <div className="flex h-full w-full relative overflow-hidden">
                  {/* Home team gradient section with 45-degree slice */}
                  <div className={`w-[52%] ${getTeamGradient(featured.teams.home.name, 'to-r')} relative`}>
                    {/* Angled edge for home team */}
                    <div className="absolute top-0 right-0 h-full w-8 transform skew-x-[20deg] translate-x-4" 
                      style={{backgroundColor: 'inherit'}}></div>
                    
                    <div className="pl-16 h-full flex items-center z-10 relative"> {/* Increased padding to account for bar extension */}
                      <span className="text-white font-bold text-lg uppercase truncate">{featured.teams.home.name}</span>
                    </div>
                  </div>
                  
                  {/* VS text positioned absolutely in the center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <span className="text-white text-sm font-bold drop-shadow-md">VS</span>
                  </div>
                  
                  {/* Away team gradient section with 45-degree slice */}
                  <div className={`w-[52%] ${getTeamGradient(featured.teams.away.name, 'to-l')} relative -ml-4`}>
                    {/* Angled edge for away team */}
                    <div className="absolute top-0 left-0 h-full w-8 transform skew-x-[20deg] -translate-x-4" 
                      style={{backgroundColor: 'inherit'}}></div>
                    
                    <div className="pr-16 h-full flex items-center justify-end z-10 relative"> {/* Increased padding to account for bar extension */}
                      <span className="text-white font-bold text-lg uppercase truncate">{featured.teams.away.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Away team logo */}
            <div className="relative z-10 -ml-4">
              <div className="relative">
                {/* Smaller shadow (50% of original size) */}
                <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[3px] transform translate-y-0.5"></div>
                <img 
                  src={featured.teams.away.logo} 
                  alt={featured.teams.away.name}
                  className="h-20 w-20 transform transition-transform duration-300 hover:scale-110 relative z-10 drop-shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Next match button */}
          <button 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-30 h-10 w-10 bg-white/70 hover:bg-white rounded-full shadow flex items-center justify-center"
            onClick={nextFixture}
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        
        {/* Match details footer */}
        <div className="text-center text-sm pb-3">
          <div className="text-sm text-gray-700">
            {formatMatchDateFn(featured.fixture.date)} | {featured.fixture.venue.name || 'TBD'}
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