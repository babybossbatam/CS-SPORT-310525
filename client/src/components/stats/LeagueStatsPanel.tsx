
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

  return null;
};

export default LeagueStatsPanel;
