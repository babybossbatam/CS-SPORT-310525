import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

// Define types
interface FixtureResponse {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface SimpleMatchCardProps {
  leagueId?: number;
  limit?: number;
  onlyLive?: boolean;
}

const SimpleMatchCard: React.FC<SimpleMatchCardProps> = ({ leagueId, limit = 5, onlyLive = false }) => {
  const [fixtures, setFixtures] = useState<FixtureResponse[]>([]);
  const [, navigate] = useLocation();
  
  // Get today's date for fixtures
  const today = new Date();
  const todayFormatted = format(today, 'yyyy-MM-dd');
  
  // Fetch live fixtures
  const liveFixturesQuery = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 30000, // 30 seconds
  });
  
  // Fetch today's fixtures
  const todayFixturesQuery = useQuery<FixtureResponse[]>({
    queryKey: [`/api/fixtures/date/${todayFormatted}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch fixtures for a specific league if leagueId is provided
  const leagueFixturesQuery = useQuery<FixtureResponse[]>({
    queryKey: [`/api/leagues/${leagueId}/fixtures`],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!leagueId,
  });
  
  // Helper function to check if a match is live
  const isLiveMatch = (status: string) => {
    return ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(status);
  };
  
  // Navigate to match details
  const goToMatch = (fixtureId: number) => {
    navigate(`/match/${fixtureId}`);
  };
  
  useEffect(() => {
    let fixtureData: FixtureResponse[] = [];
    let isLoading = false;
    
    // If leagueId is provided, use league fixtures
    if (leagueId) {
      fixtureData = leagueFixturesQuery.data || [];
      isLoading = leagueFixturesQuery.isLoading;
    } 
    // Otherwise use live fixtures and today's fixtures
    else {
      // Start with live fixtures
      const liveFixtures = liveFixturesQuery.data || [];
      const todayFixtures = todayFixturesQuery.data || [];
      isLoading = liveFixturesQuery.isLoading || todayFixturesQuery.isLoading;
      
      // Combine and sort fixtures
      if (onlyLive) {
        fixtureData = liveFixtures;
      } else {
        // Combine live and today's fixtures
        fixtureData = [...liveFixtures];
        
        // Add today's fixtures that aren't live yet
        for (const fixture of todayFixtures) {
          if (!fixtureData.some(f => f.fixture.id === fixture.fixture.id)) {
            fixtureData.push(fixture);
          }
        }
        
        // Sort fixtures: Live matches first, then by match time
        fixtureData.sort((a, b) => {
          const aIsLive = isLiveMatch(a.fixture.status.short);
          const bIsLive = isLiveMatch(b.fixture.status.short);
          
          if (aIsLive && !bIsLive) return -1;
          if (!aIsLive && bIsLive) return 1;
          
          return parseISO(a.fixture.date).getTime() - parseISO(b.fixture.date).getTime();
        });
      }
    }
    
    // Apply limit if not loading
    if (!isLoading) {
      setFixtures(fixtureData.slice(0, limit));
    }
  }, [leagueId, limit, onlyLive, liveFixturesQuery.data, todayFixturesQuery.data, leagueFixturesQuery.data, 
     liveFixturesQuery.isLoading, todayFixturesQuery.isLoading, leagueFixturesQuery.isLoading]);
  
  if (fixtures.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No matches available
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-100">
      {fixtures.map((fixture) => (
        <div 
          key={fixture.fixture.id} 
          className="block px-3 py-2 hover:bg-gray-50 transition-colors group cursor-pointer"
          onClick={() => goToMatch(fixture.fixture.id)}
        >
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <div className="flex items-center">
              <img 
                src={fixture.league.logo} 
                alt={fixture.league.name}
                className="w-4 h-4 mr-1" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16?text=L';
                }}
              />
              <span className="truncate max-w-[150px]">{fixture.league.name}</span>
            </div>
            <div>
              {isLiveMatch(fixture.fixture.status.short) ? (
                <div className="flex items-center">
                  <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                  <span className="font-semibold">{fixture.fixture.status.elapsed}'</span>
                </div>
              ) : (
                <span>{format(parseISO(fixture.fixture.date), 'HH:mm')}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {/* Home team */}
            <div className="flex items-center">
              <div className="relative mr-1">
                <img 
                  src={fixture.teams.home.logo} 
                  alt={fixture.teams.home.name}
                  className="w-6 h-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                  }}
                />
              </div>
              <span className="font-medium text-sm truncate max-w-[120px]">
                {fixture.teams.home.name}
              </span>
            </div>
            
            {/* Score */}
            <div className="text-center mx-2 text-sm font-bold">
              {isLiveMatch(fixture.fixture.status.short) || fixture.fixture.status.short === 'FT' ? (
                <span className="text-black">{fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}</span>
              ) : (
                <span className="text-gray-400">vs</span>
              )}
            </div>
            
            {/* Away team */}
            <div className="flex items-center justify-end">
              <span className="font-medium text-sm truncate max-w-[120px]">
                {fixture.teams.away.name}
              </span>
              <div className="relative ml-1">
                <img 
                  src={fixture.teams.away.logo} 
                  alt={fixture.teams.away.name}
                  className="w-6 h-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=T';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SimpleMatchCard;