import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useDispatch, useSelector } from "react-redux";
import { RootState, fixturesActions, userActions } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import TournamentHeader from "@/components/layout/TournamentHeader";
import MatchEngagementSection from "@/components/heatmap/MatchEngagementSection";
import {
  Star,
  ArrowLeft,
  BarChart2,
  Timer,
  Trophy,
  ListOrdered,
  Info,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateTime, getMatchStatusText, isLiveMatch } from "@/lib/utils";
import {
  getTeamGradient,
  getTeamColor,
  getOpposingTeamColor,
  getTailwindToHex,
} from "@/lib/colorUtils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BrandedLoading from "@/components/common/BrandedLoading";
import MatchPrediction from "@/components/matches/MatchPrediction";
import HistoricalMatchStats from "@/components/matches/HistoricalMatchStats";
import TeamPerformanceTimeline from "@/components/matches/TeamPerformanceTimeline";
import StatHighlight from "@/components/matches/StatHighlight";
import HistoricalStats from "@/components/matches/HistoricalStats";
import PredictionMeter from "@/components/matches/PredictionMeter";
import MatchScoreboard from "@/components/matches/MatchScoreboard";
import MatchTimeline, { MatchEvent } from "@/components/matches/MatchTimeline";
import TodayMatchpage from "@/components/matches/TodayMatchPageCard";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";
import MyDetailsLayout from "@/components/matches/MyDetailsLayout";
import { format } from "date-fns";

