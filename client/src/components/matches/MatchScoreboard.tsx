import { useState, useEffect } from 'react';
import { Clock, X, Play } from 'lucide-react';
import { format } from 'date-fns';
import { isLiveMatch } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMatchHighlights, HighlightsResponse } from '@/lib/highlightsApi';

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
  
  // State for video highlights
  const [showHighlights, setShowHighlights] = useState(false);
  const [highlightsData, setHighlightsData] = useState<HighlightsResponse | null>(null);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);

  // Function to fetch highlights
  const fetchHighlights = async () => {
    if (fixture.id) {
      try {
        setLoadingHighlights(true);
        setHighlightsError(null);
        const data = await getMatchHighlights(fixture.id.toString());
        setHighlightsData(data);
        setShowHighlights(true);
      } catch (error) {
        console.error("Error fetching highlights:", error);
        setHighlightsError("Unable to load highlights for this match");
      } finally {
        setLoadingHighlights(false);
      }
    }
  };
  
  return (
    <div 
      className={`${compact ? 'mb-4' : 'mb-8'} relative`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* League info and match status */}
      <div className="flex justify-between items-center mb-2 px-1">
        {/* League info */}
        <div className="flex items-center">
          <img 
            src={league.logo} 
            alt={league.name} 
            className="h-4 w-auto mr-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=League';
            }}
          />
          <span className="text-xs text-gray-700 font-medium">{league.name}</span>
          {league.round && (
            <span className="text-xs text-gray-500 ml-1">• {league.round}</span>
          )}
        </div>
        
        {/* Match status */}
        <div className="flex items-center text-xs">
          {isLiveMatch(fixture.status.short) ? (
            <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-sm font-semibold flex items-center">
              <span className="animate-pulse inline-block h-2 w-2 rounded-full bg-white mr-1"></span>
              {fixture.status.short === 'HT' ? 'HALF-TIME' : `${fixture.status.elapsed}'`}
            </span>
          ) : (
            <span 
              className={`${
                fixture.status.short === 'FT' || fixture.status.short === 'AET' || fixture.status.short === 'PEN' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-100 text-gray-800'
              } px-1.5 py-0.5 rounded-sm font-medium`}
            >
              {fixture.status.short === 'NS' ? 'UPCOMING' : fixture.status.short}
            </span>
          )}
        </div>
      </div>
      
      {/* Score section for FT/Live matches */}
      {(fixture.status.short !== 'NS' && goals.home !== null && goals.away !== null) && (
        <div className="flex justify-center mb-2">
          <div className="bg-gray-800 text-white px-4 py-1 rounded-md flex items-center space-x-3">
            <span className="text-lg font-bold">{goals.home}</span>
            <span className="text-sm text-gray-400">-</span>
            <span className="text-lg font-bold">{goals.away}</span>
          </div>
        </div>
      )}
      
      {/* Match bar styled with height set to exactly 30px */}
      <div className="flex relative h-[30px] rounded-md">
        {/* Full bar with logos and team names, with colored sections in between logos and VS */}
        <div className="w-full h-full flex justify-between relative">
          {/* Home team logo - fixed size */}
          <div 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 transition-transform duration-300 hover:scale-110 hover:-translate-y-[55%] cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering parent onClick
              if (onClick) onClick(); // Use the same navigation function as the parent
            }}
          >
            <img 
              src={teams.home.logo} 
              alt={teams.home.name}
              className="h-[69px] w-auto object-contain drop-shadow-md hover:drop-shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
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
          {goals.home === null && goals.away === null && (
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
          )}
          
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
          
          {/* Away team logo - fixed size */}
          <div 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 transition-transform duration-300 hover:scale-110 hover:-translate-y-[55%] cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering parent onClick
              if (onClick) onClick(); // Use the same navigation function as the parent
            }}
          >
            <img 
              src={teams.away.logo} 
              alt={teams.away.name}
              className="h-[72px] w-auto object-contain drop-shadow-md hover:drop-shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Team';
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Match details footer (date/time, venue, and halftime score) */}
      <div className="mt-9 px-3 grid grid-cols-3 text-xs text-gray-600">
        {/* Date and time with clock icon */}
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{formatDateTime(fixture.date)}</span>
        </div>
        
        {/* Stadium/Venue info if available */}
        <div className="text-center">
          {fixture.venue.name && (
            <span>{fixture.venue.name}, {fixture.venue.city}</span>
          )}
        </div>
        
        {/* Halftime score if available */}
        <div className="text-right">
          {score.halftime.home !== null && score.halftime.away !== null && (
            <span>HT: {score.halftime.home} - {score.halftime.away}</span>
          )}
        </div>
      </div>
      
      {/* Match Highlights button */}
      {(fixture.status.short === 'FT' || fixture.status.short === 'AET' || fixture.status.short === 'PEN') && (
        <div className="mt-3 px-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800"
            onClick={(e) => {
              e.stopPropagation();
              fetchHighlights();
            }}
            disabled={loadingHighlights}
          >
            <Play className="h-4 w-4 mr-1" />
            {loadingHighlights ? 'Loading Highlights...' : 'Match Highlights'}
          </Button>
        </div>
      )}
      
      {/* Video highlights card */}
      {showHighlights && highlightsData && (
        <Card className="mt-4 overflow-hidden">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-10 bg-black/30 text-white hover:bg-black/50 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setShowHighlights(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <CardContent className="p-0">
              {highlightsData.response[0]?.embed ? (
                <div 
                  className="aspect-video" 
                  dangerouslySetInnerHTML={{ __html: highlightsData.response[0].embed }}
                />
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">No highlights available for this match</p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      )}
      
      {/* Error message for highlights */}
      {highlightsError && (
        <div className="mt-2 text-red-500 text-sm text-center">{highlightsError}</div>
      )}
    </div>
  );
}

export default MatchScoreboard;