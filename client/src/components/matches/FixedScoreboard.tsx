import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, addDays } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

        // Fetch fixtures for popular leagues for latest season
        const leaguePromises = popularLeagues.map(leagueId => 
          apiRequest('GET', `/api/leagues/${leagueId}/fixtures?season=${currentSeason}`)
            .then(response => response.json())
            .catch(error => {
              console.error(`Error fetching league ${leagueId} fixtures:`, error);
              return [];
            })
        );

        // Also fetch today, yesterday, and tomorrow's fixtures for more comprehensive data
        const todayPromise = apiRequest('GET', `/api/fixtures/date/${todayDate}`)
          .then(response => response.json())
          .catch(error => {
            console.error('Error fetching today\'s fixtures:', error);
            return [];
          });

        const tomorrowPromise = apiRequest('GET', `/api/fixtures/date/${tomorrowDate}`)
          .then(response => response.json())
          .catch(error => {
            console.error('Error fetching tomorrow\'s fixtures:', error);
            return [];
          });

        const yesterdayPromise = apiRequest('GET', `/api/fixtures/date/${yesterdayDate}`)
          .then(response => response.json())
          .catch(error => {
            console.error('Error fetching yesterday\'s fixtures:', error);
            return [];
          });

        // Wait for all API calls to complete
        const allResults = await Promise.all([
          ...leaguePromises,
          todayPromise,
          tomorrowPromise,
          yesterdayPromise
        ]);

        // Combine and filter out duplicate matches
        const allMatches = Array.from(
          new Map(
            allResults.flat()
              .filter(match => match && match.fixture && match.teams && match.league)
              .map(match => [match.fixture.id, match])
          ).values()
        );

        console.log(`Total matches fetched: ${allMatches.length}`);

        // Mock current time for the demo (matches the fixture dates in the system)
        const now = new Date("2025-05-19T12:00:00Z");

        // Only use matches from the popular leagues list
        const popularLeagueMatches = allMatches.filter(match => 
          popularLeagues.includes(match.league.id)
        );

        console.log(`Filtered to ${popularLeagueMatches.length} matches from popular leagues only`);

        // Filter matches according to specified criteria - ONLY from popular leagues

        // 1. Live matches from popular leagues
        const liveMatches = popularLeagueMatches.filter(match => 
          ['1H', '2H', 'HT', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(match.fixture.status.short)
        );

        // 2. Upcoming matches from popular leagues - show if within 8 hours of start time
        const upcomingMatches = popularLeagueMatches.filter(match => {
          if (match.fixture.status.short !== 'NS') return false;

          const matchDate = new Date(match.fixture.date);
          const timeDiff = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60); // hours

          // Keep matches within next 8 hours
          return timeDiff >= 0 && timeDiff <= 8;
        }).sort((a, b) => 
          new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
        );

        // 3. Recently finished matches from popular leagues - only show within 8 hours after completion
        const finishedMatches = popularLeagueMatches.filter(match => {
          if (match.fixture.status.short !== 'FT') return false;

          const matchDate = new Date(match.fixture.date);
          // For finished matches, add ~2 hours to match start time to approximate end time
          const estimatedEndTime = new Date(matchDate.getTime() + (2 * 60 * 60 * 1000));
          const hoursSinceCompletion = (now.getTime() - estimatedEndTime.getTime()) / (1000 * 60 * 60);

          // Only show if completed within last 8 hours
          return hoursSinceCompletion >= 0 && hoursSinceCompletion <= 8;
        }).sort((a, b) => 
          new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
        );

        console.log(`Match breakdown from popular leagues - Live: ${liveMatches.length}, Upcoming (within 8h): ${upcomingMatches.length}, Finished (within 8h): ${finishedMatches.length}`);

        // Combine matches with priority
        let finalMatches: Match[] = [];

        // 1. Live matches have highest priority
        if (liveMatches.length > 0) {
          finalMatches = [...liveMatches];
        }

        // 2. Add some recently finished matches if we have space
        if (finishedMatches.length > 0 && finalMatches.length < 6) {
          const finishedToAdd = finishedMatches.slice(0, 6 - finalMatches.length);
          finalMatches = [...finalMatches, ...finishedToAdd];
        }

        // 3. Add upcoming matches within 8 hours if we have space
        if (upcomingMatches.length > 0 && finalMatches.length < 6) {
          const upcomingToAdd = upcomingMatches.slice(0, 6 - finalMatches.length);
          finalMatches = [...finalMatches, ...upcomingToAdd];
        }

        // 4. If we still don't have enough, add other matches from popular leagues
        if (finalMatches.length < 6) {
          // Get other matches from popular leagues not already included
          const otherPopularMatches = popularLeagueMatches
            .filter(match => !finalMatches.find(m => m.fixture.id === match.fixture.id))
            .sort((a, b) => {
              // Sort by closest match time to now (upcoming preferred over past)
              const aDate = new Date(a.fixture.date);
              const bDate = new Date(b.fixture.date);
              const aTimeDiff = aDate.getTime() - now.getTime();
              const bTimeDiff = bDate.getTime() - now.getTime();

              // Prioritize upcoming over finished matches
              if (aTimeDiff >= 0 && bTimeDiff < 0) return -1;
              if (aTimeDiff < 0 && bTimeDiff >= 0) return 1;

              // Otherwise sort by closest to now
              return Math.abs(aTimeDiff) - Math.abs(bTimeDiff);
            })
            .slice(0, 6 - finalMatches.length);

          finalMatches = [...finalMatches, ...otherPopularMatches];
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
        const hoursToMatch = Math.floor(msToMatch / (1000 * 60 * 60));
        const minutesToMatch = Math.floor((msToMatch % (1000 * 60 * 60)) / (1000 * 60));
        
        // For matches today (within 24 hours), show the time
        if (daysToMatch === 0) {
          return `Today ${format(matchDate, 'HH:mm')}`;
        }
        
        // If match is tomorrow, show "Tomorrow"
        if (daysToMatch === 1) {
          return 'Tomorrow';
        }
        
        // If match is within 3 days, show "X more days"
        if (daysToMatch > 1 && daysToMatch <= 3) {
          return `${daysToMatch} more days`;
        }
        
        // For matches further away, show month and date
        return format(matchDate, 'MMM d');
      } catch (e) {
        return 'Upcoming';
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
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
      >
        Featured Match
      </Badge>

      {matches.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-[45%] h-[14%] -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black px-1 rounded-r-full z-30 flex items-center border border-gray-200 transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-[45%] h-[14%] -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black px-1 rounded-l-full z-30 flex items-center border border-gray-200 transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </>
      )}

      <CardContent className="p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            {/* League and match status header */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                {currentMatch?.league?.logo && (
                  <img 
                    src={currentMatch.league.logo} 
                    alt={currentMatch.league.name}
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=L';
                    }}
                  />
                )}
                <span className="text-sm font-medium">{currentMatch?.league?.name || 'League Name'}</span>
              </div>

              <span className="text-gray-400">-</span>

              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-indigo-600" />
                <span className={`text-sm font-medium ${getMatchStatusLabel(currentMatch) === 'LIVE' ? 'text-red-600' : 'text-indigo-800'}`}>
                  {getMatchStatusLabel(currentMatch) || 'UPCOMING'}
                </span>
              </div>
            </div>

            {/* Match time/status information */}
            <div className="text-lg font-semibold text-center mb-3">
              <div className="flex flex-col items-center mb-[5px]">
                {/* Simple static status display */}
                <div className="h-8 flex justify-center items-center">
                  {(() => {
                    if (!currentMatch) return null;
                    
                    if (getMatchStatusLabel(currentMatch) === 'LIVE') {
                      return (
                        <span className="text-red-600 font-bold">
                          {currentMatch.fixture.status.short === '1H' 
                            ? `First half: ${currentMatch.fixture.status.elapsed}'` 
                            : currentMatch.fixture.status.short === '2H'
                              ? `Second half: ${currentMatch.fixture.status.elapsed}'`
                              : 'LIVE'}
                        </span>
                      );
                    }
                    
                    if (currentMatch.fixture.status.short === 'NS') {
                      try {
                        const matchDate = parseISO(currentMatch.fixture.date);
                        const now = new Date("2025-05-19T12:00:00Z");
                        const msToMatch = matchDate.getTime() - now.getTime();
                        const daysToMatch = Math.floor(msToMatch / (1000 * 60 * 60 * 24));
                        
                        // For matches today, show a simple format instead of timer
                        if (daysToMatch === 0) {
                          return <span className="text-gray-500">Today {format(matchDate, 'HH:mm')}</span>;
                        }
                        
                        // For matches tomorrow or later, show the regular format
                        if (daysToMatch === 1) {
                          return <span className="text-gray-500">Tomorrow</span>;
                        } else if (daysToMatch <= 3) {
                          return <span className="text-gray-500">{daysToMatch} more days</span>;
                        } else {
                          return <span className="text-gray-500">{format(matchDate, 'MMM d')}</span>;
                        }
                      } catch (e) {
                        return <span className="text-gray-500">Upcoming</span>;
                      }
                    }
                    
                    return <span className="text-gray-500">Full Time</span>;
                  })()}
                </div>
              </div>
            </div>

            {/* Team scoreboard */}
            <div className="relative">
              {isLoading && !currentMatch ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                </div>
              ) : currentMatch ? (
                <div 
                  className="flex relative h-[53px] rounded-md mb-8 transition-all duration-300 ease-in-out opacity-100 mt-[-8px]"
                  onClick={handleMatchClick}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="w-full h-full flex justify-between relative">
                    {/* Home team colored bar and logo */}
                    <div className="h-full w-[calc(50%-67px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative" 
                      style={{ 
                        background: getTeamColor(currentMatch.teams.home.id),
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      <img 
                        src={`https://cdn.sportmonks.com/images/soccer/teams/${currentMatch.teams.home.id % 100}.png`} 
                        alt={currentMatch.teams.home.name} 
                        className="absolute left-[-32px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-90 saturate-150 drop-shadow-[0_0_8px_rgba(0,0,0,0.6)]"
                        style={{
                          cursor: 'pointer',
                          top: "calc(50% - 32px)",
                          filter: "contrast(1.2) brightness(0.9) saturate(1.2)"
                        }}
                        onClick={handleMatchClick}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('sportmonks') && currentMatch.teams.home.logo) {
                            target.src = currentMatch.teams.home.logo;
                          } else {
                            target.src = `/assets/fallback-logo.svg`;
                          }
                        }}
                      />

                      {/* Match time & venue information starting from home logo center */}
                      {currentMatch.fixture.status.short === 'NS' && (
                        <div className="absolute text-center text-xs text-gray-500 w-[300px] left-[32px] top-[calc(50%+32px)]" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'visible' }}>
                          {(() => {
                            try {
                              const matchDate = parseISO(currentMatch.fixture.date);
                              const formattedDate = format(matchDate, "EEEE, do MMM");
                              const timeOnly = format(matchDate, 'HH:mm');
                              return `${formattedDate} | ${timeOnly}${currentMatch.fixture.venue?.name ? ` | ${currentMatch.fixture.venue.name}` : ''}`;
                            } catch (e) {
                              return currentMatch.fixture.venue?.name || '';
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="absolute left-[125px] text-white font-bold text-sm uppercase transition-all duration-300 ease-in-out opacity-100 max-w-[120px] truncate md:max-w-[200px]" style={{top: "calc(50% - 8px)"}}>
                      {currentMatch.teams.home.name}
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
                      className="absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out hover:scale-110 opacity-100"
                      style={{
                        background: '#a00000',
                        left: 'calc(50% - 26px)',
                        top: 'calc(50% - 26px)',
                        minWidth: '52px'
                      }}
                    >
                      <span className="vs-text font-bold">VS</span>
                    </div>

                    {/* Remove the venue info from under the VS circle since we moved it below the team logo */}

                    {/* Away team colored bar and logo */}
                    <div className="h-full w-[calc(50%-67px)] mr-[77px] transition-all duration-500 ease-in-out opacity-100" 
                      style={{ 
                        background: getTeamColor(currentMatch.teams.away.id),
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                    </div>

                    <img 
                      src={`https://cdn.sportmonks.com/images/soccer/teams/${currentMatch.teams.away.id % 100}.png`} 
                      alt={currentMatch.teams.away.name} 
                      className="absolute right-[41px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-90 saturate-150 drop-shadow-[0_0_8px_rgba(0,0,0,0.6)]"
                      style={{
                        cursor: 'pointer',
                        top: "calc(50% - 32px)",
                        filter: "contrast(1.2) brightness(0.9) saturate(1.2)"
                      }}
                      onClick={handleMatchClick}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.includes('sportmonks') && currentMatch.teams.away.logo) {
                          target.src = currentMatch.teams.away.logo;
                        } else {
                          target.src = `/assets/fallback-logo.svg`;
                        }
                      }}
                    />

                    <div className="absolute right-[125px] text-white font-bold text-sm uppercase text-right transition-all duration-300 ease-in-out opacity-100 max-w-[120px] truncate md:max-w-[200px]" style={{top: "calc(50% - 8px)"}}>
                      {currentMatch.teams.away.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center py-8 text-gray-500">
                  No matches available at this moment
                </div>
              )}
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
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 19H5V15H11V19ZM11 13H5V9H11V13ZM11 7H5V5H11V7ZM19 19H13V17H19V19ZM19 15H13V13H19V15ZM19 11H13V9H19V11ZM19 7H13V5H19V7Z" fill="currentColor" />
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

            {/* Indicator dots for slideshow */}
            {matches.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {matches.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default FixedScoreboard;