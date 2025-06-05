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
      </CardContent>
    </Card>
  );
};

export default MyFeaturedMatchSlide;