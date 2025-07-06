
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Zap, Users, Clock, BarChart3 } from "lucide-react";

interface MyMatchDataProps {
  fixtureId?: number;
  homeTeam?: string;
  awayTeam?: string;
  matchStatus?: string;
  className?: string;
}

interface MatchStats {
  possession?: {
    home: number;
    away: number;
  };
  expectedGoals?: {
    home: number;
    away: number;
  };
  totalShots?: {
    home: number;
    away: number;
  };
  shotsOnTarget?: {
    home: number;
    away: number;
  };
  corners?: {
    home: number;
    away: number;
  };
  fouls?: {
    home: number;
    away: number;
  };
  yellowCards?: {
    home: number;
    away: number;
  };
  redCards?: {
    home: number;
    away: number;
  };
  offsides?: {
    home: number;
    away: number;
  };
  saves?: {
    home: number;
    away: number;
  };
}

const MyMatchData: React.FC<MyMatchDataProps> = ({
  fixtureId,
  homeTeam = "Home Team",
  awayTeam = "Away Team",
  matchStatus,
  className = ""
}) => {
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchStats = async () => {
      if (!fixtureId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/fixtures/${fixtureId}/statistics`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length >= 2) {
          // Extract stats from API response
          const homeStats = data[0]?.statistics || [];
          const awayStats = data[1]?.statistics || [];
          
          const extractStat = (statName: string) => {
            const homeStat = homeStats.find((s: any) => s.type === statName);
            const awayStat = awayStats.find((s: any) => s.type === statName);
            
            return {
              home: homeStat ? (parseInt(homeStat.value) || 0) : 0,
              away: awayStat ? (parseInt(awayStat.value) || 0) : 0
            };
          };
          
          const extractPercentage = (statName: string) => {
            const homeStat = homeStats.find((s: any) => s.type === statName);
            const awayStat = awayStats.find((s: any) => s.type === statName);
            
            return {
              home: homeStat ? (parseInt(homeStat.value?.replace('%', '')) || 0) : 0,
              away: awayStat ? (parseInt(awayStat.value?.replace('%', '')) || 0) : 0
            };
          };
          
          const extractExpectedGoals = (statName: string) => {
            const homeStat = homeStats.find((s: any) => s.type === statName);
            const awayStat = awayStats.find((s: any) => s.type === statName);
            
            return {
              home: homeStat ? (parseFloat(homeStat.value) || 0) : 0,
              away: awayStat ? (parseFloat(awayStat.value) || 0) : 0
            };
          };

          const matchStats: MatchStats = {
            possession: extractPercentage('Ball Possession'),
            expectedGoals: extractExpectedGoals('expected_goals'),
            totalShots: extractStat('Total Shots'),
            shotsOnTarget: extractStat('Shots on Goal'),
            corners: extractStat('Corner Kicks'),
            fouls: extractStat('Fouls'),
            yellowCards: extractStat('Yellow Cards'),
            redCards: extractStat('Red Cards'),
            offsides: extractStat('Offsides'),
            saves: extractStat('Goalkeeper Saves')
          };

          setStats(matchStats);
        }
      } catch (err) {
        console.error('Error fetching match statistics:', err);
        setError('Failed to load match statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchStats();
  }, [fixtureId]);

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No statistics available for this match</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const StatRow = ({ 
    label, 
    homeValue, 
    awayValue, 
    icon: Icon,
    isPercentage = false,
    isDecimal = false,
    showBar = true
  }: {
    label: string;
    homeValue: number;
    awayValue: number;
    icon: React.ElementType;
    isPercentage?: boolean;
    isDecimal?: boolean;
    showBar?: boolean;
  }) => {
    const total = homeValue + awayValue;
    const homePercentage = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPercentage = total > 0 ? (awayValue / total) * 100 : 50;

    const formatValue = (value: number) => {
      if (isPercentage) return `${value}%`;
      if (isDecimal) return value.toFixed(2);
      return value.toString();
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            {formatValue(homeValue)}
          </Badge>
          
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Icon className="h-4 w-4" />
            {label}
          </div>
          
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            {formatValue(awayValue)}
          </Badge>
        </div>
        
        {showBar && (
          <div className="flex h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500 transition-all duration-300"
              style={{ width: `${homePercentage}%` }}
            />
            <div 
              className="bg-blue-500 transition-all duration-300"
              style={{ width: `${awayPercentage}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Possession */}
        {stats.possession && (
          <StatRow
            label="Possession"
            homeValue={stats.possession.home}
            awayValue={stats.possession.away}
            icon={Users}
            isPercentage
          />
        )}

        {/* Expected Goals */}
        {stats.expectedGoals && (
          <StatRow
            label="Expected Goals"
            homeValue={stats.expectedGoals.home}
            awayValue={stats.expectedGoals.away}
            icon={TrendingUp}
            isDecimal
          />
        )}

        {/* Total Shots */}
        {stats.totalShots && (
          <StatRow
            label="Total Shots"
            homeValue={stats.totalShots.home}
            awayValue={stats.totalShots.away}
            icon={Target}
          />
        )}

        {/* Shots on Target */}
        {stats.shotsOnTarget && (
          <StatRow
            label="Shots On Target"
            homeValue={stats.shotsOnTarget.home}
            awayValue={stats.shotsOnTarget.away}
            icon={Zap}
          />
        )}

        {/* Corners */}
        {stats.corners && (
          <StatRow
            label="Corner Kicks"
            homeValue={stats.corners.home}
            awayValue={stats.corners.away}
            icon={Target}
          />
        )}

        {/* Fouls */}
        {stats.fouls && (
          <StatRow
            label="Fouls"
            homeValue={stats.fouls.home}
            awayValue={stats.fouls.away}
            icon={Clock}
          />
        )}

        {/* Cards */}
        {stats.yellowCards && (
          <StatRow
            label="Yellow Cards"
            homeValue={stats.yellowCards.home}
            awayValue={stats.yellowCards.away}
            icon={Clock}
          />
        )}

        {stats.redCards && (stats.redCards.home > 0 || stats.redCards.away > 0) && (
          <StatRow
            label="Red Cards"
            homeValue={stats.redCards.home}
            awayValue={stats.redCards.away}
            icon={Clock}
          />
        )}

        {/* See All Button */}
        <div className="pt-4 border-t border-gray-100">
          <button className="w-full text-center text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1">
            See All
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyMatchData;
