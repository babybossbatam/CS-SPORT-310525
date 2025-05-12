import { useState, useEffect } from 'react';
import { Clock, X, HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';
import { isLiveMatch } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { getMatchHighlights, HighlightsResponse } from '@/lib/highlightsApi';
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
  // State to track if highlight video is showing
  const [showHighlights, setShowHighlights] = useState(false);
  const [highlightsData, setHighlightsData] = useState<HighlightsResponse | null>(null);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  // State for team logo evolution modal
  const [evolutionModalTeam, setEvolutionModalTeam] = useState<null | {
    id: string;
    name: string;
    logo: string;
  }>(null);
  
  // Load highlights data when the highlights button is clicked
  const loadHighlights = async () => {
    if (!showHighlights && !highlightsData) {
      try {
        setIsLoadingHighlights(true);
        const data = await getMatchHighlights(fixture.id);
        setHighlightsData(data);
        setIsLoadingHighlights(false);
      } catch (error) {
        console.error('Failed to load highlights:', error);
        setIsLoadingHighlights(false);
      }
    }
    // Toggle highlights display
    setShowHighlights(!showHighlights);
  };
  
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
      </div>
      
      {/* Match details footer */}
      {!compact && (
        <div className="p-2 text-center text-sm border-t border-gray-100 mt-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent onClick
                loadHighlights(); // Load and toggle highlights display
              }}
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Match Highlights
            </button>
            
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent onClick
                // Open the home team logo evolution by default
                openTeamEvolution(teams.home, e);
              }}
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
              </svg>
              Team Evolution
            </button>
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
      
      {/* Video highlights card that appears below when button is clicked */}
      {showHighlights && !compact && (
        <Card className="mt-4 overflow-hidden relative">
          <CardContent className="p-0">
            <div className="aspect-video bg-black relative">
              {isLoadingHighlights ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-white/20 border-t-white rounded-full mb-2"></div>
                    <p>Loading highlights...</p>
                  </div>
                </div>
              ) : (
                <iframe 
                  className="w-full h-full"
                  src={highlightsData && highlightsData.highlights ? highlightsData.highlights.embedUrl : `https://www.youtube.com/embed/SpmLIIlcCFs?autoplay=1`} 
                  title={highlightsData && highlightsData.highlights ? highlightsData.highlights.title : "Match Highlights"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              )}
              
              {/* Close button for the video */}
              <button 
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHighlights(false);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-3 bg-gray-50">
              <h3 className="text-sm font-medium">{teams.home.name} vs {teams.away.name} - Match Highlights</h3>
              <p className="text-xs text-gray-500 mt-1">
                League: {league.name} | {formatDateTime(fixture.date)}
              </p>
              <div className="flex justify-end mt-2">
                <button 
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHighlights(false);
                  }}
                >
                  Close Highlights
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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