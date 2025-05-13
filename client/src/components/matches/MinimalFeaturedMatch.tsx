import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * A minimal featured match component with no API dependencies
 * This is a fallback component that doesn't rely on any API data
 * to prevent crashes in the UI
 */
const MinimalFeaturedMatch: React.FC = () => {
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-center mb-4">Featured Match</h3>
        
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400">Team A</span>
            </div>
            <span className="text-sm font-medium">Team A</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold mb-2">vs</div>
            <div className="text-sm text-gray-500">Coming Soon</div>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400">Team B</span>
            </div>
            <span className="text-sm font-medium">Team B</span>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Match information will be displayed when available
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MinimalFeaturedMatch;