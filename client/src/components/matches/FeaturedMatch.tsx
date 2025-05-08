import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { format, parseISO, compareAsc } from 'date-fns';
import { ChevronLeft, ChevronRight, Trophy, Timer, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMatchDateFn, formatExactDateTime, getCountdownTimer, isLiveMatch } from '@/lib/utils';
import { getTeamColor } from '@/lib/colorExtractor';

// Define types locally
interface FixtureResponse {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country?: string;
    round?: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner?: boolean;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner?: boolean;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
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

const FeaturedMatch: React.FC = () => {
  const [, navigate] = useLocation();
  const [filteredFixtures, setFilteredFixtures] = useState<FixtureResponse[]>([]);
  const [currentFixtureIndex, setCurrentFixtureIndex] = useState(0);
  const [countdown, setCountdown] = useState('');
  
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
    
    // Define top teams for popular leagues (id: team names array)
    const topTeamsByLeague: Record<number, string[]> = {
      // UEFA Champions League (2)
      2: ['Manchester City', 'Real Madrid', 'Bayern Munich'],
      // UEFA Europa League (3)
      3: ['Bayer Leverkusen', 'Atalanta', 'AS Roma'],
      // Premier League (39)
      39: ['Manchester City', 'Arsenal', 'Liverpool'],
      // La Liga (140)
      140: ['Real Madrid', 'FC Barcelona', 'Girona'],
      // Serie A Italy (135)
      135: ['Inter', 'AC Milan', 'Juventus'],
      // Serie A Brazil (71)
      71: ['Palmeiras', 'Botafogo', 'Flamengo'],
      // Bundesliga (78)
      78: ['Bayer Leverkusen', 'Bayern Munich', 'RB Leipzig'],
    };
    
    // Filter fixtures to only include top teams from popular leagues
    const topTeamFixtures = allFixtures.filter(fixture => {
      const leagueId = fixture.league.id;
      const homeTeam = fixture.teams.home.name;
      const awayTeam = fixture.teams.away.name;
      
      // If we have top team data for this league
      if (topTeamsByLeague[leagueId]) {
        const topTeams = topTeamsByLeague[leagueId];
        // Check if either home or away team is in the top teams list
        return topTeams.some(team => 
          homeTeam.includes(team) || awayTeam.includes(team)
        );
      }
      
      // For other leagues we don't have data for, keep all fixtures
      return true;
    });
    
    // Use top team fixtures if we have any, otherwise fall back to regular fixtures
    let fixtures = topTeamFixtures.length > 0 ? topTeamFixtures : allFixtures;
    
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
    
    // Compare stringified arrays to check for actual changes
    const currentFixturesStr = JSON.stringify(fixtures.map(f => f.fixture.id));
    const prevFixturesStr = JSON.stringify(filteredFixtures.map(f => f.fixture.id));
    
    // Only update if the fixtures have actually changed
    if (currentFixturesStr !== prevFixturesStr) {
      setFilteredFixtures(fixtures);
      setCurrentFixtureIndex(0);
    }
  }, [liveFixturesQuery.data, upcomingFixturesQuery.data, filteredFixtures]);
  
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
  
  // Memoize current featured fixture to prevent unnecessary re-renders
  const featuredFixture = filteredFixtures[currentFixtureIndex];
  
  // Update countdown timer
  useEffect(() => {
    // Exit early if we don't have valid fixtures or index
    if (!featuredFixture) {
      return;
    }
    
    // Only set up timer for upcoming matches
    if (isLiveMatch(featuredFixture.fixture.status.short) || featuredFixture.fixture.status.short === 'FT') {
      setCountdown('');
      return;
    }
    
    // Calculate countdown outside of state change to prevent multiple renders
    const updateCountdown = () => {
      const time = getCountdownTimer(featuredFixture.fixture.date);
      setCountdown(time);
    };
    
    // Initial countdown
    updateCountdown();
    
    // Update countdown every second
    const intervalId = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(intervalId);
  }, [featuredFixture]); // Depend on the memoized fixture itself
  
  // Loading state
  if (liveFixturesQuery.isLoading || upcomingFixturesQuery.isLoading) {
    return (
      <Card className="m-4">
        <div className="bg-gray-700 text-white p-3">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            <span className="font-semibold">Loading Matches...</span>
          </div>
        </div>
        <div className="p-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }
  
  // No matches state
  if (filteredFixtures.length === 0) {
    return (
      <Card className="m-4">
        <div className="bg-gray-700 text-white p-3">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            <span className="font-semibold">Featured Matches</span>
          </div>
        </div>
        <div className="p-4 text-center">
          <p>No matches available right now.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="mb-4">
      {/* Featured match card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 relative">
        {/* Featured Match badge */}
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-md z-30 font-semibold">
          FEATURED MATCH
        </div>
        
        {/* League info */}
        <div className="bg-gray-50 p-2 border-b border-gray-100 flex items-center justify-center space-x-2">
          <img 
            src={featuredFixture.league.logo}
            alt={featuredFixture.league.name}
            className="w-5 h-5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16?text=L';
            }}
          />
          <span className="text-sm font-medium">{featuredFixture.league.name} - {featuredFixture.league.round}</span>
        </div>
        
        {/* Match status at top */}
        <div className="text-sm text-center py-2 border-b border-gray-100">
          {isLiveMatch(featuredFixture.fixture.status.short) ? (
            <div className="flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <div className="text-base font-bold">LIVE • {featuredFixture.fixture.status.elapsed}′</div>
            </div>
          ) : featuredFixture.fixture.status.short === 'FT' ? (
            <div className="text-base font-bold">MATCH ENDED</div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center mb-1">
                <Timer className="h-4 w-4 mr-2 text-blue-600" />
                <div className="text-base font-bold">{formatExactDateTime(featuredFixture.fixture.date)}</div>
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
        
        {/* Teams with match bar */}
        <div className="relative my-4">
          {/* Previous match button */}
          <button 
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-30 h-10 w-10 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
            onClick={previousFixture}
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          
          {/* Match bar with team info */}
          <div className="flex items-center justify-between mx-12">
            {/* Home team logo */}
            <div className="relative z-10 mr-3">
              <div className="relative">
                {/* Shadow effect */}
                <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[3px] transform translate-y-0.5"></div>
                <img 
                  src={featuredFixture.teams.home.logo} 
                  alt={featuredFixture.teams.home.name}
                  className="h-16 w-16 transform transition-transform duration-300 hover:scale-110 relative z-10 drop-shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
                  }}
                />
              </div>
            </div>
            
            {/* Match bar with dynamic team colors */}
            <div className="flex-1 h-12 rounded-md shadow-md overflow-hidden">
              <div className="flex h-full">
                {/* Home team color bar */}
                <div
                  className="w-1/2 flex items-center justify-start pl-3 h-full"
                  style={{
                    backgroundColor: getTeamColor(featuredFixture.teams.home.logo) || '#3B82F6'
                  }}
                >
                  <span className="font-medium text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                    {featuredFixture.teams.home.name}
                  </span>
                </div>
                
                {/* Away team color bar */}
                <div
                  className="w-1/2 flex items-center justify-end pr-3 h-full"
                  style={{
                    backgroundColor: getTeamColor(featuredFixture.teams.away.logo) || '#EF4444'
                  }}
                >
                  <span className="font-medium text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] text-right">
                    {featuredFixture.teams.away.name}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Away team logo */}
            <div className="relative z-10 ml-3">
              <div className="relative">
                {/* Shadow effect */}
                <div className="absolute inset-0 scale-75 origin-center bg-black/20 rounded-full filter blur-[3px] transform translate-y-0.5"></div>
                <img 
                  src={featuredFixture.teams.away.logo} 
                  alt={featuredFixture.teams.away.name}
                  className="h-16 w-16 transform transition-transform duration-300 hover:scale-110 relative z-10 drop-shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
                  }}
                />
              </div>
            </div>
            
            {/* Next match button */}
            <button 
              className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-30 h-10 w-10 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              onClick={nextFixture}
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
        
        {/* Score display */}
        <div className="flex justify-center items-center mb-5 mt-4">
          <div className="text-4xl font-extrabold tracking-tighter">
            {isLiveMatch(featuredFixture.fixture.status.short) || featuredFixture.fixture.status.short === 'FT' ? (
              <>
                <span className={featuredFixture.teams.home.winner ? 'text-green-600' : ''}>{featuredFixture.goals.home ?? 0}</span>
                <span className="text-gray-400 mx-3">-</span>
                <span className={featuredFixture.teams.away.winner ? 'text-green-600' : ''}>{featuredFixture.goals.away ?? 0}</span>
              </>
            ) : (
              <>
                <span className="text-gray-300">0</span>
                <span className="text-gray-200 mx-3">-</span>
                <span className="text-gray-300">0</span>
              </>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-center pb-4 gap-4">
          <button 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-md text-sm font-medium"
            onClick={() => navigate(`/match/${featuredFixture.fixture.id}`)}
          >
            Match Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedMatch;