
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MyTrendsTabsCardProps {
  match: any;
}

// Placeholder MyTrends component until the actual component is created
const MyTrends = ({ match }: { match: any }) => {
  return (
    <div className="space-y-4">
      <div className="text-center text-gray-500">
        <p className="text-lg font-medium">Team Trends & Form</p>
        <p className="text-sm">Recent performance analysis and trends</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Team Trends */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img 
              src={match?.teams?.home?.logo} 
              alt={match?.teams?.home?.name}
              className="w-6 h-6"
            />
            <h4 className="font-semibold">{match?.teams?.home?.name}</h4>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Recent Form:</span>
              <div className="flex gap-1 mt-1">
                {/* Placeholder form indicators */}
                {['W', 'L', 'W', 'D', 'W'].map((result, index) => (
                  <span 
                    key={index}
                    className={`w-6 h-6 rounded-full text-xs flex items-center justify-center text-white font-bold ${
                      result === 'W' ? 'bg-green-500' : 
                      result === 'L' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                  >
                    {result}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Goals scored (last 5): 8</p>
              <p>Goals conceded (last 5): 3</p>
              <p>Clean sheets: 2</p>
            </div>
          </div>
        </div>
        
        {/* Away Team Trends */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img 
              src={match?.teams?.away?.logo} 
              alt={match?.teams?.away?.name}
              className="w-6 h-6"
            />
            <h4 className="font-semibold">{match?.teams?.away?.name}</h4>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Recent Form:</span>
              <div className="flex gap-1 mt-1">
                {/* Placeholder form indicators */}
                {['W', 'W', 'L', 'W', 'D'].map((result, index) => (
                  <span 
                    key={index}
                    className={`w-6 h-6 rounded-full text-xs flex items-center justify-center text-white font-bold ${
                      result === 'W' ? 'bg-green-500' : 
                      result === 'L' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                  >
                    {result}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Goals scored (last 5): 7</p>
              <p>Goals conceded (last 5): 4</p>
              <p>Clean sheets: 1</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t text-center text-sm text-gray-500">
        Detailed trends analysis coming soon...
      </div>
    </div>
  );
};

const MyTrendsTabsCard = ({ match }: MyTrendsTabsCardProps) => {
  if (!match) return null;

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Team Trends</h3>
          <MyTrends match={match} />
        </div>
      </CardContent>
    </Card>
  );
};

export default MyTrendsTabsCard;
