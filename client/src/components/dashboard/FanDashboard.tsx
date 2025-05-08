import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { queryClient } from '@/lib/queryClient';
import {
  Heart,
  Plus,
  X,
  Trophy,
  Calendar,
  Star,
  BarChart3,
  Clock,
  Search
} from 'lucide-react';

interface Team {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface UserPreferences {
  id: number;
  userId: number;
  favoriteTeams: number[]; 
  favoriteLeagues: number[];
  notifications: boolean;
  theme: string;
  updatedAt: string;
}

interface FixtureBase {
  id: number;
  status: string;
  date: string;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
}

const FanDashboard: React.FC = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteTeamId, setFavoriteTeamId] = useState<number | null>(null);
  const [favoriteLeagueId, setFavoriteLeagueId] = useState<number | null>(null);
  
  // Get user ID from somewhere (e.g. auth context, redux, etc.)
  const userId = 1; // Mock user ID
  
  // Query user preferences
  const preferencesQuery = useQuery<UserPreferences>({
    queryKey: [`/api/user/${userId}/preferences`],
    staleTime: 60 * 60 * 1000, // 1 hour
  });
  
  // Query teams - this would be filtered by search term in a real API
  const teamsQuery = useQuery<Team[]>({
    queryKey: ['/api/teams', { search: searchQuery }],
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: searchQuery.length > 2,
  });
  
  // Query leagues for dropdown
  const leaguesQuery = useQuery<League[]>({
    queryKey: ['/api/leagues'],
    staleTime: 60 * 60 * 1000, // 1 hour
  });
  
  // Query upcoming fixtures for favorite teams
  const upcomingFixturesQuery = useQuery<FixtureBase[]>({
    queryKey: ['/api/fixtures/upcoming', { teams: preferencesQuery.data?.favoriteTeams }],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!preferencesQuery.data?.favoriteTeams?.length,
  });
  
  // Mutation to add favorite team
  const addFavoriteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await fetch(`/api/user/${userId}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favoriteTeams: [...(preferencesQuery.data?.favoriteTeams || []), teamId],
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add favorite team');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/preferences`] });
      setSearchQuery('');
      setFavoriteTeamId(null);
    },
  });
  
  // Mutation to add favorite league
  const addFavoriteLeagueMutation = useMutation({
    mutationFn: async (leagueId: number) => {
      const response = await fetch(`/api/user/${userId}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favoriteLeagues: [...(preferencesQuery.data?.favoriteLeagues || []), leagueId],
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add favorite league');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/preferences`] });
      setFavoriteLeagueId(null);
    },
  });
  
  // Mutation to remove favorite team
  const removeFavoriteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await fetch(`/api/user/${userId}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favoriteTeams: (preferencesQuery.data?.favoriteTeams || []).filter(id => id !== teamId),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove favorite team');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/preferences`] });
    },
  });
  
  // Mutation to remove favorite league
  const removeFavoriteLeagueMutation = useMutation({
    mutationFn: async (leagueId: number) => {
      const response = await fetch(`/api/user/${userId}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favoriteLeagues: (preferencesQuery.data?.favoriteLeagues || []).filter(id => id !== leagueId),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove favorite league');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/preferences`] });
    },
  });
  
  // Loading state
  if (preferencesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }
  
  // Error or no data state - handle both cases by showing a demo dashboard
  if (preferencesQuery.error || !preferencesQuery.data) {
    // Use demo data instead of showing error
    const demoPreferences = {
      favoriteTeams: [33, 42, 49, 50], // Manchester United, Arsenal, Chelsea, Manchester City
      favoriteLeagues: [39, 2, 140], // Premier League, Champions League, La Liga
    };
    
    // Mock teams to display since we don't have real data
    const demoTeams = [
      { id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png", country: "England" },
      { id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png", country: "England" },
      { id: 49, name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png", country: "England" },
      { id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png", country: "England" }
    ];
    
    // Mock leagues to display
    const demoLeagues = [
      { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png", country: "England" },
      { id: 2, name: "UEFA Champions League", logo: "https://media.api-sports.io/football/leagues/2.png", country: "World" },
      { id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png", country: "Spain" }
    ];
    
    // Demo fixtures
    const demoFixtures = [
      {
        id: 1001,
        status: "Not Started",
        date: "2025-05-15T19:45:00+00:00",
        homeTeam: { id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png" },
        awayTeam: { id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png" },
        league: { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png" }
      },
      {
        id: 1002,
        status: "Not Started",
        date: "2025-05-18T14:00:00+00:00",
        homeTeam: { id: 49, name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png" },
        awayTeam: { id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png" },
        league: { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png" }
      }
    ];
    
    return renderDashboard(
      demoPreferences.favoriteTeams,
      demoPreferences.favoriteLeagues,
      demoTeams,
      demoLeagues,
      demoFixtures,
      true // isDemo flag
    );
  }
  
  // Real data
  const favoriteTeamIds = preferencesQuery.data.favoriteTeams || [];
  const favoriteLeagueIds = preferencesQuery.data.favoriteLeagues || [];
  
  // Get team details for each favorite team ID
  const favoriteTeams = teamsQuery.data?.filter(team => favoriteTeamIds.includes(team.id)) || [];
  
  // Get league details for each favorite league ID
  const favoriteLeagues = leaguesQuery.data?.filter(league => favoriteLeagueIds.includes(league.id)) || [];
  
  // Filter upcoming fixtures for favorite teams
  const upcomingTeamFixtures = upcomingFixturesQuery.data || [];
  
  return renderDashboard(
    favoriteTeamIds,
    favoriteLeagueIds,
    favoriteTeams,
    favoriteLeagues,
    upcomingTeamFixtures,
    false
  );
  
  // Helper function to render dashboard (for both real data and demo mode)
  function renderDashboard(
    teamIds: number[],
    leagueIds: number[],
    teams: Team[],
    leagues: League[],
    fixtures: FixtureBase[],
    isDemo: boolean
  ) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isDemo ? "Fan Dashboard (Demo)" : "Fan Dashboard"}
          </h2>
          <div className="flex gap-2">
            {/* Add Team Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a Favorite Team</DialogTitle>
                  <DialogDescription>
                    Search for teams to add to your fan dashboard
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-team">Search Teams</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="search-team"
                        placeholder="Enter team name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  {isDemo ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      <p>This is a demo - log in to save your preferences</p>
                    </div>
                  ) : (
                    <>
                      {searchQuery.length > 2 && teamsQuery.isLoading && (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      )}
                      
                      {searchQuery.length > 2 && !teamsQuery.isLoading && teamsQuery.data && (
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {teamsQuery.data.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No teams found</p>
                          ) : (
                            teamsQuery.data.map(team => (
                              <div
                                key={team.id}
                                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                                  favoriteTeamId === team.id ? 'bg-blue-50 border border-blue-200' : ''
                                }`}
                                onClick={() => setFavoriteTeamId(team.id)}
                              >
                                <img
                                  src={team.logo}
                                  alt={team.name}
                                  className="h-8 w-8 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=T';
                                  }}
                                />
                                <div>
                                  <p className="font-medium">{team.name}</p>
                                  <p className="text-xs text-gray-500">{team.country}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setFavoriteTeamId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (favoriteTeamId && !isDemo) {
                        addFavoriteTeamMutation.mutate(favoriteTeamId);
                      }
                    }}
                    disabled={isDemo || !favoriteTeamId || addFavoriteTeamMutation.isPending}
                  >
                    {addFavoriteTeamMutation.isPending ? 'Adding...' : 'Add Team'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Add League Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add League
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a Favorite League</DialogTitle>
                  <DialogDescription>
                    Select leagues to follow in your dashboard
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {isDemo ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      <p>This is a demo - log in to save your preferences</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {leaguesQuery.isLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : leaguesQuery.data?.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No leagues found</p>
                      ) : (
                        leaguesQuery.data?.slice(0, 10).map(league => (
                          <div
                            key={league.id}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                              favoriteLeagueId === league.id ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                            onClick={() => setFavoriteLeagueId(league.id)}
                          >
                            <img
                              src={league.logo}
                              alt={league.name}
                              className="h-8 w-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=L';
                              }}
                            />
                            <div>
                              <p className="font-medium">{league.name}</p>
                              <p className="text-xs text-gray-500">{league.country}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFavoriteLeagueId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (favoriteLeagueId && !isDemo) {
                        addFavoriteLeagueMutation.mutate(favoriteLeagueId);
                      }
                    }}
                    disabled={isDemo || !favoriteLeagueId || addFavoriteLeagueMutation.isPending}
                  >
                    {addFavoriteLeagueMutation.isPending ? 'Adding...' : 'Add League'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="favorites">My Favorites</TabsTrigger>
            <TabsTrigger value="fixtures">Upcoming Matches</TabsTrigger>
            <TabsTrigger value="standing">Standings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="favorites" className="space-y-4">
            {(teamIds.length === 0 && leagueIds.length === 0) ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center p-8">
                    <Heart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Favorites Added Yet</h3>
                    <p className="text-gray-500 mb-4">
                      Track your favorite teams and leagues to get personalized updates and stats.
                    </p>
                    <div className="flex justify-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Favorites
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          {/* Dialog content same as above */}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Favorite Teams Section */}
                {teamIds.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Star className="h-5 w-5 text-blue-600" />
                      Favorite Teams
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {teamIds.map(teamId => {
                        const team = teams.find(t => t.id === teamId) || {
                          id: teamId,
                          name: `Team #${teamId}`,
                          logo: '',
                          country: ''
                        };
                        
                        return (
                          <Card key={teamId} className="overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1"></div>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-full bg-gray-100 p-1">
                                    <img
                                      src={team.logo}
                                      alt={team.name}
                                      className="h-10 w-10 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=T';
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-medium leading-tight">{team.name}</h4>
                                    <p className="text-xs text-gray-500">{team.country}</p>
                                  </div>
                                </div>
                                {!isDemo && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                                    onClick={() => removeFavoriteTeamMutation.mutate(teamId)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => navigate(`/team/${teamId}`)}
                                >
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                  Stats
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => navigate(`/team/${teamId}/fixtures`)}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Fixtures
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                )}
                
                {/* Favorite Leagues Section */}
                {leagueIds.length > 0 && (
                  <section className="mt-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-600" />
                      Favorite Leagues
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {leagueIds.map(leagueId => {
                        const league = leagues.find(l => l.id === leagueId) || {
                          id: leagueId,
                          name: `League #${leagueId}`,
                          logo: '',
                          country: ''
                        };
                        
                        return (
                          <Card key={leagueId} className="overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-1"></div>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-full bg-gray-100 p-1">
                                    <img
                                      src={league.logo}
                                      alt={league.name}
                                      className="h-10 w-10 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=L';
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-medium leading-tight">{league.name}</h4>
                                    <p className="text-xs text-gray-500">{league.country}</p>
                                  </div>
                                </div>
                                {!isDemo && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                                    onClick={() => removeFavoriteLeagueMutation.mutate(leagueId)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => navigate(`/league/${leagueId}/standings`)}
                                >
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Standings
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => navigate(`/league/${leagueId}/fixtures`)}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Fixtures
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="fixtures">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Upcoming Matches
                </CardTitle>
                <CardDescription>
                  Matches for your favorite teams
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingFixturesQuery.isLoading && !isDemo ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : fixtures.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>No upcoming fixtures for your favorite teams</p>
                    {teamIds.length === 0 && (
                      <p className="mt-2">Add favorite teams to see their upcoming matches</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fixtures.map(fixture => (
                      <div key={fixture.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/match/${fixture.id}`)}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <img 
                              src={fixture.league.logo} 
                              alt={fixture.league.name}
                              className="h-5 w-5 mr-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
                              }}
                            />
                            <span className="text-xs text-gray-600">{fixture.league.name}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {new Date(fixture.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <img 
                              src={fixture.homeTeam.logo} 
                              alt={fixture.homeTeam.name}
                              className="h-8 w-8"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=T';
                              }}
                            />
                            <span className="font-medium">{fixture.homeTeam.name}</span>
                          </div>
                          <div className="text-sm font-bold mx-2">vs</div>
                          <div className="flex items-center gap-2 justify-end">
                            <span className="font-medium">{fixture.awayTeam.name}</span>
                            <img 
                              src={fixture.awayTeam.logo} 
                              alt={fixture.awayTeam.name}
                              className="h-8 w-8"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=T';
                              }}
                            />
                          </div>
                        </div>
                        {(teamIds.includes(fixture.homeTeam.id) || teamIds.includes(fixture.awayTeam.id)) ? (
                          <div className="mt-2 flex justify-end">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Favorite Team
                            </Badge>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/fixtures')}
                >
                  View All Fixtures
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="standing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-amber-600" />
                  League Standings
                </CardTitle>
                <CardDescription>
                  Standings for your favorite leagues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leagueIds.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>No favorite leagues selected</p>
                    <p className="mt-2">Add favorite leagues to see their standings</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leagueIds.slice(0, 1).map(leagueId => {
                      const league = leagues.find(l => l.id === leagueId);
                      
                      return (
                        <div key={leagueId} className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <img 
                              src={league?.logo} 
                              alt={league?.name}
                              className="h-6 w-6"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=L';
                              }}
                            />
                            <h4 className="font-medium">{league?.name || `League #${leagueId}`}</h4>
                          </div>
                          
                          {/* Simple placeholder for standings - would be replaced with actual data */}
                          <div className="text-center py-4">
                            <Button 
                              onClick={() => navigate(`/league/${leagueId}/standings`)}
                            >
                              View Standings
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {leagueIds.length > 1 && (
                      <div className="text-center pt-2">
                        <Button 
                          variant="link" 
                          onClick={() => navigate('/leagues')}
                        >
                          View all {leagueIds.length} favorite leagues
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
};

export default FanDashboard;