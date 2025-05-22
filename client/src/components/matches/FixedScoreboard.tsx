import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, addDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import FixedMatchTimer from './FixedMatchTimer';

// Types
interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Fixture {
  id: number;
  date: string;
  status: {
    short: string;
    long: string;
    elapsed: number | null;
  };
  venue?: {
    id?: number;
    name?: string;
    city?: string;
  };
}

interface League {
  id: number;
  name: string;
  logo: string;
  round?: string;
}

interface Match {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

const FixedScoreboard = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch matches from popular leagues with proper filtering
  useEffect(() => {
    const popularLeagues = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga
    const currentSeason = 2024;

    const fetchMatches = async () => {
      try {
        setIsLoading(true);

        // Use a smaller date range to reduce data
        const todayDate = "2025-05-19";
        const tomorrowDate = "2025-05-20";
        const yesterdayDate = "2025-05-18";
        // Only fetch 2 additional days
        const day3Date = "2025-05-21";
        const day4Date = "2025-05-22";

        // Fetch fixtures for popular leagues for latest season with better error handling
        const leaguePromises = popularLeagues.map(async leagueId => {
          try {
            const response = await apiRequest('GET', `/api/leagues/${leagueId}/fixtures?season=${currentSeason}`);
            if (!response.ok) {
              console.log(`Error fetching league ${leagueId} fixtures: ${response.status}`);
              return [];
            }
            return await response.json();
          } catch (error) {
            console.error(`Error processing league ${leagueId} fixtures:`, error);
            return [];
          }
        });

        // Fetch today's fixtures with better error handling
        const todayPromise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${todayDate}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest('GET', `/api/fixtures/date/${todayDate}`);
            if (!response.ok) {
              console.log(`Error fetching today's fixtures: ${response.status}`);
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error('Error processing today\'s fixtures:', error);
            return [];
          }
        })();

        // Fetch tomorrow's fixtures with better error handling
        const tomorrowPromise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${tomorrowDate}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest('GET', `/api/fixtures/date/${tomorrowDate}`);
            if (!response.ok) {
              console.log(`Error fetching tomorrow's fixtures: ${response.status}`);
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error('Error processing tomorrow\'s fixtures:', error);
            return [];
          }
        })();

