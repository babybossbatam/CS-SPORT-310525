import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from 'react-redux';
import { format, parseISO, differenceInMinutes, differenceInHours } from 'date-fns';
import { RootState } from '@/lib/store';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Enhanced match fixture type
interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
  };
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
}

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

interface Score {
  halftime: { home: number | null; away: number | null; };
  fulltime: { home: number | null; away: number | null; };
  extratime: { home: number | null; away: number | null; };
  penalty: { home: number | null; away: number | null; };
}

interface FixtureResponse {
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
  score: Score;
}

// Match types for different states
enum MatchType {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED'
}

const EnhancedFeatureMatchCard = () => {
  const [, navigate] = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredMatches, setFilteredMatches] = useState<FixtureResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchType, setMatchType] = useState<MatchType | null>(null);
  const [liveElapsed, setLiveElapsed] = useState<number | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  // Hard-coded popular leagues to ensure we use the right IDs
  const popularLeagues = [2, 3, 39, 140, 135, 78]; // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

  // Get the current date for filtering
  const today = new Date();
  const todayFormatted = format(today, 'yyyy-MM-dd');

  // Function to fetch matches for the featured leagues
  const fetchMatchesForFeaturedLeagues = useCallback(async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      // Calculate if we should refresh based on 5-minute interval
      const timeSinceLastFetch = differenceInMinutes(new Date(), lastFetchTime);
      if (timeSinceLastFetch < 5 && filteredMatches.length > 0) {
        // Skip fetching if we've fetched recently and have data
        return;
      }

      // Get current season - use 2024 since that's the current football season
      const currentSeason = 2024;

      // Get fixtures from all popular leagues
      const allFixturesPromises = popularLeagues.map(async (leagueId) => {
        try {
          console.log(`Fetching fixtures for league ${leagueId} with season ${currentSeason}`);
          const response = await apiRequest(
            'GET', 
            `/api/leagues/${leagueId}/fixtures?season=${currentSeason}`
          );
          return response.json();
        } catch (error) {
          console.error(`Error fetching fixtures for league ${leagueId}:`, error);
          return [];
        }
      });

      // Wait for all requests to complete
      const allFixturesResults = await Promise.all(allFixturesPromises);

      // Flatten the array of fixtures from different leagues
      const allFixtures = allFixturesResults.flat();

      // Update the last fetch time
      setLastFetchTime(new Date());

      // Inspect what's in the allFixtures array
      console.log(`Total fixtures loaded: ${allFixtures.length}`);
      if (allFixtures.length > 0) {
        // Log the structure of the first fixture
        console.log("First fixture structure:", JSON.stringify(allFixtures[0], null, 2).substring(0, 500) + "...");
      }

      // For demo/testing, make sure we only include valid fixtures
      const demoMatches = allFixtures
        .filter(match => {
          // Check if the match has all required properties
          const isValid = match && 
            match.fixture && 
            match.teams && 
            match.teams.home && 
            match.teams.away && 
            match.league;

          if (!isValid) {
            console.log("Found invalid match:", match);
          }
          return isValid;
        })
        .sort((a, b) => {
          // Sort by date (newest first)
          return new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime();
        });

      console.log(`Filtered valid fixtures: ${demoMatches.length}`);

      // Take the first few fixtures for testing
      const testFixtures = demoMatches.slice(0, 6);
      console.log(`Using ${testFixtures.length} test fixtures for display`);
      if (testFixtures.length > 0) {
        console.log("First test fixture:", testFixtures[0].teams.home.name, "vs", testFixtures[0].teams.away.name);
      }

      // For now, just use the test fixtures directly
      const matches = testFixtures;
      setMatchType(MatchType.UPCOMING);

      console.log(`Setting ${matches.length} matches for display`);

      // Limit to 5-6 matches maximum for the slideshow
      const limitedMatches = matches.slice(0, 6);
      setFilteredMatches(limitedMatches);

      if (limitedMatches.length > 0) {
        // Reset current index if it's out of bounds
        if (currentIndex >= limitedMatches.length) {
          setCurrentIndex(0);
        }

        // If we have live matches, start the elapsed time ticker
        if (matchType === MatchType.LIVE && limitedMatches[currentIndex]?.fixture?.status?.elapsed) {
          setLiveElapsed(limitedMatches[currentIndex].fixture.status.elapsed);
        }
      }
    } catch (error) {
      console.error('Error fetching featured matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load featured matches',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [popularLeagues, isLoading, lastFetchTime, filteredMatches.length, currentIndex, toast, matchType]);

  // Initial fetch and 5-minute refresh interval
  useEffect(() => {
    fetchMatchesForFeaturedLeagues();

    // Set up refresh interval (every 5 minutes)
    const refreshInterval = setInterval(() => {
      fetchMatchesForFeaturedLeagues();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    return () => clearInterval(refreshInterval);
  }, [fetchMatchesForFeaturedLeagues]);

  // For live matches, update the elapsed time every minute
  useEffect(() => {
    if (matchType !== MatchType.LIVE || liveElapsed === null) return;

    const liveTimer = setInterval(() => {
      setLiveElapsed(prev => prev !== null ? prev + 1 : null);
    }, 60 * 1000); // Update every minute

    return () => clearInterval(liveTimer);
  }, [matchType, liveElapsed]);

  // Get current match
  const currentMatch = filteredMatches[currentIndex];

  // Handle match click to navigate to match details
  const handleMatchClick = () => {
    if (currentMatch?.fixture?.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (filteredMatches.length <= 1) return;
    setCurrentIndex(prev => (prev === 0 ? filteredMatches.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (filteredMatches.length <= 1) return;
    setCurrentIndex(prev => (prev === filteredMatches.length - 1 ? 0 : prev + 1));
  };

  // Format match time/status display text
  const getMatchStatusText = (match: FixtureResponse | undefined) => {
    if (!match) return 'Match Information';

    const { fixture } = match;

    if (fixture.status.short === 'FT') {
      return 'Full Time';
    } else if (['1H', '2H', 'HT', 'LIVE'].includes(fixture.status.short)) {
      return fixture.status.short === 'HT' 
        ? 'Half Time' 
        : `${liveElapsed || fixture.status.elapsed || 0}'`;
    } else {
      // For upcoming matches, show scheduled time
      try {
        const matchDate = new Date(fixture.date);
        return format(matchDate, 'dd MMM yyyy - HH:mm');
      } catch (e) {
        return 'Upcoming';
      }
    }
  };

  // Get match status label (Live, Upcoming, etc.)
  const getMatchStatusLabel = () => {
    if (!currentMatch) return '';

    const { fixture } = currentMatch;

    if (['1H', '2H', 'HT', 'LIVE'].includes(fixture.status.short)) {
      return 'LIVE';
    } else if (fixture.status.short === 'FT') {
      return 'FINISHED';
    } else {
      return 'UPCOMING';
    }
  };

  // Get dynamic team colors (simplified version)
  const getTeamColor = (teamId: number) => {
    // You could implement dynamic color fetching here based on team ID
    // For now, using some default colors
    switch (teamId % 5) {
      case 0: return '#6f7c93';
      case 1: return '#8b0000';
      case 2: return '#1d3557';
      case 3: return '#2a9d8f';
      case 4: return '#e63946';
      default: return '#6f7c93';
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
      >
        Featured Match
      </Badge>

      {filteredMatches.length > 1 && (
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
                <span className={`text-sm font-medium ${getMatchStatusLabel() === 'LIVE' ? 'text-red-600' : 'text-indigo-800'}`}>
                  {getMatchStatusLabel()}
                </span>
              </div>
            </div>

            {/* Match time/status information */}
            <div className="text-lg font-semibold text-center mb-3">
              <div className="flex flex-col items-center mb-[5px]">
                <span className={`${getMatchStatusLabel() === 'LIVE' ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
                  {getMatchStatusText(currentMatch)}
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
                        src={currentMatch.teams.home.id 
                          ? `https://cdn.sportmonks.com/images/soccer/teams/${currentMatch.teams.home.id}.png` 
                          : currentMatch.teams.home.logo} 
                        alt={currentMatch.teams.home.name} 
                        className="absolute left-[-32px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        style={{
                          cursor: 'pointer',
                          top: "calc(50% - 32px)"
                        }}
                        onClick={handleMatchClick}
                        onError={(e) => {
                          const target = e.currentTarget;
                          // Prevent infinite loops
                          if (target.dataset.errorHandled === 'true') return;
                          target.dataset.errorHandled = 'true';
                          
                          if (target.src.includes('sportmonks') && currentMatch.teams.home.logo) {
                            target.src = currentMatch.teams.home.logo;
                            target.dataset.errorHandled = 'false'; // Allow one more try
                          } else {
                            target.src = `/assets/fallback-logo.png`;
                          }
                        }}
                      />
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

                    {/* Away team colored bar and logo */}
                    <div className="h-full w-[calc(50%-67px)] mr-[77px] transition-all duration-500 ease-in-out opacity-100" 
                      style={{ 
                        background: getTeamColor(currentMatch.teams.away.id),
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                    </div>

                    <img 
                      src={currentMatch.teams.away.id 
                        ? `https://cdn.sportmonks.com/images/soccer/teams/${currentMatch.teams.away.id}.png` 
                        : currentMatch.teams.away.logo} 
                      alt={currentMatch.teams.away.name} 
                      className="absolute right-[41px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{
                        cursor: 'pointer',
                        top: "calc(50% - 32px)"
                      }}
                      onClick={handleMatchClick}
                      onError={(e) => {
                        const target = e.currentTarget;
                        // Prevent infinite loops
                        if (target.dataset.errorHandled === 'true') return;
                        target.dataset.errorHandled = 'true';
                        
                        if (target.src.includes('sportmonks') && currentMatch.teams.away.logo) {
                          target.src = currentMatch.teams.away.logo;
                          target.dataset.errorHandled = 'false'; // Allow one more try
                        } else {
                          target.src = `/assets/fallback-logo.png`;
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
            {filteredMatches.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {filteredMatches.map((_, index) => (
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

export default EnhancedFeatureMatchCard;