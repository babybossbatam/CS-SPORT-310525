import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MyTrendsTabsCardProps {
  match?: any;
}

const MyTrendsTabsCard: React.FC<MyTrendsTabsCardProps> = ({ match }) => {
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

  const homeTeam = match.teams?.home;
  const awayTeam = match.teams?.away;

  // Sample trend data - in real implementation, this would come from API
  const trendData = {
    home: {
      form: ['W', 'W', 'L', 'W', 'D'], // Last 5 matches
      goalTrend: 'up',
      defenseTrend: 'stable',
      recentGoals: 8,
      recentConceded: 3
    },
    away: {
      form: ['L', 'W', 'W', 'D', 'W'], // Last 5 matches
      goalTrend: 'up',
      defenseTrend: 'down',
      recentGoals: 6,
      recentConceded: 5
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getFormBadge = (result: string) => {
    const colors = {
      'W': 'bg-green-500 text-white',
      'L': 'bg-red-500 text-white',
      'D': 'bg-gray-500 text-white'
    };
    return (
      <span className={`inline-block w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${colors[result as keyof typeof colors]}`}>
        {result}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Trends & Analysis</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Recent Form */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Recent Form (Last 5 matches)</h3>

          {/* Home Team Form */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img 
                src={homeTeam?.logo || "/assets/fallback-logo.png"} 
                alt={homeTeam?.name}
                className="w-5 h-5 object-contain"
              />
              <span className="font-medium">{homeTeam?.name}</span>
            </div>
            <div className="flex gap-1">
              {trendData.home.form.map((result, index) => (
                <div key={index}>
                  {getFormBadge(result)}
                </div>
              ))}
            </div>
          </div>

          {/* Away Team Form */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img 
                src={awayTeam?.logo || "/assets/fallback-logo.png"} 
                alt={awayTeam?.name}
                className="w-5 h-5 object-contain"
              />
              <span className="font-medium">{awayTeam?.name}</span>
            </div>
            <div className="flex gap-1">
              {trendData.away.form.map((result, index) => (
                <div key={index}>
                  {getFormBadge(result)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goal Trends */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Goal Trends</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Home Team Goals */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{homeTeam?.name}</span>
                {getTrendIcon(trendData.home.goalTrend)}
              </div>
              <div className="text-2xl font-bold text-blue-600">{trendData.home.recentGoals}</div>
              <div className="text-xs text-gray-600">Goals in last 5 games</div>
            </div>

            {/* Away Team Goals */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{awayTeam?.name}</span>
                {getTrendIcon(trendData.away.goalTrend)}
              </div>
              <div className="text-2xl font-bold text-blue-600">{trendData.away.recentGoals}</div>
              <div className="text-xs text-gray-600">Goals in last 5 games</div>
            </div>
          </div>
        </div>

        {/* Defensive Trends */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Defensive Trends</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Home Team Defense */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{homeTeam?.name}</span>
                {getTrendIcon(trendData.home.defenseTrend)}
              </div>
              <div className="text-2xl font-bold text-red-600">{trendData.home.recentConceded}</div>
              <div className="text-xs text-gray-600">Goals conceded in last 5</div>
            </div>

            {/* Away Team Defense */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{awayTeam?.name}</span>
                {getTrendIcon(trendData.away.defenseTrend)}
              </div>
              <div className="text-2xl font-bold text-red-600">{trendData.away.recentConceded}</div>
              <div className="text-xs text-gray-600">Goals conceded in last 5</div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Key Insights</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Both teams show attacking form in recent matches</li>
            <li>• {homeTeam?.name} has been solid defensively</li>
            <li>• {awayTeam?.name} has been more vulnerable at the back</li>
            <li>• Expect an entertaining match with goals</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyTrendsTabsCard;