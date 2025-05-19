import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FanEngagementHeatMap from './FanEngagementHeatMap';
import WorldMapHeatMap from './WorldMapHeatMap';

interface MatchEngagementSectionProps {
  matchId?: number;
  teamId?: number;
  className?: string;
}

const MatchEngagementSection: React.FC<MatchEngagementSectionProps> = ({ 
  matchId,
  teamId,
  className = ''
}) => {
  return (
    <div className={`${className}`}>
      <h2 className="text-xl font-bold mb-4">Fan Engagement Analysis</h2>
      
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="chart">Chart View</TabsTrigger>
          <TabsTrigger value="map">World Map</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart">
          <FanEngagementHeatMap matchId={matchId} teamId={teamId} />
        </TabsContent>
        
        <TabsContent value="map">
          <WorldMapHeatMap matchId={matchId} teamId={teamId} />
        </TabsContent>
      </Tabs>
      
      <div className="text-sm text-gray-500 mt-4">
        <p>This analysis shows real-time fan engagement data gathered from social media activity, 
        app usage, and streaming statistics across different regions globally.</p>
      </div>
    </div>
  );
};

export default MatchEngagementSection;