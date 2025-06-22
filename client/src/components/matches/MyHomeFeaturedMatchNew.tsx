
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { CURRENT_POPULAR_LEAGUES } from "@/components/leagues/PopularLeaguesList";

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 3,
}) => {
  const [, navigate] = useLocation();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get the popular league IDs from the PopularLeaguesList
  const popularLeagueIds = CURRENT_POPULAR_LEAGUES.slice(0, 10).map(league => league.id);

  useEffect(() => {
    const fetchFeaturedFixtures = async () => {
      try {
        setIsLoading(true);
        
        // Use today's date if no date is provided
        const targetDate = selectedDate || new Date().toISOString().slice(0, 10);
        
        // Fetch fixtures for the target date
        const response = await fetch(`/api/fixtures/date/${targetDate}?all=true`);
        if (!response.ok) {
          throw new Error('Failed to fetch fixtures');
        }
        
        const allFixtures: Fixture[] = await response.json();
        
        // Filter fixtures from popular leagues
        const popularFixtures = allFixtures.filter(fixture => 
          popularLeagueIds.includes(fixture.league.id)
        );
        
        // Prioritize live matches, then upcoming matches from top leagues
        const sortedFixtures = popularFixtures.sort((a, b) => {
          // Prioritize live matches
          const aIsLive = ['1H', '2H', 'HT', 'LIVE'].includes(a.fixture.status.short);
          const bIsLive = ['1H', '2H', 'HT', 'LIVE'].includes(b.fixture.status.short);
          
          if (aIsLive && !bIsLive) return -1;
          if (!aIsLive && bIsLive) return 1;
          
          // Then prioritize by league importance (order in CURRENT_POPULAR_LEAGUES)
          const aLeagueIndex = popularLeagueIds.indexOf(a.league.id);
          const bLeagueIndex = popularLeagueIds.indexOf(b.league.id);
          
          if (aLeagueIndex !== bLeagueIndex) {
            return aLeagueIndex - bLeagueIndex;
          }
          
          // Finally sort by date
          return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
        });
        
        setFixtures(sortedFixtures.slice(0, maxMatches));
      } catch (error) {
        console.error('Error fetching featured fixtures:', error);
        setFixtures([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedFixtures();
  }, [selectedDate, maxMatches]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? fixtures.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === fixtures.length - 1 ? 0 : prev + 1));
  };

  const getMatchStatus = (fixture: Fixture) => {
    const status = fixture.fixture.status.short;
    if (['1H', '2H', 'HT', 'LIVE'].includes(status)) {
      return { text: 'LIVE', color: 'bg-red-500' };
    } else if (status === 'FT') {
      return { text: 'FINISHED', color: 'bg-gray-500' };
    } else {
      return { text: format(parseISO(fixture.fixture.date), 'HH:mm'), color: 'bg-blue-500' };
    }
  };

  if (isLoading) {
    return (
      <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
            <p className="text-sm">Loading featured matches...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fixtures.length === 0) {
    return (
      <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
        <Badge
          variant="secondary"
          className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
        >
          Featured Match
        </Badge>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No featured matches</p>
            <p className="text-sm">Check back later for upcoming games</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentFixture = fixtures[currentIndex];
  const status = getMatchStatus(currentFixture);

  return (
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4 cursor-pointer" onClick={() => navigate(`/match/${currentFixture.fixture.id}`)}>
      <Badge
        variant="secondary"
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        Featured Match
      </Badge>

      {fixtures.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 z-20 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 z-20 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      <CardContent className="p-6">
        {/* League Info */}
        <div className="flex items-center justify-center mb-4">
          <img
            src={currentFixture.league.logo}
            alt={currentFixture.league.name}
            className="w-6 h-6 mr-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
            }}
          />
          <span className="text-sm font-medium text-gray-600">
            {currentFixture.league.name}
          </span>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between mb-4">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1">
            <img
              src={currentFixture.teams.home.logo}
              alt={currentFixture.teams.home.name}
              className="w-12 h-12 mb-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
              }}
            />
            <span className="text-sm font-medium text-center">
              {currentFixture.teams.home.name}
            </span>
          </div>

          {/* Score/Status */}
          <div className="flex flex-col items-center mx-4">
            <Badge className={`${status.color} text-white mb-2`}>
              {status.text}
            </Badge>
            <div className="text-2xl font-bold">
              {currentFixture.goals.home !== null && currentFixture.goals.away !== null ? (
                `${currentFixture.goals.home} - ${currentFixture.goals.away}`
              ) : (
                'vs'
              )}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1">
            <img
              src={currentFixture.teams.away.logo}
              alt={currentFixture.teams.away.name}
              className="w-12 h-12 mb-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
              }}
            />
            <span className="text-sm font-medium text-center">
              {currentFixture.teams.away.name}
            </span>
          </div>
        </div>

        {/* Match Info */}
        <div className="flex items-center justify-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          <span className="mr-3">
            {format(parseISO(currentFixture.fixture.date), 'MMM d, yyyy')}
          </span>
          <Clock className="h-4 w-4 mr-1" />
          <span>
            {format(parseISO(currentFixture.fixture.date), 'HH:mm')}
          </span>
        </div>

        {/* Pagination dots */}
        {fixtures.length > 1 && (
          <div className="flex justify-center mt-4 space-x-1">
            {fixtures.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyFeaturedMatchSlide;
