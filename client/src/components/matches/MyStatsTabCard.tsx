
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MyMatchStats from './MyMatchStats';

interface MyStatsTabCardProps {
  match?: any;
}

// Enhanced StatRow component with horizontal bars
const StatRowWithBars: React.FC<{
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  homeColor?: string;
  awayColor?: string;
}> = ({ label, homeValue, awayValue, homeColor = '#ef4444', awayColor = '#10b981' }) => {
  // Convert values to numbers for bar calculation
  const homeNum = typeof homeValue === 'string' ? parseFloat(homeValue.replace('%', '')) || 0 : homeValue || 0;
  const awayNum = typeof awayValue === 'string' ? parseFloat(awayValue.replace('%', '')) || 0 : awayValue || 0;
  
  // Calculate percentages for bar widths
  const total = homeNum + awayNum;
  const homePercentage = total > 0 ? (homeNum / total) * 100 : 0;
  const awayPercentage = total > 0 ? (awayNum / total) * 100 : 0;

  return (
    <div className="py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-900 w-12 text-right">{homeValue}</span>
        <span className="text-sm font-semibold text-gray-700 text-center flex-1">{label}</span>
        <span className="text-sm font-medium text-gray-900 w-12 text-left">{awayValue}</span>
      </div>
      
      <div className="flex items-center h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* Home team bar (left side) */}
        <div 
          className="h-full transition-all duration-300 ease-in-out"
          style={{ 
            width: `${homePercentage}%`,
            backgroundColor: homeColor
          }}
        />
        
        {/* Away team bar (right side) */}
        <div 
          className="h-full transition-all duration-300 ease-in-out"
          style={{ 
            width: `${awayPercentage}%`,
            backgroundColor: awayColor
          }}
        />
      </div>
    </div>
  );
};

const MyStatsTabCard: React.FC<MyStatsTabCardProps> = ({ match }) => {
  if (!match) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            No match data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUpcoming = match.fixture?.status?.short === "NS";
  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;

  // If it's an upcoming match, show the preview
  if (isUpcoming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match Statistics</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            <div className="text-center text-gray-600 py-8">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="text-lg font-medium mb-2">Statistics Coming Soon</h3>
              <p className="text-sm text-gray-500">
                Match statistics will be available once the game starts
              </p>
            </div>

            {/* Team Comparison Preview */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-center">Team Comparison Preview</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <img 
                    src={homeTeam?.logo || "/assets/fallback-logo.png"} 
                    alt={homeTeam?.name}
                    className="w-8 h-8 object-contain mx-auto mb-1"
                  />
                  <div className="font-medium truncate">{homeTeam?.name}</div>
                </div>
                <div className="text-center text-gray-500">
                  VS
                </div>
                <div className="text-center">
                  <img 
                    src={awayTeam?.logo || "/assets/fallback-logo.png"} 
                    alt={awayTeam?.name}
                    className="w-8 h-8 object-contain mx-auto mb-1"
                  />
                  <div className="font-medium truncate">{awayTeam?.name}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For live/finished matches, we'll create a custom stats component with bars
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Match Statistics</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Team Headers */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <div className="flex items-center space-x-2">
            <img 
              src={homeTeam?.logo || "/assets/fallback-logo.png"} 
              alt={homeTeam?.name}
              className="w-6 h-6 object-contain"
            />
            <span className="text-sm font-semibold truncate max-w-20">{homeTeam?.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold truncate max-w-20">{awayTeam?.name}</span>
            <img 
              src={awayTeam?.logo || "/assets/fallback-logo.png"} 
              alt={awayTeam?.name}
              className="w-6 h-6 object-contain"
            />
          </div>
        </div>

        {/* Statistics with bars - Sample data for demonstration */}
        <div className="space-y-3">
          <StatRowWithBars label="Ball Possession" homeValue="28%" awayValue="72%" />
          <StatRowWithBars label="Shots on Goal" homeValue={2} awayValue={10} />
          <StatRowWithBars label="Shots off Goal" homeValue={4} awayValue={8} />
          <StatRowWithBars label="Total Shots" homeValue={8} awayValue={28} />
          <StatRowWithBars label="Blocked Shots" homeValue={2} awayValue={10} />
          <StatRowWithBars label="Shots insidebox" homeValue={6} awayValue={22} />
          <StatRowWithBars label="Shots outsidebox" homeValue={2} awayValue={6} />
          <StatRowWithBars label="Fouls" homeValue={15} awayValue={14} />
          <StatRowWithBars label="Corner Kicks" homeValue={9} awayValue={13} />
          <StatRowWithBars label="Offsides" homeValue={4} awayValue={2} />
          <StatRowWithBars label="Yellow Cards" homeValue={2} awayValue={1} />
          <StatRowWithBars label="Red Cards" homeValue={1} awayValue={0} />
          <StatRowWithBars label="Goalkeeper Saves" homeValue={10} awayValue={1} />
          <StatRowWithBars label="Total passes" homeValue={369} awayValue={970} />
          <StatRowWithBars label="Passes accurate" homeValue={261} awayValue={881} />
          <StatRowWithBars label="Passes %" homeValue="71%" awayValue="91%" />
        </div>

        {/* Note about integrating with real data */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p>Note: This is using sample data. To integrate with real statistics, replace the sample data with actual values from the MyMatchStats component API calls.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyStatsTabCard;
