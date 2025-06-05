
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight, BarChart3, Users, Clock, Grid3X3 } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid } from 'date-fns';
import { 
  applyPriorityFiltering, 
  groupFixturesByCountryAndLeague, 
  filterPopularCountries,
  sortLeaguesByPriority,
  getCountryFlag 
} from '@/components/matches/MyNewPriorityFilters';
import { CacheManager } from '@/lib/cachingHelper';
import { backgroundCache } from '@/lib/backgroundCache';

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
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

  // Get current date if not provided
  const currentDate = selectedDate || new Date().toISOString().split('T')[0];

  // Fetch featured match data using priority filters and caching
  useEffect(() => {
    const loadFeaturedMatches = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cacheKey = ['featured-matches', currentDate];
        const cachedData = CacheManager.getCachedData(cacheKey, 15 * 60 * 1000); // 15 minutes cache
        
        if (cachedData) {
          console.log('🎯 [FeaturedMatch] Using cached data:', cachedData.length, 'matches');
          setMatches(cachedData);
          setCurrentIndex(0);
          setLoading(false);
          return;
        }

        console.log('🔍 [FeaturedMatch] Fetching fresh data for date:', currentDate);

        // Fetch all fixtures for the date
        const response = await fetch(`/api/fixtures/date/${currentDate}?all=true`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const allFixtures = await response.json();
        console.log('🔍 [FeaturedMatch] Found', allFixtures.length, 'total fixtures for', currentDate);

        if (!allFixtures || allFixtures.length === 0) {
          setMatches([]);
          setLoading(false);
          return;
        }

        // Apply priority filtering using MyNewPriorityFilters
        const filteredFixtures = applyPriorityFiltering(allFixtures, currentDate);
        console.log('🔍 [FeaturedMatch] Filtered to', filteredFixtures.length, 'popular league fixtures');

        // Group by country and league
        const groupedByCountry = groupFixturesByCountryAndLeague(filteredFixtures);
        
        // Filter to show only popular countries
        const popularCountries = filterPopularCountries(groupedByCountry);
        
        // Flatten all leagues from popular countries
        const allLeaguesFlat = popularCountries.flatMap(countryData => 
          Object.values(countryData.leagues).map(leagueData => ({
            ...leagueData,
            country: countryData.country,
            flag: countryData.flag
          }))
        );

        // Sort leagues by priority
        const sortedLeagues = sortLeaguesByPriority(allLeaguesFlat);

        // Get featured matches (prioritize live matches, then upcoming, then recent)
        const featuredMatches = [];
        
        for (const leagueData of sortedLeagues) {
          if (featuredMatches.length >= maxMatches) break;
          
          const leagueMatches = leagueData.matches || [];
          
          // Sort matches within league: Live > Upcoming (next 24h) > Recent finished
          const sortedMatches = leagueMatches.sort((a, b) => {
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
            const aIsRecentFinished = ['FT', 'AET', 'PEN'].includes(aStatus) && (now.getTime() - aDate.getTime()) < (6 * 60 * 60 * 1000);
            const bIsRecentFinished = ['FT', 'AET', 'PEN'].includes(bStatus) && (now.getTime() - bDate.getTime()) < (6 * 60 * 60 * 1000);
            
            if (aIsRecentFinished && !bIsRecentFinished) return -1;
            if (!aIsRecentFinished && bIsRecentFinished) return 1;

            // Sort by time
            return aDate.getTime() - bDate.getTime();
          });

          // Add the best match from this league
          if (sortedMatches.length > 0) {
            const bestMatch = sortedMatches[0];
            featuredMatches.push({
              ...bestMatch,
              league: {
                ...bestMatch.league,
                country: leagueData.country,
                flag: leagueData.flag
              }
            });
          }
        }

        // Take only the required number of matches
        const finalMatches = featuredMatches.slice(0, maxMatches);
        
        console.log('🔍 [FeaturedMatch] Returning', finalMatches.length, 'featured matches:', {
          matches: finalMatches.map(m => ({
            league: m.league.name,
            homeTeam: m.teams.home.name,
            awayTeam: m.teams.away.name,
            status: m.fixture.status.short === 'NS' ? 'UPCOMING' : 
                   ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(m.fixture.status.short) ? 'LIVE' : 
                   'FINISHED'
          }))
        });

        // Cache the result
        CacheManager.setCachedData(cacheKey, finalMatches);
        
        // Store in background cache as well
        backgroundCache.set(`featured-matches-${currentDate}`, finalMatches, 15 * 60 * 1000);

        setMatches(finalMatches);
        setCurrentIndex(0);
        
      } catch (error) {
        console.error('🔍 [FeaturedMatch] Error fetching featured matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedMatches();
  }, [currentDate, maxMatches]);

  // Handle navigation (slide functions)
  const handlePrevious = () => {
    if (matches.length <= 1) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : matches.length - 1));
  };

  const handleNext = () => {
    if (matches.length <= 1) return;
    setCurrentIndex(prev => (prev < matches.length - 1 ? prev + 1 : 0));
  };

  const handleMatchClick = () => {
    if (currentMatch?.fixture?.id) {
      navigate(`/match/${currentMatch.fixture.id}`);
    }
  };

  // Get current match
  const currentMatch = matches[currentIndex];

  // Get match status display
  const getMatchStatus = (match) => {
    const status = match.fixture.status.short;
    const elapsed = match.fixture.status.elapsed;
    
    if (['1H', '2H'].includes(status)) {
      return `${elapsed}'`;
    }
    if (status === 'HT') return 'HT';
    if (status === 'FT') return 'FT';
    if (status === 'NS') {
      const matchDate = new Date(match.fixture.date);
      return format(matchDate, 'HH:mm');
    }
    return status;
  };

  // Get match status color
  const getStatusColor = (status) => {
    if (['1H', '2H', 'LIVE'].includes(status)) return 'bg-red-500';
    if (status === 'HT') return 'bg-orange-500';
    if (status === 'FT') return 'bg-gray-500';
    return 'bg-blue-500';
  };

  // Loading state
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

  // No matches state
  if (!currentMatch || matches.length === 0) {
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
    <Card className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden relative cursor-pointer hover:shadow-xl transition-shadow duration-200" onClick={handleMatchClick}>
      <Badge 
        variant="secondary" 
        className="bg-blue-600 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
      >
        Featured Match
      </Badge>

      {/* Navigation arrows */}
      {matches.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 p-2 rounded-full z-30 shadow-md transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 p-2 rounded-full z-30 shadow-md transition-all duration-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      <CardContent className="p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {/* League Info */}
            <div className="flex items-center gap-2 mb-4">
              {currentMatch.league.flag && (
                <img 
                  src={currentMatch.league.flag} 
                  alt={currentMatch.league.country}
                  className="w-4 h-4 rounded-sm object-cover"
                />
              )}
              <span className="text-sm font-medium text-gray-600">
                {currentMatch.league.name}
              </span>
              <Badge 
                className={`text-xs px-2 py-1 text-white ${getStatusColor(currentMatch.fixture.status.short)}`}
              >
                {getMatchStatus(currentMatch)}
              </Badge>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between mb-4">
              {/* Home Team */}
              <div className="flex items-center gap-3 flex-1">
                <img 
                  src={currentMatch.teams.home.logo || '/assets/fallback-logo.svg'} 
                  alt={currentMatch.teams.home.name}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-semibold text-gray-900 truncate">
                  {currentMatch.teams.home.name}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2 px-4">
                {currentMatch.goals.home !== null && currentMatch.goals.away !== null ? (
                  <div className="text-2xl font-bold text-gray-900">
                    {currentMatch.goals.home} - {currentMatch.goals.away}
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
                  {currentMatch.teams.away.name}
                </span>
                <img 
                  src={currentMatch.teams.away.logo || '/assets/fallback-logo.svg'} 
                  alt={currentMatch.teams.away.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
            </div>

            {/* Match Info */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(currentMatch.fixture.date), 'MMM dd, HH:mm')}
                </div>
                {currentMatch.fixture.venue?.name && (
                  <div className="flex items-center gap-1">
                    <Grid3X3 className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">
                      {currentMatch.fixture.venue.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                <span>View Details</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicator dots for multiple matches */}
        {matches.length > 1 && (
          <div className="flex justify-center gap-2 py-3 bg-gray-50">
            {matches.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyFeaturedMatchSlide;
