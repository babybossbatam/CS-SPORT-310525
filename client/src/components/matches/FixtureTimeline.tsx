import React from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamLogo } from './TeamLogo';
import type { FixtureResponse } from '@/types/fixtures';

interface FixtureTimelineProps {
  fixture?: FixtureResponse;
  className?: string;
}

export const FixtureTimeline = ({ fixture, className }: FixtureTimelineProps) => {
  return (
    <div className={cn("w-full bg-white rounded-lg shadow-sm", className)}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-gray-50/80 rounded-t-lg">
          <TabsTrigger value="overview">Score Overview</TabsTrigger>
          <TabsTrigger value="result">Result</TabsTrigger>
          <TabsTrigger value="fixture">Fixture</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-4">
          {fixture && (
            <>
              <div className="text-center mb-4">
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {fixture.league?.round || 'Quarter Finals • Leg 2/2'}
                </span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 mt-6">
                <div className="text-center">
                  <TeamLogo
                    src={fixture.teams?.home?.logo}
                    alt={fixture.teams?.home?.name || ''}
                    className="w-12 h-12 mx-auto mb-2"
                  />
                  <div className="text-sm font-medium">{fixture.teams?.home?.name}</div>
                </div>
                <div className="text-center text-2xl font-bold">VS</div>
                <div className="text-center">
                  <TeamLogo
                    src={fixture.teams?.away?.logo}
                    alt={fixture.teams?.away?.name || ''}
                    className="w-12 h-12 mx-auto mb-2"
                  />
                  <div className="text-sm font-medium">{fixture.teams?.away?.name}</div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="result">
          {/* Result content */}
        </TabsContent>

        <TabsContent value="fixture">
          {/* Fixture content */}
        </TabsContent>
      </Tabs>
    </div>
  );
};