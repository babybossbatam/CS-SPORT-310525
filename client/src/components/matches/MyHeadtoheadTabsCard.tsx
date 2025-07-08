
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MyHeadtoheadTabsCardProps {
  match: any;
}

// Placeholder MyHeadtoHead component until the actual component is created
const MyHeadtoHead = ({ match }: { match: any }) => {
  return (
    <div className="space-y-4">
      <div className="text-center text-gray-500">
        <p className="text-lg font-medium">Head to Head Statistics</p>
        <p className="text-sm">Historical matchup data and statistics</p>
      </div>
      
      <div className="space-y-4">
        {/* Overall H2H Stats */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-center">Overall Record</h4>
          
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={match?.teams?.home?.logo} 
                  alt={match?.teams?.home?.name}
                  className="w-6 h-6"
                />
                <span className="font-medium text-sm">{match?.teams?.home?.name}</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-xs text-gray-500">Wins</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Total Matches</div>
              <div className="text-2xl font-bold text-gray-700">12</div>
              <div className="text-xs text-gray-500">Draws: 2</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={match?.teams?.away?.logo} 
                  alt={match?.teams?.away?.name}
                  className="w-6 h-6"
                />
                <span className="font-medium text-sm">{match?.teams?.away?.name}</span>
              </div>
              <div className="text-2xl font-bold text-red-600">5</div>
              <div className="text-xs text-gray-500">Wins</div>
            </div>
          </div>
        </div>
        
        {/* Recent Meetings */}
        <div>
          <h4 className="font-semibold mb-3">Recent Meetings</h4>
          <div className="space-y-2">
            {[
              { date: '2024-03-15', home: match?.teams?.home?.name, away: match?.teams?.away?.name, score: '2-1', competition: 'League' },
              { date: '2023-10-22', home: match?.teams?.away?.name, away: match?.teams?.home?.name, score: '0-2', competition: 'Cup' },
              { date: '2023-05-08', home: match?.teams?.home?.name, away: match?.teams?.away?.name, score: '1-1', competition: 'League' },
            ].map((meeting, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="text-sm">
                  <span className="font-medium">{meeting.home}</span>
                  <span className="mx-2">vs</span>
                  <span className="font-medium">{meeting.away}</span>
                </div>
                <div className="text-sm">
                  <span className="font-bold">{meeting.score}</span>
                  <span className="ml-2 text-gray-500">({meeting.competition})</span>
                </div>
                <div className="text-xs text-gray-500">{meeting.date}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Goals Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded p-3">
            <h5 className="font-medium text-sm mb-2">Goals For</h5>
            <div className="flex justify-between text-sm">
              <span>{match?.teams?.home?.name}: 18</span>
              <span>{match?.teams?.away?.name}: 15</span>
            </div>
          </div>
          
          <div className="bg-red-50 rounded p-3">
            <h5 className="font-medium text-sm mb-2">Goals Against</h5>
            <div className="flex justify-between text-sm">
              <span>{match?.teams?.home?.name}: 15</span>
              <span>{match?.teams?.away?.name}: 18</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t text-center text-sm text-gray-500">
        Detailed head-to-head analysis coming soon...
      </div>
    </div>
  );
};

const MyHeadtoheadTabsCard = ({ match }: MyHeadtoheadTabsCardProps) => {
  if (!match) return null;

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Head to Head</h3>
          <MyHeadtoHead match={match} />
        </div>
      </CardContent>
    </Card>
  );
};

export default MyHeadtoheadTabsCard;
