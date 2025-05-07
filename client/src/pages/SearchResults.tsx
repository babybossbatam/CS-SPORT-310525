import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, leaguesActions, fixturesActions } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';
import TournamentHeader from '@/components/layout/TournamentHeader';
import { Search, X, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';

const SearchResults = () => {
  const [location, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  
  // Parse query from URL
  const params = new URLSearchParams(location.split('?')[1]);
  const initialQuery = params.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('matches');
  const [isSearching, setIsSearching] = useState(false);
  
  const leagues = useSelector((state: RootState) => state.leagues.list);
  const fixtures = useSelector((state: RootState) => Object.values(state.fixtures.byLeague).flat());
  
  // Data for search results
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [leagueResults, setLeagueResults] = useState<any[]>([]);
  const [teamResults, setTeamResults] = useState<any[]>([]);
  
  // Perform search when component mounts or query changes
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);
  
  // Search function
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Search in leagues
      const filteredLeagues = leagues.filter(league => 
        league.league.name.toLowerCase().includes(query.toLowerCase()) ||
        league.country.name.toLowerCase().includes(query.toLowerCase())
      );
      setLeagueResults(filteredLeagues);
      
      // Search in fixtures (teams and match details)
      const filteredMatches = fixtures.filter(fixture => 
        fixture.teams.home.name.toLowerCase().includes(query.toLowerCase()) ||
        fixture.teams.away.name.toLowerCase().includes(query.toLowerCase()) ||
        fixture.league.name.toLowerCase().includes(query.toLowerCase())
      );
      setMatchResults(filteredMatches);
      
      // Extract teams from fixtures
      const teamsMap = new Map();
      fixtures.forEach(fixture => {
        const homeTeam = fixture.teams.home;
        const awayTeam = fixture.teams.away;
        
        if (homeTeam.name.toLowerCase().includes(query.toLowerCase())) {
          teamsMap.set(homeTeam.id, homeTeam);
        }
        
        if (awayTeam.name.toLowerCase().includes(query.toLowerCase())) {
          teamsMap.set(awayTeam.id, awayTeam);
        }
      });
      
      setTeamResults(Array.from(teamsMap.values()));
      
      // If no local results, try fetching more data
      if (filteredLeagues.length === 0 && filteredMatches.length === 0 && teamsMap.size === 0) {
        // In a real app, we would make API calls to search for more data
        toast({
          title: 'Limited Search Results',
          description: 'Only searching in already loaded data. In a full app, we would search the API for more results.',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to perform search. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    // Update URL with search query
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    
    performSearch(searchQuery);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setMatchResults([]);
    setLeagueResults([]);
    setTeamResults([]);
    navigate('/search');
  };
  
  return (
    <>
      <Header />
      <SportsCategoryTabs />
      <TournamentHeader title="Search Results" icon={<Search className="h-4 w-4 text-neutral-600" />} />
      
      <div className="container mx-auto px-4 py-4">
        <Card className="mb-6">
          <CardHeader className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center" 
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            <h2 className="text-lg font-semibold">Search</h2>
            <div className="w-10"></div> {/* Spacer for layout balance */}
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search for teams, leagues, players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </form>
            
            {initialQuery && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  {isSearching 
                    ? 'Searching...' 
                    : `Search results for "${initialQuery}"`
                  }
                </p>
              </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="matches">
                  Matches {matchResults.length > 0 && `(${matchResults.length})`}
                </TabsTrigger>
                <TabsTrigger value="teams">
                  Teams {teamResults.length > 0 && `(${teamResults.length})`}
                </TabsTrigger>
                <TabsTrigger value="leagues">
                  Leagues {leagueResults.length > 0 && `(${leagueResults.length})`}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="matches" className="mt-2">
                <Card>
                  <CardContent className="p-4">
                    {isSearching ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="p-3 border-b border-neutral-200">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 w-5/12">
                              <div className="text-right w-full">
                                <Skeleton className="h-4 w-24 ml-auto" />
                              </div>
                              <Skeleton className="h-8 w-8 rounded" />
                            </div>
                            <Skeleton className="h-4 w-10" />
                            <div className="flex items-center space-x-3 w-5/12">
                              <Skeleton className="h-8 w-8 rounded" />
                              <div className="w-full">
                                <Skeleton className="h-4 w-24" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : matchResults.length > 0 ? (
                      matchResults.map((fixture) => (
                        <div 
                          key={fixture.fixture.id} 
                          className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/match/${fixture.fixture.id}`)}
                        >
                          <div className="flex items-center text-sm mb-1">
                            <span className="text-xs text-neutral-500 mr-2">
                              {formatDateTime(fixture.fixture.date)}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {fixture.league.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 w-5/12">
                              <div className="text-right w-full">
                                <span className="font-medium">{fixture.teams.home.name}</span>
                              </div>
                              <img 
                                src={fixture.teams.home.logo} 
                                alt={fixture.teams.home.name} 
                                className="h-8 w-8"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-center w-2/12">
                              <span className="font-bold text-lg">
                                {fixture.goals.home !== null ? fixture.goals.home : '-'} - {fixture.goals.away !== null ? fixture.goals.away : '-'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 w-5/12">
                              <img 
                                src={fixture.teams.away.logo} 
                                alt={fixture.teams.away.name} 
                                className="h-8 w-8"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
                                }}
                              />
                              <div className="w-full">
                                <span className="font-medium">{fixture.teams.away.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : initialQuery ? (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">No Matches Found</h3>
                        <p className="text-sm text-gray-500">
                          No matches found for "{initialQuery}". Try a different search term.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">Search for Matches</h3>
                        <p className="text-sm text-gray-500">
                          Enter a search term to find matches by team name or league.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="teams" className="mt-2">
                <Card>
                  <CardContent className="p-4">
                    {isSearching ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="p-3 border-b border-neutral-200">
                          <div className="flex items-center">
                            <Skeleton className="h-10 w-10 rounded mr-3" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : teamResults.length > 0 ? (
                      teamResults.map((team) => (
                        <div 
                          key={team.id}
                          className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
                          // In a real app, we would navigate to a team details page
                          onClick={() => toast({
                            title: 'Team Details',
                            description: `View all matches for ${team.name}`
                          })}
                        >
                          <div className="flex items-center">
                            <img 
                              src={team.logo} 
                              alt={team.name} 
                              className="h-10 w-10 mr-3"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Team';
                              }}
                            />
                            <div>
                              <h3 className="font-medium">{team.name}</h3>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : initialQuery ? (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">No Teams Found</h3>
                        <p className="text-sm text-gray-500">
                          No teams found for "{initialQuery}". Try a different search term.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">Search for Teams</h3>
                        <p className="text-sm text-gray-500">
                          Enter a search term to find teams.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="leagues" className="mt-2">
                <Card>
                  <CardContent className="p-4">
                    {isSearching ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="p-3 border-b border-neutral-200">
                          <div className="flex items-center">
                            <Skeleton className="h-10 w-10 rounded mr-3" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : leagueResults.length > 0 ? (
                      leagueResults.map((league) => (
                        <div 
                          key={league.league.id}
                          className="p-3 border-b border-neutral-200 cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/league/${league.league.id}`)}
                        >
                          <div className="flex items-center">
                            <img 
                              src={league.league.logo} 
                              alt={league.league.name} 
                              className="h-10 w-10 mr-3"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=League';
                              }}
                            />
                            <div>
                              <h3 className="font-medium">{league.league.name}</h3>
                              <p className="text-xs text-gray-500">{league.country.name}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : initialQuery ? (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">No Leagues Found</h3>
                        <p className="text-sm text-gray-500">
                          No leagues found for "{initialQuery}". Try a different search term.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-lg font-medium text-gray-700">Search for Leagues</h3>
                        <p className="text-sm text-gray-500">
                          Enter a search term to find leagues.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SearchResults;
