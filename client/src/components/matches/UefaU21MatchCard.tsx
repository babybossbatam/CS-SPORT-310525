
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TeamLogo from './TeamLogo';
import { format, parseISO } from 'date-fns';

interface U21Match {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
    };
    venue?: {
      name: string;
      city: string;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
    country: string;
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
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

interface UefaU21MatchCardProps {
  onMatchClick?: (matchId: number) => void;
}

const UefaU21MatchCard: React.FC<UefaU21MatchCardProps> = ({ onMatchClick }) => {
  const [matches, setMatches] = useState<U21Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchU21Matches();
  }, []);

  const fetchU21Matches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏆 Fetching UEFA U21 matches...');
      
      // Try sample endpoint first since it has mock data
      try {
        const response = await fetch('/api/uefa-u21/sample');
        if (response.ok) {
          const data = await response.json();
          console.log(`🏆 Sample endpoint returned ${data.length} matches:`, data);
          
          if (data.length > 0) {
            setMatches(data);
            return;
          }
        } else {
          console.error(`❌ Sample endpoint failed with status ${response.status}`);
        }
      } catch (err) {
        console.error('❌ Failed to fetch sample data:', err);
      }
      
      // Try other endpoints as fallback
      const endpoints = [
        '/api/uefa-u21/upcoming',
        '/api/uefa-u21/recent',
        '/api/uefa-u21/season/current'
      ];
      
      let allMatches: U21Match[] = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            console.log(`🏆 Found ${data.length} matches from ${endpoint}`, data);
            allMatches.push(...data);
          } else {
            console.warn(`⚠️ ${endpoint} returned status ${response.status}`);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to fetch from ${endpoint}:`, err);
        }
      }
      
      // Remove duplicates and sort by date
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.fixture.id === match.fixture.id)
      );
      
      const sortedMatches = uniqueMatches.sort((a, b) => 
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      );
      
      console.log(`🏆 Total unique UEFA U21 matches: ${sortedMatches.length}`);
      setMatches(sortedMatches);
      
    } catch (err) {
      console.error('❌ Error fetching UEFA U21 matches:', err);
      setError('Failed to load UEFA U21 matches');
    } finally {
      setLoading(false);
    }
  };

  const formatMatchTime = (dateString: string, userTimezone: string = 'Asia/Manila') => {
    try {
      const date = parseISO(dateString);
      const time = format(date, 'HH:mm');
      const localTime = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
      
      return {
        utc: time,
        local: localTime,
        date: format(date, 'MMM dd')
      };
    } catch (error) {
      return {
        utc: 'TBD',
        local: 'TBD',
        date: 'TBD'
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FT':
      case 'AET':
      case 'PEN':
        return 'bg-gray-500';
      case 'LIVE':
      case '1H':
      case '2H':
      case 'HT':
        return 'bg-red-500 animate-pulse';
      case 'NS':
      case 'TBD':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">🏆 UEFA U21 Championship</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading U21 matches...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">🏆 UEFA U21 Championship</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-red-600">
            <p>{error}</p>
            <button 
              onClick={fetchU21Matches}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">🏆 UEFA U21 Championship</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-gray-600">
            <p>No UEFA U21 matches found</p>
            <button 
              onClick={fetchU21Matches}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          🏆 UEFA U21 Championship
          <Badge variant="outline" className="text-xs">
            {matches.length} matches
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.slice(0, 10).map((match) => {
          const timeInfo = formatMatchTime(match.fixture.date);
          const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.fixture.status.short);
          const isFinished = ['FT', 'AET', 'PEN'].includes(match.fixture.status.short);
          
          return (
            <div
              key={match.fixture.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onMatchClick?.(match.fixture.id)}
            >
              {/* Teams */}
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <TeamLogo 
                    teamName={match.teams.home.name}
                    logoUrl={match.teams.home.logo}
                    size="32px"
                  />
                  <span className="text-sm font-medium truncate">
                    {match.teams.home.name}
                  </span>
                </div>
                
                {/* Score or Time */}
                <div className="flex flex-col items-center px-2">
                  {isFinished && match.goals.home !== null && match.goals.away !== null ? (
                    <div className="text-lg font-bold">
                      {match.goals.home} - {match.goals.away}
                    </div>
                  ) : isLive ? (
                    <div className="text-sm">
                      <Badge className={`${getStatusColor(match.fixture.status.short)} text-white`}>
                        {match.fixture.status.short}
                      </Badge>
                      {match.goals.home !== null && match.goals.away !== null && (
                        <div className="text-xs mt-1">
                          {match.goals.home} - {match.goals.away}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-center">
                      <div className="font-medium">{timeInfo.local}</div>
                      <div className="text-xs text-gray-500">{timeInfo.date}</div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
                  <span className="text-sm font-medium truncate text-right">
                    {match.teams.away.name}
                  </span>
                  <TeamLogo 
                    teamName={match.teams.away.name}
                    logoUrl={match.teams.away.logo}
                    size="32px"
                  />
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="ml-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(match.fixture.status.short)} text-white border-0`}
                >
                  {match.fixture.status.short}
                </Badge>
              </div>
            </div>
          );
        })}
        
        {matches.length > 10 && (
          <div className="text-center pt-2">
            <Badge variant="outline" className="text-xs">
              +{matches.length - 10} more matches
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UefaU21MatchCard;
