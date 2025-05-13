import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import TeamLogo from './TeamLogo';
import { useState, useEffect } from 'react';

// Define types
interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean;
}

interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
  };
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
}

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

interface Score {
  halftime: { home: number | null; away: number | null; };
  fulltime: { home: number | null; away: number | null; };
  extratime: { home: number | null; away: number | null; };
  penalty: { home: number | null; away: number | null; };
}

interface FixtureResponse {
  fixture: Fixture;
  league: League;
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: Score;
}

interface MatchScoreboardProps {
  match: FixtureResponse;
  onClick?: () => void;
  featured?: boolean;
  homeTeamColor?: string;
  awayTeamColor?: string;
  compact?: boolean;
}

// Helper function to format date/time
const formatDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return 'Date TBD';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Date TBD';
    return format(date, 'EEE, dd MMM yyyy • HH:mm');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date TBD';
  }
};

export function MatchScoreboard({ 
  match, 
  onClick, 
  featured = false,
  homeTeamColor = '#6f7c93', // Default Atalanta blue-gray color 
  awayTeamColor = '#8b0000', // Default AS Roma dark red color
  compact = false 
}: MatchScoreboardProps) {
  // Get match data
  const { fixture, league, teams, goals, score } = match;
  
  // Animation and hover effect states
  const [isLoaded, setIsLoaded] = useState(false);
  const [homeTeamHover, setHomeTeamHover] = useState(false);
  const [awayTeamHover, setAwayTeamHover] = useState(false);
  const [scoreboardHover, setScoreboardHover] = useState(false);
  
  // Fade-in animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <>
      {/* Match bar styled with height set to exactly 30px */}
      <div 
        className={`flex relative h-[30px] rounded-md ${compact ? 'mb-4' : 'mb-8'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClick}
        style={{ 
          cursor: onClick ? 'pointer' : 'default',
          transform: scoreboardHover ? 'scale(1.02)' : 'scale(1)',
          boxShadow: scoreboardHover ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
        }}
        onMouseEnter={() => setScoreboardHover(true)}
        onMouseLeave={() => setScoreboardHover(false)}
      >
        {/* Previous navigation buttons removed */}
        
        {/* Full bar with logos and team names, with colored sections in between logos and VS */}
        <div className="w-full h-full flex justify-between relative">
          {/* Home team logo container - replaced with text-based circle */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20">
            <div 
              className={`w-14 h-14 rounded-full flex items-center justify-center bg-blue-100 border-2 ${teams?.home?.winner ? 'border-green-500 shadow-lg' : 'border-white'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ 
                backgroundColor: homeTeamColor,
                cursor: onClick ? 'pointer' : 'default',
                transform: `${homeTeamHover ? 'scale(1.1)' : teams?.home?.winner ? 'scale(1.05)' : 'scale(1)'}`,
                boxShadow: homeTeamHover ? '0 0 12px rgba(255, 255, 255, 0.5)' : 'none',
                transition: 'all 0.2s ease-in-out'
              }}
              onClick={onClick}
              onMouseEnter={() => setHomeTeamHover(true)}
              onMouseLeave={() => setHomeTeamHover(false)}
            >
              <span className="text-white font-bold text-xs">
                {teams?.home?.name?.substring(0, 3)?.toUpperCase() || 'HOM'}
              </span>
              {teams?.home?.winner && (
                <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <span className="text-xs">W</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Home team name display */}
          <div className={`absolute left-[calc(0px+72px)] ml-8 text-white font-bold text-sm leading-tight flex items-center h-full uppercase z-20 transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
            style={{
              textShadow: homeTeamHover ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
              transform: homeTeamHover ? 'translateX(2px) scale(1.05)' : 'translateX(0) scale(1)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {teams?.home?.name || 'Home Team'}
            {teams?.home?.winner && (
              <span className="text-xs uppercase text-white ml-1 bg-green-600 inline-block px-1 rounded animate-pulse">
                Winner
              </span>
            )}
          </div>
          
          {/* HOME TEAM COLORED BAR - Starts from halfway of logo and extends to VS */}
          <div className={`h-full w-[calc(50%-47px)] ml-[47px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
              background: homeTeamColor,
              backgroundImage: homeTeamHover || scoreboardHover ? 
                'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)' : 
                'none',
              boxShadow: homeTeamHover ? 'inset 0 0 10px rgba(255, 255, 255, 0.3)' : 'none',
              transition: 'all 0.3s ease-in-out'
            }}>
          </div>
          
          {/* VS SECTION - fixed size */}
          <div 
            className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-[12px] rounded-full h-12 w-12 flex items-center justify-center z-30 border-[2px] border-white shadow-md overflow-hidden transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
            style={{
              background: 'linear-gradient(135deg, #a00000 0%, #7a0000 100%)',
              textShadow: '0px 0px 2px rgba(255, 255, 255, 0.5)',
              boxShadow: scoreboardHover 
                ? '0 0 0 3px rgba(255, 255, 255, 0.9), 0 0 16px rgba(255, 0, 0, 0.5)' 
                : '0 0 0 2px rgba(255, 255, 255, 0.8), 0 0 8px rgba(0, 0, 0, 0.7)',
              transform: scoreboardHover ? 'translate(-50%, -50%) rotate(5deg)' : 'translate(-50%, -50%) rotate(0deg)',
              transition: 'all 0.3s ease-in-out'
            }}
          >
            VS
          </div>
          
          {/* AWAY TEAM COLORED BAR - Starts from VS and extends to halfway of away logo */}
          <div className={`h-full w-[calc(50%-55px)] mr-[55px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
              background: awayTeamColor,
              backgroundImage: awayTeamHover || scoreboardHover ? 
                'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)' : 
                'none',
              boxShadow: awayTeamHover ? 'inset 0 0 10px rgba(255, 255, 255, 0.3)' : 'none',
              transition: 'all 0.3s ease-in-out'
            }}>
          </div>
          
          {/* Away team name display */}
          <div className={`absolute right-[calc(4px+72px)] mr-8 text-white font-bold text-sm leading-tight flex items-center justify-end h-full uppercase text-right z-20 transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
            style={{
              textShadow: awayTeamHover ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
              transform: awayTeamHover ? 'translateX(-2px) scale(1.05)' : 'translateX(0) scale(1)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {teams?.away?.name || 'Away Team'}
            {teams?.away?.winner && (
              <span className="text-xs uppercase text-white mr-1 bg-green-600 inline-block px-1 rounded animate-pulse">Winner</span>
            )}
          </div>
          
          {/* Away team logo container - replaced with text-based circle */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
            <div 
              className={`w-14 h-14 rounded-full flex items-center justify-center bg-red-700 border-2 ${teams?.away?.winner ? 'border-green-500 shadow-lg' : 'border-white'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ 
                backgroundColor: awayTeamColor,
                cursor: onClick ? 'pointer' : 'default',
                transform: `${awayTeamHover ? 'scale(1.1)' : teams?.away?.winner ? 'scale(1.05)' : 'scale(1)'}`,
                boxShadow: awayTeamHover ? '0 0 12px rgba(255, 255, 255, 0.5)' : 'none',
                transition: 'all 0.2s ease-in-out'
              }}
              onClick={onClick}
              onMouseEnter={() => setAwayTeamHover(true)}
              onMouseLeave={() => setAwayTeamHover(false)}
            >
              <span className="text-white font-bold text-xs">
                {teams?.away?.name?.substring(0, 3)?.toUpperCase() || 'AWY'}
              </span>
              {teams?.away?.winner && (
                <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <span className="text-xs">W</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Next navigation button removed */}
      </div>
      
      {/* Match details footer */}
      {!compact && (
        <div className={`p-2 text-center text-sm border-t border-gray-100 mt-5 transition-all duration-700 ease-in-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{
            boxShadow: scoreboardHover ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none',
            background: scoreboardHover ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* Removed live button */}
          </div>
          
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors duration-200">
            <Clock className={`h-3 w-3 ${scoreboardHover ? 'text-blue-500' : ''} transition-colors duration-300`} />
            <span>{formatDateTime(fixture?.date)}</span>
            {fixture?.venue?.name && (
              <span className="hover:text-blue-600 transition-colors duration-300"> | {fixture.venue.name}, {fixture.venue?.city || ''}</span>
            )}
          </div>
          
          {/* HT score if available */}
          {score?.halftime?.home !== null && 
           score?.halftime?.home !== undefined && 
           score?.halftime?.away !== null && 
           score?.halftime?.away !== undefined && (
            <div className="text-xs text-gray-700 mt-1 hover:text-blue-700 transition-colors duration-300">
              <span className={`${scoreboardHover ? 'font-bold' : ''} transition-all duration-300`}>
                HT: {score.halftime.home} - {score.halftime.away}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Featured badge removed as it's now handled in the FeaturedMatch component */}
      
      {/* Removed video highlights and live stream components */}
      
      {/* Team Logo Evolution Modal removed */}
    </>
  );
}

export default MatchScoreboard;