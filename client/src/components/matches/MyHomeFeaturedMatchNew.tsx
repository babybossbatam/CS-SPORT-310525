import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid } from 'date-fns';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { shouldExcludeFromPopularLeagues, isRestrictedUSLeague } from "@/lib/MyPopularLeagueExclusion";
import { getCountryFlagWithFallbackSync } from "../../lib/flagUtils";
import MyColoredBar from './MyColoredBar';

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

  // Popular countries and leagues configuration (same as TodayPopularFootballLeaguesNew)
  const POPULAR_COUNTRIES_ORDER = [
    "England", "Spain", "Italy", "Germany", "France", "World", "Europe", 
    "South America", "Brazil", "Saudi Arabia", "Egypt", "Colombia", 
    "United States", "USA", "US", "United Arab Emirates", "United-Arab-Emirates"
  ];

  const POPULAR_LEAGUES_BY_COUNTRY = {
    England: [39, 45, 48], // Premier League, FA Cup, EFL Cup
    Spain: [140, 143], // La Liga, Copa del Rey
    Italy: [135, 137], // Serie A, Coppa Italia
    Germany: [78, 81], // Bundesliga, DFB Pokal
    France: [61, 66], // Ligue 1, Coupe de France
    "United Arab Emirates": [301], // UAE Pro League
    Egypt: [233], // Egyptian Premier League
    International: [15], // FIFA Club World Cup
    World: [914, 848, 15], // COSAFA Cup, UEFA Conference League, FIFA Club World Cup
  };

  const POPULAR_LEAGUES = [...Object.values(POPULAR_LEAGUES_BY_COUNTRY).flat(), 914];

  // Fetch fixtures data
  const { data: fixtures = [] } = useQuery({
    queryKey: ["featured-fixtures-by-date", selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/fixtures/date/${selectedDate}?all=true`);
      const data = await response.json();
      return data;
    },
    enabled: !!selectedDate,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Filter and prioritize matches (same logic as TodayPopularFootballLeaguesNew)
  const filteredMatches = useMemo(() => {
    if (!fixtures?.length) return [];

    const filtered = fixtures.filter((fixture: any) => {
      // Apply smart time filtering
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z"
        );

        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = format(tomorrow, "yyyy-MM-dd");
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = format(yesterday, "yyyy-MM-dd");

        const shouldInclude = (() => {
          if (selectedDate === tomorrowString && smartResult.label === "tomorrow") return true;
          if (selectedDate === todayString && smartResult.label === "today") return true;
          if (selectedDate === yesterdayString && smartResult.label === "yesterday") return true;
          if (selectedDate !== todayString && selectedDate !== tomorrowString && selectedDate !== yesterdayString) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange) return true;
          }
          return false;
        })();

        if (!shouldInclude) return false;
      }

      // Apply exclusion filters
      if (shouldExcludeFromPopularLeagues(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name,
        fixture.league.country
      )) {
        return false;
      }

      if (isRestrictedUSLeague(fixture.league.id, fixture.league.country)) {
        return false;
      }

      // Check for popular leagues/countries/international competitions
      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";
      const leagueName = fixture.league?.name?.toLowerCase() || "";

      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase())
      );

      const isInternationalCompetition =
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        leagueName.includes("world cup") ||
        leagueName.includes("fifa club world cup") ||
        leagueName.includes("fifa") ||
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        leagueName.includes("copa libertadores") ||
        leagueName.includes("copa sudamericana") ||
        leagueName.includes("libertadores") ||
        leagueName.includes("sudamericana") ||
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        (leagueName.includes("international") && !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
    });

    // Prioritize matches: LIVE > Popular teams > Finals/Semi-finals > Upcoming
    const prioritized = filtered.sort((a: any, b: any) => {
      const aStatus = a.fixture.status.short;
      const bStatus = b.fixture.status.short;
      
      // Live matches first
      const aLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(aStatus);
      const bLive = ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(bStatus);
      
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      
      // Check for finals/semi-finals
      const aIsFinal = a.league?.round?.toLowerCase().includes("final") || 
                      a.league?.round?.toLowerCase().includes("semi");
      const bIsFinal = b.league?.round?.toLowerCase().includes("final") || 
                      b.league?.round?.toLowerCase().includes("semi");
      
      if (aIsFinal && !bIsFinal) return -1;
      if (!aIsFinal && bIsFinal) return 1;
      
      // Sort by time for same priority
      const aDate = parseISO(a.fixture.date);
      const bDate = parseISO(b.fixture.date);
      
      if (isValid(aDate) && isValid(bDate)) {
        return aDate.getTime() - bDate.getTime();
      }
      
      return 0;
    });

    return prioritized.slice(0, maxMatches);
  }, [fixtures, selectedDate, maxMatches]);

  const matches = filteredMatches;

  // Handle navigation
  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : matches.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < matches.length - 1 ? prev + 1 : 0));
  };

  const handleMatchClick = () => {
    if (matches[currentIndex]) {
      const match = matches[currentIndex];
      navigate(`/matches/${match.fixture.id}`);
    }
  };

  // Get current match
  const currentMatch = matches[currentIndex];

  // Get match status for display - includes bracket status
  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;

    // Live matches
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return status === 'HT' ? 'Half Time' : 'LIVE';
    }

    // Finished matches
    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      return 'Recent';
    }

    // For upcoming matches, show bracket status if available
    if (fixture.league?.round) {
      return fixture.league.round;
    }

    return 'Scheduled';
  };

  // Dynamic team colors
  const getTeamColor = (teamId: number) => {
    const colors = ['#6f7c93', '#8b0000', '#1d3557', '#2a9d8f', '#e63946'];
    return colors[teamId % colors.length];
  };

  // No matches state
  if (!currentMatch) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
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
    <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
      >
        Featured Match
      </Badge>

      {false && (
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
            

            {/* League info and status */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {currentMatch.league?.logo && (
                  <img
                    src={currentMatch.league.logo}
                    alt={currentMatch.league.name}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                    }}
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {currentMatch.league?.name || "League"}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {getMatchStatus(currentMatch)}
                </span>
              </div>
              
              {/* Score display */}
              {['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(currentMatch.fixture.status.short) || 
               ['FT', 'AET', 'PEN'].includes(currentMatch.fixture.status.short) ? (
                <div className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                  <span>{currentMatch.goals.home ?? 0}</span>
                  <span className="text-gray-400">-</span>
                  <span>{currentMatch.goals.away ?? 0}</span>
                </div>
              ) : (
                <div className="text-lg font-medium text-gray-600">
                  VS
                </div>
              )}
            </div>

            {/* Main match display */}
            <div className="relative">
              <MyColoredBar
                homeTeam={currentMatch.teams.home}
                awayTeam={currentMatch.teams.away}
                homeScore={currentMatch.goals.home}
                awayScore={currentMatch.goals.away}
                status={currentMatch.fixture.status.short}
                onClick={handleMatchClick}
                getTeamColor={getTeamColor}
                className="mb-8"
              />
            </div>

            {/* Match date, time and venue - centered below VS */}
            <div
              className="text-center text-xs text-black font-medium mt-4"
              style={{
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {(() => {
                try {
                  const matchDate = parseISO(currentMatch.fixture.date);
                  const formattedDate = format(matchDate, "EEEE, do MMM");
                  const timeOnly = format(matchDate, "HH:mm");

                  return (
                    <>
                      {formattedDate} | {timeOnly}
                      {currentMatch.fixture.venue?.name
                        ? ` | ${currentMatch.fixture.venue.name}`
                        : ""}
                    </>
                  );
                } catch (e) {
                  return currentMatch.fixture.venue?.name || "";
                }
              })()}
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
            {false && (
              <div className="flex justify-center gap-2 mt-4">
                {matches.map((_, index) => (
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