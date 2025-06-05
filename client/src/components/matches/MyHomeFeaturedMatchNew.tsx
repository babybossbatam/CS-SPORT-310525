import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid } from 'date-fns';
import MyColoredBar from './MyColoredBar';
import { fetchFeaturedMatchData } from '@/lib/MyFeatureMatchFetchDataNew';

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

  // Dynamic team colors
  const getTeamColor = (teamId: number) => {
    const colors = ['#6f7c93', '#8b0000', '#1d3557', '#2a9d8f', '#e63946'];
    return colors[teamId % colors.length];
  };

  // Loading state
  if (loading) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-8 overflow-hidden relative">
        <Badge 
          variant="secondary" 
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading featured matches...</p>
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

      {matches.length > 1 && (
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
            {/* Main match display - Colored Bar */}
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

            {/* Venue Information */}
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

            {/* Indicator dots for multiple matches */}
            {matches.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {matches.map((_, index) => (
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

export default MyHomeFeaturedMatchNew;