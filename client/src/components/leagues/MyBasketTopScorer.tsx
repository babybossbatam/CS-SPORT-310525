import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCachedQuery } from "@/lib/cachingHelper";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MyAvatarInfo from "@/components/matches/MyAvatarInfo";

// Add CSS to hide scrollbars
const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Popular basketball leagues with their API-Football.com basketball IDs
const POPULAR_BASKETBALL_LEAGUES = [
  {
    id: 12,
    name: "NBA",
    logo: "https://media.api-sports.io/basketball/leagues/12.png",
  },
  {
    id: 120,
    name: "EuroLeague",
    logo: "https://media.api-sports.io/basketball/leagues/120.png",
  },
  {
    id: 127,
    name: "Liga ACB",
    logo: "https://media.api-sports.io/basketball/leagues/127.png",
  },
  {
    id: 133,
    name: "Lega Basket Serie A",
    logo: "https://media.api-sports.io/basketball/leagues/133.png",
  },
  {
    id: 132,
    name: "Bundesliga",
    logo: "https://media.api-sports.io/basketball/leagues/132.png",
  },
  {
    id: 134,
    name: "LNB Pro A",
    logo: "https://media.api-sports.io/basketball/leagues/134.png",
  },
];

interface Player {
  id: number;
  name: string;
  photo: string;
}

interface PlayerStatistics {
  player: Player;
  statistics: {
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number;
      position: string;
    };
    goals: {
      total: number;
    };
  }[];
}

