import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCachedQuery } from "@/lib/cachingHelper";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

// Import the popular leagues list from PopularLeaguesList component
import { CURRENT_POPULAR_LEAGUES } from "./PopularLeaguesList";

// Reorder leagues to put Saudi Pro League next to FIFA Club World Cup
const POPULAR_LEAGUES = [
  {
    id: 39,
    name: "Premier League",
    logo: "https://media.api-sports.io/football/leagues/39.png",
  },
  {
    id: 140,
    name: "La Liga",
    logo: "https://media.api-sports.io/football/leagues/140.png",
  },
  {
    id: 135,
    name: "Serie A",
    logo: "https://media.api-sports.io/football/leagues/135.png",
  },
  {
    id: 78,
    name: "Bundesliga",
    logo: "https://media.api-sports.io/football/leagues/78.png",
  },
  {
    id: 61,
    name: "Ligue 1",
    logo: "https://media.api-sports.io/football/leagues/61.png",
  },
  {
    id: 34,
    name: "World Cup Qualification South America",
    logo: "https://media.api-sports.io/football/leagues/34.png",
  },
  {
    id: 2,
    name: "UEFA Champions League",
    logo: "https://media.api-sports.io/football/leagues/2.png",
  },
  {
    id: 3,
    name: "UEFA Europa League",
    logo: "https://media.api-sports.io/football/leagues/3.png",
  },
  {
    id: 848,
    name: "UEFA Conference League",
    logo: "https://media.api-sports.io/football/leagues/848.png",
  },
  {
    id: 5,
    name: "UEFA Nations League",
    logo: "https://media.api-sports.io/football/leagues/5.png",
  },
  {
    id: 1,
    name: "World Cup",
    logo: "https://media.api-sports.io/football/leagues/1.png",
  },
  {
    id: 4,
    name: "Euro Championship",
    logo: "https://media.api-sports.io/football/leagues/4.png",
  },
  {
    id: 15,
    name: "FIFA Club World Cup",
    logo: "https://media.api-sports.io/football/leagues/15.png",
  },
  {
    id: 307,
    name: "Saudi Pro League",
    logo: "https://media.api-sports.io/football/leagues/307.png",
  },
  {
    id: 38,
    name: "UEFA U21 Championship",
    logo: "https://media.api-sports.io/football/leagues/38.png",
  },
  {
    id: 9,
    name: "Copa America",
    logo: "https://media.api-sports.io/football/leagues/9.png",
  },
  {
    id: 22,
    name: "CONCACAF Gold Cup",
    logo: "https://media.api-sports.io/football/leagues/22.png",
  },
  {
    id: 6,
    name: "Africa Cup of Nations",
    logo: "https://media.api-sports.io/football/leagues/6.png",
  },
  {
    id: 16,
    name: "Asian Cup",
    logo: "https://media.api-sports.io/football/leagues/16.png",
  },
  {
    id: 137,
    name: "Coppa Italia",
    logo: "https://media.api-sports.io/football/leagues/137.png",
  },
  {
    id: 45,
    name: "FA Cup",
    logo: "https://media.api-sports.io/football/leagues/45.png",
  },
  {
    id: 143,
    name: "Copa del Rey",
    logo: "https://media.api-sports.io/football/leagues/143.png",
  },
  {
    id: 81,
    name: "DFB Pokal",
    logo: "https://media.api-sports.io/football/leagues/81.png",
  },
  {
    id: 233,
    name: "Egyptian Premier League",
    logo: "https://media.api-sports.io/football/leagues/233.png",
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

const HomeTopScorersList = () => {
  const [, navigate] = useLocation();
  const [availableLeagues, setAvailableLeagues] = useState<
    typeof POPULAR_LEAGUES
  >([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Simplified - no need to check which leagues have data, just show all
  const isLoadingLeagues = false;

  // Update available leagues when data is loaded
  useEffect(() => {
    // Always show all popular leagues regardless of data availability
    setAvailableLeagues(POPULAR_LEAGUES);

    // Set initial selected league if not set and persist it
    if (!selectedLeague && POPULAR_LEAGUES.length > 0) {
      // Always start with World Cup Qualification South America (ID 34)
      const initialLeague = 34;
      
      console.log(`🎯 [HomeTopScorers] Setting initial league:`, {
        initialLeagueId: initialLeague,
        initialLeagueName: "World Cup Qualification South America"
      });
      
      setSelectedLeague(initialLeague);

      // Store in sessionStorage to persist across refreshes
      sessionStorage.setItem(
        "homeTopScorers_selectedLeague",
        initialLeague.toString(),
      );
    }
  }, []);

  // Restore selected league from sessionStorage on mount
  useEffect(() => {
    const storedLeague = sessionStorage.getItem(
      "homeTopScorers_selectedLeague",
    );
    console.log(`💾 [HomeTopScorers] Checking sessionStorage:`, {
      storedLeague,
      currentSelectedLeague: selectedLeague,
      hasStoredLeague: !!storedLeague
    });
    
    if (storedLeague && !selectedLeague) {
      const leagueId = parseInt(storedLeague, 10);
      const foundLeague = POPULAR_LEAGUES.find((league) => league.id === leagueId);
      
      console.log(`🔍 [HomeTopScorers] Restoring from storage:`, {
        leagueId,
        foundLeague: foundLeague?.name,
        isValid: !!foundLeague
      });
      
      // Verify the league still exists in our list
      if (foundLeague) {
        setSelectedLeague(leagueId);
      } else {
        // If stored league not found, default to World Cup Qualification South America
        setSelectedLeague(34);
      }
    } else if (!storedLeague && !selectedLeague) {
      // If no stored league, default to World Cup Qualification South America
      setSelectedLeague(34);
    }
  }, []);

  // Store selected league in sessionStorage when it changes
  useEffect(() => {
    if (selectedLeague) {
      sessionStorage.setItem(
        "homeTopScorers_selectedLeague",
        selectedLeague.toString(),
      );
    }
  }, [selectedLeague]);

  const {
    data: topScorers,
    isLoading,
    error,
  } = useCachedQuery(
    [`top-scorers-league-${selectedLeague}`],
    async () => {
      if (!selectedLeague) return [];

      console.log(
        `🎯 [HomeTopScorers] Fetching top scorers for selected league ${selectedLeague}`,
      );

      const response = await fetch(
        `/api/leagues/${selectedLeague}/topscorers`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Cache-Control": "max-age=3600", // 1 hour cache
          },
        },
      );

      if (!response.ok) {
        console.warn(
          `Failed to fetch top scorers for league ${selectedLeague}: ${response.status}`,
        );
        return [];
      }

      const data: PlayerStatistics[] = await response.json();

      // Filter for current/recent season data only
      const freshData = data.filter((scorer) => {
        const seasonYear = scorer.statistics[0]?.league?.season;
        if (!seasonYear) return false;

        const currentYear = new Date().getFullYear();

        // For World Cup Qualification cycles, include current and next year
        // CONMEBOL WC Qualification runs for 2026 World Cup
        if (selectedLeague === 34) {
          // CONMEBOL WC Qualification
          return seasonYear >= 2024 && seasonYear <= 2026;
        }

        // For other competitions, use standard season logic
        const currentMonth = new Date().getMonth() + 1; // 1-12

        // Determine current season based on typical football calendar
        let currentSeason;
        if (currentMonth >= 8) {
          currentSeason = currentYear; // Aug-Dec: use current year
        } else {
          currentSeason = currentYear - 1; // Jan-July: use previous year
        }

        // Include current season and next season for ongoing competitions
        return seasonYear >= currentSeason && seasonYear <= currentYear + 1;
      });

      return freshData.sort((a, b) => {
        const goalsA = a.statistics[0]?.goals?.total || 0;
        const goalsB = b.statistics[0]?.goals?.total || 0;
        return goalsB - goalsA;
      });
    },
    {
      enabled: !!selectedLeague,
      maxAge: 4 * 60 * 60 * 1000, // 4 hours cache for better performance
      backgroundRefresh: false, // Disable background refresh to reduce API calls
      retry: 1,
      staleTime: 2 * 60 * 60 * 1000, // 2 hour stale time - use cached data longer
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: false, // Use cached data on mount
    },
  );

  const getCurrentLeagueIndex = () => {
    const index = availableLeagues.findIndex((league) => league.id === selectedLeague);
    console.log(`🔍 [getCurrentLeagueIndex] selectedLeague: ${selectedLeague}, found index: ${index}, available leagues count: ${availableLeagues.length}`);
    
    if (index === -1) {
      console.warn(`❌ [getCurrentLeagueIndex] League ${selectedLeague} not found in available leagues:`, availableLeagues.map(l => ({ id: l.id, name: l.name })));
    }
    
    return index;
  };

  const getCurrentLeague = () => {
    const league = availableLeagues.find((league) => league.id === selectedLeague);
    console.log(`🔍 [getCurrentLeague] selectedLeague: ${selectedLeague}, found league: ${league?.name || 'NOT FOUND'}`);
    return league;
  };

  const goToPreviousLeague = () => {
    const currentIndex = getCurrentLeagueIndex();
    if (currentIndex > 0) {
      setSelectedLeague(availableLeagues[currentIndex - 1].id);
    } else {
      // If at first league, go to last league
      setSelectedLeague(availableLeagues[availableLeagues.length - 1].id);
    }
  };

  const goToNextLeague = () => {
    const currentIndex = getCurrentLeagueIndex();
    if (currentIndex < availableLeagues.length - 1) {
      setSelectedLeague(availableLeagues[currentIndex + 1].id);
    } else {
      // If at last league, go to first league
      setSelectedLeague(availableLeagues[0].id);
    }
  };

  const getLeagueDisplayName = (leagueId: number) => {
    const league = availableLeagues.find((l) => l.id === leagueId);
    return league?.name || "League";
  };

  // 365scores-style navigation with positioning
  const [contentPosition, setContentPosition] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  // Calculate dimensions on mount and resize with better timing
  useEffect(() => {
    const updateDimensions = () => {
      if (scrollContainerRef.current && availableLeagues.length > 0) {
        const container = scrollContainerRef.current;
        const content = container.querySelector(
          "[data-content]",
        ) as HTMLElement;
        if (content) {
          // Use requestAnimationFrame to ensure accurate measurements
          requestAnimationFrame(() => {
            setContainerWidth(container.clientWidth);
            setContentWidth(content.scrollWidth);
          });
        }
      }
    };

    // Initial dimension calculation with multiple attempts for better reliability
    const initialTimer = setTimeout(updateDimensions, 100);
    const fallbackTimer = setTimeout(updateDimensions, 300);

    window.addEventListener("resize", updateDimensions);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(fallbackTimer);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [availableLeagues.length]);

  // Update dimensions when selected league changes
  useEffect(() => {
    if (
      selectedLeague &&
      availableLeagues.length > 0 &&
      scrollContainerRef.current
    ) {
      const updateDimensions = () => {
        const container = scrollContainerRef.current;
        const content = container?.querySelector(
          "[data-content]",
        ) as HTMLElement;
        if (container && content) {
          requestAnimationFrame(() => {
            setContainerWidth(container.clientWidth);
            setContentWidth(content.scrollWidth);
          });
        }
      };

      // Multiple timing attempts to catch the DOM updates
      const timer1 = setTimeout(updateDimensions, 0);
      const timer2 = setTimeout(updateDimensions, 50);
      const timer3 = setTimeout(updateDimensions, 150);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [selectedLeague, availableLeagues.length]);

  const scrollLeft = () => {
    if (availableLeagues.length === 0) return;

    const currentIndex = getCurrentLeagueIndex();
    console.log(`🔍 [Navigation Debug] Current league: ${getCurrentLeague()?.name} at index: ${currentIndex}`);
    
    // Ensure we have a valid current index
    if (currentIndex === -1) {
      console.warn(`❌ [Navigation] Current league not found in available leagues`);
      return;
    }
    
    let nextLeagueId;
    
    if (currentIndex > 0) {
      nextLeagueId = availableLeagues[currentIndex - 1].id;
    } else {
      // If at first league, go to last league
      nextLeagueId = availableLeagues[availableLeagues.length - 1].id;
    }

    const nextLeague = availableLeagues.find(l => l.id === nextLeagueId);
    console.log(`⬅️ [Navigation] Moving left from ${getCurrentLeague()?.name} (index: ${currentIndex}) to ${nextLeague?.name} (id: ${nextLeagueId})`);
    
    setSelectedLeague(nextLeagueId);
    
    // Force immediate centering after state update
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const content = container.querySelector("[data-content]") as HTMLElement;
        const selectedButton = content?.querySelector(`[data-league-id="${nextLeagueId}"]`) as HTMLElement;
        
        if (container && content && selectedButton) {
          const containerWidth = container.clientWidth;
          const contentWidth = content.scrollWidth;
          const buttonRelativeLeft = selectedButton.offsetLeft;
          const buttonWidth = selectedButton.offsetWidth;
          const containerCenter = containerWidth / 2;
          const buttonCenter = buttonRelativeLeft + (buttonWidth / 2);
          const newPosition = buttonCenter - containerCenter;
          const maxScroll = Math.max(0, contentWidth - containerWidth);
          const clampedPosition = Math.max(0, Math.min(newPosition, maxScroll));
          
          setContentPosition(clampedPosition);
          console.log(`🎯 [Navigation Left] Centered league ${nextLeague?.name}`);
        }
      }
    }, 50);
  };

  const scrollRight = () => {
    if (availableLeagues.length === 0) return;

    const currentIndex = getCurrentLeagueIndex();
    console.log(`🔍 [Navigation Debug] Current league: ${getCurrentLeague()?.name} at index: ${currentIndex}`);
    
    // Ensure we have a valid current index
    if (currentIndex === -1) {
      console.warn(`❌ [Navigation] Current league not found in available leagues`);
      return;
    }
    
    let nextLeagueId;
    
    if (currentIndex < availableLeagues.length - 1) {
      nextLeagueId = availableLeagues[currentIndex + 1].id;
    } else {
      // If at last league, go to first league
      nextLeagueId = availableLeagues[0].id;
    }

    const nextLeague = availableLeagues.find(l => l.id === nextLeagueId);
    console.log(`➡️ [Navigation] Moving right from ${getCurrentLeague()?.name} (index: ${currentIndex}) to ${nextLeague?.name} (id: ${nextLeagueId})`);
    
    setSelectedLeague(nextLeagueId);
    
    // Force immediate centering after state update
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const content = container.querySelector("[data-content]") as HTMLElement;
        const selectedButton = content?.querySelector(`[data-league-id="${nextLeagueId}"]`) as HTMLElement;
        
        if (container && content && selectedButton) {
          const containerWidth = container.clientWidth;
          const contentWidth = content.scrollWidth;
          const buttonRelativeLeft = selectedButton.offsetLeft;
          const buttonWidth = selectedButton.offsetWidth;
          const containerCenter = containerWidth / 2;
          const buttonCenter = buttonRelativeLeft + (buttonWidth / 2);
          const newPosition = buttonCenter - containerCenter;
          const maxScroll = Math.max(0, contentWidth - containerWidth);
          const clampedPosition = Math.max(0, Math.min(newPosition, maxScroll));
          
          setContentPosition(clampedPosition);
          console.log(`🎯 [Navigation Right] Centered league ${nextLeague?.name}`);
        }
      }
    }, 50);
  };

  const canScrollLeft = availableLeagues.length > 0;
  const canScrollRight = availableLeagues.length > 0;

  // Auto-center selected league with improved timing
  useEffect(() => {
    if (
      !scrollContainerRef.current ||
      !selectedLeague ||
      availableLeagues.length === 0
    ) {
      return;
    }

    const centerSelectedLeague = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const content = container.querySelector("[data-content]") as HTMLElement;
      if (!content) return;

      // Find the selected league button
      const selectedButton = content.querySelector(`[data-league-id="${selectedLeague}"]`) as HTMLElement;
      if (!selectedButton) {
        console.warn(`❌ [Auto-center] Could not find button for league ${selectedLeague}`);
        return;
      }

      // Get fresh measurements
      const containerWidth = container.clientWidth;
      const contentWidth = content.scrollWidth;
      const buttonRelativeLeft = selectedButton.offsetLeft;
      const buttonWidth = selectedButton.offsetWidth;

      // Calculate center position
      const containerCenter = containerWidth / 2;
      const buttonCenter = buttonRelativeLeft + (buttonWidth / 2);
      const newPosition = buttonCenter - containerCenter;

      // Clamp position to valid range
      const maxScroll = Math.max(0, contentWidth - containerWidth);
      const clampedPosition = Math.max(0, Math.min(newPosition, maxScroll));

      console.log(`🎯 [Auto-center] Centering league ${getCurrentLeague()?.name}:`, {
        containerWidth,
        contentWidth,
        buttonLeft: buttonRelativeLeft,
        buttonWidth,
        buttonCenter,
        containerCenter,
        newPosition,
        clampedPosition,
        maxScroll
      });

      setContentPosition(clampedPosition);
    };

    // Use multiple attempts with longer delays for better reliability
    const attemptCenter = (attempt = 0) => {
      const maxAttempts = 5;
      const delays = [0, 50, 150, 300, 500];

      if (attempt >= maxAttempts) {
        console.warn(`❌ [Auto-center] Failed to center league ${selectedLeague} after ${maxAttempts} attempts`);
        return;
      }

      const timer = setTimeout(() => {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          centerSelectedLeague();
        });
        
        // Continue attempting if not the last attempt
        if (attempt < maxAttempts - 1) {
          attemptCenter(attempt + 1);
        }
      }, delays[attempt]);

      return () => clearTimeout(timer);
    };

    const cleanup = attemptCenter();
    return cleanup;
  }, [selectedLeague, availableLeagues.length]);

  // Additional effect to re-center when dimensions change
  useEffect(() => {
    if (
      selectedLeague &&
      availableLeagues.length > 0 &&
      containerWidth > 0 &&
      contentWidth > 0 &&
      scrollContainerRef.current
    ) {
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          const container = scrollContainerRef.current;
          const content = container?.querySelector("[data-content]") as HTMLElement;
          const selectedButton = content?.querySelector(`[data-league-id="${selectedLeague}"]`) as HTMLElement;
          
          if (container && content && selectedButton) {
            const buttonRelativeLeft = selectedButton.offsetLeft;
            const buttonWidth = selectedButton.offsetWidth;
            const containerCenter = containerWidth / 2;
            const buttonCenter = buttonRelativeLeft + (buttonWidth / 2);
            const newPosition = buttonCenter - containerCenter;
            const maxScroll = Math.max(0, contentWidth - containerWidth);
            const clampedPosition = Math.max(0, Math.min(newPosition, maxScroll));
            
            setContentPosition(clampedPosition);
            console.log(`🔄 [Dimension Change] Re-centered league ${getCurrentLeague()?.name}`);
          }
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedLeague, containerWidth, contentWidth]);

  if (isLoadingLeagues || !selectedLeague) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
        </div>

        {/* Title skeleton */}
        <div className="p-4 border-b border-gray-100">
          <div className="h-5 w-16 bg-gray-200 animate-pulse rounded" />
        </div>

        {/* Players skeleton */}
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

  if (isLoading && !topScorers) {
    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-gray-200 animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="h-6 w-8 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mx-auto"></div>
        </div>
      </>
    );
  }

  const currentLeague = getCurrentLeague();
  const currentIndex = getCurrentLeagueIndex();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyle }} />
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        {/* Goals title */}
        <div className="px-4 py-1 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 text-center">
            Goals
          </h3>
        </div>
        {/* Horizontal scrollable league navigation with navigation buttons */}
        <div className="border-b ">
          <div className="flex items-center">
            {/* Left navigation button - 365scores style */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-8 p-0 ml-1 flex-shrink-0  transition-all ${
                canScrollLeft
                  ? "text-gray-700  hover:bg-bg-white-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              onClick={scrollLeft}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* 365scores-style scrollable container */}
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
                      console.log(`🎯 [League Selection] User selected league:`, {
                        id: league.id,
                        name: league.name,
                        previousSelection: selectedLeague
                      });
                      setSelectedLeague(league.id);
                    }}
                    className={`flex items-center gap-2 whitespace-nowrap transition-all duration-200 flex-shrink-0 px-3 py-2 min-w-max ${
                      selectedLeague === league.id
                        ? "text-gray-700 font-semibold bg-gray-50 rounded-md"
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

            {/* Right navigation button - 365scores style */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-8 p-0 mr-1 flex-shrink-0  transition-all  ${
                canScrollRight
                  ? "text-gray-700  hover:bg-bg-white-100"
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
                const goals = playerStats?.goals?.total || 0;

                // Try to get more specific position information
                const rawPosition =
                  scorer.player.position || playerStats?.games?.position || "";

                // Map generic positions to more specific ones based on player data
                const getSpecificPosition = (pos: string) => {
                  if (!pos) return "";

                  // Convert common generic positions to more specific ones
                  const positionMap: { [key: string]: string } = {
                    Attacker: "Forward",
                    Midfielder: "Midfielder",
                    Defender: "Defender",
                    Goalkeeper: "Goalkeeper",
                  };

                  // If it's already specific, return as is
                  if (
                    pos.includes("Left") ||
                    pos.includes("Right") ||
                    pos.includes("Central") ||
                    pos.includes("Centre")
                  ) {
                    return pos;
                  }

                  // Otherwise use the mapped version or original
                  return positionMap[pos] || pos;
                };

                const position = getSpecificPosition(rawPosition);
                const country =
                  playerStats?.team?.name || playerStats?.league?.country || "";

                // Debug logging to see what position data is available
                if (index === 0) {
                  console.log("🔍 Player position data:", {
                    playerName: scorer.player.name,
                    playerPosition: scorer.player.position,
                    gamesPosition: playerStats?.games?.position,
                    finalPosition: position,
                    fullPlayerData: scorer.player,
                    fullStatsData: playerStats,
                  });
                }

                return (
                  <div
                    key={scorer.player.id}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-12 w-12 rounded-full overflow-hidden border border-gray-200">
                      <AvatarImage
                        src={scorer.player.photo}
                        alt={scorer.player.name}
                        className="object-cover object-center scale-110"
                      />
                      <AvatarFallback className="text-xs">
                        {scorer.player.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                          {scorer.player.name}
                        </h4>
                        {position && (
                          <span className="text-xs text-gray-500 font-medium">
                            {position.charAt(0).toUpperCase() +
                              position.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {country}
                      </p>
                    </div>

                    <div className="text-center flex-shrink-0">
                      <div className="text-lg font-bold text-gray-900">
                        {goals}
                      </div>
                      <div className="text-xs text-gray-500">Goals</div>
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

          {/* Stats link - always use the currently selected league */}
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

export default HomeTopScorersList;
