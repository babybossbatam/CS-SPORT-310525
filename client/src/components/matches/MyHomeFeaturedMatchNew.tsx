import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import FixedMatchTimer from './FixedMatchTimer';
import { apiRequest } from '@/lib/queryClient';

interface MyHomeFeaturedMatchNewProps {
  selectedDate: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({ 
  selectedDate,
  maxMatches = 1
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter no.6 mechanisms from TodayPopularFootballLeaguesNew
  const POPULAR_COUNTRIES_ORDER = [
    "England",
    "Spain", 
    "Italy",
    "Germany",
    "France",
    "World",
    "Europe",
    "South America",
    "Brazil",
    "Saudi Arabia",
    "Egypt",
    "Colombia",
    "United States",
    "USA",
    "US", 
    "United Arab Emirates",
    "United-Arab-Emirates",
  ];

  const POPULAR_LEAGUES = [
    39, 45, 48, // England: Premier League, FA Cup, EFL Cup
    140, 143, // Spain: La Liga, Copa del Rey
    135, 137, // Italy: Serie A, Coppa Italia
    78, 81, // Germany: Bundesliga, DFB Pokal
    61, 66, // France: Ligue 1, Coupe de France
    301, // UAE Pro League
    233, // Egyptian Premier League
    15, // FIFA Club World Cup
    914, 848, // COSAFA Cup, UEFA Conference League
    2, 3, // Champions League, Europa League
  ];

  // Apply Filter no.6 mechanisms
  const applyFilterNo6 = (fixtures) => {
    return fixtures.filter((fixture) => {
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return false;
      }

      const league = fixture.league;
      const country = league.country?.toLowerCase() || "";
      const leagueName = league.name?.toLowerCase() || "";

      // Check if it's a popular league
      const isPopularLeague = POPULAR_LEAGUES.includes(league.id);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(popularCountry =>
        country.includes(popularCountry.toLowerCase()) ||
        league.country?.toLowerCase().includes(popularCountry.toLowerCase())
      );

      // Check if it's an international competition
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
  };

  // Fetch matches using Filter no.6 mechanisms
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
        console.log('🔍 [FeaturedMatch] Fetching matches for date:', currentDate);

        // Fetch from API
        const response = await apiRequest('GET', `/api/fixtures/date/${currentDate}?all=true`);
        const allFixtures = await response.json();

        console.log('🔍 [FeaturedMatch] Found', allFixtures.length, 'total fixtures for', currentDate);

        if (!allFixtures || allFixtures.length === 0) {
          setMatches([]);
          setLoading(false);
          return;
        }

        // Apply Filter no.6 mechanisms
        const filteredFixtures = applyFilterNo6(allFixtures);
        console.log('🔍 [FeaturedMatch] Filtered to', filteredFixtures.length, 'popular league fixtures');

        // Sort matches with the same priority as TodayPopularFootballLeaguesNew
        const sortedFixtures = filteredFixtures.sort((a, b) => {
          const aStatus = a.fixture.status.short;
          const bStatus = b.fixture.status.short;
          const aDate = new Date(a.fixture.date);
          const bDate = new Date(b.fixture.date);
          const now = new Date();

          // Priority 1: Live matches
          const aIsLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(aStatus);
          const bIsLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(bStatus);

          if (aIsLive && !bIsLive) return -1;
          if (!aIsLive && bIsLive) return 1;

          // Priority 2: Upcoming matches (within next 24 hours)
          const aIsUpcoming = aStatus === 'NS' && aDate > now && (aDate.getTime() - now.getTime()) < (24 * 60 * 60 * 1000);
          const bIsUpcoming = bStatus === 'NS' && bDate > now && (bDate.getTime() - now.getTime()) < (24 * 60 * 60 * 1000);

          if (aIsUpcoming && !bIsUpcoming) return -1;
          if (!aIsUpcoming && bIsUpcoming) return 1;

          // Priority 3: Recent finished matches (within last 6 hours)
          const aIsRecent = aStatus === 'FT' && (now.getTime() - aDate.getTime()) < (6 * 60 * 60 * 1000);
          const bIsRecent = bStatus === 'FT' && (now.getTime() - bDate.getTime()) < (6 * 60 * 60 * 1000);

          if (aIsRecent && !bIsRecent) return -1;
          if (!aIsRecent && bIsRecent) return 1;

          // Sort by date within same category
          return Math.abs(aDate.getTime() - now.getTime()) - Math.abs(bDate.getTime() - now.getTime());
        });

        // Take the first match for the first slide (as requested)
        const featuredMatches = sortedFixtures.slice(0, maxMatches);

        setMatches(featuredMatches);
        setLoading(false);

      } catch (error) {
        console.error('🔍 [FeaturedMatch] Error fetching matches:', error);
        setError('Failed to load featured matches.');
        toast({
          title: "Something went wrong!",
          description: "Failed to load featured matches.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [selectedDate, maxMatches, toast]);

  const handleMatchClick = (match) => {
    if (match && match.fixture && match.fixture.id) {
      navigate(`/match/${match.fixture.id}`);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge 
          variant="secondary" 
          className="bg-blue-600 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-blue-500 animate-pulse" />
          <p className="text-gray-600 font-medium">Loading today's featured match...</p>
          <p className="text-gray-400 text-sm mt-1">Getting the best match from popular leagues</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge 
          variant="secondary" 
          className="bg-red-600 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Error
        </Badge>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">Error loading matches</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge 
          variant="secondary" 
          className="bg-blue-600 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No featured matches available</p>
            <p className="text-sm">Check back later for exciting matches</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence>
      {matches.map((match, index) => (
        <motion.Card
          key={match.fixture.id}
          className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden relative cursor-pointer hover:shadow-xl transition-shadow duration-200"
          onClick={() => handleMatchClick(match)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Badge 
            variant="secondary" 
            className="bg-blue-600 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
          >
            Featured Match
          </Badge>

          <CardContent className="p-6">
            {/* League Info */}
            <div className="flex items-center gap-2 mb-4">
              {match.league?.flag && (
                <img 
                  src={match.league.flag} 
                  alt={match.league.country || 'Country'}
                  className="w-4 h-4 rounded-sm object-cover"
                />
              )}
              <span className="text-sm font-medium text-gray-600">
                {match.league.name}
              </span>
              <Badge 
                className={`text-xs px-2 py-1 text-white ${
                  match.fixture.status.short === 'NS' ? 'bg-blue-500' :
                  ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(match.fixture.status.short) ? 'bg-red-500' :
                  'bg-gray-500'
                }`}
              >
                {match.fixture.status.short === 'NS' ? format(new Date(match.fixture.date), 'HH:mm') : match.fixture.status.short}
              </Badge>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between mb-4">
              {/* Home Team */}
              <div className="flex items-center gap-3 flex-1">
                <img 
                  src={match.teams.home.logo || '/assets/fallback-logo.svg'} 
                  alt={match.teams.home.name}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-semibold text-gray-900 truncate">
                  {match.teams.home.name}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2 px-4">
                {match.goals.home !== null && match.goals.away !== null ? (
                  <div className="text-2xl font-bold text-gray-900">
                    {match.goals.home} - {match.goals.away}
                  </div>
                ) : (
                  <div className="text-lg font-medium text-gray-500">
                    vs
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-3 flex-1 justify-end">
                <span className="font-semibold text-gray-900 truncate">
                  {match.teams.away.name}
                </span>
                <img 
                  src={match.teams.away.logo || '/assets/fallback-logo.svg'} 
                  alt={match.teams.away.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
            </div>

            {/* Match Info */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(match.fixture.date), 'MMM dd, HH:mm')}
                </div>
                {match.fixture?.venue?.name && (
                  <div className="flex items-center gap-1">
                    <Grid3X3 className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">
                      {match.fixture.venue.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span>View Details</span>
              </div>
            </div>
          </CardContent>
        </motion.Card>
      ))}
    </AnimatePresence>
  );
};

export default MyFeaturedMatchSlide;