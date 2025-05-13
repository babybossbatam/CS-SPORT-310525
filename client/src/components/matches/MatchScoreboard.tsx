import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import TeamLogo from './TeamLogo';

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
  
  return (
    <>
      {/* Match bar styled with height set to exactly 30px */}
      <div 
        className={`flex relative h-[30px] rounded-md ${compact ? 'mb-4' : 'mb-8'}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        {/* Previous navigation buttons removed */}
        
        {/* Full bar with logos and team names, with colored sections in between logos and VS */}
        <div className="w-full h-full flex justify-between relative">
          {/* Home team logo */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20">
            <TeamLogo
              logoUrl={teams?.home?.logo || 'https://via.placeholder.com/80?text=Team'}
              teamName={teams?.home?.name || 'Home Team'}
              teamId={teams?.home?.id}
              size="md"
              isHome={true}
              winner={teams?.home?.winner || false}
              onClick={onClick ? () => onClick() : undefined}
            />
          </div>
          
          {/* Home team name display */}
          <div className="absolute left-[calc(0px+72px)] ml-8 text-white font-bold text-sm leading-tight flex items-center h-full uppercase z-20">
            {teams?.home?.name || 'Home Team'}
            {teams?.home?.winner && (
              <span className="text-xs uppercase text-white ml-1 bg-green-600 inline-block px-1 rounded">Winner</span>
            )}
          </div>
          
          {/* HOME TEAM COLORED BAR - Starts from halfway of logo and extends to VS */}
          <div className="h-full w-[calc(50%-47px)] ml-[47px]" 
            style={{ 
              background: homeTeamColor
            }}>
          </div>
          
          {/* VS SECTION - fixed size */}
          <div 
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-[12px] rounded-full h-12 w-12 flex items-center justify-center z-30 border-[2px] border-white shadow-md overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #a00000 0%, #7a0000 100%)',
              textShadow: '0px 0px 2px rgba(255, 255, 255, 0.5)',
              boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.8), 0 0 8px rgba(0, 0, 0, 0.7)'
            }}
          >
            VS
          </div>
          
          {/* AWAY TEAM COLORED BAR - Starts from VS and extends to halfway of away logo */}
          <div className="h-full w-[calc(50%-55px)] mr-[55px]" 
            style={{ 
              background: awayTeamColor
            }}>
          </div>
          
          {/* Away team name display */}
          <div className="absolute right-[calc(4px+72px)] mr-8 text-white font-bold text-sm leading-tight flex items-center justify-end h-full uppercase text-right z-20">
            {teams?.away?.name || 'Away Team'}
            {teams?.away?.winner && (
              <span className="text-xs uppercase text-white mr-1 bg-green-600 inline-block px-1 rounded">Winner</span>
            )}
          </div>
          
          {/* Away team logo */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
            <TeamLogo
              logoUrl={teams?.away?.logo || 'https://via.placeholder.com/80?text=Team'}
              teamName={teams?.away?.name || 'Away Team'}
              teamId={teams?.away?.id}
              size="md"
              isHome={false}
              winner={teams?.away?.winner || false}
              onClick={onClick ? () => onClick() : undefined}
            />
          </div>
        </div>
        
        {/* Next navigation button removed */}
      </div>
      
      {/* Match details footer */}
      {!compact && (
        <div className="p-2 text-center text-sm border-t border-gray-100 mt-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            
            {/* Removed live button */}
          </div>
          
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>{formatDateTime(fixture?.date)}</span>
            {fixture?.venue?.name && (
              <span> | {fixture.venue.name}, {fixture.venue?.city || ''}</span>
            )}
          </div>
          
          {/* HT score if available */}
          {score?.halftime?.home !== null && 
           score?.halftime?.home !== undefined && 
           score?.halftime?.away !== null && 
           score?.halftime?.away !== undefined && (
            <div className="text-xs text-gray-700 mt-1">
              HT: {score.halftime.home} - {score.halftime.away}
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