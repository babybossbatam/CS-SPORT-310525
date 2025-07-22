
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Target, Clock } from 'lucide-react';

interface MatchStatsProps {
  fixtureId: number;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  onClose?: () => void;
}

interface TeamStatistic {
  type: string;
  value: number | string;
}

interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: TeamStatistic[];
}

const MyMatchStats: React.FC<MatchStatsProps> = ({
  fixtureId,
  homeTeam,
  awayTeam,
  onClose
}) => {
  const [homeStats, setHomeStats] = useState<TeamStats | null>(null);
  const [awayStats, setAwayStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch stats for both teams
        const [homeResponse, awayResponse] = await Promise.all([
          fetch(`/api/fixtures/${fixtureId}/statistics?team=${homeTeam.id}`),
          fetch(`/api/fixtures/${fixtureId}/statistics?team=${awayTeam.id}`)
        ]);

        if (!homeResponse.ok || !awayResponse.ok) {
          throw new Error('Failed to fetch match statistics');
        }

        const homeData = await homeResponse.json();
        const awayData = await awayResponse.json();

        setHomeStats(homeData[0] || null);
        setAwayStats(awayData[0] || null);
      } catch (err) {
        console.error('Error fetching match statistics:', err);
        setError('Failed to load match statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchStats();
  }, [fixtureId, homeTeam.id, awayTeam.id]);

  const getStatValue = (stats: TeamStatistic[], type: string): string => {
    const stat = stats?.find(s => s.type === type);
    return stat ? String(stat.value) : '0';
  };

  const formatPercentage = (value: string): string => {
    if (value.includes('%')) return value;
    const num = parseFloat(value);
    return isNaN(num) ? '0%' : `${num}%`;
  };

  const StatRow = ({ 
    label, 
    homeValue, 
    awayValue, 
    icon: Icon 
  }: { 
    label: string; 
    homeValue: string; 
    awayValue: string; 
    icon: any;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center flex-1 text-sm font-medium text-right">
        <span className="text-blue-600">{homeValue}</span>
      </div>
      <div className="flex items-center justify-center flex-1 px-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Icon className="w-4 h-4" />
          <span className="font-medium">{label}</span>
        </div>
      </div>
      <div className="flex items-center flex-1 text-sm font-medium">
        <span className="text-red-600">{awayValue}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Match Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !homeStats || !awayStats) {
    return (
      <Card className="w-full mt-4">
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">
            {error || 'No statistics available for this match'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-blue-600" />
            Match Statistics
          </CardTitle>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Team Headers */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={homeTeam.logo} 
              alt={homeTeam.name}
              className="w-8 h-8 object-contain"
            />
            <span className="text-sm font-medium text-blue-600 truncate">
              {homeTeam.name}
            </span>
          </div>
          <div className="px-4">
            <Badge variant="outline" className="text-xs">VS</Badge>
          </div>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="text-sm font-medium text-red-600 truncate">
              {awayTeam.name}
            </span>
            <img 
              src={awayTeam.logo} 
              alt={awayTeam.name}
              className="w-8 h-8 object-contain"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-0">
          <StatRow
            label="Shots on Goal"
            homeValue={getStatValue(homeStats.statistics, 'Shots on Goal')}
            awayValue={getStatValue(awayStats.statistics, 'Shots on Goal')}
            icon={Target}
          />
          
          <StatRow
            label="Total Shots"
            homeValue={getStatValue(homeStats.statistics, 'Total Shots')}
            awayValue={getStatValue(awayStats.statistics, 'Total Shots')}
            icon={TrendingUp}
          />
          
          <StatRow
            label="Possession"
            homeValue={formatPercentage(getStatValue(homeStats.statistics, 'Ball Possession'))}
            awayValue={formatPercentage(getStatValue(awayStats.statistics, 'Ball Possession'))}
            icon={Clock}
          />
          
          <StatRow
            label="Passes"
            homeValue={getStatValue(homeStats.statistics, 'Total passes')}
            awayValue={getStatValue(awayStats.statistics, 'Total passes')}
            icon={Activity}
          />
          
          <StatRow
            label="Pass Accuracy"
            homeValue={formatPercentage(getStatValue(homeStats.statistics, 'Passes accurate'))}
            awayValue={formatPercentage(getStatValue(awayStats.statistics, 'Passes accurate'))}
            icon={Target}
          />
          
          <StatRow
            label="Fouls"
            homeValue={getStatValue(homeStats.statistics, 'Fouls')}
            awayValue={getStatValue(awayStats.statistics, 'Fouls')}
            icon={Activity}
          />
          
          <StatRow
            label="Yellow Cards"
            homeValue={getStatValue(homeStats.statistics, 'Yellow Cards')}
            awayValue={getStatValue(awayStats.statistics, 'Yellow Cards')}
            icon={Activity}
          />
          
          <StatRow
            label="Red Cards"
            homeValue={getStatValue(homeStats.statistics, 'Red Cards')}
            awayValue={getStatValue(awayStats.statistics, 'Red Cards')}
            icon={Activity}
          />
          
          <StatRow
            label="Offsides"
            homeValue={getStatValue(homeStats.statistics, 'Offsides')}
            awayValue={getStatValue(awayStats.statistics, 'Offsides')}
            icon={Activity}
          />
          
          <StatRow
            label="Corner Kicks"
            homeValue={getStatValue(homeStats.statistics, 'Corner Kicks')}
            awayValue={getStatValue(awayStats.statistics, 'Corner Kicks')}
            icon={Activity}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MyMatchStats;
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MatchStatsProps {
  match?: any;
  fixtureId?: string | number;
}

interface TeamStatistic {
  type: string;
  value: number | string;
}

interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: TeamStatistic[];
}

const MyMatchStats: React.FC<MatchStatsProps> = ({ match, fixtureId }) => {
  const [homeTeamStats, setHomeTeamStats] = useState<TeamStats | null>(null);
  const [awayTeamStats, setAwayTeamStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchStats = async () => {
      if (!fixtureId || !match?.teams) {
        setError("No fixture or team data available");
        setIsLoading(false);
        return;
      }

      try {
        console.log(`📊 [MyMatchStats] Fetching statistics for fixture: ${fixtureId}`);
        
        const homeTeamId = match.teams.home.id;
        const awayTeamId = match.teams.away.id;

        // Fetch statistics for both teams
        const [homeResponse, awayResponse] = await Promise.all([
          fetch(`/api/fixtures/${fixtureId}/team-statistics?team=${homeTeamId}`),
          fetch(`/api/fixtures/${fixtureId}/team-statistics?team=${awayTeamId}`)
        ]);

        if (!homeResponse.ok || !awayResponse.ok) {
          throw new Error('Failed to fetch team statistics');
        }

        const [homeData, awayData] = await Promise.all([
          homeResponse.json(),
          awayResponse.json()
        ]);

        console.log(`📊 [MyMatchStats] Home team data:`, homeData);
        console.log(`📊 [MyMatchStats] Away team data:`, awayData);

        if (homeData && homeData.length > 0) {
          setHomeTeamStats(homeData[0]);
        }
        if (awayData && awayData.length > 0) {
          setAwayTeamStats(awayData[0]);
        }

        setError(null);
      } catch (error) {
        console.error(`❌ [MyMatchStats] Error fetching statistics:`, error);
        setError(error instanceof Error ? error.message : "Failed to fetch statistics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchStats();
  }, [fixtureId, match]);

  const getStatValue = (stats: TeamStatistic[], statType: string): string => {
    const stat = stats?.find(s => s.type === statType);
    return stat?.value?.toString() || '0';
  };

  const getStatPercentage = (homeValue: string, awayValue: string): { home: number; away: number } => {
    const home = parseInt(homeValue) || 0;
    const away = parseInt(awayValue) || 0;
    const total = home + away;
    
    if (total === 0) return { home: 50, away: 50 };
    
    return {
      home: Math.round((home / total) * 100),
      away: Math.round((away / total) * 100)
    };
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-normal">Match Statistics</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading statistics...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !homeTeamStats || !awayTeamStats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-normal">Match Statistics</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500 py-8">
            <p>Statistics not available</p>
            <p className="text-xs mt-1">Data will be available during or after the match</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const keyStats = [
    { type: 'Shots on Goal', key: 'Shots on Goal' },
    { type: 'Shots off Goal', key: 'Shots off Goal' },
    { type: 'Total Shots', key: 'Total Shots' },
    { type: 'Ball Possession', key: 'Ball Possession' },
    { type: 'Corner Kicks', key: 'Corner Kicks' },
    { type: 'Offsides', key: 'Offsides' },
    { type: 'Fouls', key: 'Fouls' },
    { type: 'Yellow Cards', key: 'Yellow Cards' },
    { type: 'Red Cards', key: 'Red Cards' },
    { type: 'Goalkeeper Saves', key: 'Goalkeeper Saves' },
    { type: 'Total passes', key: 'Total passes' },
    { type: 'Passes accurate', key: 'Passes accurate' },
    { type: 'Passes %', key: 'Passes %' }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">Match Statistics</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {keyStats.map((stat) => {
            const homeValue = getStatValue(homeTeamStats.statistics, stat.key);
            const awayValue = getStatValue(awayTeamStats.statistics, stat.key);
            
            // Skip if both values are 0 or empty
            if (homeValue === '0' && awayValue === '0') {
              return null;
            }

            const percentages = stat.key === 'Ball Possession' || stat.key === 'Passes %' 
              ? { home: parseInt(homeValue) || 0, away: parseInt(awayValue) || 0 }
              : getStatPercentage(homeValue, awayValue);

            return (
              <div key={stat.key} className="space-y-2">
                {/* Stat name and values */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{homeValue}</span>
                  <span className="text-xs text-gray-600 font-medium">{stat.type}</span>
                  <span className="text-sm font-medium text-gray-900">{awayValue}</span>
                </div>
                
                {/* Progress bar */}
                <div className="flex items-center h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${percentages.home}%` }}
                  ></div>
                  <div 
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${percentages.away}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Team names at bottom */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">{homeTeamStats.team.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{awayTeamStats.team.name}</span>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyMatchStats;
