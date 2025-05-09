import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, fixturesActions } from '@/lib/store';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getMatchStatusText } from '@/lib/utils';
import { FixtureResponse } from '../../../../server/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Include Champions League, Europa League, Serie A, and Premier League
const POPULAR_LEAGUES = [
  2,   // UEFA Champions League (Europe)
  3,   // UEFA Europa League (Europe)
  135, // Serie A (Italy)
  39,  // Premier League (England)
];

const TodayMatches = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('live');
  
  const fixtures = useSelector((state: RootState) => state.fixtures);
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const todayFixtures = fixtures.byDate[currentDate] || [];
  
  useEffect(() => {
    const fetchTodaysFixtures = async () => {
      // If we already have fixtures for today, don't fetch again
      if (todayFixtures.length > 0) return;
      
      setIsLoading(true);
      
      try {
        const response = await apiRequest('GET', `/api/fixtures/date/${currentDate}`);
        const data = await response.json();
        
        if (data) {
          // Store the fixtures in Redux
          dispatch(fixturesActions.setFixturesByDate({ 
            date: currentDate,
            fixtures: data
          }));
        }
      } catch (error) {
        console.error('Error fetching today\'s fixtures:', error);
        toast({
          title: 'Error',
          description: 'Failed to load today\'s matches',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTodaysFixtures();
  }, [currentDate, dispatch, toast, todayFixtures.length]);
  
  // Define top teams for popular leagues (id: team names array)
  const topTeamsByLeague: Record<number, string[]> = {
    // UEFA Champions League (2)
    2: ['Manchester City', 'Real Madrid', 'Bayern Munich'],
    // UEFA Europa League (3)
    3: ['Manchester United', 'Arsenal', 'Sevilla'],
    // Premier League (39)
    39: ['Manchester City', 'Arsenal', 'Liverpool'],
    // Serie A Italy (135)
    135: ['Inter', 'AC Milan', 'Juventus'],
  };
  
  // Helper to check if a team is popular
  const isPopularTeam = (fixture: FixtureResponse): boolean => {
    const leagueId = fixture.league.id;
    const homeTeam = fixture.teams.home.name;
    const awayTeam = fixture.teams.away.name;
    
    if (topTeamsByLeague[leagueId]) {
      const topTeams = topTeamsByLeague[leagueId];
      return topTeams.some(team => 
        homeTeam.includes(team) || awayTeam.includes(team)
      );
    }
    
    return false;
  };
  
  // Filter fixtures by league and prioritize by timestamp first, then popular teams
  const filterAndPrioritizeFixtures = (fixtures: FixtureResponse[]): FixtureResponse[] => {
    // Step 1: Filter to only include our priority leagues
    const leagueFixtures = fixtures.filter(f => POPULAR_LEAGUES.includes(f.league.id));
    
    if (leagueFixtures.length === 0) return fixtures; // Fallback to all fixtures if none in our leagues
    
    // Step 2: Sort primarily by timestamp, then consider popular teams and league priority
    return leagueFixtures.sort((a, b) => {
      // First sort by timestamp for nearest matches
      if (a.fixture.timestamp !== b.fixture.timestamp) {
        return a.fixture.timestamp - b.fixture.timestamp;
      }
      
      // If timestamps are the same, then prioritize popular team matches
      const aIsPopular = isPopularTeam(a);
      const bIsPopular = isPopularTeam(b);
      
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
      
      // Finally prioritize by league (using the order in POPULAR_LEAGUES)
      const aLeagueIndex = POPULAR_LEAGUES.indexOf(a.league.id);
      const bLeagueIndex = POPULAR_LEAGUES.indexOf(b.league.id);
      
      return aLeagueIndex - bLeagueIndex;
    });
  };
  
  // Get fixtures by category for tabs
  const getLiveFixtures = (): FixtureResponse[] => {
    const liveMatches = todayFixtures.filter(f => 
      f.fixture.status.short === 'LIVE' || 
      f.fixture.status.short === '1H' || 
      f.fixture.status.short === '2H' || 
      f.fixture.status.short === 'HT'
    );
    
    return filterAndPrioritizeFixtures(liveMatches);
  };
  
  const getUpcomingFixtures = (): FixtureResponse[] => {
    const upcomingMatches = todayFixtures.filter(f => 
      f.fixture.status.short === 'NS'
    );
    
    return filterAndPrioritizeFixtures(upcomingMatches);
  };
  
  // Format time from timestamp (HH:MM format)
  const formatMatchTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Get aggregate score from fixture if available
  const getAggregateScore = (fixture: FixtureResponse): string | null => {
    // This would normally come from the API, for now return sample data for the UI
    const leagueId = fixture.league.id;
    
    // Return aggregate only for Europa League fixtures as an example
    if (leagueId === 3) {
      return "Aggregate 3 - 0";
    }
    
    return null;
  };
  
  const liveFixtures = getLiveFixtures();
  const upcomingFixtures = getUpcomingFixtures();
  
  if (isLoading) {
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
  
  return (
    <div>
      {/* Navigation tabs */}
      <div className="flex justify-between items-center border-b border-gray-200">
        <div className="relative w-full">
          <div className="absolute left-0 top-0 bg-neutral-700 text-white text-xs px-2 py-1 rounded-sm">
            Live
          </div>
          <div className="absolute right-0 top-0 text-xs px-2 py-1 rounded-sm flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>By time</span>
          </div>
          <div className="h-6"></div> {/* Spacer for absolute elements */}
        </div>
      </div>
      
      {/* Main content */}
      <div className="space-y-1 mt-2">
        {upcomingFixtures.length === 0 && liveFixtures.length === 0 && (
          <div className="text-center p-3 text-gray-500">
            No matches scheduled for today.
          </div>
        )}
        
        {/* Display upcoming fixtures */}
        {upcomingFixtures.map((fixture) => (
          <div 
            key={fixture.fixture.id}
            className="flex flex-col px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
            onClick={() => navigate(`/match/${fixture.fixture.id}`)}
          >
            <div className="flex items-center justify-between mb-1">
              <img 
                src={fixture.teams.home.logo} 
                alt={fixture.teams.home.name} 
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                }}
              />
              <div className="text-center text-sm font-semibold">
                {formatMatchTime(fixture.fixture.timestamp)}
              </div>
              <img 
                src={fixture.teams.away.logo} 
                alt={fixture.teams.away.name} 
                className="w-6 h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm w-[40%] text-left truncate">{fixture.teams.home.name}</span>
              <div className="text-xs text-gray-500 text-center">
                {fixture.league.name}
              </div>
              <span className="text-sm w-[40%] text-right truncate">{fixture.teams.away.name}</span>
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