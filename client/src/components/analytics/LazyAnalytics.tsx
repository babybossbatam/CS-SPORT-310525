
import React, { Suspense, lazy, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Lazy load analytics components
const PlayerHeatMap = lazy(() => import('./PlayerHeatMap'));
const ShotMapVisualization = lazy(() => import('./ShotMapVisualization'));

// Loading fallback component
const AnalyticsLoader = () => (
  <Card className="w-full h-64">
    <CardContent className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading analytics...</span>
    </CardContent>
  </Card>
);

// Memoized analytics wrapper
interface LazyAnalyticsProps {
  type: 'heatmap' | 'shotmap';
  playerId?: number;
  matchId?: number;
  playerName?: string;
  teamName?: string;
  shotData?: any[];
  eventData?: any[];
}

const LazyAnalytics: React.FC<LazyAnalyticsProps> = memo(({
  type,
  playerId,
  matchId,
  playerName,
  teamName,
  shotData,
  eventData
}) => {
  const renderAnalytics = () => {
    switch (type) {
      case 'heatmap':
        return (
          <PlayerHeatMap
            playerId={playerId!}
            matchId={matchId!}
            playerName={playerName}
            teamName={teamName}
          />
        );
      case 'shotmap':
        return (
          <ShotMapVisualization
            shotData={shotData || []}
            eventData={eventData || []}
          />
        );
      default:
        return <div>Unknown analytics type</div>;
    }
  };

  return (
    <Suspense fallback={<AnalyticsLoader />}>
      {renderAnalytics()}
    </Suspense>
  );
});

LazyAnalytics.displayName = 'LazyAnalytics';

export default LazyAnalytics;
