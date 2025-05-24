import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useDispatch, useSelector } from "react-redux";
import {
  RootState,
  leaguesActions,
  fixturesActions,
  userActions,
} from "@/lib/store";

// Adjustments for header height and league tabs position
const headerHeight = "h-[216px]"; // 180px increased by 20%
const leagueTabsPosition = "mt-[236px]"; // 180px increased to accommodate new header height
import { LeagueStandings } from "@/components/stats/LeagueStandings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import TeamLogo from "@/components/matches/TeamLogo";
import { EnhancedLeagueFixtures } from "@/components/matches/EnhancedLeagueFixtures";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import TournamentHeader from "@/components/layout/TournamentHeader";
import {
  Star,
  ArrowLeft,
  BarChart2,
  CalendarDays,
  Trophy,
  Table,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";
import LeagueTabs from "@/components/layout/LeagueTabs";
import LeagueTabsHeader from "@/components/layout/LeagueTabsHeader";
import LeagueTabsDetails from "@/components/layout/LeagueTabsDetails";

const LeagueDetails = () => {
  const { id, tab = "fixtures" } = useParams();
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const user = useSelector((state: RootState) => state.user, (prev, next) => prev.id === next.id);
  const { list: leagues, loading: leagueLoading } = useSelector(
    (state: RootState) => state.leagues,
    (prev, next) => prev.list === next.list && prev.loading === next.loading
  );
  const { byLeague: fixturesByLeague, loading: fixturesLoading } = useSelector(
    (state: RootState) => state.fixtures,
    (prev, next) => prev.byLeague === next.byLeague && prev.loading === next.loading
  );

  const league = leagues.find((l) => l.league.id.toString() === id);
  const fixtures = fixturesByLeague[id || ""] || [];
  const loading = leagueLoading || fixturesLoading;

  const [activeTab, setActiveTab] = useState(tab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/league/${id}/${value}`);
  };

  // Check if league is favorited
  const isFavorite = user.preferences.favoriteLeagues.includes(id || "");

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      if (!id) return;
      if (league) return;

      try {
        dispatch(leaguesActions.setLoadingLeagues(true));
        const response = await apiRequest("GET", `/api/leagues/${id}`);
        const data = await response.json();
        if (data) {
          dispatch(leaguesActions.setLeagues([...leagues, data]));
        }
      } catch (error) {
        console.error(`Error fetching league ${id}:`, error);
        toast({
          title: "Error",
          description: "Failed to load league information",
          variant: "destructive",
        });
      } finally {
        dispatch(leaguesActions.setLoadingLeagues(false));
      }
    };

    fetchLeagueDetails();
  }, [id, league, leagues, dispatch, toast]);

  useEffect(() => {
    const fetchLeagueFixtures = async () => {
      if (!id) return;
      if (fixtures.length > 0) return;

      try {
        dispatch(fixturesActions.setLoadingFixtures(true));
        const currentYear = new Date().getFullYear();
        const response = await apiRequest(
          "GET",
          `/api/leagues/${id}/fixtures?season=${currentYear}`,
        );
        const data = await response.json();
        dispatch(
          fixturesActions.setFixturesByLeague({ leagueId: id, fixtures: data }),
        );
      } catch (error) {
        console.error(`Error fetching fixtures for league ${id}:`, error);
        toast({
          title: "Error",
          description: "Failed to load league fixtures",
          variant: "destructive",
        });
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };

    fetchLeagueFixtures();
  }, [id, fixtures.length, dispatch, toast]);

  useEffect(() => {
    if (id) {
      navigate(`/league/${id}/${activeTab}`);
    }
  }, [activeTab, id, navigate]);

  const toggleFavorite = () => {
    if (!user.isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to save favorites",
      });
      navigate("/login");
      return;
    }

    if (isFavorite) {
      dispatch(userActions.removeFavoriteLeague(id || ""));
      if (user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteLeagues: user.preferences.favoriteLeagues.filter(
            (leagueId) => leagueId !== id,
          ),
        }).catch((err) => {
          console.error("Failed to update preferences:", err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteLeague(id || ""));
      if (user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteLeagues: [...user.preferences.favoriteLeagues, id],
        }).catch((err) => {
          console.error("Failed to update preferences:", err);
        });
      }
    }
  };

  if (loading || !league) {
    return (
      <>
        <Header />
      </>
    );
  }

  return (
    <>
      <Header />
      <TournamentHeader title={league.league.name} />
      
      <LeagueTabsHeader
        
        leagueId={league?.league?.id}
        leagueName={league?.league?.name}
        leagueLogo={league?.league?.logo}
        followers="10.5K"
      />
      <div className="container mx-auto px-6 py-8 mt-[216px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <Card className="mb-6">
              <CardHeader className="p-4 border-b border-neutral-200">
                
                <LeagueTabsDetails />
                
                <Tabs
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsContent value="fixtures" className="mt-2">
                    {fixtures.length > 0 ? (
                      <EnhancedLeagueFixtures
                        fixtures={[...fixtures].sort(
                          (a, b) =>
                            new Date(b.fixture.date).getTime() -
                            new Date(a.fixture.date).getTime(),
                        )}
                        onMatchClick={(matchId) =>
                          navigate(`/match/${matchId}`)
                        }
                      />
                    ) : (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-gray-500">
                            No fixtures available for this league.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="standings" className="mt-2">
                    <Card>
                      {league && (
                        <LeagueStandings
                          leagueId={league.league.id}
                          season={league.league.season}
                        />
                      )}
                    </Card>
                  </TabsContent>

                  <TabsContent value="stats" className="mt-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">
                            League statistics will be displayed here.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="bracket" className="mt-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center py-8">
                          {loading ? (
                            <div className="space-y-4">
                              <Skeleton className="h-8 w-48 mx-auto" />
                              <Skeleton className="h-64 w-full" />
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Tournament bracket will be displayed here.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4"></div>
        </div>
      </div>
    </>
  );
};

export default LeagueDetails;