const MatchDetails = () => {
  const { id, tab = "summary" } = useParams();
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const user = useSelector((state: RootState) => state.user);
  const { currentFixture, loading, error } = useSelector(
    (state: RootState) => state.fixtures,
  );

  const [activeTab, setActiveTab] = useState("details");

  // Sample match events data for the interactive timeline
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([
    {
      id: 1,
      minute: 12,
      type: "goal",
      team: "home",
      player: "Player Name",
      assistedBy: "Teammate",
    },
    {
      id: 2,
      minute: 24,
      type: "yellow_card",
      team: "away",
      player: "Opponent Player",
    },
    {
      id: 3,
      minute: 36,
      type: "goal",
      team: "away",
      player: "Striker Name",
      assistedBy: "Midfielder",
    },
    {
      id: 4,
      minute: 42,
      type: "substitution",
      team: "home",
      player: "Substitute Player",
      detail: "Injured Player",
    },
    {
      id: 5,
      minute: 58,
      type: "var",
      team: "home",
      player: "Team Captain",
      detail: "Goal disallowed for offside",
    },
    {
      id: 6,
      minute: 67,
      type: "goal",
      team: "home",
      player: "Midfielder",
      assistedBy: "Winger",
    },
    {
      id: 7,
      minute: 73,
      type: "red_card",
      team: "away",
      player: "Defender",
    },
    {
      id: 8,
      minute: 85,
      type: "penalty",
      team: "home",
      player: "Penalty Taker",
      detail: "Scored",
    },
  ]);

  // Check if match is favorited
  const isFavorite = user.preferences.favoriteMatches.includes(id || "");

  // Fetch match details and highlights
  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!id) return;

      try {
        dispatch(fixturesActions.setLoadingFixtures(true));
        dispatch(fixturesActions.setFixturesError(null));

        // Implement fetch with a timeout to avoid hanging requests
        const fetchWithTimeout = async (
          url: string,
          options: RequestInit,
          timeout = 15000,
        ) => {
          const controller = new AbortController();
          const { signal } = controller;

          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            const response = await fetch(url, { ...options, signal });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === "AbortError") {
              throw new Error(
                "Network timeout: The request took too long to complete.",
              );
            }
            throw error;
          }
        };

        // Use our custom fetch with timeout
        const response = await fetchWithTimeout(`/api/fixtures/${id}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        dispatch(fixturesActions.setCurrentFixture(data));

        // Generate realistic match events based on fixture data
        generateMatchEvents(data);
      } catch (error) {
        console.error(`Error fetching match details for ID ${id}:`, error);

        // Create a user-friendly error message based on the type of error
        let errorMessage = "Failed to load match details";
        if (error instanceof Error) {
          if (error.message.includes("Network timeout")) {
            errorMessage =
              "The request timed out. Please check your connection and try again.";
          } else if (
            error.message.includes("Network error") ||
            error.message.includes("fetch")
          ) {
            errorMessage =
              "Network error: Please check your internet connection and try again.";
          } else if (error.message.includes("Server error")) {
            errorMessage = `Server error: ${error.message.replace("Server error: ", "")}`;
          }
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });

        dispatch(fixturesActions.setFixturesError(errorMessage));
      } finally {
        dispatch(fixturesActions.setLoadingFixtures(false));
      }
    };

    // Function to generate realistic match events based on the fixture data
    const generateMatchEvents = (fixture: any) => {
      if (!fixture) return;

      const homeTeam = fixture.teams.home;
      const awayTeam = fixture.teams.away;
      const homeScore = fixture.goals.home || 0;
      const awayScore = fixture.goals.away || 0;

      const newEvents: MatchEvent[] = [];

      // Add goal events based on score
      for (let i = 0; i < homeScore; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: "goal",
          team: "home",
          player: `${homeTeam.name} Player`,
          assistedBy:
            Math.random() > 0.5 ? `${homeTeam.name} Teammate` : undefined,
        });
      }

      for (let i = 0; i < awayScore; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: "goal",
          team: "away",
          player: `${awayTeam.name} Player`,
          assistedBy:
            Math.random() > 0.5 ? `${awayTeam.name} Teammate` : undefined,
        });
      }

      // Add some yellow cards (1-3 per team)
      const homeYellowCards = Math.floor(Math.random() * 3) + 1;
      const awayYellowCards = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < homeYellowCards; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: "yellow_card",
          team: "home",
          player: `${homeTeam.name} Player`,
        });
      }

      for (let i = 0; i < awayYellowCards; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: "yellow_card",
          team: "away",
          player: `${awayTeam.name} Player`,
        });
      }

      // Add a red card with 20% probability
      if (Math.random() < 0.2) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: "red_card",
          team: Math.random() < 0.5 ? "home" : "away",
          player:
            Math.random() < 0.5
              ? `${homeTeam.name} Player`
              : `${awayTeam.name} Player`,
        });
      }

      // Add substitutions (2-3 per team)
      const homeSubstitutions = Math.floor(Math.random() * 2) + 2;
      const awaySubstitutions = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < homeSubstitutions; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: 45 + Math.floor(Math.random() * 45),
          type: "substitution",
          team: "home",
          player: `${homeTeam.name} Sub In`,
          detail: `${homeTeam.name} Sub Out`,
        });
      }

      for (let i = 0; i < awaySubstitutions; i++) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: 45 + Math.floor(Math.random() * 45),
          type: "substitution",
          team: "away",
          player: `${awayTeam.name} Sub In`,
          detail: `${awayTeam.name} Sub Out`,
        });
      }

      // Add VAR event with 30% probability
      if (Math.random() < 0.3) {
        newEvents.push({
          id: newEvents.length + 1,
          minute: Math.floor(Math.random() * 90) + 1,
          type: "var",
          team: Math.random() < 0.5 ? "home" : "away",
          player:
            Math.random() < 0.5
              ? `${homeTeam.name} Player`
              : `${awayTeam.name} Player`,
          detail:
            Math.random() < 0.5
              ? "Goal disallowed for offside"
              : "Penalty decision overturned",
        });
      }

      // Sort events by minute
      newEvents.sort((a, b) => a.minute - b.minute);

      // Update ID sequence to match sorted order
      newEvents.forEach((event, index) => {
        event.id = index + 1;
      });

      // Update the state with the generated events
      setMatchEvents(newEvents);
    };

    fetchMatchDetails();

    // Bounded refresh for live matches while page is visible
    let refreshTimeoutId: NodeJS.Timeout | null = null;
    
    const scheduleLiveRefresh = () => {
      // Clear any existing timeout
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }
      
      // Only schedule refresh if match is live and page is visible
      if (currentFixture && isLiveMatch(currentFixture.fixture.status.short) && !document.hidden) {
        console.log('⏰ [MatchDetails] Scheduling live refresh in 5 minutes');
        refreshTimeoutId = setTimeout(() => {
          console.log('🔄 [MatchDetails] Refreshing live match data');
          fetchMatchDetails();
          scheduleLiveRefresh(); // Schedule next refresh
        }, 5 * 60 * 1000); // 5 minutes
      }
    };

    // Event-driven refresh: update when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ [MatchDetails] Page visible, refreshing match data');
        fetchMatchDetails();
        scheduleLiveRefresh(); // Restart refresh cycle when page becomes visible
      } else {
        // Clear refresh when page is hidden to prevent background updates
        if (refreshTimeoutId) {
          console.log('💤 [MatchDetails] Page hidden, clearing refresh timeout');
          clearTimeout(refreshTimeoutId);
          refreshTimeoutId = null;
        }
      }
    };

    // Set up visibility listener and initial refresh schedule
    if (currentFixture && isLiveMatch(currentFixture.fixture.status.short)) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      scheduleLiveRefresh(); // Start refresh cycle for live match
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, dispatch, toast, currentFixture?.fixture?.status?.short]);

  // Update tab in URL when changed
  useEffect(() => {
    if (tab !== activeTab && id) {
      navigate(`/match/${id}/${activeTab}`);
    }
  }, [activeTab, id, navigate, tab]);

  // Toggle favorite status
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
      dispatch(userActions.removeFavoriteMatch(id || ""));

      // Update on server
      if (user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteMatches: user.preferences.favoriteMatches.filter(
            (matchId) => matchId !== id,
          ),
        }).catch((err) => {
          console.error("Failed to update preferences:", err);
        });
      }
    } else {
      dispatch(userActions.addFavoriteMatch(id || ""));

      // Update on server
      if (user.id) {
        apiRequest("PATCH", `/api/user/${user.id}/preferences`, {
          favoriteMatches: [...user.preferences.favoriteMatches, id],
        }).catch((err) => {
          console.error("Failed to update preferences:", err);
        });
      }
    }
  };

  // Loading state
  if (loading || !currentFixture) {
    return (
      <>
        <Header />
        <TournamentHeader title="Loading match details..." />
        <BrandedLoading text="Loading match details..." className="pt-20" />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <TournamentHeader title="Error loading match" />

        <div className="container mx-auto px-4 py-4">
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-bold">
                  Error Loading Match Details
                </h3>
                <p className="text-gray-600 mt-2">
                  {typeof error === "string" && error.includes("Network error")
                    ? "Network connection issue: Please check your internet connection and try again."
                    : error ||
                      "There was a problem loading this match. Please try again later."}
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <Button variant="default" onClick={() => navigate("/")}>
                  Return to Home
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reload the fixture data
                    dispatch(fixturesActions.setLoadingFixtures(true));
                    dispatch(fixturesActions.setFixturesError(null));

                    // Attempt to reload the match
                    apiRequest("GET", `/api/fixtures/${id}`)
                      .then((res) => res.json())
                      .then((data) => {
                        dispatch(fixturesActions.setCurrentFixture(data));
                        dispatch(fixturesActions.setLoadingFixtures(false));
                      })
                      .catch((err) => {
                        dispatch(
                          fixturesActions.setFixturesError(
                            err.message || "Failed to load match",
                          ),
                        );
                        dispatch(fixturesActions.setLoadingFixtures(false));

                        toast({
                          title: "Error",
                          description:
                            "Could not reload match details. Please try again later.",
                          variant: "destructive",
                        });
                      });
                  }}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Match details view
  return (
    <>
      <Header />
      <TournamentHeader
        title={`${currentFixture.teams.home.name} vs ${currentFixture.teams.away.name}`}
      />

      <Card className="mt-[10px]">
        {/* Breadcrumb Navigation */}
        <div className="mx-20 py-1 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center text-sm text-gray-600">
            <span className="hover:text-blue-400 cursor-pointer text-gray-900">
              Football
            </span>
            <svg
              className="h-4 w-4 mx-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="hover:text-blue-400 cursor-pointer text-gray-900">
              {currentFixture?.league.name}
            </span>
            <svg
              className="h-4 w-4 mx-2 text-gray-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-gray-400 font-medium">
              {currentFixture?.teams.home.name} vs{" "}
              {currentFixture?.teams.away.name}
            </span>
          </div>
        </div>

        <CardHeader className="border-b border-neutral-200 mx-20">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">
              {isLiveMatch(currentFixture.fixture.status.short) && (
                <Badge variant="default" className="bg-[#48BB78]">
                  LIVE
                </Badge>
              )}
            </div>
          </div>

          {/* League Information Header */}
          <div className="flex items-center  mb-4">
            <img
              src={
                currentFixture?.league.name?.toLowerCase().includes('cotif')
                  ? "/assets/matchdetaillogo/SGCUNl9j-zkh3mv3i.png"
                  : currentFixture?.league.logo || "/assets/fallback-logo.svg"
              }
              alt={currentFixture?.league.name}
              className="h-16 w-17 object-cover bg-gray-50"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/fallback-logo.svg";
              }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-semibold text-gray-900 uppercase tracking-wide">
                  {currentFixture?.league.name}
                </h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full px-4 py-1 text-blue-600 border-blue-600 hover:bg-stone-200 hover:text-blue-600 transition-colors duration-200"
                      >
                        Follow
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to My Selections</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm text-gray-500">1.08M</span>
              </div>
            </div>
          </div>
        </CardHeader>
        {/* TabsList moved below header */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-start bg-transparent border-b border-gray-200 rounded-none h-auto p-0 mb-0 mx-10 ml-[15%]">
            <TabsTrigger
              value="details"
              className="bg-transparent border-0 rounded-none   px-4 py-3 text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="matches"
              className="bg-transparent border-0 rounded-none px-4 py-3 text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              Matches
            </TabsTrigger>
            <TabsTrigger
              value="standings"
              className="bg-transparent border-0 rounded-none px-4 py-3 text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              Standings
            </TabsTrigger>
            <TabsTrigger
              value="news"
              className="bg-transparent border-0 rounded-none px-4 py-3 text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              News
            </TabsTrigger>
            <TabsTrigger
              value="highlights"
              className="bg-transparent border-0 rounded-none px-4 py-3 text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              Highlights
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="bg-transparent border-0 rounded-none px-4 py-3 text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="bg-transparent border-0 rounded-none px-4 py-3 text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent font-medium"
            >
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details">
            <MyDetailsLayout currentFixture={currentFixture} />
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <MyDetailsLayout currentFixture={currentFixture} />
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <MyDetailsLayout currentFixture={currentFixture} />
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            <MyDetailsLayout currentFixture={currentFixture} />
          </TabsContent>

          {/* Highlights Tab */}
          <TabsContent value="highlights">
            <MyDetailsLayout currentFixture={currentFixture} />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <MyDetailsLayout currentFixture={currentFixture} />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <MyDetailsLayout currentFixture={currentFixture} />
          </TabsContent>
        </Tabs>
      </Card>
    </>
  );
};

export default MatchDetails;
