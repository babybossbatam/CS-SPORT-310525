import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { format, parseISO } from 'date-fns';
import { isLiveMatch } from '@/lib/utils';

// Types
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

const SimpleMatchCard: React.FC<SimpleMatchCardProps> = ({ 
  leagueId, 
  limit = 5,
  onlyLive = false
}) => {
  const [fixtures, setFixtures] = useState<FixtureResponse[]>([]);
  
  // Get today's date
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Fetch live fixtures
  const liveFixturesQuery = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 30000, // 30 seconds
  });
  
  // Fetch today's fixtures
  const todayFixturesQuery = useQuery<FixtureResponse[]>({
    queryKey: [`/api/fixtures/date/${today}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // If a specific league ID is provided, fetch fixtures for that league
  const leagueFixturesQuery = useQuery<FixtureResponse[]>({
    queryKey: [`/api/leagues/${leagueId}/fixtures`],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!leagueId, // Only fetch if league ID is provided
  });
  
  // Process fixtures when data is available
  useEffect(() => {
    const liveFixtures = liveFixturesQuery.data || [];
    const todayFixtures = todayFixturesQuery.data || [];
    const leagueFixtures = leagueFixturesQuery.data || [];
    
    let allFixtures: FixtureResponse[] = [];
    
    // Determine which fixtures to show
    if (leagueId) {
      allFixtures = leagueFixtures;
    } else if (onlyLive) {
      allFixtures = liveFixtures;
    } else {
      // Combine live and today's fixtures
      const combinedFixtures = [...liveFixtures];
      
      // Add today's fixtures that aren't already in the live fixtures
      todayFixtures.forEach(fixture => {
        const isAlreadyIncluded = combinedFixtures.some(
          f => f.fixture.id === fixture.fixture.id
        );
        
        if (!isAlreadyIncluded) {
          combinedFixtures.push(fixture);
        }
      });
      
      allFixtures = combinedFixtures;
    }
    
    // Sort fixtures: live first, then by time
    allFixtures.sort((a, b) => {
      const aIsLive = isLiveMatch(a.fixture.status.short);
      const bIsLive = isLiveMatch(b.fixture.status.short);
      
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      return parseISO(a.fixture.date).getTime() - parseISO(b.fixture.date).getTime();
    });
    
    // Apply limit
    setFixtures(allFixtures.slice(0, limit));
  }, [liveFixturesQuery.data, todayFixturesQuery.data, leagueFixturesQuery.data, leagueId, limit, onlyLive]);
  
  // Show nothing if no fixtures
  if (fixtures.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-2">
        No matches available
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-100">
      {fixtures.map((fixture) => (
        <Link 
          key={fixture.fixture.id}
          href={`/match/${fixture.fixture.id}`}
        >
          <a className="block px-3 py-2 hover:bg-gray-50 transition-colors group">
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
          </a>
        </Link>
      ))}
    </div>
  );
};

export default SimpleMatchCard;