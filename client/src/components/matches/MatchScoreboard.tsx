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
  matches?: FixtureResponse[];
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
    return format(date, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date TBD';
  }
};

export function MatchScoreboard({ 
  match, 
  matches = [],
  onClick, 
  featured = false,
  homeTeamColor = '#6f7c93', // Default Atalanta blue-gray color 
  awayTeamColor = '#8b0000', // Default AS Roma dark red color
  compact = false 
}: MatchScoreboardProps) {
  // Get match data
  const allMatches = [match, ...matches].slice(0, 5);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const { fixture, league, teams, goals, score } = allMatches[currentMatchIndex];

  // Animation state - removed hover effects
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMatchIndex((prev) => (prev + 1) % allMatches.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [allMatches.length]);

  // Fade-in animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Match bar styled with height set to exactly 36px */}
      <div 
        className={`flex relative h-[53px] rounded-md ${compact ? 'mb-4' : 'mb-8'} transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} mt-[-8px]`}
        onClick={onClick}
        style={{ 
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        {/* Full bar with logos and team names, with colored sections in between logos and VS */}
        <div className="w-full h-full flex justify-between relative">
          {/* Home team logo */}
            <img 
                key={`home-${teams?.home?.id}`}
                src={teams?.home?.id ? `https://cdn.sportmonks.com/images/soccer/teams/${teams.home.id}.png` : teams?.home?.logo} 
                alt={teams?.home?.name || 'Home Team'} 
                className={`absolute left-[33px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'} contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
                style={{
                  cursor: onClick ? 'pointer' : 'default',
                  top: "calc(50% - 32px)"
                }}
                onClick={onClick}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.includes('sportmonks') && teams?.home?.logo) {
                    target.src = teams.home.logo;
                  } else if (teams?.home?.name) {
                    target.src = `/src/assets/fallback-logo.png`;
                  } else {
                    target.src = 'https://via.placeholder.com/64?text=H';
                  }
                }}
              />
              <div className={`absolute left-[120px] text-white font-bold text-xl uppercase transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{top: "calc(50% - 13px)", fontFamily: "Calibri"}}>
              {teams?.home?.name || 'Home Team'}
            </div>

          {/* HOME TEAM COLORED BAR - Starts from halfway of logo and extends to VS */}
          <div className={`h-full w-[calc(50%-77px)] ml-[87px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
              background: homeTeamColor,
              transition: 'all 0.3s ease-in-out'
            }}>
          </div>

          {/* VS SECTION - fixed size */}
          <div 
            className={`absolute text-white font-bold text-sm rounded-full h-[52px] w-[52px] flex items-center justify-center z-30 border-2 border-white overflow-hidden transition-all duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              background: '#a00000',
              left: 'calc(50% - 26px)',
              top: 'calc(50% - 26px)'
            }}
          >
            <span className="vs-text font-bold">VS</span>
          </div>

          {/* AWAY TEAM COLORED BAR - Starts from VS and extends to halfway of away logo */}
          <div className={`h-full w-[calc(50%-67px)] mr-[77px] transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
            style={{ 
              background: awayTeamColor,
              transition: 'all 0.3s ease-in-out'
            }}>
          </div>

          {/* Away team logo and name */}
          <img 
            key={`away-${teams?.away?.id}`}
            src={teams?.away?.id ? `https://cdn.sportmonks.com/images/soccer/teams/${teams.away.id}.png` : teams?.away?.logo} 
            alt={teams?.away?.name || 'Away Team'} 
            className={`absolute right-[33px] z-20 w-[64px] h-[64px] object-contain transition-transform duration-300 ease-in-out hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'} contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
            style={{
              cursor: onClick ? 'pointer' : 'default',
              top: "calc(50% - 32px)"
            }}
            onClick={onClick}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes('sportmonks') && teams?.away?.logo) {
                target.src = teams.away.logo;
              } else if (teams?.away?.name) {
                target.src = `/src/assets/fallback-logo.png`;
              } else {
                target.src = 'https://via.placeholder.com/64?text=A';
              }
            }}
          />


          {/* Team name */}
          <div className={`absolute right-[120px] text-white font-bold text-xl uppercase text-right transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{top: "calc(50% - 13px)"}}>
            {teams?.away?.name || 'Away Team'}
          </div>
        </div>
      </div>

      
    </>
  );
}

export default MatchScoreboard;