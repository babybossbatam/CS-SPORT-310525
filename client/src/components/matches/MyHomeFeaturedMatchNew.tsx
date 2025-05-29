import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from 'date-fns';

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

  // Mock data for design purposes
  const mockMatches = [
    {
      fixture: {
        id: 1,
        date: '2025-06-01T03:00:00Z',
        status: { short: 'NS' },
        venue: { name: 'Allianz Arena' }
      },
      league: {
        id: 2,
        name: 'UEFA Champions League',
        logo: '/assets/fallback-logo.svg'
      },
      teams: {
        home: {
          id: 529,
          name: 'Barcelona',
          logo: '/assets/fallback-logo.svg'
        },
        away: {
          id: 541,
          name: 'Real Madrid',
          logo: '/assets/fallback-logo.svg'
        }
      },
      goals: {
        home: null,
        away: null
      }
    },
    {
      fixture: {
        id: 2,
        date: '2025-05-29T18:00:00Z',
        status: { short: 'LIVE' },
        venue: { name: 'Old Trafford' }
      },
      league: {
        id: 39,
        name: 'Premier League',
        logo: '/assets/fallback-logo.svg'
      },
      teams: {
        home: {
          id: 33,
          name: 'Manchester United',
          logo: '/assets/fallback-logo.svg'
        },
        away: {
          id: 40,
          name: 'Liverpool',
          logo: '/assets/fallback-logo.svg'
        }
      },
      goals: {
        home: 2,
        away: 1
      }
    }
  ];

  // Handle navigation
  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : mockMatches.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < mockMatches.length - 1 ? prev + 1 : 0));
  };

  const handleMatchClick = () => {
    if (mockMatches[currentIndex]) {
      const match = mockMatches[currentIndex];
      navigate(`/matches/${match.fixture.id}`);
    }
  };

  // Get current match
  const currentMatch = mockMatches[currentIndex];

  // Get match status for display
  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;

    // Live matches
    if (['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(status)) {
      return status === 'HT' ? 'Half Time' : 'LIVE';
    }

    // Finished matches
    if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC', 'SUSP'].includes(status)) {
      return 'Recent';
    }

    return 'Scheduled';
  };

  // Dynamic team colors
  const getTeamColor = (teamId: number) => {
    const colors = ['#6f7c93', '#8b0000', '#1d3557', '#2a9d8f', '#e63946'];
    return colors[teamId % colors.length];
  };

  // No matches state
  if (!currentMatch) {
    return (
      <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
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
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
      >
        Featured Match
      </Badge>

      {mockMatches.length > 1 && (
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
            {/* Header with league info and status */}
            <div className="flex items-center justify-center gap-2 mb-2 mb-4">
              <div className="flex items-center gap-2">
                <img
                  src={currentMatch.league.logo || '/assets/fallback-logo.svg'}
                  alt={currentMatch.league.name}
                  className="w-5 h-5 rounded object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/assets/fallback-logo.svg') {
                      target.src = '/assets/fallback-logo.svg';
                    }
                  }}
                />
                <span className="text-sm font-medium">{currentMatch.league.name}</span>
              </div>

              <span className="text-gray-400">-</span>

              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-800">
                  {getMatchStatus(currentMatch)}
                </span>
              </div>
            </div>

            

            {/* Main match display */}
            <div className="relative">
              <div 
                className="flex relative h-[53px] rounded-md mb-8 transition-all duration-300 ease-in-out opacity-100 mt-[-8px] cursor-pointer"
                onClick={handleMatchClick}
              >
                <div className="w-full h-full flex justify-between relative">
                  {/* Home team colored bar and logo */}
                  <div 
                    className="h-full w-[calc(50%-67px)] ml-[77px] transition-all duration-500 ease-in-out opacity-100 relative" 
                    style={{ 
                      background: getTeamColor(currentMatch.teams.home.id),
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    <div 
                      className="absolute left-[-32px] z-20 w-[64px] h-[64px] bg-white/10 rounded-full p-2 transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{
                        top: "calc(50% - 32px)",
                        cursor: 'pointer'
                      }}
                      onClick={handleMatchClick}
                    >
                      <img
                        src={currentMatch.teams.home.logo || '/assets/fallback-logo.svg'}
                        alt={currentMatch.teams.home.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/assets/fallback-logo.svg') {
                            target.src = '/assets/fallback-logo.svg';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* VS section with score */}
                  <div 
                    className="absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out hover:scale-110 opacity-100"
                    style={{
                      background: '#a00000',
                      left: 'calc(50% - 26px)',
                      top: 'calc(50% - 26px)',
                      minWidth: '52px'
                    }}
                  >
                    {['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(currentMatch.fixture.status.short) || 
                     ['FT', 'AET', 'PEN'].includes(currentMatch.fixture.status.short) ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-xs">
                          <span>{currentMatch.goals.home ?? 0}</span>
                          <span>-</span>
                          <span>{currentMatch.goals.away ?? 0}</span>
                        </div>
                        {['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(currentMatch.fixture.status.short) && (
                          <div className="text-[8px] animate-pulse">LIVE</div>
                        )}
                      </div>
                    ) : (
                      <span className="vs-text font-bold">VS</span>
                    )}
                  </div>

                  {/* Match date, time and venue - centered below VS */}
                  <div
                    className="absolute text-center text-xs text-black font-medium"
                    style={{
                      fontSize: "0.875rem",
                      whiteSpace: "nowrap",
                      overflow: "visible",
                      textAlign: "center",
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      bottom: "-25px",
                      width: "max-content",
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

                  {/* Away team colored bar and logo */}
                  <div 
                    className="h-full w-[calc(50%-67px)] mr-[77px] transition-all duration-500 ease-in-out opacity-100" 
                    style={{ 
                      background: getTeamColor(currentMatch.teams.away.id),
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    <div
                      className="absolute right-[41px] z-20 w-[64px] h-[64px] bg-white/10 rounded-full p-2 transition-transform duration-300 ease-in-out hover:scale-110 opacity-100 contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{
                        top: "calc(50% - 32px)",
                        cursor: 'pointer'
                      }}
                      onClick={handleMatchClick}
                    >
                      <img
                        src={currentMatch.teams.away.logo || '/assets/fallback-logo.svg'}
                        alt={currentMatch.teams.away.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/assets/fallback-logo.svg') {
                            target.src = '/assets/fallback-logo.svg';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team names */}
            <div className="flex justify-between items-center mb-4 px-4">
              <div className="text-center flex-1">
                <span className="text-sm font-medium">{currentMatch.teams.home.name}</span>
              </div>
              <div className="text-center flex-1">
                <span className="text-sm font-medium">{currentMatch.teams.away.name}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-around border-t border-gray-200 mt-2 pt-3">
              <button 
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={handleMatchClick}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                  <path d="M20 3H4C3.45 3 3 3.45 3 4V20C3 20.55 3.45 21 4 21H20C20.55 21 21 20.55 21 20V4C21 3.45 20.55 3 20 3ZM7 7H17V17H7V7Z" fill="currentColor" />
                </svg>
                <span className="text-xs text-gray-600 mt-1">Match Page</span>
              </button>
              <button 
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() => navigate(`/matches/${currentMatch.fixture.id}/lineups`)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 19H5V15H11V19ZM11 13H5V9H11V13ZM11 7H5V5H11V7ZM19 19H13V17H19V19ZM19 15H13V13H19V15ZM19 11H13V9H19V11ZM19 7H13V5H19V7Z" fill="currentColor" />
                </svg>
                <span className="text-xs text-gray-600 mt-1">Lineups</span>
              </button>
              <button 
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() => navigate(`/matches/${currentMatch.fixture.id}/stats`)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor" />
                </svg>
                <span className="text-xs text-gray-600 mt-1">Stats</span>
              </button>
              <button 
                className="flex flex-col items-center cursor-pointer w-1/4"
                onClick={() => navigate(`/leagues/${currentMatch.league.id}/standings`)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-600">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor" />
                  <path d="M7 7H9V17H7V7Z" fill="currentColor" />
                  <path d="M11 7H13V17H11V7Z" fill="currentColor" />
                  <path d="M15 7H17V17H15V7Z" fill="currentColor" />
                </svg>
                <span className="text-xs text-gray-600 mt-1">Standings</span>
              </button>
            </div>

            {/* Carousel indicators */}
            {mockMatches.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {mockMatches.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentIndex(index)}
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