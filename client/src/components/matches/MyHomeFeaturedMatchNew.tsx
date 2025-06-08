import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCentralData } from "@/providers/CentralDataProvider";
import { shouldExcludeFromPopularLeagues, isRestrictedUSLeague } from "@/lib/MyPopularLeagueExclusion";
import { shouldExcludeFeaturedMatch } from "@/lib/MyFeaturedMatchExclusion";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 1,
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get central cache data
  const { fixtures, liveFixtures, isLoading } = useCentralData();

  // Calculate dates
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().slice(0, 10);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const nextDayAfterTomorrowDate = dayAfterTomorrow.toISOString().slice(0, 10);

  // Filter and process fixtures from central cache
  const featuredMatches = useMemo(() => {
    if (!fixtures?.length && !liveFixtures?.length) return [];

    // Combine all available fixtures
    const allFixtures = [...fixtures, ...liveFixtures];

    // Define popular leagues for featured matches
    const POPULAR_LEAGUES = [
      39, 45, 48, // England: Premier League, FA Cup, EFL Cup
      140, 143, // Spain: La Liga, Copa del Rey
      135, 137, // Italy: Serie A, Coppa Italia
      78, 81, // Germany: Bundesliga, DFB Pokal
      61, 66, // France: Ligue 1, Coupe de France
      2, 3, 848, // Champions League, Europa League, Conference League
      301, // UAE Pro League
      233, // Egyptian Premier League
      15, // FIFA Club World Cup
      914, // COSAFA Cup
    ];

    const POPULAR_COUNTRIES_ORDER = [
      "England", "Spain", "Italy", "Germany", "France", "World", "Europe",
      "South America", "Brazil", "Saudi Arabia", "Egypt", "Colombia",
      "United States", "USA", "US", "United Arab Emirates", "United-Arab-Emirates",
    ];

    const filtered = allFixtures.filter((fixture) => {
      // Basic validation
      if (!fixture?.league || !fixture?.teams || !fixture?.teams?.home || !fixture?.teams?.away) {
        return false;
      }

      // Check if fixture is for today, tomorrow, or day after tomorrow
      const fixtureDate = new Date(fixture.fixture.date).toISOString().slice(0, 10);
      const isValidDate = fixtureDate === today || fixtureDate === tomorrowDate || fixtureDate === nextDayAfterTomorrowDate;

      if (!isValidDate) return false;

      // For featured matches, be more permissive with time filtering
      // Skip complex smart time filtering for now to include more matches

      // Apply basic exclusion filters but be more permissive
      if (shouldExcludeFromPopularLeagues(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name,
        fixture.league.country,
      )) {
        return false;
      }

      if (isRestrictedUSLeague(fixture.league.id, fixture.league.country)) {
        return false;
      }

      // Apply featured match exclusions
      if (shouldExcludeFeaturedMatch(fixture)) {
        return false;
      }

      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";
      const leagueName = fixture.league?.name?.toLowerCase() || "";

      // Check if it's a popular league
      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase()),
      );

      // Check if it's an international competition (be more inclusive)
      const isInternationalCompetition =
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        leagueName.includes("nations league") ||
        leagueName.includes("world cup") ||
        leagueName.includes("fifa club world cup") ||
        leagueName.includes("fifa") ||
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        leagueName.includes("copa libertadores") ||
        leagueName.includes("copa sudamericana") ||
        leagueName.includes("libertadores") ||
        leagueName.includes("sudamericana") ||
        leagueName.includes("qualification") ||
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        (leagueName.includes("international") && !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      // Be more inclusive - if it matches any criteria, include it
      return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
    });

    // Sort by priority: Live matches first, then upcoming, then by league importance
    const prioritized = filtered.sort((a, b) => {
      const aIsLive = ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(a.fixture.status.short);
      const bIsLive = ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(b.fixture.status.short);

      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      // Prioritize by league importance
      const aIsTopLeague = [39, 140, 135, 78, 61, 2, 3].includes(a.league.id);
      const bIsTopLeague = [39, 140, 135, 78, 61, 2, 3].includes(b.league.id);

      if (aIsTopLeague && !bIsTopLeague) return -1;
      if (!aIsTopLeague && bIsTopLeague) return 1;

      return 0;
    });

    console.log(`🔍 [MyHomeFeaturedMatchNew] Filtered ${allFixtures.length} fixtures to ${prioritized.length} featured matches`);

    return prioritized.slice(0, maxMatches * 3); // Get more options for cycling
  }, [fixtures, liveFixtures, today, tomorrowDate, nextDayAfterTomorrowDate, maxMatches]);

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
          {/* League info section */}
          <div className="bg-white p-2 mt-6 relative mt-4 mb-4">
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
                  {getMatchStatusLabel(currentMatch)}
                </Badge>
              )}
            </div>
          </div>

          {/* Score and Status Display */}
          <div className="score-area h-20 flex flex-col justify-center items-center relative">
            {(() => {
              const status = currentMatch?.fixture?.status?.short;
              const elapsed = currentMatch?.fixture?.status?.elapsed;
              const isLive = getMatchStatusLabel(currentMatch) === "LIVE";
              const hasScore = currentMatch?.fixture?.status?.short &&
                ["1H", "2H", "HT", "ET", "P", "FT", "AET", "PEN"].includes(status);

              if (hasScore) {
                const statusText = getMatchStatus(currentMatch);
                const scoreText = `${currentMatch?.goals?.home ?? 0}   -   ${currentMatch?.goals?.away ?? 0}`;

                return (
                  <div className={`flex flex-col items-center gap-1 ${isLive ? "text-red-600" : "text-gray-900"}`}>
                    <div className="text-xs uppercase tracking-wide">
                      {statusText}
                    </div>
                    <div className="text-lg font-semibold">
                      {scoreText}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="text-gray-500 text-sm uppercase tracking-wide">
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
                  className="h-full w-[calc(50%-16px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative"
                  style={{
                    background: getTeamColor(currentMatch?.teams?.home?.id || 0),
                  }}
                >
                  <img
                    src={currentMatch?.teams?.home?.logo || `/assets/fallback-logo.svg`}
                    alt={currentMatch?.teams?.home?.name || "Home Team"}
                    className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full"
                    style={{
                      top: "calc(50% - 32px)",
                      left: "-32px",
                      filter: "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                    }}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.svg";
                    }}
                  />
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
                  <span className="vs-text font-bold">VS</span>
                </div>

                {/* Away team colored bar and logo */}
                <div
                  className="h-full w-[calc(50%-26px)] mr-[87px] transition-all duration-500 ease-in-out opacity-100"
                  style={{
                    background: getTeamColor(currentMatch?.teams?.away?.id || 1),
                  }}
                ></div>

                <div
                  className="absolute text-white uppercase text-center max-w-[120px] truncate md:max-w-[200px] font-sans"
                  style={{
                    top: "calc(50% - 13px)",
                    right: "130px",
                    fontSize: "1.24rem",
                    fontWeight: "normal",
                  }}
                >
                  {currentMatch?.teams?.away?.name || "Away Team"}
                </div>

                <img
                  src={currentMatch?.teams?.away?.logo || `/assets/fallback-logo.svg`}
                  alt={currentMatch?.teams?.away?.name || "Away Team"}
                  className="absolute z-20 w-[64px] h-[64px] object-cover rounded-full"
                  style={{
                    top: "calc(50% - 32px)",
                    right: "87px",
                    transform: "translateX(50%)",
                    filter: "contrast(115%) brightness(105%) drop-shadow(4px 4px 6px rgba(0, 0, 0, 0.3))",
                  }}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/fallback-logo.svg";
                  }}
                />
              </div>
            </div>

            {/* Match date and venue */}
            <div className="absolute text-center text-sm text-black font-medium"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 20px)",
                width: "max-content",
              }}
            >
              {(() => {
                const fixtureDate = new Date(currentMatch?.fixture?.date).toISOString().slice(0, 10);
                const dateLabel = fixtureDate === today ? "Today" : fixtureDate === tomorrowDate ? "Tomorrow" : "Upcoming";
                return `${dateLabel} | ${currentMatch?.fixture?.venue?.name || "Stadium"}`;
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
          {featuredMatches.slice(0, Math.min(featuredMatches.length, 5)).map((_, index) => (
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