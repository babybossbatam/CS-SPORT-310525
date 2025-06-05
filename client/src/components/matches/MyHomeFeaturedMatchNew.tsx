
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight, BarChart3, Users, Clock, Grid3X3 } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid } from 'date-fns';
import { fetchFeaturedMatchData } from '@/lib/MyFeatureMatchFetchDataNew';

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({ 
  selectedDate,
  maxMatches = 8
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured match data
  useEffect(() => {
    const loadFeaturedMatches = async () => {
      try {
        setLoading(true);
        const featuredMatches = await fetchFeaturedMatchData(selectedDate, maxMatches);
        setMatches(featuredMatches);
        setCurrentIndex(0); // Reset to first match when data changes
      } catch (error) {
        console.error('Error loading featured matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedMatches();
  }, [selectedDate, maxMatches]);

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

  // Get country flag URL from team logo URL
  const getCountryFlag = (teamLogo: string, teamName: string) => {
    // Simple country mapping based on team names
    const countryMap = {
      'Germany': 'https://flagcdn.com/w40/de.png',
      'Portugal': 'https://flagcdn.com/w40/pt.png',
      'Spain': 'https://flagcdn.com/w40/es.png',
      'France': 'https://flagcdn.com/w40/fr.png',
      'Italy': 'https://flagcdn.com/w40/it.png',
      'England': 'https://flagcdn.com/w40/gb-eng.png',
      'Brazil': 'https://flagcdn.com/w40/br.png',
      'Argentina': 'https://flagcdn.com/w40/ar.png',
    };

    // Try to determine country from team name
    for (const [country, flag] of Object.entries(countryMap)) {
      if (teamName.toLowerCase().includes(country.toLowerCase())) {
        return flag;
      }
    }

    // Default fallback
    return 'https://flagcdn.com/w40/xx.png';
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
          <p className="text-gray-400 text-sm mt-1">Getting the first league match from popular leagues</p>
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
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No featured matches available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden relative">
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
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 p-2 rounded-full z-30 shadow-md transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={handleNext}
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
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "tween", duration: 0.2 }}
          >
            {/* League Header */}
            <div className="bg-gray-50 border-b px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                {currentMatch?.league?.logo ? (
                  <img
                    src={currentMatch.league.logo}
                    alt={currentMatch.league.name}
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/fallback-logo.svg";
                    }}
                  />
                ) : (
                  <Trophy className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-sm font-semibold text-gray-800">
                  {currentMatch?.league?.name || "League Name"}
                </span>
              </div>
            </div>

            {/* Match Status */}
            <div className="text-center py-2 bg-gray-100">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                {currentMatch.score.status}
              </span>
            </div>

            {/* Score Section */}
            <div className="text-center py-4 bg-white">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {currentMatch.score.home !== null && currentMatch.score.away !== null 
                  ? `${currentMatch.score.home} - ${currentMatch.score.away}`
                  : 'VS'
                }
              </div>
            </div>

            {/* Teams Section */}
            <div className="relative bg-gradient-to-r from-gray-800 via-red-600 to-gray-800 py-8">
              {/* Home Team */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                <div className="relative ml-4">
                  {/* Country Flag */}
                  <img
                    src={getCountryFlag(currentMatch.homeTeam.logo, currentMatch.homeTeam.name)}
                    alt="Country"
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.currentTarget.src = "https://flagcdn.com/w40/xx.png";
                    }}
                  />
                </div>
                <div className="ml-4 text-white">
                  <div className="font-bold text-lg uppercase tracking-wide">
                    {currentMatch.homeTeam.name.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* VS in center */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-white text-red-600 font-bold text-xl px-4 py-2 rounded transform -skew-x-12">
                  VS
                </div>
              </div>

              {/* Away Team */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                <div className="mr-4 text-white text-right">
                  <div className="font-bold text-lg uppercase tracking-wide">
                    {currentMatch.awayTeam.name.toUpperCase()}
                  </div>
                </div>
                <div className="relative mr-4">
                  {/* Country Flag */}
                  <img
                    src={getCountryFlag(currentMatch.awayTeam.logo, currentMatch.awayTeam.name)}
                    alt="Country"
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.currentTarget.src = "https://flagcdn.com/w40/xx.png";
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Match Details */}
            <div className="text-center py-3 bg-gray-50 border-b">
              <div className="text-sm text-gray-700 font-medium">
                {(() => {
                  try {
                    const matchDate = parseISO(currentMatch.fixture.date);
                    const formattedDate = format(matchDate, "EEEE, do MMM");
                    const timeOnly = format(matchDate, "HH:mm");

                    return (
                      <>
                        {formattedDate} | {timeOnly}
                        {currentMatch.fixture.venue
                          ? ` | ${currentMatch.fixture.venue}`
                          : ""}
                      </>
                    );
                  } catch (e) {
                    return currentMatch.fixture.venue?.name || "";
                  }
                })()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-0 bg-white">
              <button
                onClick={handleMatchClick}
                className="flex flex-col items-center py-4 hover:bg-gray-50 transition-colors border-r border-gray-200"
              >
                <BarChart3 className="h-5 w-5 text-blue-600 mb-1" />
                <span className="text-xs font-medium text-gray-700">Match Page</span>
              </button>
              
              <button
                onClick={handleMatchClick}
                className="flex flex-col items-center py-4 hover:bg-gray-50 transition-colors border-r border-gray-200"
              >
                <Users className="h-5 w-5 text-blue-600 mb-1" />
                <span className="text-xs font-medium text-gray-700">Lineups</span>
              </button>
              
              <button
                onClick={handleMatchClick}
                className="flex flex-col items-center py-4 hover:bg-gray-50 transition-colors border-r border-gray-200"
              >
                <Clock className="h-5 w-5 text-blue-600 mb-1" />
                <span className="text-xs font-medium text-gray-700">Stats</span>
              </button>
              
              <button
                onClick={handleMatchClick}
                className="flex flex-col items-center py-4 hover:bg-gray-50 transition-colors"
              >
                <Grid3X3 className="h-5 w-5 text-blue-600 mb-1" />
                <span className="text-xs font-medium text-gray-700">Bracket</span>
              </button>
            </div>

            {/* Indicator dots for multiple matches */}
            {matches.length > 1 && (
              <div className="flex justify-center gap-2 py-3 bg-gray-50">
                {matches.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
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

export default MyFeaturedMatchSlide;
