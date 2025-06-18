import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useCachedQuery } from "@/lib/cachingHelper";
import { format, parseISO, isValid } from "date-fns";
import { FixtureResponse } from "@/types/fixtures";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";

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
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const autoSlideInterval = useRef<NodeJS.Timeout | null>(null);

  // Simple date setup
  const today = new Date().toISOString().slice(0, 10);
  const dateToUse = selectedDate || today;

  // Simple fixture fetch for today only
  const { data: fixtures = [], isLoading } = useCachedQuery(
    ["simple-featured-matches", dateToUse],
    async () => {
      console.log(`🔄 [MyHomeFeaturedMatchNew] Fetching fixtures for ${dateToUse}`);

      try {
        const response = await apiRequest("GET", `/api/fixtures/date/${dateToUse}?all=true`);
        const data = await response.json();
        console.log(`✅ [MyHomeFeaturedMatchNew] Received ${data?.length || 0} fixtures`);
        return data || [];
      } catch (error) {
        console.error(`❌ [MyHomeFeaturedMatchNew] Error fetching fixtures:`, error);
        return [];
      }
    },
    {
      enabled: true,
      maxAge: 5 * 60 * 1000, // 5 minutes
      backgroundRefresh: false,
    }
  );

  // Simple featured matches selection - just pick the first few matches
  const featuredMatches = useMemo(() => {
    if (!fixtures?.length) return [];

    // Simple filtering - just take first few matches that have valid data
    const validMatches = fixtures.filter((fixture) => {
      return fixture?.league && fixture?.teams?.home && fixture?.teams?.away;
    });

    console.log(`🎯 [MyHomeFeaturedMatchNew] Selected ${Math.min(validMatches.length, maxMatches)} featured matches`);

    return validMatches.slice(0, maxMatches);
  }, [fixtures, maxMatches]);

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
      return `${elapsed || 0}'`;
    }
    if (status === "HT") return "Halftime";
    if (status === "FT") return "Ended";
    if (status === "LIVE") return "Live";
    if (status === "NS") return "UPCOMING";
    return status;
  };

  const getMatchStatusLabel = (match: any) => {
    if (!match) return "";
    const status = match.fixture.status.short;

    if (["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(status)) {
      return "LIVE";
    } else if (["FT", "AET", "PEN"].includes(status)) {
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

  // Show loading state
  if (isLoading && !fixtures?.length) {
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
            <p className="text-sm">Please wait</p>
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
            <p className="text-lg font-medium mb-1">No featured matches available</p>
            <p className="text-sm">Check back later for today's highlights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Clean up effect
  useEffect(() => {
    return () => {
      if (autoSlideInterval.current) {
        clearInterval(autoSlideInterval.current);
      }
    };
  }, []);

  return (
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
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
          {/* League info section */}
          <div className="bg-white p-2 mt-6 relative">
            <div className="flex items-center justify-center">
              {currentMatch?.league?.logo ? (
                <img
                  src={currentMatch.league.logo}
                  alt={currentMatch.league.name}
                  className="w-5 h-5 object-contain mr-2 drop-shadow-md"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.svg";
                  }}
                />
              ) : (
                <Trophy className="w-5 h-5 text-amber-500 mr-2" />
              )}
              <span className="text-sm font-medium">
                {currentMatch?.league?.name || "League Name"}
              </span>
              {getMatchStatusLabel(currentMatch) === "LIVE" ? (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 border border-red-500 text-red-500 animate-pulse ml-2"
                >
                  LIVE
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border ml-[3px] ${
                    getMatchStatusLabel(currentMatch) === "FINISHED"
                      ? "border-gray-500 text-gray-500"
                      : "border-blue-500 text-blue-500"
                  }`}
                >
                  {getMatchStatusLabel(currentMatch) === "FINISHED"
                    ? currentMatch?.league?.round || "Final"
                    : currentMatch?.league?.round || getMatchStatusLabel(currentMatch)}
                </Badge>
              )}
            </div>
          </div>

          {/* Score and Status Display */}
          <div className="score-area h-20 flex flex-col justify-center items-center relative">
            {(() => {
              const status = currentMatch?.fixture?.status?.short;
              const hasScore = currentMatch?.fixture?.status?.short &&
                ["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(status);

              if (hasScore) {
                const statusText = getMatchStatus(currentMatch);
                const scoreText = `${currentMatch?.goals?.home ?? 0}   -   ${currentMatch?.goals?.away ?? 0}`;

                return (
                  <div className="flex flex-col items-center">
                    <div className={`text-sm tracking-wide mt-1 ${getMatchStatusLabel(currentMatch) === "LIVE" ? "text-red-600" : "text-gray-500"}`}>
                      {statusText}
                    </div>
                    <div className="text-xl font-semibold text-black mb-1 mt-1" style={{ fontSize: "1.95rem" }}>
                      {scoreText}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="text-black uppercase tracking-wide" style={{ fontSize: "1.125rem" }}>
                    UPCOMING
                  </div>
                );
              }
            })()}
          </div>

          {/* Team scoreboard with colored bars */}
          <div className="relative">
            <div className="flex relative h-[53px] rounded-md mb-8 cursor-pointer">
              <div className="w-full h-full flex justify-between relative">
                {/* Home team colored bar and logo */}
                <div
                  className="h-full w-[calc(50%-76px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative"
                  style={{ background: getTeamColor(currentMatch?.teams?.home?.id || 0) }}
                >
                  <div className="absolute z-20" style={{ top: "calc(50% - 32px)", left: "-32px" }}>
                    <MyWorldTeamLogo
                      teamName={currentMatch?.teams?.home?.name || ""}
                      teamLogo={currentMatch?.teams?.home?.logo || "/assets/fallback-logo.svg"}
                      alt={currentMatch?.teams?.home?.name || "Home Team"}
                      size="64px"
                      className="featured-match-size"
                      leagueContext={{
                        name: currentMatch?.league?.name || "",
                        country: currentMatch?.league?.country || "",
                      }}
                    />
                  </div>
                </div>

                <div
                  className="absolute text-white uppercase text-center max-w-[160px] truncate md:max-w-[240px] font-sans"
                  style={{
                    top: "calc(50% - 13px)",
                    left: "120px",
                    fontSize: "1.24rem",
                    fontWeight: "normal",
                  }}
                >
                  {currentMatch?.teams?.home?.name || "TBD"}
                </div>

                {/* VS circle */}
                <div
                  className="absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden"
                  style={{
                    background: "#a00000",
                    left: "calc(50% - 26px)",
                    top: "calc(50% - 26px)",
                    minWidth: "52px",
                  }}
                >
                  <span className="vs-text font-bold" style={{ fontSize: "1.5rem" }}>
                    VS
                  </span>
                </div>

                {/* Away team colored bar */}
                <div
                  className="h-full w-[calc(50%-56px)] mr-[77px] transition-all duration-500 ease-in-out opacity-100"
                  style={{ background: getTeamColor(currentMatch?.teams?.away?.id || 1) }}
                ></div>

                {/* Away team name - positioned independently */}
                <div
                  className="absolute text-white uppercase text-center max-w-[160px] truncate md:max-w-[240px] font-sans"
                  style={{
                    top: "calc(50% - 13px)",
                    right: "110px",
                    fontSize: "1.24rem",
                    fontWeight: "normal",
                  }}
                >
                  {currentMatch?.teams?.away?.name || "Away Team"}
                </div>

                <div className="absolute z-20" style={{ top: "calc(50% - 32px)", right: "32px" }}>
                  <MyWorldTeamLogo
                    teamName={currentMatch?.teams?.away?.name || ""}
                    teamLogo={currentMatch?.teams?.away?.logo || "/assets/fallback-logo.svg"}
                    alt={currentMatch?.teams?.away?.name || "Away Team"}
                    size="64px"
                    className="featured-match-size"
                    moveLeft={true}
                    leagueContext={{
                      name: currentMatch?.league?.name || "",
                      country: currentMatch?.league?.country || "",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Match date and venue */}
            <div
              className="absolute text-center text-sm text-black font-medium"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 20px)",
                width: "max-content",
              }}
            >
              {(() => {
                try {
                  const matchDate = new Date(currentMatch?.fixture?.date || "");
                  const weekday = matchDate.toLocaleDateString("en-GB", { weekday: "long" });
                  const month = matchDate.toLocaleDateString("en-GB", { month: "short" });
                  const day = matchDate.getDate();
                  const getOrdinalSuffix = (day: number) => {
                    if (day > 3 && day < 21) return "th";
                    switch (day % 10) {
                      case 1: return "st";
                      case 2: return "nd";
                      case 3: return "rd";
                      default: return "th";
                    }
                  };
                  const dayWithSuffix = `${day}${getOrdinalSuffix(day)}`;
                  const formattedTime = matchDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });
                  const venueName = currentMatch?.fixture?.venue?.name || "Stadium";

                  return `${weekday}, ${dayWithSuffix} ${month} | ${formattedTime} | ${venueName}`;
                } catch (e) {
                  return `Today | ${currentMatch?.fixture?.venue?.name || "Stadium"}`;
                }
              })()}
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="flex justify-around border-t border-gray-200 pt-4 mt-12 pb-4">
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