        // Fetch yesterday's fixtures with better error handling
        const yesterdayPromise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${yesterdayDate}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest('GET', `/api/fixtures/date/${yesterdayDate}`);
            if (!response.ok) {
              console.log(`Error fetching yesterday's fixtures: ${response.status}`);
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error('Error processing yesterday\'s fixtures:', error);
            return [];
          }
        })();

        // Fetch day 3 fixtures
        const day3Promise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${day3Date}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest('GET', `/api/fixtures/date/${day3Date}`);
            if (!response.ok) {
              console.log(`Error fetching day 3 fixtures: ${response.status}`);
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error('Error processing day 3 fixtures:', error);
            return [];
          }
        })();

        // Fetch day 4 fixtures
        const day4Promise = (async () => {
          try {
            // Check localStorage for cached data
            const cacheKey = `/api/fixtures/date/${day4Date}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
              return JSON.parse(cachedData);
            }

            const response = await apiRequest('GET', `/api/fixtures/date/${day4Date}`);
            if (!response.ok) {
              console.log(`Error fetching day 4 fixtures: ${response.status}`);
              return [];
            }

            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify(data)); // Store in localStorage
            return data;
          } catch (error) {
            console.error('Error processing day 4 fixtures:', error);
            return [];
          }
        })();

        // Fetch standings for popular leagues to identify top teams
        const standingsPromises = popularLeagues.map(async leagueId => {
          try {
            const response = await apiRequest('GET', `/api/leagues/${leagueId}/standings`);
            if (!response.ok) {
              console.log(`Error fetching league ${leagueId} standings: ${response.status}`);
              return null;
            }
            return await response.json();
          } catch (error) {
            console.error(`Error processing league ${leagueId} standings:`, error);
            return null;
          }
        });

        // Wait for all API calls to complete
        const [fixtureResults, standingsResults] = await Promise.all([
          Promise.all([
            ...leaguePromises,
            todayPromise,
            tomorrowPromise,
            yesterdayPromise,
            day3Promise,
            day4Promise
          ]),
          Promise.all(standingsPromises)
        ]);

        // Combine and filter out duplicate matches
        const allMatches = Array.from(
          new Map(
            fixtureResults.flat()
              .filter(match => match && match.fixture && match.teams && match.league)
              .map(match => [match.fixture.id, match])
          ).values()
        );

        console.log(`Total matches fetched: ${allMatches.length}`);

        // Use a date that matches our fixture data to ensure we show matches within 8 hours
        // When using the real API, this will be 'new Date()' to always show recent matches
        const now = new Date();

        console.log("Current filtering date:", now.toISOString());

        // Only use matches from the popular leagues list
        const popularLeagueMatches = allMatches.filter(match => 
          popularLeagues.includes(match.league.id)
        );

        console.log(`Filtered to ${popularLeagueMatches.length} matches from popular leagues only`);

        // Extract top 3 teams from standings for each league
        let topTeamIds: number[] = [];
        standingsResults.forEach(leagueStanding => {
          if (leagueStanding && leagueStanding.league && leagueStanding.league.standings) {
            leagueStanding.league.standings.forEach((standingGroup: any) => {
              // Get top 3 teams from each standings group
              if (Array.isArray(standingGroup) && standingGroup.length > 0) {
                const groupTopTeams = standingGroup.slice(0, 3).map((teamData: any) => {
                  return teamData?.team?.id;
                }).filter(Boolean);
                topTeamIds.push(...groupTopTeams);
              }
            });
          }
        });

        // Define popular teams by ID (big teams that should be prioritized)
        // plus top standings teams we extracted above
        const manualPopularTeamIds = [33, 42, 40, 39, 49, 48, 529, 530, 541, 497, 505, 157, 165]; // Big teams

        // Combine manual and standings-based team IDs and remove duplicates
        const uniqueTeamIds = Array.from(new Set([...manualPopularTeamIds, ...topTeamIds]));

        // Helper functions for filtering
        const isPopularTeamMatch = (match: Match) => {
          return uniqueTeamIds.includes(match.teams.home.id) || uniqueTeamIds.includes(match.teams.away.id);
        };

        // Check if match is a final or semifinal
        const isFinalOrSemifinal = (match: Match) => {
          const round = match.league.round?.toLowerCase() || '';
          return round.includes('final') || round.includes('semi') || round.includes('semi-final');
        };

        // Teams to exclude
        const excludeTeamIds = [52, 76]; // Teams to exclude

        // Function to check if a match should be excluded
        const shouldExcludeMatch = (match: Match) => {
          return excludeTeamIds.includes(match.teams.home.id) || 
                 excludeTeamIds.includes(match.teams.away.id);
        };

        // Filter matches according to specified criteria - ONLY from popular leagues

        // 1. Live matches from popular leagues
        const liveMatches = popularLeagueMatches.filter(match => 
          ['1H', '2H', 'HT', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(match.fixture.status.short)
        );

        // 2. Upcoming matches - limit to 5 days (a balance to ensure we have enough matches to display)
        const upcomingMatches = popularLeagueMatches.filter(match => {
          if (match.fixture.status.short !== 'NS') return false;

          const matchDate = new Date(match.fixture.date);
          const timeDiffHours = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          const timeDiffDays = timeDiffHours / 24;

          // Only include future matches
          if (timeDiffHours < 0) return false;

          // For finals/semifinals, give a little more leeway (5 days)
          if (isFinalOrSemifinal(match) && timeDiffDays <= 5) return true;

          // For regular matches, be more permissive to ensure we have matches to display
          return timeDiffDays <= 30;
        }).sort((a, b) => {
          // Sort by importance, then by time
          const aIsFinal = isFinalOrSemifinal(a);
          const bIsFinal = isFinalOrSemifinal(b);

          // Finals/semifinals first
          if (aIsFinal && !bIsFinal) return -1;
          if (!aIsFinal && bIsFinal) return 1;

          // Then by time - closest to now first
          return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
        });

        // 3. Recently finished matches - improved 8-hour window
        const finishedMatches = popularLeagueMatches.filter(match => {
          if (!['FT', 'AET', 'PEN'].includes(match.fixture.status.short)) return false;

          // Calculate hours since match ended
          const matchDate = new Date(match.fixture.date);
          const matchEndTime = new Date(matchDate.getTime() + (2 * 60 * 60 * 1000)); // Match + ~2 hours
          const hoursSinceCompletion = (now.getTime() - matchEndTime.getTime()) / (1000 * 60 * 60);

          // Debug output to check time calculations
          if (hoursSinceCompletion >= 0 && hoursSinceCompletion <= 10) {
            console.log(`Match within time window: ${match.teams.home.name} vs ${match.teams.away.name}, Hours since: ${hoursSinceCompletion.toFixed(1)}`);
          }

          // Show all matches completed within the last 8 hours
          return hoursSinceCompletion >= 0 && hoursSinceCompletion <= 8;
        }).sort((a, b) => {
          // Sort by importance first, then by recency
          const aIsFinal = isFinalOrSemifinal(a);
          const bIsFinal = isFinalOrSemifinal(b);

          // Finals/semifinals first
          if (aIsFinal && !bIsFinal) return -1;
          if (!aIsFinal && bIsFinal) return 1;

          // Most recently finished first
          return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
        });

        // Log match count for better insight
        console.log(`Match breakdown from popular leagues - Live: ${liveMatches.length}, Upcoming (within 8h): ${upcomingMatches.filter(m => {
          const matchDate = new Date(m.fixture.date);
          const timeDiffHours = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          return timeDiffHours <= 8;
        }).length}, Finished (within 8h): ${finishedMatches.length}`);

        // Build the final match list with proper prioritization
        let finalMatches: Match[] = [];

        // PRIORITY 1: Live matches with popular teams or finals/semifinals
        const livePopularMatches = liveMatches
          .filter(match => isPopularTeamMatch(match) || isFinalOrSemifinal(match))
          .filter(match => !shouldExcludeMatch(match));

        if (livePopularMatches.length > 0) {
          finalMatches = [...livePopularMatches];
        }

        // PRIORITY 2: Finals or semifinals (upcoming within 3-4 days or just finished)
        const specialMatches = [...upcomingMatches, ...finishedMatches]
          .filter(match => isFinalOrSemifinal(match) && !shouldExcludeMatch(match));

        if (specialMatches.length > 0 && finalMatches.length < 6) {
          const specialToAdd = specialMatches
            .filter(match => !finalMatches.some(m => m.fixture.id === match.fixture.id))
            .slice(0, 6 - finalMatches.length);
          finalMatches = [...finalMatches, ...specialToAdd];
        }

        // PRIORITY 3: Recently finished matches with popular teams
        const finishedPopularMatches = finishedMatches
          .filter(match => isPopularTeamMatch(match) && !shouldExcludeMatch(match))
          .filter(match => !finalMatches.some(m => m.fixture.id === match.fixture.id));

        if (finishedPopularMatches.length > 0 && finalMatches.length < 6) {
          const finishedToAdd = finishedPopularMatches.slice(0, 6 - finalMatches.length);
          finalMatches = [...finalMatches, ...finishedToAdd];
        }

        // PRIORITY 4: Upcoming matches with popular teams - prioritize closest ones
        const upcomingPopularMatches = upcomingMatches
          .filter(match => isPopularTeamMatch(match) && !shouldExcludeMatch(match))
          .filter(match => !finalMatches.some(m => m.fixture.id === match.fixture.id));

        if (upcomingPopularMatches.length > 0 && finalMatches.length < 6) {
          const upcomingToAdd = upcomingPopularMatches.slice(0, 6 - finalMatches.length);
          finalMatches = [...finalMatches, ...upcomingToAdd];
        }

        // No need for specific match overrides - we'll use our standard filter criteria

        // Ensure limit of exactly 6 matches for the carousel
        finalMatches = finalMatches.slice(0, 6);

        console.log(`Displaying ${finalMatches.length} matches`);

        if (finalMatches.length > 0) {
          console.log(`First match: ${finalMatches[0].teams.home.name} vs ${finalMatches[0].teams.away.name}`);
        }

        setMatches(finalMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast({
          title: 'Error',
          description: 'Failed to load matches',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();

    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchMatches();
      // Clear local storage to re-fetch every day (or shorter interval if needed)
      localStorage.clear();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [toast]);

  const currentMatch = matches[currentIndex];

  // Find and display match with countdown timer if one exists
  useEffect(() => {
    if (!matches.length) return;

    // Preload team logos
    matches.forEach(match => {
      const homeLogo = match?.teams?.home?.logo;
      const awayLogo = match?.teams?.away?.logo;
      if (homeLogo) {
        const img = new Image();
        img.src = homeLogo;
      }
      if (awayLogo) {
        const img = new Image();
        img.src = awayLogo;
      }
    });

    // Find match within 8 hours window
    const now = new Date("2025-05-19T12:00:00Z");
    const upcomingMatchIndex = matches.findIndex(match => {
      if (match.fixture.status.short !== 'NS') return false;

      try {
        const matchDate = parseISO(match.fixture.date);
        const hoursToMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursToMatch >= 0 && hoursToMatch <= 8;
      } catch (e) {
        return false;
      }
    });

    // If we found a match within 8 hours, display it
    if (upcomingMatchIndex !== -1) {
      setCurrentIndex(upcomingMatchIndex);
      console.log(`Found match with countdown: ${matches[upcomingMatchIndex].teams.home.name} vs ${matches[upcomingMatchIndex].teams.away.name}`);
    }
  }, [matches]);

  // Only use effect for fetching match data
  useEffect(() => {
    // Just a placeholder to ensure the component works
    if (matches.length === 0) return;

    // Any additional match data initialization can go here if needed
  }, [matches]);

  // Navigation handlers
  const handlePrevious = () => {
    if (matches.length <= 1) return;
    setCurrentIndex(prev => (prev === 0 ? matches.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (matches.length <= 1) return;
    setCurrentIndex(prev => (prev === matches.length - 1 ? 0 : prev + 1));
  };

  const handleMatchClick = () => {
    if (currentMatch?.fixture?.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  // State to track elapsed time for live matches
  const [liveElapsed, setLiveElapsed] = useState<number | null>(null);

  // Update timer for live matches
  useEffect(() => {
    if (!currentMatch) return;

    // Only set up timer for live matches
    if (!['1H', '2H'].includes(currentMatch.fixture.status.short)) {
      setLiveElapsed(null);
      return;
    }

    // Initialize with current elapsed time from the API
    if (currentMatch.fixture.status.elapsed) {
      setLiveElapsed(currentMatch.fixture.status.elapsed);
    }

    // Update timer every minute for live matches
    const timer = setInterval(() => {
      setLiveElapsed(prev => prev !== null ? prev + 1 : prev);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [currentMatch]);

  // Format match status to show appropriate information based on match state
  const getMatchStatus = (match: Match | undefined) => {
    if (!match) return 'No Match Data';

    const { fixture } = match;
    // Use hardcoded "now" for demo purposes to match the fixture dates in our data
    const now = new Date("2025-05-19T12:00:00Z");

    // LIVE MATCHES - show match minute or halftime
    if (['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(fixture.status.short)) {
      // For halftime
      if (fixture.status.short === 'HT') {
        return 'Half Time';
      }
      // For live match with timer
      else if (['1H', '2H'].includes(fixture.status.short)) {
        // Use our tracked elapsed time if available, otherwise fall back to API
        const elapsed = liveElapsed || fixture.status.elapsed || 0;
        const halfLabel = fixture.status.short === '1H' ? 'First half' : 'Second half';
        return `${halfLabel}: ${elapsed}'`;
      }
      // For other live states
      else {
        return fixture.status.long || 'LIVE';
      }
    } 
    // FINISHED MATCHES
    else if (fixture.status.short === 'FT') {
      try {
        const matchDate = parseISO(fixture.date);
        // Calculate how long ago match ended (add ~2 hours to start time)
        const estimatedEndTime = new Date(matchDate.getTime() + (2 * 60 * 60 * 1000));
        const hoursSince = Math.floor((now.getTime() - estimatedEndTime.getTime()) / (1000 * 60 * 60));

        if (hoursSince <= 1) {
          return 'Just finished';
        } else if (hoursSince < 8) {
          return `${hoursSince}h ago`;
        } else {
          return 'Full Time';
        }
      } catch (e) {
        return 'Full Time';
      }
    } 
    // UPCOMING MATCHES
    else {
      try {
        const matchDate = parseISO(fixture.date);
        const now = new Date("2025-05-19T12:00:00Z"); // Use same hardcoded time as above for consistency

        // Get time differences in various units
        const msToMatch = matchDate.getTime() - now.getTime();
        const daysToMatch = Math.floor(msToMatch / (1000 * 60 * 60 * 24));

        // For matches today, show a simple format
        if (daysToMatch === 0) {
          try {
            const hoursToMatch = Math.floor(msToMatch / (1000 * 60 * 60));
            // For matches less than 8 hours away, show timer below "Today"
            if (hoursToMatch >= 0 && hoursToMatch < 8) {
              return (
                <div className="flex flex-col space-y-0 relative pb-6">
                  <span className="text-gray-500">Today</span>
                  <div style={{ fontSize: '0.65rem', position: 'absolute', top: '80%', left: '50%', transform: 'translateX(-50%)', width: '200px', textAlign: 'center', zIndex: 20, marginTop: '-15px' }}>
                    <span className="font-bold text-red-500">Live start in:</span> 
                    <span className="text-red-500"><FixedMatchTimer matchDate={matchDate.toISOString()} /></span>
                  </div>
                </div>
              );
            } else {
              // More than 8 hours away
              return <span className="text-gray-500">Today</span>;
            }
          } catch (e) {
            return <span className="text-gray-500">Today</span>;
          }
        }

        // For matches tomorrow or later, show the regular format
        if (daysToMatch === 1) {
          return <span className="text-gray-500">Tomorrow</span>;
        } else if (daysToMatch <= 7) {
          return <span className="text-gray-500">{daysToMatch} more days</span>;
        } else {
          return <span className="text-gray-500">{format(matchDate, 'MMM d')}</span>;
        }
      } catch (e) {
        return <span className="text-gray-500">Upcoming</span>;
      }
    }
  };

  // Get match status label with proper formatting
  const getMatchStatusLabel = (match: Match | undefined) => {
    if (!match) return '';

    const { fixture, league } = match;

    if (['1H', '2H', 'HT', 'LIVE', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(fixture.status.short)) {
      return 'LIVE';
    } else if (fixture.status.short === 'FT') {
      return 'FINISHED';
    } else {
      // Show league/tournament round for upcoming matches
      return league.round || 'UPCOMING';
    }
  };

  // Team color helper function
  const getTeamColor = (teamId: number) => {
    const colors = [
      '#6f7c93', // blue-gray
      '#8b0000', // dark red
      '#1d3557', // dark blue
      '#2a9d8f', // teal
      '#e63946', // red
    ];
    return colors[teamId % colors.length];
  };

  return (
    <>
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        Featured Match
      </Badge>

      <Card className="px-0 pt-2 pb-2 relative">
        {matches.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black h-[58px] w-[26px] p-2 rounded-r-full z-40 flex items-center border border-gray-200"
            >
              <ChevronLeft className="h-14 w-14" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black h-[58px] w-[26px] p-2 rounded-l-full z-40 flex items-center border border-gray-200"
            >
              <ChevronRight className="h-14 w-14" />
            </button>
          </>
        )}
        {isLoading && matches.length === 0 ? (
          // Loading state with skeleton
          <div className="p-4">
            {/* League info skeleton */}
            <div className="flex items-center justify-center mb-4">
              <Skeleton className="h-5 w-5 rounded-full mr-2" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Match time skeleton */}
            <Skeleton className="h-6 w-40 mx-auto mb-6" />

            {/* Teams skeleton */}
            <div className="relative mt-4">
              <div className="flex justify-between items-center h-[53px] mb-8">
                <div className="flex items-center w-[45%]">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 ml-4" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex items-center justify-end w-[45%]">
                  <Skeleton className="h-6 w-24 mr-4" />
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
              </div>
            </div>

            {/* Bottom nav skeleton */}
            <div className="flex justify-around mt-4 pt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center w-1/4">
                  <Skeleton className="h-5 w-5 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : !currentMatch ? (
          // Empty state - no matches available
          <div className="flex justify-center items-center py-14 text-gray-500">
            <span>No matches available at this moment</span>
          </div>
        ) : (
          // Matches available - show content
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden h-full w-full bg-white shadow-sm cursor-pointer"
              onClick={handleMatchClick}
            >
                <div className="p-0 h-full my-[10px] relative">
                {/* League info and match header at the top */}
                <div className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center justify-center h-[60px] bg-white/95 backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex-shrink-0">
                    {currentMatch?.league?.logo ? (
                      <img 
                        src={currentMatch.league.logo} 
                        alt={currentMatch.league.name} 
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/fallback-logo.svg';
                        }}
                      />
                    ) : (
                      <Trophy className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-black whitespace-nowrap">
                      {currentMatch?.league?.name || 'League Name'}
                    </p>
                    <span className="text-gray-400 mx-1">•</span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-2 py-0.5 border whitespace-nowrap ${
                        getMatchStatusLabel(currentMatch) === 'LIVE' 
                          ? 'border-red-500 text-red-500 animate-pulse' 
                          : getMatchStatusLabel(currentMatch) === 'FINISHED'
                          ? 'border-gray-500 text-gray-500'
                          : 'border-blue-500 text-blue-500'
                    }`}
                  >
                    {getMatchStatusLabel(currentMatch)}
                  </Badge>
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {(() => {
                      try {
                        const matchDate = parseISO(currentMatch.fixture.date);
                        return format(matchDate, 'MMM d');
                      } catch (e) {
                        return '';
                      }
                    })()}
                  </span>
                </div>
              </div>

              {/* Fixed height container for match status and score */}
              <div className="h-[80px] flex flex-col justify-center" style={{ marginBottom: '-5px' }}>
                {/* Match time/status display */}
                <div className="font-medium text-center" style={{ fontSize: 'calc(0.875rem * 1.5)', fontWeight: '600' }}>                  {getMatchStatus(currentMatch)}
                </div>

                {/* Score display with date for finished matches */}
                <div className="h-[24px] flex items-center justify-center gap-3">
                  {currentMatch?.fixture?.status?.short && 
                   ['FT', 'AET', 'PEN'].includes(currentMatch.fixture.status.short) && (
                    <>
                      <div className="text-xl font-bold flex gap-2 items-center">
                        <span>{currentMatch?.goals?.home ?? 0}</span>
                        <span className="text-base">-</span>
                        <span>{currentMatch?.goals?.away ?? 0}</span>
                      </div>
                      <span className="text-sm text-gray-500">•</span>
                      <div className="text-sm text-gray-500">
                        {(() => {
                          try {
                            const matchDate = parseISO(currentMatch.fixture.date);
                            return format(matchDate, 'MMM d');
                          } catch (e) {
                            return '';
                          }
                        })()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Team scoreboard */}
              <div className="relative">
                <div 
                  className="flex relative h-[53px] rounded-md mb-8"
                  onClick={handleMatchClick}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="w-full h-full flex justify-between relative">
                    {/* Home team colored bar and logo */}
                    <div className="h-full w-[calc(50%-64px)] ml-[64px] relative" 
                      style={{ 
                        background: getTeamColor(currentMatch?.teams?.home?.id || 0)
                      }}
                    >
                      {currentMatch?.teams?.home && (
                      <img 
                        src={currentMatch.teams.home.logo || `/assets/fallback-logo.svg`}
                        alt={currentMatch.teams.home.name || 'Home Team'} 
                        className="absolute z-20 w-[64px] h-[64px] object-contain"
                        style={{
                          cursor: 'pointer',
                          top: "calc(50% - 32px)",
                          left: "-32px"
                        }}
                        onClick={handleMatchClick}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('sportmonks') && currentMatch.teams.home.logo) {
                            target.src = currentMatch.teams.home.logo;
                          } else if (target.src !== '/assets/fallback-logo.svg') {
                            target.src = '/assets/fallback-logo.svg';
                          }
                        }}
                      />
                    )}

                      {/* Match time & venue information below VS - for ALL matches */}
                      <div className="absolute text-center text-xs text-gray-500 w-[300px]" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'visible', textAlign: 'center', zIndex: 30, left: '50%', transform: 'translateX(-50%)', top: 'calc(50% + 35px)' }}>
                        {(() => {
                          try {
                            const matchDate = parseISO(currentMatch.fixture.date);
                            const formattedDate = format(matchDate, "EEEE, do MMM");
                            const timeOnly = format(matchDate, 'HH:mm');

                            return (
                              <>
                                {formattedDate} | {timeOnly}
                                {currentMatch.fixture.venue?.name ? (' | ' + currentMatch.fixture.venue.name) : ''}
                              </>
                            );
                          } catch (e) {
                            return currentMatch.fixture.venue?.name || '';
                          }
                        })()}
                      </div>
                    </div>

                    <div className="absolute text-white font-bold text-sm uppercase text-left max-w-[120px] truncate md:max-w-[200px]" style={{top: "calc(50% - 8px)", left: "110px"}}>
                      {currentMatch?.teams?.home?.name || 'TBD'}
                    </div>



                    {/* VS circle */}
                    <div 
                      className="absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden"
                      style={{
                        background: '#a00000',
                        left: 'calc(50% - 26px)',
                        top: 'calc(50% - 26px)',
                        minWidth: '52px'
                      }}
                    >
                      <span className="vs-text font-bold">VS</span>
                    </div>

                    {/* Away team colored bar and logo */}
                    <div className="h-full w-[calc(50%-52px)] mr-[82px]" 
                      style={{ 
                        background: getTeamColor(currentMatch.teams.away.id)
                      }}
                    >
                    </div>

                    <div className="absolute text-white font-bold text-sm uppercase text-right max-w-[120px] truncate md:max-w-[200px]" style={{top: "calc(50% - 8px)", right: "130px"}}>
                      {currentMatch?.teams?.away?.name || 'Away Team'}
                    </div>

                    <img 
                      src={currentMatch?.teams?.away?.logo || `/assets/fallback-logo.svg`}
                      alt={currentMatch?.teams?.away?.name || 'Away Team'} 
                      className="absolute z-20 w-[64px] h-[64px] object-contain"
                      style={{
                        cursor: 'pointer',
                        top: "calc(50% - 32px)",
                        right: "52px"
                      }}
                      onClick={handleMatchClick}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/fallback-logo.svg';
                      }}
                    />

                    </div>
                </div>
              </div>

              {/* Bottom navigation */}
              <div className="flex justify-around border-t border-gray-200 pt-4">
                <button 
                  className="flex flex-col items-center cursor-pointer w-1/4"
                  onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}`)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600">
                    <path d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z" fill="currentColor" />
                  </svg>
                  <span className="text-[0.75rem] text-gray-600 mt-1">Match Page</span>
                </button>
                <button 
                  className="flex flex-col items-center cursor-pointer w-1/4"
                  onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}/lineups`)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600">
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 19H5V15H11V19ZM11 13H5V9H11V13ZM11 7H5V5H11V7ZM13 19V5H19V19H13Z" fill="currentColor" />
                  </svg>
                  <span className="text-[0.75rem] text-gray-600 mt-1">Lineups</span>
                </button>
                <button 
                  className="flex flex-col items-center cursor-pointer w-1/4"
                  onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}/h2h`)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600">
                    <path d="M14.06 9.02L16.66 11.62L14.06 14.22L15.48 15.64L18.08 13.04L20.68 15.64L19.26 17.06L21.86 19.66L20.44 21.08L17.84 18.48L15.24 21.08L13.82 19.66L16.42 17.06L15.06 15.64L12.46 13.04L15.06 10.44L13.64 9.02L11.04 11.62L8.44 9.02L9.86 7.6L7.26 5L4.66 7.6L6.08 9.02L3.48 11.62L6.08 14.22L4.66 15.64L2.06 13.04L4.66 10.44L6.08 9.02L3.48 6.42L4.9 5L7.5 7.6L10.1 5L11.52 6.42L8.92 9.02L11.52 11.62L14.06 9.02M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 12 2Z" fill="currentColor" />
                  </svg>
                  <span className="text-[0.75rem] text-gray-600 mt-1">H2H</span>
                </button>
                <button 
                  className="flex flex-col items-center cursor-pointer w-1/4"
                  onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}/standings`)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600">
                    <path d="M12 4C11.17 4 10.36 4.16 9.59 4.47L7.75 6.32L16.68 15.25L18.53 13.4C18.84 12.64 19 11.83 19 11C19 7.13 15.87 4 12 4M5.24 8.66L6.66 7.24L7.93 8.51C8.74 8.2 9.56 8 10.4 7.83L12.24 5.96L3.31 14.89L5.24 8.66M13.6 16.6L5.33 21.88C5.72 22.4 6.29 22.88 6.93 23.17L8.77 21.33L16.36 13.74L13.6 16.6M15.25 17.75L13.4 19.6C12.64 19.84 11.83 20 11 20C7.13 20 4 16.87 4 13C4 12.17 4.16 11.36 4.47 10.59L6.32 8.75L15.25 17.75Z" fill="currentColor" />
                  </svg>
                  <span className="text-[0.75rem] text-gray-600 mt-1">Standings</span>
                </button>
              </div>

              {/* Navigation dots */}
              {matches.length > 1 && (
                <div className="flex justify-center gap-2 py-2 mt-2">
                  {matches.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentIndex ? 'bg-black' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </Card>
    </>
  );
};

export default FixedScoreboard;