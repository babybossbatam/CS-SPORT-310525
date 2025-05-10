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
  Trophy,
} from 'lucide-react';
import EuropaLeagueSchedule from '@/components/leagues/EuropaLeagueSchedule';
import PremierLeagueSchedule from '@/components/leagues/PremierLeagueSchedule';
import SerieASchedule from '@/components/leagues/SerieASchedule';
import ChampionsLeagueSchedule from '@/components/leagues/ChampionsLeagueSchedule';
import UpcomingMatchesScoreboard from '@/components/matches/UpcomingMatchesScoreboard';
import { format, parseISO, compareAsc } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  formatMatchDateFn, 
  formatExactDateTime,
  getCountdownTimer,
  isLiveMatch
} from '@/lib/utils';
import {
  getTeamGradient, 
  getOpposingTeamColor,
  getTeamColor
} from '@/lib/colorUtils';

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

// Popular leagues for prioritization in the scoreboard
const POPULAR_LEAGUES = [
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  39,  // Premier League (England)
  135, // Serie A (Italy)
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
  const topPriorityLeagues = [2, 3, 39, 135]; // UEFA Champions League (2), Europa League (3), Premier League (39), Serie A (135)
  
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
    };
    
    // Filter fixtures to only include top teams from popular leagues
    const topTeamFixtures = fixtures.filter(fixture => {
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
    fixtures = topTeamFixtures.length > 0 ? topTeamFixtures : fixtures;
    
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
      try {
        if (!featuredFixture.fixture.date) {
          setCountdown('TBD');
          return;
        }
        
        // Use timestamp if available, otherwise use date string
        const dateValue = featuredFixture.fixture.timestamp 
          ? new Date(featuredFixture.fixture.timestamp * 1000) 
          : featuredFixture.fixture.date;
          
        const time = getCountdownTimer(dateValue);
        setCountdown(time);
      } catch (error) {
        console.error('Error updating countdown:', error);
        setCountdown('TBD');
      }
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
  
  // We already have featuredFixture defined above, no need to redefine it
  
  return (
    <div className="container mx-auto my-4 px-2">
      <div className="grid grid-cols-1 gap-4">
        {/* Main column - Upcoming Matches Scoreboard */}
        <div className="space-y-4">
          {/* New component for the upcoming matches scoreboard */}
          <UpcomingMatchesScoreboard />
          
          {/* Featured match card removed - now using the FeaturedMatch component in Home.tsx */}
        </div>
        
        {/* League schedules moved to Home.tsx below Today's Matches */}
      </div>
    </div>
  );
}

export default LiveScoreboardPage;