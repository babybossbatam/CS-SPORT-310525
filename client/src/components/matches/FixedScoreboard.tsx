import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from 'date-fns';
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
        
        // Filter matches according to specified criteria
        
        // 1. Live matches - show with priority
        const liveMatches = allMatches.filter(match => 
          ['1H', '2H', 'HT', 'BT', 'ET', 'P', 'SUSP', 'INT'].includes(match.fixture.status.short)
        );
        
        // 2. Upcoming matches - show if within 8 hours of start time
        const upcomingMatches = allMatches.filter(match => {
          if (match.fixture.status.short !== 'NS') return false;
          
          const matchDate = new Date(match.fixture.date);
          const timeDiff = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60); // hours
          
          // Keep matches within next 8 hours
          return timeDiff >= 0 && timeDiff <= 8;
        }).sort((a, b) => 
          new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
        );
        
        // 3. Recently finished matches - only show within 8 hours after completion
        const finishedMatches = allMatches.filter(match => {
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
        
        // Prioritize and combine matches for display
        const prioritizedMatches = [
          ...liveMatches,                    // Live matches first
          ...upcomingMatches.slice(0, 3),    // Then upcoming within 8 hours
          ...finishedMatches.slice(0, 2)     // Then recently finished
        ];
        
        // If we don't have enough, add popular league matches regardless of time
        if (prioritizedMatches.length < 6) {
          // Get matches from popular leagues not already included
          const popularMatches = allMatches
            .filter(match => 
              popularLeagues.includes(match.league.id) && 
              !prioritizedMatches.find(m => m.fixture.id === match.fixture.id)
            )
            .sort((a, b) => {
              // Sort by match date (upcoming before past)
              const aDate = new Date(a.fixture.date);
              const bDate = new Date(b.fixture.date);
              return Math.abs(aDate.getTime() - now.getTime()) - Math.abs(bDate.getTime() - now.getTime());
            })
            .slice(0, 6 - prioritizedMatches.length);
            
          prioritizedMatches.push(...popularMatches);
        }
        
        // Limit to 6 matches for the carousel
        const finalMatches = prioritizedMatches.slice(0, 6);
        
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
  const [liveTimers, setLiveTimers] = useState<{[key: number]: number}>({});
  
  // Update timers for live matches
  useEffect(() => {
    if (!currentMatch) return;
    
    // Only set up timer for live matches
    if (!['1H', '2H'].includes(currentMatch.fixture.status.short)) return;
    
    // Initialize with current elapsed time from the API
    if (!liveTimers[currentMatch.fixture.id] && currentMatch.fixture.status.elapsed) {
      setLiveTimers(prev => ({
        ...prev,
        [currentMatch.fixture.id]: currentMatch.fixture.status.elapsed
      }));
    }
    
    // Update timer every minute for live matches
    const timer = setInterval(() => {
      setLiveTimers(prev => {
        if (!prev[currentMatch.fixture.id]) return prev;
        
        return {
          ...prev,
          [currentMatch.fixture.id]: prev[currentMatch.fixture.id] + 1
        };
      });
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
        const elapsed = liveTimers[fixture.id] || fixture.status.elapsed || 0;
        return `${elapsed}'`;
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
        const minutesToMatch = Math.floor((matchDate.getTime() - now.getTime()) / (1000 * 60));
        const hoursToMatch = Math.floor(minutesToMatch / 60);
        
        // Format based on how soon
        if (minutesToMatch < 0) {
          // Match time passed but status not updated yet
          return 'Starting soon';
        } else if (hoursToMatch === 0) {
          // Less than an hour away
          return `In ${minutesToMatch % 60}m`;
        } else if (hoursToMatch < 8) {
          // Within 8 hours
          return `In ${hoursToMatch}h ${minutesToMatch % 60}m`;
        } else if (hoursToMatch < 24) {
          // Today but more than 8 hours away
          return format(matchDate, 'Today, HH:mm');
        } else {
          // Tomorrow or later
          return format(matchDate, 'EEE, HH:mm');
        }
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
                <span className={`${getMatchStatusLabel(currentMatch) === 'LIVE' ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
                  {getMatchStatus(currentMatch)}
                </span>
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
                        className="absolute left-[-32px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        style={{
                          cursor: 'pointer',
                          top: "calc(50% - 32px)"
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
                      
                      {/* Match time & venue information centered between home logo and VS */}
                      {currentMatch.fixture.status.short === 'NS' && (
                        <div className="absolute text-center text-xs text-gray-500 w-[200px] left-[15px] top-[calc(50%+32px)]" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

                    {/* Score or VS section */}
                    <div 
                      className="absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out hover:scale-110 opacity-100"
                      style={{
                        background: '#a00000',
                        left: 'calc(50% - 26px)',
                        top: 'calc(50% - 26px)',
                        minWidth: '52px'
                      }}
                    >
                      {currentMatch.fixture.status.short === 'NS' ? (
                        <span className="vs-text font-bold">VS</span>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <span>{currentMatch.goals.home ?? 0}</span>
                          <span className="text-xs">-</span>
                          <span>{currentMatch.goals.away ?? 0}</span>
                        </div>
                      )}
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
                      className="absolute right-[41px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{
                        cursor: 'pointer',
                        top: "calc(50% - 32px)"
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