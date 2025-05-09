import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions } from '@/lib/store';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const POPULAR_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 2, name: 'Champions League', country: 'Europe' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
];

const LeagueFilter = () => {
  const dispatch = useDispatch();
  const selectedLeague = useSelector((state: RootState) => state.ui.selectedLeague);
  
  // Fetch league data for logos
  const { data: leagueData, isLoading } = useQuery({
    queryKey: ['/api/leagues'],
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });
  
  // Get league logos from the API data
  const getLeagueLogo = (leagueId: number) => {
    if (!leagueData || isLoading || !Array.isArray(leagueData)) return null;
    
    const league = leagueData.find((l: any) => l.league.id === leagueId);
    return league?.league?.logo || null;
  };
  
  // Handle league selection
  const handleLeagueChange = (leagueId: string) => {
    dispatch(uiActions.setSelectedLeague(parseInt(leagueId, 10)));
  };
  
  // Set default league if none selected
  useEffect(() => {
    if (!selectedLeague && POPULAR_LEAGUES.length > 0) {
      dispatch(uiActions.setSelectedLeague(POPULAR_LEAGUES[0].id));
    }
  }, [selectedLeague, dispatch]);
  
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
        <TabsList className="grid grid-cols-5 h-9">
          {POPULAR_LEAGUES.map((league) => (
            <TabsTrigger 
              key={league.id} 
              value={league.id.toString()}
              className="px-2 py-1 text-xs flex items-center justify-center gap-1"
            >
              {getLeagueLogo(league.id) ? (
                <img 
                  src={getLeagueLogo(league.id) as string} 
                  alt={league.name} 
                  className="h-4 w-4 object-contain"
                />
              ) : (
                <Filter className="h-3 w-3" />
              )}
              <span className="hidden sm:inline truncate">{league.name}</span>
              <span className="inline sm:hidden truncate">
                {league.name === 'Premier League' ? 'EPL' : 
                 league.name === 'Champions League' ? 'UCL' :
                 league.name === 'Serie A' ? 'SA' :
                 league.name === 'La Liga' ? 'LL' : 'BL'}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default LeagueFilter;