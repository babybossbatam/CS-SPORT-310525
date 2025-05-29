
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid, differenceInHours } from 'date-fns';
import { useCachedQuery, CacheManager } from '@/lib/cachingHelper';
import { apiRequest } from '@/lib/queryClient';
import { getCurrentUTCDateString } from '@/lib/dateUtilsTodayMatch';
import { shouldExcludeFixture } from '@/lib/exclusionFilters';

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyHomeFeaturedMatchNew: React.FC<MyHomeFeaturedMatchNewProps> = ({ 
  selectedDate,
  maxMatches = 8
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [enableFetching, setEnableFetching] = useState(true);

  // Use current date if not provided
  const currentDate = selectedDate || getCurrentUTCDateString();

  // Popular leagues for featured matches (same as TodayPopularLeaguesNew)
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78, 848, 1, 9, 11, 13, 15, 71, 233, 253, 254, 307, 301];

  // Popular teams for prioritization
  const POPULAR_TEAMS = [
    // Premier League
    33, 40, 42, 50, 47, 49, // Manchester United, Liverpool, Arsenal, Manchester City, Tottenham, Chelsea
    // La Liga
    529, 541, 530, 548, 727, // Barcelona, Real Madrid, Atletico Madrid, Real Sociedad, Athletic Bilbao
    // Serie A
    489, 492, 496, 500, 502, 505, // AC Milan, Napoli, Juventus, Inter, Fiorentina, Lazio
    // Bundesliga
    157, 165, 168, 173, 192, // Bayern Munich, Borussia Dortmund, Bayer Leverkusen, RB Leipzig, Eintracht Frankfurt
    // Champions League popular teams
    85, 81, 212, 548, // Paris Saint Germain, AS Monaco, Real Sociedad, Real Sociedad
  ];

  // Fetch popular league fixtures using the same logic as TodayPopularLeaguesNew
  const { data: popularFixtures = [], isLoading, isFetching } = useCachedQuery(
    ['featured-matches', currentDate],
    async () => {
      console.log(`MyHomeFeaturedMatchNew - Fetching fixtures for ${currentDate}`);

      // Split leagues into smaller batches for better performance
      const batchSize = 3;
      const leagueBatches = [];
      for (let i = 0; i < POPULAR_LEAGUES.length; i += batchSize) {
        leagueBatches.push(POPULAR_LEAGUES.slice(i, i + batchSize));
      }

      const allData = [];

      // Process batches in parallel for better performance
      for (const batch of leagueBatches) {
        const batchPromises = batch.map(async (leagueId) => {
          try {
            const response = await apiRequest('GET', `/api/leagues/${leagueId}/fixtures`);
            const leagueFixtures = await response.json();

            // Filter fixtures for the selected date
            const matchesFromSelectedDate = leagueFixtures.filter(match => {
              if (!match?.fixture?.date) return false;

              try {
                const fixtureDate = parseISO(match.fixture.date);
                if (!isValid(fixtureDate)) return false;

                const fixtureUTCDateString = format(fixtureDate, 'yyyy-MM-dd');
                return fixtureUTCDateString === currentDate;
              } catch (error) {
                return false;
              }
            });

            return matchesFromSelectedDate;
          } catch (error) {
            console.error(`Error fetching fixtures for league ${leagueId}:`, error);
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(matches => allData.push(...matches));
      }

      console.log(`MyHomeFeaturedMatchNew - Fetched ${allData.length} fixtures for ${currentDate}`);
      return allData;
    },
    {
      enabled: POPULAR_LEAGUES.length > 0 && !!currentDate && enableFetching,
      maxAge: 30 * 60 * 1000, // 30 minutes cache
      backgroundRefresh: true,
      staleTime: 15 * 60 * 1000, // Don't refetch for 15 minutes
    }
  );

  // Filter and prioritize matches for featured display
  const featuredMatches = useMemo(() => {
    if (!popularFixtures?.length) return [];

    const filtered = popularFixtures.filter(fixture => {
      // Apply exclusion filters
      if (shouldExcludeFixture(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name
      )) {
        return false;
      }

      // Validate team data
      return fixture.teams.home && fixture.teams.away && 
             fixture.teams.home.name && fixture.teams.away.name;
    });

    // Prioritize matches: Featured → Live → Upcoming (24h) → Other Upcoming → Recent Finished
    const prioritized = filtered.sort((a, b) => {
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;
      const aDate = parseISO(a.fixture.date);
      const bDate = parseISO(b.fixture.date);
      const now = new Date();

      // Check if teams are popular
      const aHasPopularTeam = POPULAR_TEAMS.includes(a.teams.home.id) || POPULAR_TEAMS.includes(a.teams.away.id);
      const bHasPopularTeam = POPULAR_TEAMS.includes(b.teams.home.id) || POPULAR_TEAMS.includes(b.teams.away.id);

      // Priority 1: Popular teams first
      if (aHasPopularTeam && !bHasPopularTeam) return -1;
      if (!aHasPopularTeam && bHasPopularTeam) return 1;

      // Priority 2: Live matches
      const aLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(aStatus);
      const bLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(bStatus);

      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;

      // Priority 3: Upcoming matches within 24 hours
      const aUpcoming = aStatus === 'NS' && aDate > now;
      const bUpcoming = bStatus === 'NS' && bDate > now;
      const aWithin24h = differenceInHours(aDate, now) <= 24 && differenceInHours(aDate, now) >= 0;
      const bWithin24h = differenceInHours(bDate, now) <= 24 && differenceInHours(bDate, now) >= 0;

      if (aUpcoming && aWithin24h && !(bUpcoming && bWithin24h)) return -1;
      if (bUpcoming && bWithin24h && !(aUpcoming && aWithin24h)) return 1;

      // Priority 4: Recent finished matches (within 2 hours)
      const aFinished = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(aStatus);
      const bFinished = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(bStatus);
      const aRecent = aFinished && differenceInHours(now, aDate) <= 2;
      const bRecent = bFinished && differenceInHours(now, bDate) <= 2;

      if (aRecent && !bRecent) return -1;
      if (!aRecent && bRecent) return 1;

      // Default: sort by date (upcoming first, then recent)
      if (aUpcoming && bUpcoming) return aDate.getTime() - bDate.getTime();
      if (aFinished && bFinished) return bDate.getTime() - aDate.getTime();

      return aDate.getTime() - bDate.getTime();
    });

    return prioritized.slice(0, maxMatches);
  }, [popularFixtures, maxMatches]);

  // Handle navigation
  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : featuredMatches.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < featuredMatches.length - 1 ? prev + 1 : 0));
  };

  const handleMatchClick = () => {
    if (featuredMatches[currentIndex]) {
      const match = featuredMatches[currentIndex];
      navigate(`/matches/${match.fixture.id}`);
    }
  };

  // Get current match
  const currentMatch = featuredMatches[currentIndex];

  // Get match status for display
  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = differenceInHours(now, fixtureDate);

    // Live matches
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return status === 'HT' ? 'Half Time' : 'LIVE';
    }

    // Finished matches
    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      if (hoursAgo <= 2) return 'Just Finished';
      if (hoursAgo <= 24) return 'Recent';
      return status;
    }

    // Upcoming matches
    if (fixtureDate < now && status === 'NS') {
      return 'Delayed';
    }

    return 'Scheduled';
  };

  // Dynamic team colors
  const getTeamColor = (teamId: number) => {
    const colors = ['#6f7c93', '#8b0000', '#1d3557', '#2a9d8f', '#e63946'];
    return colors[teamId % colors.length];
  };

  // Loading state
  if (isLoading && featuredMatches.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
        <Badge 
          variant="secondary" 
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-48 mx-auto mb-4" />
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-16 w-16 rounded mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-16" />
            <div className="flex flex-col items-center">
              <Skeleton className="h-16 w-16 rounded mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No matches state
  if (!currentMatch) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
        <Badge 
          variant="secondary" 
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No featured matches available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
      >
        Featured Match
      </Badge>

      {featuredMatches.length > 1 && (
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
            {/* Header with league info and status */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <img
                  src={currentMatch.league.logo || '/assets/fallback-logo.svg'}
                  alt={currentMatch.league.name}
                  className="w-5 h-5 rounded object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/assets/fallback-logo.svg') {
                      target.src = '/assets/fallback-logo.svg';
                    }
                  }}
                />
                <span className="text-sm font-medium">{currentMatch.league.name}</span>
              </div>

              <span className="text-gray-400">-</span>

              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-800">
                  {getMatchStatus(currentMatch)}
                </span>
              </div>
            </div>

            {/* Match date and time */}
            <div className="text-lg font-semibold text-center mb-3">
              <div className="flex flex-col items-center mb-[5px]">
                <span className="text-gray-600">
                  {format(parseISO(currentMatch.fixture.date), 'EEEE, MMM d')} | {format(parseISO(currentMatch.fixture.date), 'HH:mm')}
                </span>
              </div>
            </div>

            {/* Main match display */}
            <div className="relative">
              <div 
                className="flex relative h-[53px] rounded-md mb-8 transition-all duration-300 ease-in-out opacity-100 mt-[-8px] cursor-pointer"
                onClick={handleMatchClick}
              >
                <div className="w-full h-full flex justify-between relative">
                  {/* Home team colored bar and logo */}
                  <div 
                    className="h-full w-[calc(50%-67px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative" 
                    style={{ 
                      background: getTeamColor(currentMatch.teams.home.id),
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    <div 
                      className="absolute left-[-32px] z-20 w-[64px] h-[64px] bg-white/10 rounded-full p-2 transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{
                        top: "calc(50% - 32px)",
                        cursor: 'pointer'
                      }}
                      onClick={handleMatchClick}
                    >
                      <img
                        src={currentMatch.teams.home.logo || '/assets/fallback-logo.svg'}
                        alt={currentMatch.teams.home.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/assets/fallback-logo.svg') {
                            target.src = '/assets/fallback-logo.svg';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* VS section with score */}
                  <div 
                    className="absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out hover:scale-110 opacity-100"
                    style={{
                      background: '#a00000',
                      left: 'calc(50% - 26px)',
                      top: 'calc(50% - 26px)',
                      minWidth: '52px'
                    }}
                  >
                    {['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(currentMatch.fixture.status.short) || 
                     ['FT', 'AET', 'PEN'].includes(currentMatch.fixture.status.short) ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-xs">
                          <span>{currentMatch.goals.home ?? 0}</span>
                          <span>-</span>
                          <span>{currentMatch.goals.away ?? 0}</span>
                        </div>
                        {['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(currentMatch.fixture.status.short) && (
                          <div className="text-[8px] animate-pulse">LIVE</div>
                        )}
                      </div>
                    ) : (
                      <span className="vs-text font-bold">VS</span>
                    )}
                  </div>

                  {/* Away team colored bar and logo */}
                  <div 
                    className="h-full w-[calc(50%-67px)] mr-[77px] transition-all duration-500 ease-in-out opacity-100" 
                    style={{ 
                      background: getTeamColor(currentMatch.teams.away.id),
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    <div
                      className="absolute right-[41px] z-20 w-[64px] h-[64px] bg-white/10 rounded-full p-2 transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{
                        top: "calc(50% - 32px)",
                        cursor: 'pointer'
                      }}
                      onClick={handleMatchClick}
                    >
                      <img
                        src={currentMatch.teams.away.logo || '/assets/fallback-logo.svg'}
                        alt={currentMatch.teams.away.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/assets/fallback-logo.svg') {
                            target.src = '/assets/fallback-logo.svg';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team names */}
            <div className="flex justify-between items-center mb-4 px-4">
              <div className="text-center flex-1">
                <span className="text-sm font-medium">{currentMatch.teams.home.name}</span>
              </div>
              <div className="text-center flex-1">
                <span className="text-sm font-medium">{currentMatch.teams.away.name}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-around border-t border-gray-200 mt-2 pt-3">
              <button 
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={handleMatchClick}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                  <path d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z" fill="currentColor" />
                </svg>
                <span className="text-xs text-gray-600 mt-1">Match Page</span>
              </button>
              <button 
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() => navigate(`/matches/${currentMatch.fixture.id}/lineups`)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 19H5V15H11V19ZM11 13H5V9H11V13ZM11 7H5V5H11V7ZM19 19H13V17H19V19ZM19 15H13V13H19V15ZM19 11H13V9H19V11ZM19 7H13V5H19V7Z" fill="currentColor" />
                </svg>
                <span className="text-xs text-gray-600 mt-1">Lineups</span>
              </button>
              <button 
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() => navigate(`/matches/${currentMatch.fixture.id}/stats`)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor" />
                </svg>
                <span className="text-xs text-gray-600 mt-1">Stats</span>
              </button>
              <button 
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() => navigate(`/leagues/${currentMatch.league.id}/standings`)}
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

            {/* Carousel indicators */}
            {featuredMatches.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {featuredMatches.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentIndex(index)}
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

export default MyHomeFeaturedMatchNew;
