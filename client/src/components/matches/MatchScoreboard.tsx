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
  
  // Animation state
  const [isLoaded, setIsLoaded] = useState(false);
  
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
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        {/* Previous navigation buttons removed */}
        
        {/* Full bar with logos and team names, with colored sections in between logos and VS */}
        <div className="w-full h-full flex justify-between relative">
          {/* Home team logo */}
          <div 
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-30 w-14 h-14 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            onClick={onClick}
            style={{
              cursor: onClick ? 'pointer' : 'default'
            }}
          >
            <img 
              src={teams?.home?.logo} 
              alt={teams?.home?.name || 'Home Team'} 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/32?text=' + (teams?.home?.name?.substring(0, 1) || 'H');
              }}
            />
            {teams?.home?.winner && (
              <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs">W</span>
              </div>
            )}
          </div>
          
          {/* Team name */}
          <div className={`absolute left-[72px] top-1/2 transform -translate-y-1/2 z-20 text-white font-bold text-sm uppercase transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            {teams?.home?.name || 'Home Team'}
          </div>
          
          {/* HOME TEAM COLORED BAR - Starts from home logo midpoint and extends to VS */}
          <div className={`h-full w-[calc(50%-18px)] ml-[18px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
              background: homeTeamColor,
              transition: 'all 0.3s ease-in-out'
            }}>
          </div>
          
          {/* VS SECTION - fixed size */}
          <div 
            className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs rounded-full h-10 w-10 flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
            style={{
              background: '#a00000',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)'
            }}
          >
            <span className="font-bold">VS</span>
          </div>
          
          {/* AWAY TEAM COLORED BAR - Starts from VS and extends to away logo midpoint */}
          <div className={`h-full w-[calc(50%-18px)] mr-[18px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
              background: awayTeamColor,
              transition: 'all 0.3s ease-in-out'
            }}>
          </div>
          
          {/* Away team logo */}
          <div 
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-30 w-14 h-14 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            onClick={onClick}
            style={{
              cursor: onClick ? 'pointer' : 'default'
            }}
          >
            <img 
              src={teams?.away?.logo} 
              alt={teams?.away?.name || 'Away Team'} 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/32?text=' + (teams?.away?.name?.substring(0, 1) || 'A');
              }}
            />
            {teams?.away?.winner && (
              <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs">W</span>
              </div>
            )}
          </div>
          
          {/* Team name */}
          <div className={`absolute right-[72px] top-1/2 transform -translate-y-1/2 z-20 text-white font-bold text-sm uppercase text-right transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            {teams?.away?.name || 'Away Team'}
          </div>
        </div>
        
        {/* Next navigation button removed */}
      </div>
      
      {/* Match details footer */}
      {!compact && (
        <div className={`p-2 text-center text-sm border-t border-gray-100 mt-5 transition-all duration-700 ease-in-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{
            transition: 'all 0.3s ease'
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* Removed live button */}
          </div>
          
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 transition-colors duration-200">
            <Clock className="h-3 w-3 transition-colors duration-300" />
            <span>{formatDateTime(fixture?.date)}</span>
            {fixture?.venue?.name && (
              <span className="transition-colors duration-300"> | {fixture.venue.name}, {fixture.venue?.city || ''}</span>
            )}
          </div>
          
          {/* HT score if available */}
          {score?.halftime?.home !== null && 
           score?.halftime?.home !== undefined && 
           score?.halftime?.away !== null && 
           score?.halftime?.away !== undefined && (
            <div className="text-xs text-gray-700 mt-1 transition-colors duration-300">
              <span className="transition-all duration-300">
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