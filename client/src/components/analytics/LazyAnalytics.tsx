
import React, { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load analytics components
const PlayerHeatMap = lazy(() => import('./PlayerHeatMap'));
const ShotMapVisualization = lazy(() => import('./ShotMapVisualization'));
const FootballChatbot = lazy(() => import('../ai/FootballChatbot'));

interface LazyAnalyticsProps {
  component: 'heatmap' | 'shotmap' | 'chatbot';
  props?: any;
}

const LoadingFallback = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </CardContent>
  </Card>
);

const LazyAnalytics: React.FC<LazyAnalyticsProps> = ({ component, props }) => {
  const renderComponent = () => {
    switch (component) {
      case 'heatmap':
        return <PlayerHeatMap {...props} />;
      case 'shotmap':
        return <ShotMapVisualization {...props} />;
      case 'chatbot':
        return <FootballChatbot {...props} />;
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      {renderComponent()}
    </Suspense>
  );
};

export default LazyAnalytics;
