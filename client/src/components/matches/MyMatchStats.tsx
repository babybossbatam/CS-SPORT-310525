
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
        
        // Check if we have the required team data
        if (!homeTeam?.id || !awayTeam?.id) {
          setError('Team data not available');
          setLoading(false);
          return;
        }
        
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

    // Only fetch if we have all required data
    if (fixtureId && homeTeam?.id && awayTeam?.id) {
      fetchMatchStats();
    }
  }, [fixtureId, homeTeam?.id, awayTeam?.id]);

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
