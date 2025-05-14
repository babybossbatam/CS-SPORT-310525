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
  
  // Animation state - removed hover effects
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
        {/* Full bar with logos and team names, with colored sections in between logos and VS */}
        <div className="w-full h-full flex justify-between relative">
          {/* Home team logo and name */}
          <div className="absolute left-4 z-20 flex items-center" style={{top: "calc(50% - 24px)"}}>
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              onClick={onClick}
              style={{
                cursor: onClick ? 'pointer' : 'default'
              }}
            >
              <img 
                src={teams?.home?.id ? `https://cdn.sportmonks.com/images/soccer/teams/${teams.home.id}.png` : teams?.home?.logo} 
                alt={teams?.home?.name || 'Home Team'} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // If SportMonk URL fails, try the original API-Football URL
                  if (e.currentTarget.src.includes('sportmonks') && teams?.home?.logo) {
                    e.currentTarget.src = teams.home.logo;
                  } else {
                    e.currentTarget.src = 'https://via.placeholder.com/32?text=' + (teams?.home?.name?.substring(0, 1) || 'H');
                  }
                }}
              />
              {teams?.home?.winner && (
                <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  <span className="text-xs">W</span>
                </div>
              )}
            </div>
            
            {/* Team name */}
            <div className={`ml-3 text-white font-bold text-sm uppercase transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              {teams?.home?.name || 'Home Team'}
            </div>
          </div>
          
          {/* HOME TEAM COLORED BAR - Starts from halfway of logo and extends to VS */}
          <div className={`h-full w-[calc(50%-47px)] ml-[47px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
              background: homeTeamColor,
              transition: 'all 0.3s ease-in-out'
            }}>
          </div>
          
          {/* VS SECTION - fixed size */}
          <div 
            className={`absolute text-white font-bold text-xs rounded-full h-10 w-10 flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              background: '#a00000',
              left: 'calc(50% - 20px)',
              top: 'calc(50% - 20px)'
            }}
          >
            <span className="vs-text font-bold">VS</span>
          </div>
          
          {/* AWAY TEAM COLORED BAR - Starts from VS and extends to halfway of away logo */}
          <div className={`h-full w-[calc(50%-55px)] mr-[55px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
              background: awayTeamColor,
              transition: 'all 0.3s ease-in-out'
            }}>
          </div>
          
          {/* Away team logo and name */}
          <div className="absolute right-4 z-20 flex items-center flex-row-reverse" style={{top: "calc(50% - 24px)"}}>
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              onClick={onClick}
              style={{
                cursor: onClick ? 'pointer' : 'default'
              }}
            >
              <img 
                src={teams?.away?.id ? `https://cdn.sportmonks.com/images/soccer/teams/${teams.away.id}.png` : teams?.away?.logo} 
                alt={teams?.away?.name || 'Away Team'} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // If SportMonk URL fails, try the original API-Football URL
                  if (e.currentTarget.src.includes('sportmonks') && teams?.away?.logo) {
                    e.currentTarget.src = teams.away.logo;
                  } else {
                    e.currentTarget.src = 'https://via.placeholder.com/32?text=' + (teams?.away?.name?.substring(0, 1) || 'A');
                  }
                }}
              />
              {teams?.away?.winner && (
                <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  <span className="text-xs">W</span>
                </div>
              )}
            </div>
            
            {/* Team name */}
            <div className={`mr-3 text-white font-bold text-sm uppercase text-right transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              {teams?.away?.name || 'Away Team'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Match details footer */}
      {!compact && (
        <>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors duration-200 mt-2">
            <Clock className="h-3 w-3 transition-colors duration-300" />
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
              <span className="transition-all duration-300">
                HT: {score.halftime.home} - {score.halftime.away}
              </span>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default MatchScoreboard;