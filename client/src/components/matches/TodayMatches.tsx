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

const TodayMatches = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  // Get the 4 most interesting fixtures to display
  const getDisplayFixtures = (): FixtureResponse[] => {
    // First prioritize live matches
    const liveMatches = todayFixtures.filter(f => 
      f.fixture.status.short === 'LIVE' || 
      f.fixture.status.short === '1H' || 
      f.fixture.status.short === '2H' || 
      f.fixture.status.short === 'HT'
    );
    
    // Then add upcoming matches
    const upcomingMatches = todayFixtures.filter(f => 
      f.fixture.status.short === 'NS'
    ).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
    
    // If we don't have enough, add finished matches
    const finishedMatches = todayFixtures.filter(f => 
      f.fixture.status.short === 'FT'
    );
    
    return [...liveMatches, ...upcomingMatches, ...finishedMatches].slice(0, 4);
  };
  
  const displayFixtures = getDisplayFixtures();
  
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
  
  if (!isLoading && displayFixtures.length === 0) {
    return (
      <div className="text-center p-3 text-gray-500">
        No matches scheduled for today.
      </div>
    );
  }
  
  return (
    <div className="space-y-0.5">
      {displayFixtures.map((fixture) => (
        <div 
          key={fixture.fixture.id}
          className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
          onClick={() => navigate(`/match/${fixture.fixture.id}`)}
        >
          <div className="flex items-center w-[40%]">
            <img 
              src={fixture.teams.home.logo} 
              alt={fixture.teams.home.name} 
              className="w-5 h-5 mr-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
              }}
            />
            <span className="text-sm truncate">{fixture.teams.home.name}</span>
          </div>
          
          <div className="text-center text-sm font-semibold min-w-[60px]">
            {fixture.goals.home !== null && fixture.goals.away !== null 
              ? `${fixture.goals.home} - ${fixture.goals.away}`
              : getMatchStatusText(fixture.fixture.status.short, fixture.fixture.status.elapsed)
            }
          </div>
          
          <div className="flex items-center justify-end w-[40%]">
            <span className="text-sm truncate">{fixture.teams.away.name}</span>
            <img 
              src={fixture.teams.away.logo} 
              alt={fixture.teams.away.name} 
              className="w-5 h-5 ml-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TodayMatches;