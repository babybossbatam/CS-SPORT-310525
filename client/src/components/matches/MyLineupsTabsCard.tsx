
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MyLineupsTabsCardProps {
  match: any;
}

// Placeholder MyLineUp component until the actual component is created
const MyLineUp = ({ match }: { match: any }) => {
  return (
    <div className="space-y-4">
      <div className="text-center text-gray-500">
        <p className="text-lg font-medium">Team Lineups</p>
        <p className="text-sm">
          {match?.fixture?.status?.short === "NS" 
            ? "Probable lineups will be available closer to match time"
            : "Official lineups and formations"
          }
        </p>
      </div>
      
      {/* Home Team Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img 
              src={match?.teams?.home?.logo} 
              alt={match?.teams?.home?.name}
              className="w-6 h-6"
            />
            <h4 className="font-semibold">{match?.teams?.home?.name}</h4>
          </div>
          <div className="text-sm text-gray-600">
            Lineup data coming soon...
          </div>
        </div>
        
        {/* Away Team Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img 
              src={match?.teams?.away?.logo} 
              alt={match?.teams?.away?.name}
              className="w-6 h-6"
            />
            <h4 className="font-semibold">{match?.teams?.away?.name}</h4>
          </div>
          <div className="text-sm text-gray-600">
            Lineup data coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};

const MyLineupsTabsCard = ({ match }: MyLineupsTabsCardProps) => {
  if (!match) return null;

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">
            {match?.fixture?.status?.short === "NS" ? "Probable Lineups" : "Team Lineups"}
          </h3>
          <MyLineUp match={match} />
        </div>
      </CardContent>
    </Card>
  );
};

export default MyLineupsTabsCard;
