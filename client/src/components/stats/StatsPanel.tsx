import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsPanelProps {
  leagueId?: number;
  season?: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ leagueId, season = 2024 }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/leagues/${leagueId}/stats`, { season }],
    enabled: !!leagueId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="font-bold text-lg">{stats?.totalMatches || 0}</div>
            <div className="text-sm text-gray-600">Matches</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{stats?.totalGoals || 0}</div>
            <div className="text-sm text-gray-600">Goals</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{stats?.avgGoalsPerMatch?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600">Avg Goals/Match</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{stats?.totalTeams || 0}</div>
            <div className="text-sm text-gray-600">Teams</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsPanel;