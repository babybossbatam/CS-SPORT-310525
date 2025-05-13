
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface LeagueStatsPanelProps {
  leagueId?: number;
  season?: number;
  className?: string;
}

const LeagueStatsPanel: React.FC<LeagueStatsPanelProps> = ({ leagueId, season = 2024, className }) => {
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
    <div className={`bg-white p-4 ${className}`}>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="font-bold text-lg text-blue-600">{stats?.totalMatches || 0}</div>
          <div className="text-xs text-gray-600">Matches</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg text-green-600">{stats?.totalGoals || 0}</div>
          <div className="text-xs text-gray-600">Goals</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg text-orange-600">{stats?.avgGoalsPerMatch?.toFixed(2) || '0.00'}</div>
          <div className="text-xs text-gray-600">Avg Goals/Match</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-lg text-purple-600">{stats?.totalTeams || 0}</div>
          <div className="text-xs text-gray-600">Teams</div>
        </div>
      </div>
    </div>
  );
};

export default LeagueStatsPanel;