const MyBasketTopScorer: React.FC = () => {
  const [, navigate] = useLocation();
  const [availableLeagues, setAvailableLeagues] = useState<
    typeof POPULAR_BASKETBALL_LEAGUES
  >([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [contentPosition, setContentPosition] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize available leagues and set default
  useEffect(() => {
    setAvailableLeagues(POPULAR_BASKETBALL_LEAGUES);

    // Set NBA as default league
    const storedLeague = sessionStorage.getItem("basketTopScorers_selectedLeague");
    if (storedLeague) {
      setSelectedLeague(parseInt(storedLeague, 10));
    } else {
      setSelectedLeague(12); // NBA
      sessionStorage.setItem("basketTopScorers_selectedLeague", "12");
    }
  }, []);

  // Store selected league in sessionStorage when it changes
  useEffect(() => {
    if (selectedLeague) {
      sessionStorage.setItem("basketTopScorers_selectedLeague", selectedLeague.toString());
    }
  }, [selectedLeague]);

  const {
    data: topScorers,
    isLoading,
    error,
  } = useCachedQuery(
    [`basket-top-scorers-league-${selectedLeague}`],
    async () => {
      if (!selectedLeague) return [];

      console.log(`🏀 [MyBasketTopScorer] Fetching top scorers for league ${selectedLeague}`);

      try {
        console.log(`🔍 [MyBasketTopScorer] Making API request to: /api/basketball/standings/top-scorers/${selectedLeague}?season=2024`);
        
        const response = await fetch(`/api/basketball/standings/top-scorers/${selectedLeague}?season=2024`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=7200' // 2 hours cache
          }
        });

        console.log(`🔍 [MyBasketTopScorer] Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`Failed to fetch basketball top scorers for league ${selectedLeague}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          return [];
        }

        const data = await response.json();
        console.log(`🔍 [MyBasketTopScorer] Raw API response:`, {
          dataType: typeof data,
          isArray: Array.isArray(data),
          dataLength: data?.length,
          dataKeys: typeof data === 'object' ? Object.keys(data) : 'not object',
          sampleData: Array.isArray(data) ? data[0] : data
        });

        if (Array.isArray(data)) {
          console.log(`✅ [MyBasketTopScorer] Retrieved ${data.length} top scorers for league ${selectedLeague}`);

          // Sort by points (goals.total in basketball context means points)
          return data.sort((a: any, b: any) => {
            const pointsA = a.statistics[0]?.goals?.total || 0;
            const pointsB = b.statistics[0]?.goals?.total || 0;
            return pointsB - pointsA;
          });
        } else {
          console.warn(`⚠️ [MyBasketTopScorer] Expected array but got:`, typeof data, data);
          return [];
        }
      } catch (error) {
        console.error(`❌ [MyBasketTopScorer] Error fetching top scorers for league ${selectedLeague}:`, error);
        return [];
      }
    },
    {
      enabled: !!selectedLeague,
      maxAge: 4 * 60 * 60 * 1000, // 4 hours cache
      backgroundRefresh: false,
      retry: 1,
      staleTime: 2 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  const getCurrentLeagueIndex = () => {
    return availableLeagues.findIndex((league) => league.id === selectedLeague);
  };

  const getCurrentLeague = () => {
    return availableLeagues.find((league) => league.id === selectedLeague);
  };

  // Calculate dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (scrollContainerRef.current && availableLeagues.length > 0) {
        const container = scrollContainerRef.current;
        const content = container.querySelector("[data-content]") as HTMLElement;
        if (content) {
          requestAnimationFrame(() => {
            setContainerWidth(container.clientWidth);
            setContentWidth(content.scrollWidth);
          });
        }
      }
    };

    const initialTimer = setTimeout(updateDimensions, 100);
    const fallbackTimer = setTimeout(updateDimensions, 300);

    window.addEventListener("resize", updateDimensions);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(fallbackTimer);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [availableLeagues.length]);

  const scrollLeft = () => {
    if (availableLeagues.length === 0) return;

    const currentIndex = getCurrentLeagueIndex();
    let nextLeagueId;

    if (currentIndex > 0) {
      nextLeagueId = availableLeagues[currentIndex - 1].id;
    } else {
      nextLeagueId = availableLeagues[availableLeagues.length - 1].id;
    }

    setSelectedLeague(nextLeagueId);
    const scrollAmount = 200;
    setContentPosition((prev) => Math.max(0, prev - scrollAmount));
  };

  const scrollRight = () => {
    if (availableLeagues.length === 0) return;

    const currentIndex = getCurrentLeagueIndex();
    let nextLeagueId;

    if (currentIndex < availableLeagues.length - 1) {
      nextLeagueId = availableLeagues[currentIndex + 1].id;
    } else {
      nextLeagueId = availableLeagues[0].id;
    }

    setSelectedLeague(nextLeagueId);
    const scrollAmount = 200;
    const maxScroll = Math.max(0, contentWidth - containerWidth);
    setContentPosition((prev) => Math.min(maxScroll, prev + scrollAmount));
  };

  const canScrollLeft = availableLeagues.length > 0;
  const canScrollRight = availableLeagues.length > 0;

  // Auto-center selected league in navigation
  useEffect(() => {
    if (
      !scrollContainerRef.current ||
      !selectedLeague ||
      availableLeagues.length === 0 ||
      containerWidth === 0 ||
      contentWidth === 0
    ) {
      return;
    }

    const centerSelectedLeague = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const selectedButton = container.querySelector(
        `[data-league-id="${selectedLeague}"]`,
      ) as HTMLElement;

      if (selectedButton) {
        container.offsetHeight;
        const buttonLeft = selectedButton.offsetLeft;
        const buttonWidth = selectedButton.offsetWidth;
        const buttonCenter = buttonLeft + buttonWidth / 2;
        const viewportCenter = containerWidth / 2;
        let targetPosition = buttonCenter - viewportCenter;
        const maxScroll = Math.max(0, contentWidth - containerWidth);
        targetPosition = Math.max(0, Math.min(maxScroll, targetPosition));

        setContentPosition(targetPosition);
        return true;
      }
      return false;
    };

    let attempts = 0;
    const maxAttempts = 5;

    const attemptCentering = () => {
      attempts++;
      const success = centerSelectedLeague();

      if (!success && attempts < maxAttempts) {
        setTimeout(attemptCentering, attempts * 50);
      }
    };

    const immediateTimer = setTimeout(attemptCentering, 0);
    const quickTimer = setTimeout(attemptCentering, 16);
    const fallbackTimer = setTimeout(attemptCentering, 100);

    return () => {
      clearTimeout(immediateTimer);
      clearTimeout(quickTimer);
      clearTimeout(fallbackTimer);
    };
  }, [selectedLeague, availableLeagues.length, containerWidth, contentWidth]);

  if (!selectedLeague) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="h-5 w-16 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="text-right">
                <div className="h-6 w-6 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-8 bg-gray-200 animate-pulse rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyle }} />
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden" data-sport="basketball">
        {/* Points title */}
        <div className="px-4 py-1 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 text-center">
            Points
          </h3>
        </div>

        {/* Horizontal scrollable league navigation with navigation buttons */}
        <div className="border-b">
          <div className="flex items-center">
            {/* Left navigation button */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-8 p-0 ml-1 flex-shrink-0 transition-all ${
                canScrollLeft
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              onClick={scrollLeft}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Scrollable container */}
            <div
              ref={scrollContainerRef}
              className="relative overflow-hidden flex-1"
            >
              <div
                data-content
                className="flex items-center py-3 gap-6 transition-all duration-400 ease-in-out"
                style={{
                  transform: `translateX(-${contentPosition}px)`,
                  width: "max-content",
                }}
              >
                {availableLeagues.map((league) => (
                  <button
                    key={league.id}
                    data-league-id={league.id}
                    onClick={() => {
                      console.log(`🏀 [League Selection] User selected league:`, {
                        id: league.id,
                        name: league.name,
                        previousSelection: selectedLeague,
                      });
                      setSelectedLeague(league.id);
                    }}
                    className={`flex items-center gap-2 whitespace-nowrap transition-all duration-200 flex-shrink-0 px-3 py-2 min-w-max ${
                      selectedLeague === league.id
                        ? "text-gray-700 font-semibold"
                        : "text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    <div className="w-5 h-5 flex-shrink-0">
                      <img
                        src={league.logo}
                        alt={league.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-sm font-medium">{league.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right navigation button */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-8 p-0 mr-1 flex-shrink-0 transition-all ${
                canScrollRight
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-700 cursor-not-allowed"
              }`}
              onClick={scrollRight}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Players list */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                    <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
                  </div>
                  <div className="text-right">
                    <div className="h-6 w-6 bg-gray-200 animate-pulse rounded" />
                    <div className="h-3 w-8 bg-gray-200 animate-pulse rounded mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">Failed to load top scorers</p>
              <p className="text-xs text-gray-400 mt-1">
                for {getCurrentLeague()?.name || "Selected League"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline"
              >
                Retry
              </button>
            </div>
          ) : topScorers && topScorers.length > 0 ? (
            <div className="space-y-3">
              {topScorers.slice(0, 3).map((scorer, index) => {
                const playerStats = scorer.statistics[0];
                const points = playerStats?.goals?.total || 0;
                const position = playerStats?.games?.position || "";
                const team = playerStats?.team?.name || "";

                return (
                  <div
                    key={scorer.player.id}
                    className="flex items-center gap-3"
                  >
                    <MyAvatarInfo
                      playerId={scorer.player.id}
                      playerName={scorer.player.name}
                      size="md"
                      className="border-gray-200"
                      sport="basketball"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                          {scorer.player.name}
                        </h4>
                        {position && (
                          <span className="text-xs text-gray-500 font-medium">
                            {position.charAt(0).toUpperCase() + position.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {team}
                      </p>
                    </div>

                    <div className="text-center flex-shrink-0">
                      <div className="text-lg font-medium text-gray-900">
                        {points}
                      </div>
                      <div className="text-xs text-gray-500">Points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No top scorer data available</p>
              <p className="text-xs text-gray-400 mt-1">
                for {getCurrentLeague()?.name || "Selected League"}
              </p>
            </div>
          )}

          {/* Stats link */}
          {selectedLeague && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium group"
                onClick={() => navigate(`/league/${selectedLeague}/stats`)}
              >
                <span className="hover:underline transition-all duration-200">
                  {getCurrentLeague()?.name || "Selected League"} Stats
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyBasketTopScorer;