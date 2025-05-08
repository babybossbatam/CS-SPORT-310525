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
  
  // Get fixtures by category for tabs
  const getLiveFixtures = (): FixtureResponse[] => {
    return todayFixtures.filter(f => 
      f.fixture.status.short === 'LIVE' || 
      f.fixture.status.short === '1H' || 
      f.fixture.status.short === '2H' || 
      f.fixture.status.short === 'HT'
    );
  };
  
  const getUpcomingFixtures = (): FixtureResponse[] => {
    return todayFixtures.filter(f => 
      f.fixture.status.short === 'NS'
    ).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
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
        {activeTab === 'live' && liveFixtures.length === 0 && upcomingFixtures.length === 0 && (
          <div className="text-center p-3 text-gray-500">
            No matches scheduled for today.
          </div>
        )}
        
        {/* Sample fixtures from reference image */}
        <div 
          className="flex flex-col px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
          onClick={() => navigate(`/match/123456`)}
        >
          <div className="flex items-center justify-between mb-1">
            <img 
              src="https://media.api-sports.io/football/teams/33.png" 
              alt="Manchester United" 
              className="w-6 h-6"
            />
            <div className="text-center text-sm font-semibold">
              03:00
            </div>
            <img 
              src="https://media.api-sports.io/football/teams/531.png" 
              alt="Athletic Club" 
              className="w-6 h-6"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm w-[40%] text-left truncate">Man Utd</span>
            <div className="text-xs text-gray-500 text-center">
              Aggregate 3 - 0
            </div>
            <span className="text-sm w-[40%] text-right truncate">Athletic</span>
          </div>
        </div>
        
        <div 
          className="flex flex-col px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
          onClick={() => navigate(`/match/123457`)}
        >
          <div className="flex items-center justify-between mb-1">
            <img 
              src="https://media.api-sports.io/football/teams/165.png" 
              alt="Borussia Dortmund" 
              className="w-6 h-6"
            />
            <div className="text-center text-sm font-semibold">
              03:00
            </div>
            <img 
              src="https://media.api-sports.io/football/teams/47.png" 
              alt="Tottenham" 
              className="w-6 h-6"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm w-[40%] text-left truncate">Bodo Glmt</span>
            <div className="text-xs text-gray-500 text-center">
              Aggregate 1 - 0
            </div>
            <span className="text-sm w-[40%] text-right truncate">Tottenham</span>
          </div>
        </div>
        
        <div className="mt-2 text-center">
          <a 
            href="#" 
            className="text-xs text-blue-600 hover:underline block py-2"
            onClick={(e) => {
              e.preventDefault();
              navigate('/leagues/3');
            }}
          >
            UEFA Europa League Bracket &gt;
          </a>
        </div>
      </div>
    </div>
  );
};

export default TodayMatches;