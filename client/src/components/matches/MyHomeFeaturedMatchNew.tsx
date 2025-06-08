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

    // Popular leagues for prioritization
    const popularLeagues = [
      "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1",
      "UEFA Champions League", "UEFA Europa League", "UEFA Nations League",
      "Major League Soccer", "Primera A"
    ];

    // Filter for featured matches
    const filtered = allFixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.teams?.home?.name || !fixture?.teams?.away?.name) {
        return false;
      }

      const fixtureDate = fixture.fixture.date.slice(0, 10);
      const isValidDate = [today, tomorrow, nextDay].includes(fixtureDate);

      if (!isValidDate) return false;

      // Apply exclusion filters but be more permissive
      if (shouldExcludeFromPopularLeagues(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name
      )) {
        return false;
      }

      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";
      const leagueName = fixture.league?.name?.toLowerCase() || "";

      // Check if it's a popular league
      const isPopularLeague = popularLeagues.some(league => 
        leagueName.includes(league.toLowerCase())
      );

      // Popular countries
      const popularCountries = [
        "england", "spain", "italy", "germany", "france", "brazil", "argentina",
        "netherlands", "portugal", "united states", "mexico"
      ];

      const isFromPopularCountry = popularCountries.some(
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

    // Sort by priority: live matches first, then popular leagues, then by date
    const sorted = filtered.sort((a, b) => {
      const aIsLive = ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(a.fixture.status?.short);
      const bIsLive = ["1H", "2H", "HT", "LIVE", "BT", "ET", "P", "SUSP", "INT"].includes(b.fixture.status?.short);

      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      const aIsPopular = popularLeagues.some(league => 
        a.league.name.toLowerCase().includes(league.toLowerCase())
      );
      const bIsPopular = popularLeagues.some(league => 
        b.league.name.toLowerCase().includes(league.toLowerCase())
      );

      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;

      return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
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
          {/* Use CombinedLeagueCards for the featured match display */}
          <CombinedLeagueCards 
            fixtures={[currentMatch]}
            selectedDate={selectedDate}
            showOnlyFeatured={true}
          />

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