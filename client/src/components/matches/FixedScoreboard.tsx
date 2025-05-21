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
    const popularLeagues = [2, 3, 39, 140, 135, 78];
    const currentSeason = 2024;

    const fetchMatches = async () => {
      try {
        setIsLoading(true);

        // Use API-provided dates for best results in demo environment
        const todayDate = "2025-05-19";
        const tomorrowDate = "2025-05-20";
        const yesterdayDate = "2025-05-18";
        // Adding more days for upcoming matches
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
            const response = await apiRequest('GET', `/api/fixtures/date/${todayDate}`);
            if (!response.ok) {
              console.log(`Error fetching today's fixtures: ${response.status}`);
              return [];
            }
            return await response.json();
          } catch (error) {
            console.error('Error processing today\'s fixtures:', error);
            return [];
          }
        })();

        // Fetch tomorrow's fixtures with better error handling
        const tomorrowPromise = (async () => {
          try {
            const response = await apiRequest('GET', `/api/fixtures/date/${tomorrowDate}`);
            if (!response.ok) {
              console.log(`Error fetching tomorrow's fixtures: ${response.status}`);
              return [];
            }
            return await response.json();
          } catch (error) {
            console.error('Error processing tomorrow\'s fixtures:', error);
            return [];
          }
        })();

        // Fetch yesterday's fixtures with better error handling
        const yesterdayPromise = (async () => {
          try {
            const response = await apiRequest('GET', `/api/fixtures/date/${yesterdayDate}`);
            if (!response.ok) {
              console.log(`Error fetching yesterday's fixtures: ${response.status}`);
              return [];
            }
            return await response.json();
          } catch (error) {
            console.error('Error processing yesterday\'s fixtures:', error);
            return [];
          }
        })();
        
        // Fetch day 3 fixtures
        const day3Promise = (async () => {
          try {
            const response = await apiRequest('GET', `/api/fixtures/date/${day3Date}`);
            if (!response.ok) {
              console.log(`Error fetching day 3 fixtures: ${response.status}`);
              return [];
            }
            return await response.json();
          } catch (error) {
            console.error('Error processing day 3 fixtures:', error);
            return [];
          }
        })();
        
        // Fetch day 4 fixtures
        const day4Promise = (async () => {
          try {
            const response = await apiRequest('GET', `/api/fixtures/date/${day4Date}`);
            if (!response.ok) {
              console.log(`Error fetching day 4 fixtures: ${response.status}`);
              return [];
            }
            return await response.json();
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

        // Use the current date from fixtures to ensure we get matches
        // Important: for testing with our fixture data, we need to use 2025 date
        const now = new Date("2025-05-19T12:00:00Z");
        console.log("Using date for filtering:", now.toISOString());

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
        
        // 3. Recently finished matches - show within 48 hours for testing purposes
        const finishedMatches = popularLeagueMatches.filter(match => {
          if (!['FT', 'AET', 'PEN'].includes(match.fixture.status.short)) return false;
          
          // For testing purposes, include all finished matches from the dataset
          // We can adjust this back to 8 hours once we've verified navigation works
          return true;
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

  // Simple team color based on team ID
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

      <CardContent className="px-0 pt-2 pb-2 relative">
        {matches.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black h-[58px] w-[26px] p-2 rounded-r-full z-40 flex items-center border border-gray-200"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black h-[58px] w-[26px] p-2 rounded-l-full z-40 flex items-center border border-gray-200"
            >
              <ChevronRight className="h-10 w-10" />
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
              className="overflow-hidden h-full w-full"
            >
              <Card className="bg-white shadow-sm h-full w-full cursor-pointer"
                onClick={handleMatchClick}
              >
                <CardContent className="p-0 h-full"
              >
              {/* Match header with league info */}
              <div className="flex items-center justify-center mb-2 px-2 pt-4">
                <div className="flex-shrink-0 mr-2">
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
                  <p className="text-xs font-medium text-gray-700 mr-2">
                    {currentMatch?.league?.name || 'League Name'}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 border ${
                      getMatchStatusLabel(currentMatch) === 'LIVE' 
                        ? 'border-red-500 text-red-500 animate-pulse' 
                        : getMatchStatusLabel(currentMatch) === 'FINISHED'
                          ? 'border-gray-500 text-gray-500'
                          : 'border-blue-500 text-blue-500'
                    }`}
                  >
                    {getMatchStatusLabel(currentMatch)}
                  </Badge>
                </div>
              </div>

              {/* Match time/status display */}
              <div className="font-medium text-center mb-5" style={{ fontSize: 'calc(0.875rem * 1.5)', fontWeight: '600', position: 'relative', left: '50%', transform: 'translateX(-50%)' }}>
                {getMatchStatus(currentMatch)}
              </div>

              {/* Score display below status for finished matches */}
              {currentMatch?.fixture?.status?.short && 
               ['FT', 'AET', 'PEN'].includes(currentMatch.fixture.status.short) && (
                <div className="flex items-center justify-center mt-1 mb-1">
                  <div className="text-xl font-bold flex gap-2 items-center">
                    <span>{currentMatch?.goals?.home ?? 0}</span>
                    <span className="text-base">-</span>
                    <span>{currentMatch?.goals?.away ?? 0}</span>
                  </div>
                </div>
              )}

              {/* Team scoreboard */}
              <div className="relative mt-4">
                <div 
                  className="flex relative h-[53px] rounded-md mb-8"
                  onClick={handleMatchClick}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="w-full h-full flex justify-between relative">
                    {/* Home team colored bar and logo */}
                    <div className="h-full w-[calc(50%-32px)] ml-[32px] relative" 
                      style={{ 
                        background: currentMatch?.teams?.home?.id ? getTeamColor(currentMatch.teams.home.id) : '#6f7c93'
                      }}
                    >
                      {currentMatch?.teams?.home && (
                      <img 
                        src={currentMatch.teams.home.logo || `/assets/fallback-logo.svg`}
                        alt={currentMatch.teams.home.name || 'Home Team'} 
                        className="absolute left-[-27px] z-20 w-[64px] h-[64px] object-contain"
                        style={{
                          cursor: 'pointer',
                          top: "calc(50% - 32px)"
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

                      {/* Match time & venue information below VS */}
                      {currentMatch.fixture.status.short === 'NS' && (
                        <div className="absolute text-center text-xs text-gray-500 w-[300px]" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'visible', textAlign: 'center', zIndex: 30, left: '50%', transform: 'translateX(-50%)', top: 'calc(50% + 40px)' }}>
                          {(() => {
                            try {
                              const matchDate = parseISO(currentMatch.fixture.date);
                              const formattedDate = format(matchDate, "EEEE, do MMM");
                              const timeOnly = format(matchDate, 'HH:mm');

                              // Always show basic match information
                              return (
                                <div>
                                  {formattedDate} | {timeOnly}
                                  {currentMatch.fixture.venue?.name ? ` | ${currentMatch.fixture.venue.name}` : ''}
                                </div>
                              );
                            } catch (e) {
                              return currentMatch.fixture.venue?.name || '';
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="absolute left-[87px] text-white font-bold text-sm uppercase text-left max-w-[120px] truncate md:max-w-[200px]" style={{top: "calc(50% - 8px)"}}>
                      {currentMatch?.teams?.home?.name || 'TBD'}
                    </div>

                    {/* Score display above the VS circle */}
                    {currentMatch.fixture.status.short !== 'NS' && (
                      <div 
                        className="absolute text-white font-bold text-xl z-30 text-center"
                        style={{
                          left: 'calc(50% - 35px)', 
                          top: 'calc(50% - 40px)',
                          width: '70px'
                        }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>{currentMatch.goals.home ?? 0}</span>
                          <span className="text-sm">-</span>
                          <span>{currentMatch.goals.away ?? 0}</span>
                        </div>
                      </div>
                    )}

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
                    <div className="h-full w-[calc(50%-32px)] mr-[32px]" 
                      style={{ 
                        background: getTeamColor(currentMatch.teams.away.id)
                      }}
                    >
                    </div>

                    <img 
                      src={currentMatch?.teams?.away?.logo || `/assets/fallback-logo.svg`}
                      alt={currentMatch?.teams?.away?.name || 'Away Team'} 
                      className="absolute right-[13px] z-20 w-[64px] h-[64px] object-contain"
                      style={{
                        cursor: 'pointer',
                        top: "calc(50% - 32px)"
                      }}
                      onClick={handleMatchClick}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/fallback-logo.svg';
                      }}
                    />

                    <div className="absolute right-[87px] text-white font-bold text-sm uppercase text-right max-w-[120px] truncate md:max-w-[200px]" style={{top: "calc(50% - 8px)"}}>
                      {currentMatch?.teams?.away?.name || 'Away Team'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom navigation */}
              <div className="flex justify-around border-t border-gray-200 mt-2 pt-3">
                <button 
                  className="flex flex-col items-center cursor-pointer w-1/4"
                  onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}`)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                    <path d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z" fill="currentColor" />
                  </svg>
                  <span className="text-xs text-gray-600 mt-1">Match Page</span>
                </button>
                <button 
                  className="flex flex-col items-center cursor-pointer w-1/4"
                  onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}/lineups`)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 19H5V15H11V19ZM11 13H5V9H11V13ZM11 7H5V5H11V7ZM<previous_generation>```text
19 19H13V17H19V19ZM19 15H13V13H19V15ZM19 11H13V9H19V11ZM19 7H13V5H19V7Z" fill="currentColor" />
                  </svg>
                  <span className="text-xs text-gray-600 mt-1">Lineups</span>
                </button>
                <button 
                  className="flex flex-col items-center cursor-pointer w-1/4"
                  onClick={() => currentMatch?.fixture?.id && navigate(`/match/${currentMatch.fixture.id}/stats`)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor" />
                  </svg>
                  <span className="text-xs text-gray-600 mt-1">Stats</span>
                </button>
                <button 
                  className="flex flex-col items-center cursor-pointer w-1/4"
                  onClick={() => currentMatch?.league?.id && navigate(`/league/${currentMatch.league.id}/standings`)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor" />
                    <path d="M7 7H9V17H7V7Z" fill="currentColor" />
                    <path d="M11 7H13V17H11V7Z" fill="currentColor" />
                    <path d="M15 7H17V17H15V7Z" fill="currentColor" />
                  </svg>
                  <span className="text-xs text-gray-600 mt-1">Standings</span>
                </button>
              </div>

              {/* Navigation buttons for previous/next match */}
              {matches.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 flex justify-between items-center px-2 transform -translate-y-1/2 z-30 pointer-events-none">
                  <button 
                    onClick={handlePrevious}
                    className="bg-white bg-opacity-80 rounded-full p-1 shadow-md text-gray-700 hover:text-gray-900 pointer-events-auto"
                    aria-label="Previous match"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button 
                    onClick={handleNext}
                    className="bg-white bg-opacity-80 rounded-full p-1 shadow-md text-gray-700 hover:text-gray-900 pointer-events-auto"
                    aria-label="Next match"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Indicator dots for slideshow */}
              {matches.length > 1 && (
                <div className="flex justify-center gap-2 my-4">
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
              )}
            </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
        )}
      </CardContent>
    </>
  );
};

export default FixedScoreboard;