import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCentralData } from '@/providers/CentralDataProvider';
import { shouldExcludeFromPopularLeagues } from "@/lib/MyPopularLeagueExclusion";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import CombinedLeagueCards from "./CombinedLeagueCards";
import { format } from 'date-fns';

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 3,
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get central cache data
  const { fixtures, liveFixtures, isLoading } = useCentralData();

  // Filter and process matches for featured display
  const featuredMatches = useMemo(() => {
    console.log(`🔍 [MyHomeFeaturedMatchNew] Processing ${fixtures.length} fixtures and ${liveFixtures.length} live fixtures`);

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const nextDay = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Combine all fixtures
    const allFixtures = [...fixtures, ...liveFixtures];

    // Simple filtering approach
    const filtered = allFixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.teams?.home?.name || !fixture?.teams?.away?.name) {
        return false;
      }

      const fixtureDate = fixture.fixture.date.slice(0, 10);
      const isValidDate = [today, tomorrow, nextDay].includes(fixtureDate);

      if (!isValidDate) return false;

      // Apply basic exclusion filters
      if (shouldExcludeFromPopularLeagues(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name
      )) {
        return false;
      }

      return true;
    });

    // Simple sorting: prioritize live matches, then by date
    const sorted = filtered.sort((a, b) => {
      const statusA = a.fixture.status.short;
      const statusB = b.fixture.status.short;

      // Live matches first
      const isLiveA = ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(statusA);
      const isLiveB = ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(statusB);

      if (isLiveA && !isLiveB) return -1;
      if (!isLiveA && isLiveB) return 1;

      // If both are live or both are not live, sort by date proximity
      const dateA = new Date(a.fixture.date).getTime();
      const dateB = new Date(b.fixture.date).getTime();
      const now = Date.now();

      return Math.abs(dateA - now) - Math.abs(dateB - now);
    });

    const result = sorted.slice(0, maxMatches);
    console.log(`🔍 [MyHomeFeaturedMatchNew] Filtered ${allFixtures.length} fixtures to ${result.length} featured matches`);

    return result;
  }, [fixtures, liveFixtures, maxMatches]);

  const currentMatch = featuredMatches[currentIndex] || null;

  const handlePrevious = () => {
    if (featuredMatches.length <= 1) return;
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : featuredMatches.length - 1);
  };

  const handleNext = () => {
    if (featuredMatches.length <= 1) return;
    setCurrentIndex(currentIndex < featuredMatches.length - 1 ? currentIndex + 1 : 0);
  };

  const handleMatchClick = () => {
    if (currentMatch?.fixture?.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  const getMatchStatus = (match: any) => {
    if (!match) return "";
    const status = match.fixture.status.short;
    const elapsed = match.fixture.status.elapsed;

    if (["1H", "2H"].includes(status)) {
      return `${elapsed}'`;
    }
    if (status === "HT") return "HT";
    if (status === "FT") return "FT";
    if (status === "NS") return "UPCOMING";
    return status;
  };

  const getMatchStatusLabel = (match: any) => {
    if (!match) return "";
    const status = match.fixture.status.short;

    if (["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(status)) {
      return "LIVE";
    } else if (status === "FT") {
      return "FINISHED";
    } else {
      return "UPCOMING";
    }
  };

  const getTeamColor = (teamId: number) => {
    const colors = [
      "#6f7c93", // blue-gray
      "#8b0000", // dark red
      "#1d3557", // dark blue
      "#2a9d8f", // teal
      "#e63946", // red
    ];
    return colors[teamId % colors.length];
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mb-3 opacity-50 animate-pulse" />
            <p className="text-lg font-medium mb-1">Loading featured matches...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentMatch || featuredMatches.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">
              No featured matches available
            </p>
            <p className="text-sm">Check back later for today's highlights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-8">
      <Badge
        variant="secondary"
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        Featured Match
      </Badge>

      {/* Navigation arrows */}
      {featuredMatches.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 w-10 h-10 rounded-full shadow-lg border border-gray-200 z-40 flex items-center justify-center transition-all duration-200 hover:shadow-xl"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 w-10 h-10 rounded-full shadow-lg border border-gray-200 z-40 flex items-center justify-center transition-all duration-200 hover:shadow-xl"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

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
          {/* Original featured match design */}
          <div className="bg-gray-50 p-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={currentMatch.league.logo} 
                  alt={currentMatch.league.name}
                  className="w-6 h-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                  }}
                />
                <span className="font-medium text-sm">{currentMatch.league.name}</span>
              </div>

              <div className="flex items-center gap-2">
                {getMatchStatusLabel(currentMatch) === "LIVE" ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-red-600">LIVE</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">
                    {getMatchStatus(currentMatch)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Teams and score section */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              {/* Home team */}
              <div className="flex flex-col items-center text-center flex-1">
                <img
                  src={currentMatch.teams.home.logo}
                  alt={currentMatch.teams.home.name}
                  className="w-16 h-16 object-contain mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                  }}
                />
                <span className="text-sm font-medium text-gray-900 max-w-[80px] truncate">
                  {currentMatch.teams.home.name}
                </span>
              </div>

              {/* Score/Time center */}
              <div className="flex flex-col items-center justify-center mx-6">
                {(() => {
                  const status = currentMatch.fixture.status.short;
                  const fixtureDate = new Date(currentMatch.fixture.date);

                  // Live matches
                  if (["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(status)) {
                    return (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {currentMatch.goals.home ?? 0} - {currentMatch.goals.away ?? 0}
                        </div>
                        <div className="text-xs text-red-600 font-medium">
                          {status === "HT" ? "Halftime" : `${currentMatch.fixture.status.elapsed || 0}'`}
                        </div>
                      </div>
                    );
                  }

                  // Finished matches
                  if (["FT", "AET", "PEN"].includes(status)) {
                    return (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {currentMatch.goals.home ?? 0} - {currentMatch.goals.away ?? 0}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Full Time
                        </div>
                      </div>
                    );
                  }

                  // Upcoming matches
                  return (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {status === "TBD" ? "TBD" : format(fixtureDate, "HH:mm")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {status === "TBD" ? "Time TBD" : format(fixtureDate, "MMM dd")}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Away team */}
              <div className="flex flex-col items-center text-center flex-1">
                <img
                  src={currentMatch.teams.away.logo}
                  alt={currentMatch.teams.away.name}
                  className="w-16 h-16 object-contain mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                  }}
                />
                <span className="text-sm font-medium text-gray-900 max-w-[80px] truncate">
                  {currentMatch.teams.away.name}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="flex justify-around border-t border-gray-200 pt-4 mt-4 pb-4">
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/MatchDetail.svg"
                alt="Match Page"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-xs text-gray-600 mt-1">Match Page</span>
            </button>
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}/lineups`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/lineups.svg"
                alt="Lineups"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-xs text-gray-600 mt-1">Lineups</span>
            </button>
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}/h2h`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/stats.svg"
                alt="H2H"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-xs text-gray-600 mt-1">H2H</span>
            </button>
            <button
              className="flex flex-col items-center cursor-pointer w-1/4"
              onClick={() => {
                if (currentMatch?.fixture?.id) {
                  navigate(`/match/${currentMatch.fixture.id}/standings`);
                }
              }}
            >
              <img
                src="/assets/matchdetaillogo/standings.svg"
                alt="Standings"
                width="18"
                height="18"
                className="text-gray-600"
              />
              <span className="text-xs text-gray-600 mt-1">Standings</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      {featuredMatches.length > 1 && (
        <div className="flex justify-center gap-2 py-2 mt-2">
          {featuredMatches.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1 h-1 rounded-full transition-all duration-200 ${
                index === currentIndex ? "bg-black" : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default MyFeaturedMatchSlide;