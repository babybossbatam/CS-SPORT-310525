
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

// Static mock data for design purposes
const mockFixtures = [
  {
    fixture: {
      id: 1,
      date: "2025-01-25T15:00:00Z",
      status: {
        short: "LIVE",
        long: "Match Finished"
      }
    },
    league: {
      id: 39,
      name: "Premier League",
      logo: "https://media.api-sports.io/football/leagues/39.png",
      country: "England"
    },
    teams: {
      home: {
        id: 33,
        name: "Manchester United",
        logo: "https://media.api-sports.io/football/teams/33.png"
      },
      away: {
        id: 34,
        name: "Newcastle",
        logo: "https://media.api-sports.io/football/teams/34.png"
      }
    },
    goals: {
      home: 2,
      away: 1
    },
    score: {
      halftime: {
        home: 1,
        away: 0
      },
      fulltime: {
        home: 2,
        away: 1
      }
    }
  },
  {
    fixture: {
      id: 2,
      date: "2025-01-25T17:30:00Z",
      status: {
        short: "1H",
        long: "First Half"
      }
    },
    league: {
      id: 140,
      name: "La Liga",
      logo: "https://media.api-sports.io/football/leagues/140.png",
      country: "Spain"
    },
    teams: {
      home: {
        id: 541,
        name: "Real Madrid",
        logo: "https://media.api-sports.io/football/teams/541.png"
      },
      away: {
        id: 529,
        name: "Barcelona",
        logo: "https://media.api-sports.io/football/teams/529.png"
      }
    },
    goals: {
      home: 1,
      away: 0
    },
    score: {
      halftime: {
        home: 1,
        away: 0
      },
      fulltime: {
        home: null,
        away: null
      }
    }
  },
  {
    fixture: {
      id: 3,
      date: "2025-01-25T20:00:00Z",
      status: {
        short: "NS",
        long: "Not Started"
      }
    },
    league: {
      id: 135,
      name: "Serie A",
      logo: "https://media.api-sports.io/football/leagues/135.png",
      country: "Italy"
    },
    teams: {
      home: {
        id: 489,
        name: "AC Milan",
        logo: "https://media.api-sports.io/football/teams/489.png"
      },
      away: {
        id: 496,
        name: "Juventus",
        logo: "https://media.api-sports.io/football/teams/496.png"
      }
    },
    goals: {
      home: null,
      away: null
    },
    score: {
      halftime: {
        home: null,
        away: null
      },
      fulltime: {
        home: null,
        away: null
      }
    }
  }
];

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  maxMatches = 3
}) => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use static mock data
  const fixtures = mockFixtures.slice(0, maxMatches);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? fixtures.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === fixtures.length - 1 ? 0 : prev + 1));
  };

  const getMatchStatus = (fixture: typeof mockFixtures[0]) => {
    const status = fixture.fixture.status.short;
    if (['1H', '2H', 'HT', 'LIVE'].includes(status)) {
      return { text: 'LIVE', color: 'bg-red-500' };
    } else if (status === 'FT') {
      return { text: 'FINISHED', color: 'bg-gray-500' };
    } else {
      return { text: '15:00', color: 'bg-blue-500' };
    }
  };

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
          <span className="mr-3">Jan 25, 2025</span>
          <Clock className="h-4 w-4 mr-1" />
          <span>15:00</span>
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
