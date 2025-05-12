import { useState, useEffect } from 'react';
import { Clock, X, HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';
import { isLiveMatch } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedTeamLogo from './AnimatedTeamLogo';
import TeamLogoModal from '@/components/ui/team-logo-modal';

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
const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return format(date, 'EEE, dd MMM yyyy • HH:mm');
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
  // State for team logo evolution modal
  const [evolutionModalTeam, setEvolutionModalTeam] = useState<null | {
    id: string;
    name: string;
    logo: string;
  }>(null);
  
  // Function to open team logo evolution modal
  const openTeamEvolution = (team: typeof teams.home | typeof teams.away, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent onClick
    
    setEvolutionModalTeam({
      id: team.id.toString(),
      name: team.name,
      logo: team.logo
    });
  };
  
  // Function to close team logo evolution modal
  const closeEvolutionModal = () => {
    setEvolutionModalTeam(null);
  };
  
  return (
    <>
      {/* Match bar styled with height set to exactly 30px */}
      <div 
        className={`flex relative h-[30px] rounded-md ${compact ? 'mb-4' : 'mb-8'}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        {/* Previous match navigation button with team logo evolution functionality */}
        {!compact && (
          <button 
            className="absolute -left-8 top-1/2 transform -translate-y-1/2 bg-gray-200/80 hover:bg-gray-300 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center z-30 transition-all"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering parent onClick
              openTeamEvolution(teams.home, e);
            }}
            title="View Home Team Logo Evolution"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        {/* Full bar with logos and team names, with colored sections in between logos and VS */}
        <div className="w-full h-full flex justify-between relative">
          {/* Home team logo with animation and evolution capability */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20">
            <AnimatedTeamLogo
              logoUrl={teams.home.logo}
              teamName={teams.home.name}
              size="md"
              isHome={true}
              winner={teams.home.winner}
              onClick={(e?: React.MouseEvent) => {
                if (e && e.detail === 2) {
                  // Double click opens evolution modal
                  openTeamEvolution(teams.home, e);
                } else if (onClick) {
                  // Regular click navigates to match details
                  onClick();
                }
              }}
            />
          </div>
          
          {/* Home team name display */}
          <div className="absolute left-[calc(0px+72px)] ml-8 text-white font-bold text-sm leading-tight flex items-center h-full uppercase z-20">
            {teams.home.name}
            {teams.home.winner && (
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
            {teams.away.name}
            {teams.away.winner && (
              <span className="text-xs uppercase text-white mr-1 bg-green-600 inline-block px-1 rounded">Winner</span>
            )}
          </div>
          
          {/* Away team logo with animation and evolution capability */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
            <AnimatedTeamLogo
              logoUrl={teams.away.logo}
              teamName={teams.away.name}
              size="md"
              isHome={false}
              winner={teams.away.winner}
              onClick={(e?: React.MouseEvent) => {
                if (e && e.detail === 2) {
                  // Double click opens evolution modal
                  openTeamEvolution(teams.away, e);
                } else if (onClick) {
                  // Regular click navigates to match details
                  onClick();
                }
              }}
            />
          </div>
        </div>
        
        {/* Next match navigation button with team logo evolution functionality */}
        {!compact && (
          <button 
            className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-gray-200/80 hover:bg-gray-300 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center z-30 transition-all"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering parent onClick
              openTeamEvolution(teams.away, e);
            }}
            title="View Away Team Logo Evolution"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Match details footer */}
      {!compact && (
        <div className="p-2 text-center text-sm border-t border-gray-100 mt-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            
            {/* Removed live button */}
          </div>
          
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>{formatDateTime(fixture.date)}</span>
            {fixture.venue.name && (
              <span> | {fixture.venue.name}, {fixture.venue.city || ''}</span>
            )}
          </div>
          
          {/* HT score if available */}
          {score.halftime.home !== null && score.halftime.away !== null && (
            <div className="text-xs text-gray-700 mt-1">
              HT: {score.halftime.home} - {score.halftime.away}
            </div>
          )}
        </div>
      )}
      
      {/* Featured badge removed as it's now handled in the FeaturedMatch component */}
      
      {/* Removed video highlights and live stream components */}
      
      {/* Team Logo Evolution Modal */}
      {evolutionModalTeam && (
        <TeamLogoModal
          isOpen={!!evolutionModalTeam}
          onClose={closeEvolutionModal}
          teamId={evolutionModalTeam.id}
          teamName={evolutionModalTeam.name}
          logoUrl={evolutionModalTeam.logo}
        />
      )}
    </>
  );
}

export default MatchScoreboard;