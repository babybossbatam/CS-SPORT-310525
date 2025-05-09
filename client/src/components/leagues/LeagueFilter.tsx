import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions } from '@/lib/store';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const POPULAR_LEAGUES = [
  { id: 3, name: 'Europa League', country: 'Europe' },
  { id: 2, name: 'Champions League', country: 'Europe' },
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
];

const LeagueFilter = () => {
  const dispatch = useDispatch();
  const selectedLeague = useSelector((state: RootState) => state.ui.selectedLeague);
  const [visibleStart, setVisibleStart] = useState(0);
  const visibleCount = 5; // Number of tabs visible at once
  
  // Fetch league data for logos
  const { data: leagueData, isLoading } = useQuery({
    queryKey: ['/api/leagues'],
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });
  
  // Get league logos from the API data
  const getLeagueLogo = (leagueId: number) => {
    if (!leagueData || isLoading || !Array.isArray(leagueData)) return null;
    
    const leagueArray = leagueData as Array<{league: {id: number, logo: string}}>;
    const league = leagueArray.find(l => l.league.id === leagueId);
    return league?.league?.logo || null;
  };
  
  // Handle league selection
  const handleLeagueChange = (leagueId: string) => {
    dispatch(uiActions.setSelectedLeague(parseInt(leagueId, 10)));
  };
  
  // Handle navigation between tabs
  const handlePrevious = () => {
    setVisibleStart(prev => Math.max(0, prev - 1));
  };
  
  const handleNext = () => {
    setVisibleStart(prev => Math.min(POPULAR_LEAGUES.length - visibleCount, prev + 1));
  };
  
  // Set default league if none selected
  useEffect(() => {
    if (!selectedLeague && POPULAR_LEAGUES.length > 0) {
      dispatch(uiActions.setSelectedLeague(POPULAR_LEAGUES[0].id));
    }
  }, [selectedLeague, dispatch]);
  
  // Get the abbreviated name for mobile displays
  const getAbbreviatedName = (name: string) => {
    switch(name) {
      case 'Champions League': return 'UCL';
      case 'Europa League': return 'UEL';
      case 'Premier League': return 'EPL';
      case 'La Liga': return 'LL';
      case 'Bundesliga': return 'BL';
      case 'Serie A': return 'SA';
      default: return name.substring(0, 3);
    }
  };
  
  // Visible leagues based on current navigation state
  const visibleLeagues = POPULAR_LEAGUES.slice(visibleStart, visibleStart + visibleCount);
  
  if (isLoading) {
    return (
      <div className="mt-1 mb-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }
  
  return (
    <div className="mt-1 mb-4">
      <Tabs 
        defaultValue={selectedLeague?.toString() || POPULAR_LEAGUES[0].id.toString()} 
        value={selectedLeague?.toString()}
        onValueChange={handleLeagueChange}
        className="w-full"
      >
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-4 w-4 p-0 mr-1" 
            onClick={handlePrevious}
            disabled={visibleStart === 0}
          >
            <ChevronLeft className="h-2.5 w-2.5" />
          </Button>
          
          <TabsList className="flex-1 grid grid-cols-5 h-4 max-w-[256px]">
            {visibleLeagues.map((league) => (
              <TabsTrigger 
                key={league.id} 
                value={league.id.toString()}
                className="px-0.5 py-0.5 text-[10px] flex items-center justify-center gap-0.5 min-h-0 max-w-[48px]"
              >
                {getLeagueLogo(league.id) ? (
                  <img 
                    src={getLeagueLogo(league.id) as string} 
                    alt={league.name} 
                    className="h-[14px] w-[14px] object-contain"
                  />
                ) : (
                  <Filter className="h-2.5 w-2.5" />
                )}
                <span className="truncate">
                  {getAbbreviatedName(league.name)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-4 w-4 p-0 ml-1" 
            onClick={handleNext}
            disabled={visibleStart >= POPULAR_LEAGUES.length - visibleCount}
          >
            <ChevronRight className="h-2.5 w-2.5" />
          </Button>
        </div>
      </Tabs>
    </div>
  );
};

export default LeagueFilter;