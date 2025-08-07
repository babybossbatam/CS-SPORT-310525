import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCachedQuery } from "@/lib/cachingHelper";
import { useLocation } from "wouter";
import MyAvatarInfo from "../matches/MyAvatarInfo";
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

  // Update available leagues when data is loaded - filter by data availability
  useEffect(() => {
    const checkLeaguesWithData = async () => {
      const leaguesWithData = [];

      for (const league of POPULAR_LEAGUES) {
        try {
          const response = await fetch(`/api/leagues/${league.id}/topscorers`, {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "Cache-Control": "max-age=3600",
            },
          });

          if (response.ok) {
            const data = await response.json();

            // Filter for current/recent season data
            const freshData = data.filter((scorer: any) => {
              const seasonYear = scorer.statistics[0]?.league?.season;
              if (!seasonYear) return false;

              const currentYear = new Date().getFullYear();
              const currentMonth = new Date().getMonth() + 1;

              // For World Cup Qualification cycles
              if (league.id === 34) {
                return seasonYear >= 2024 && seasonYear <= 2026;
              }

              // For other competitions
              let currentSeason;
              if (currentMonth >= 8) {
                currentSeason = currentYear;
              } else {
                currentSeason = currentYear - 1;
              }

              return (
                seasonYear >= currentSeason && seasonYear <= currentYear + 1
              );
            });

            if (freshData.length > 0) {
              leaguesWithData.push(league);
            }
          }
        } catch (error) {
          console.warn(`Failed to check data for league ${league.id}`);
        }
      }

      setAvailableLeagues(leaguesWithData);

      // Set initial selected league from available leagues with data
      if (!selectedLeague && leaguesWithData.length > 0) {
        // Try to find World Cup Qualification South America first
        const preferredLeague = leaguesWithData.find((l) => l.id === 34);
        const initialLeague = preferredLeague
          ? preferredLeague.id
          : leaguesWithData[0].id;

        console.log(`🎯 [HomeTopScorers] Setting initial league:`, {
          initialLeagueId: initialLeague,
          initialLeagueName: leaguesWithData.find((l) => l.id === initialLeague)
            ?.name,
          availableLeaguesCount: leaguesWithData.length,
        });

        setSelectedLeague(initialLeague);

        // Store in sessionStorage to persist across refreshes
        sessionStorage.setItem(
          "homeTopScorers_selectedLeague",
          initialLeague.toString(),
        );
      }
    };

    checkLeaguesWithData();
  }, []);

  // Restore selected league from sessionStorage on mount
  useEffect(() => {
    const storedLeague = sessionStorage.getItem(
      "homeTopScorers_selectedLeague",
    );
    console.log(`💾 [HomeTopScorers] Checking sessionStorage:`, {
      storedLeague,
      currentSelectedLeague: selectedLeague,
      hasStoredLeague: !!storedLeague,
      availableLeaguesCount: availableLeagues.length,
    });

    if (storedLeague && !selectedLeague && availableLeagues.length > 0) {
      const leagueId = parseInt(storedLeague, 10);
      const foundLeague = availableLeagues.find(
        (league) => league.id === leagueId,
      );

      console.log(`🔍 [HomeTopScorers] Restoring from storage:`, {
        leagueId,
        foundLeague: foundLeague?.name,
        isValid: !!foundLeague,
        isInAvailableList: !!foundLeague,
      });

      // Verify the league exists in our filtered available list
      if (foundLeague) {
        setSelectedLeague(leagueId);
      } else if (availableLeagues.length > 0) {
        // If stored league not in available list, use first available
        const fallbackLeague =
          availableLeagues.find((l) => l.id === 34) || availableLeagues[0];
        setSelectedLeague(fallbackLeague.id);
      }
    }
  }, [availableLeagues]);

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

      // Filter for current/recent season data AND ensure players actually played in the selected league
      const freshData = data.filter((scorer) => {
        const playerStats = scorer.statistics[0];
        const seasonYear = playerStats?.league?.season;
        const playerLeagueId = playerStats?.league?.id;
        
        // Must have valid season and league data
        if (!seasonYear || !playerLeagueId) {
          console.log(`❌ [HomeTopScorers] Filtering out player ${scorer.player?.name} - missing season/league data:`, {
            seasonYear,
            playerLeagueId,
            selectedLeague
          });
          return false;
        }
        
        // CRITICAL: Only include players who actually played in the selected league
        if (playerLeagueId !== selectedLeague) {
          console.log(`❌ [HomeTopScorers] Filtering out player ${scorer.player?.name} - wrong league:`, {
            playerLeagueId,
            selectedLeague,
            playerLeagueName: playerStats?.league?.name,
            selectedLeagueName: availableLeagues.find(l => l.id === selectedLeague)?.name
          });
          return false;
        }

        const currentYear = new Date().getFullYear();

        // For World Cup Qualification cycles, include current and next year
        // CONMEBOL WC Qualification runs for 2026 World Cup
        if (selectedLeague === 34) {
          // CONMEBOL WC Qualification
          const isValidSeason = seasonYear >= 2024 && seasonYear <= 2026;
          console.log(`🔍 [HomeTopScorers] CONMEBOL WC Qualification season check for ${scorer.player?.name}:`, {
            seasonYear,
            isValidSeason
          });
          return isValidSeason;
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
        const isValidSeason = seasonYear >= currentSeason && seasonYear <= currentYear + 1;
        
        console.log(`🔍 [HomeTopScorers] Season validation for ${scorer.player?.name} in ${playerStats?.league?.name}:`, {
          seasonYear,
          currentSeason,
          currentYear,
          isValidSeason,
          playerLeagueId,
          selectedLeague
        });
        
        return isValidSeason;
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
    return availableLeagues.findIndex((league) => league.id === selectedLeague);
  };

  const getCurrentLeague = () => {
    return availableLeagues.find((league) => league.id === selectedLeague);
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
    const name = league?.name || "League";
    
    // Shorten long league names for better display
    const shortenedNames: { [key: string]: string } = {
      "World Cup Qualification South America": "WC SA",
      "World Cup Qualification Europe": "WC EU", 
      "World Cup Qualification Africa": "WC AF",
      "World Cup Qualification Asia": "WC AS",
      "World Cup Qualification North America": "WC NA",
      "UEFA Nations League": "Nations League",
      "UEFA Champions League": "Champions League",
      "UEFA Europa League": "Europa League",
      "UEFA Conference League": "Conference League",
      "FIFA Club World Cup": "Club World Cup",
      "Egyptian Premier League": "Egyptian PL",
      "Saudi Pro League": "Saudi League"
    };
    
    return shortenedNames[name] || name;
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
    let nextLeagueId;

    if (currentIndex > 0) {
      nextLeagueId = availableLeagues[currentIndex - 1].id;
    } else {
      // If at first league, go to last league
      nextLeagueId = availableLeagues[availableLeagues.length - 1].id;
    }

    console.log(
      `⬅️ [Navigation] Moving left from ${getCurrentLeague()?.name} to ${availableLeagues.find((l) => l.id === nextLeagueId)?.name}`,
    );
    setSelectedLeague(nextLeagueId);

    // Scroll content to the right when moving selection left
    const scrollAmount = 200; // Adjust scroll amount as needed
    setContentPosition((prev) => Math.max(0, prev - scrollAmount));
  };

  const scrollRight = () => {
    if (availableLeagues.length === 0) return;

    const currentIndex = getCurrentLeagueIndex();
    let nextLeagueId;

    if (currentIndex < availableLeagues.length - 1) {
      nextLeagueId = availableLeagues[currentIndex + 1].id;
    } else {
      // If at last league, go to first league
      nextLeagueId = availableLeagues[0].id;
    }

    console.log(
      `➡️ [Navigation] Moving right from ${getCurrentLeague()?.name} to ${availableLeagues.find((l) => l.id === nextLeagueId)?.name}`,
    );
    setSelectedLeague(nextLeagueId);

    // Scroll content to the left when moving selection right
    const scrollAmount = 200; // Adjust scroll amount as needed
    const maxScroll = Math.max(0, contentWidth - containerWidth);
    setContentPosition((prev) => Math.min(maxScroll, prev + scrollAmount));
  };

  const canScrollLeft = availableLeagues.length > 0;
  const canScrollRight = availableLeagues.length > 0;

  // Auto-center selected league in navigation - Enhanced version
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
      if (!container) return false;

      const selectedButton = container.querySelector(
        `[data-league-id="${selectedLeague}"]`,
      ) as HTMLElement;

      if (selectedButton) {
        // Get fresh measurements each time
        const containerRect = container.getBoundingClientRect();
        const buttonRect = selectedButton.getBoundingClientRect();
        const contentContainer = container.querySelector('[data-content]') as HTMLElement;
        
        if (!contentContainer) return false;

        const currentContainerWidth = containerRect.width;
        const currentContentWidth = contentContainer.scrollWidth;
        const buttonRelativeLeft = selectedButton.offsetLeft;
        const buttonWidth = buttonRect.width;

        // Calculate center position
        const buttonCenter = buttonRelativeLeft + buttonWidth / 2;
        const viewportCenter = currentContainerWidth / 2;
        let targetPosition = buttonCenter - viewportCenter;

        // Ensure we don't scroll beyond boundaries
        const maxScroll = Math.max(0, currentContentWidth - currentContainerWidth);
        targetPosition = Math.max(0, Math.min(maxScroll, targetPosition));

        console.log(
          `🎯 [Enhanced Auto-Center] Centering league: ${getCurrentLeague()?.name}`,
          {
            selectedLeague,
            buttonRelativeLeft,
            buttonWidth,
            buttonCenter,
            viewportCenter,
            targetPosition,
            maxScroll,
            currentContainerWidth,
            currentContentWidth,
          },
        );

        setContentPosition(targetPosition);
        return true;
      }
      return false;
    };

    // Enhanced timing with multiple attempts and better delays
    let attempts = 0;
    const maxAttempts = 8;
    const delays = [0, 16, 50, 100, 200, 300, 500, 800]; // Progressive delays

    const attemptCentering = () => {
      const success = centerSelectedLeague();
      
      if (!success && attempts < maxAttempts) {
        const delay = delays[attempts] || 1000;
        setTimeout(() => {
          attempts++;
          attemptCentering();
        }, delay);
      }
    };

    // Start centering process
    attemptCentering();

    // Backup centering with intersection observer for better reliability
    if (window.IntersectionObserver) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.getAttribute('data-league-id') === selectedLeague.toString()) {
            setTimeout(centerSelectedLeague, 50);
          }
        });
      });

      const selectedButton = scrollContainerRef.current.querySelector(
        `[data-league-id="${selectedLeague}"]`,
      );
      if (selectedButton) {
        observer.observe(selectedButton);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, [selectedLeague, availableLeagues.length]);

  // Immediate centering for user interactions
  useEffect(() => {
    if (!selectedLeague || !scrollContainerRef.current) return;

    const centerImmediately = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const selectedButton = container.querySelector(
        `[data-league-id="${selectedLeague}"]`,
      ) as HTMLElement;

      if (selectedButton) {
        const containerRect = container.getBoundingClientRect();
        const contentContainer = container.querySelector('[data-content]') as HTMLElement;
        
        if (!contentContainer) return;

        const currentContainerWidth = containerRect.width;
        const currentContentWidth = contentContainer.scrollWidth;
        const buttonLeft = selectedButton.offsetLeft;
        const buttonWidth = selectedButton.offsetWidth;
        const buttonCenter = buttonLeft + buttonWidth / 2;
        const viewportCenter = currentContainerWidth / 2;
        let targetPosition = buttonCenter - viewportCenter;

        const maxScroll = Math.max(0, currentContentWidth - currentContainerWidth);
        targetPosition = Math.max(0, Math.min(maxScroll, targetPosition));

        console.log(
          `🎯 [Immediate Center] User interaction centering for: ${getCurrentLeague()?.name}`,
          {
            targetPosition,
            buttonLeft,
            buttonWidth,
            currentContainerWidth,
            currentContentWidth,
          },
        );

        setContentPosition(targetPosition);
      }
    };

    // Use multiple timing strategies for immediate response
    const rafId = requestAnimationFrame(centerImmediately);
    const timeoutId = setTimeout(centerImmediately, 0);
    const fallbackId = setTimeout(centerImmediately, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      clearTimeout(fallbackId);
    };
  }, [selectedLeague]);

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
      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Goals title */}
        <div className="px-4 py-1 border-b border-gray-100 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-center">
            Goals
          </h3>
        </div>
        {/* Horizontal scrollable league navigation with navigation buttons */}
        <div className="border-b border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            {/* Left navigation button - 365scores style */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-8 p-0 ml-1 flex-shrink-0 transition-all ${
                canScrollLeft
                  ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
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
                      console.log(
                        `🎯 [League Selection] User selected league:`,
                        {
                          id: league.id,
                          name: league.name,
                          previousSelection: selectedLeague,
                        },
                      );
                      setSelectedLeague(league.id);
                    }}
                    className={`flex items-center gap-2 whitespace-nowrap transition-all duration-200 flex-shrink-0 px-3 py-2 min-w-max ${
                      selectedLeague === league.id
                        ? "text-gray-700 dark:text-white font-semibold"
                        : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <div className="w-5 h-5 flex-shrink-0">
                      <img
                        src={league.logo}
                        alt={league.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-sm font-medium">{getLeagueDisplayName(league.id)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right navigation button - 365scores style */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-10 w-8 p-0 mr-1 flex-shrink-0 transition-all ${
                canScrollRight
                  ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  : "text-gray-700 dark:text-gray-300 cursor-not-allowed"
              }`}
              onClick={scrollRight}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Players list */}
        <div className="p-4 dark:bg-gray-800">
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
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <p className="text-sm">Failed to load top scorers</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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

                // Debug logging for player photos
                console.log(`🖼️ [TopScorers] Player photo debug:`, {
                  playerName: scorer.player.name,
                  playerId: scorer.player.id,
                  originalPhoto: scorer.player.photo,
                  fallbackUrl: `https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Athletes:default.png,r_max,c_thumb,g_face,z_0.65/v41/Athletes/${scorer.player.id}`,
                  league: getCurrentLeague()?.name
                });

                return (
                  <div
                    key={scorer.player.id}
                    className="flex items-center gap-3"
                  >
                    <MyAvatarInfo
                      playerId={scorer.player.id}
                      playerName={scorer.player.name}
                      teamId={playerStats?.team?.id}
                      size="md"
                      className="border-gray-200"
                      sport="football"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {scorer.player.name}
                        </h4>
                        {position && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {position.charAt(0).toUpperCase() +
                              position.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {country}
                      </p>
                    </div>

                    <div className="text-center flex-shrink-0">
                      <div className="text-lg font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-500 rounded-full w-8 h-8 flex items-center justify-center">
                        {goals}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Goals</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No top scorer data available</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                for {getCurrentLeague()?.name || "Selected League"}
              </p>
            </div>
          )}

          {/* Stats link - always use the currently selected league */}
          {selectedLeague && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium group"
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
