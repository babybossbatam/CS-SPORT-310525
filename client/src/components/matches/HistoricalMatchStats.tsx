import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamStats {
  id: number;
  name: string;
  logo: string;
}

interface HeadToHeadStats {
  wins: {
    home: number;
    away: number;
    total: number;
  };
  draws: {
    total: number;
  };
  loses: {
    home: number;
    away: number;
    total: number;
  };
  played: {
    home: number;
    away: number;
    total: number;
  };
}

interface HistoricalMatchStatsProps {
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  headToHead?: {
    [teamId: number]: HeadToHeadStats;
  };
}

const HistoricalMatchStats: React.FC<HistoricalMatchStatsProps> = ({
  homeTeam,
  awayTeam,
  headToHead = {
    // Sample data - in a real app this would come from API
    [homeTeam.id]: {
      wins: { home: 3, away: 2, total: 5 },
      draws: { total: 2 },
      loses: { home: 1, away: 1, total: 2 },
      played: { home: 4, away: 5, total: 9 }
    },
    [awayTeam.id]: {
      wins: { home: 1, away: 1, total: 2 },
      draws: { total: 2 },
      loses: { home: 2, away: 3, total: 5 },
      played: { home: 5, away: 4, total: 9 }
    }
  }
}) => {
  // Calculate win percentage
  const calculateWinPercentage = (teamId: number) => {
    const stats = headToHead[teamId];
    if (!stats) return 0;
    return Math.round((stats.wins.total / stats.played.total) * 100);
  };

  // Get last 5 results as emojis (W, D, L)
  const getLastFiveForm = (teamId: number) => {
    // In a real app, this would come from API data
    const forms = {
      [homeTeam.id]: ['W', 'D', 'W', 'L', 'W'],
      [awayTeam.id]: ['L', 'W', 'D', 'L', 'L'],
    };
    
    return forms[teamId] || [];
  };
  
  // Get emoji for result
  const getFormEmoji = (result: string) => {
    switch(result) {
      case 'W': return '🟢';
      case 'D': return '🟡';
      case 'L': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          Head-to-Head Statistics
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">
                  Historical performance between these teams based on all previous matches.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div>
            <div className="flex flex-col items-center">
              <img 
                src={homeTeam.logo} 
                alt={homeTeam.name} 
                className="w-12 h-12 mb-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                }}
              />
              <div className="font-medium text-sm">{homeTeam.name}</div>
              <div className="text-2xl font-bold mt-2">{calculateWinPercentage(homeTeam.id)}%</div>
              <div className="text-xs text-gray-500">Win rate</div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="text-xl font-semibold">VS</div>
            <div className="bg-gray-100 rounded-lg px-3 py-1 mt-2 text-sm">
              {headToHead[homeTeam.id]?.played.total || 0} matches
            </div>
            <div className="flex items-center justify-center space-x-1 mt-2">
              <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                {headToHead[homeTeam.id]?.wins.total || 0}W
              </div>
              <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                {headToHead[homeTeam.id]?.draws.total || 0}D
              </div>
              <div className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                {headToHead[homeTeam.id]?.loses.total || 0}L
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex flex-col items-center">
              <img 
                src={awayTeam.logo} 
                alt={awayTeam.name} 
                className="w-12 h-12 mb-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Team';
                }}
              />
              <div className="font-medium text-sm">{awayTeam.name}</div>
              <div className="text-2xl font-bold mt-2">{calculateWinPercentage(awayTeam.id)}%</div>
              <div className="text-xs text-gray-500">Win rate</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 border-t pt-4">
          {/* Home team recent form */}
          <div>
            <h4 className="text-sm font-medium mb-2">{homeTeam.name} Recent Form</h4>
            <div className="flex items-center space-x-1">
              {getLastFiveForm(homeTeam.id).map((result, i) => (
                <div 
                  key={`home-${i}`} 
                  className="w-8 h-8 flex items-center justify-center text-sm rounded-full"
                >
                  {getFormEmoji(result)}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span>Home wins:</span>
                <span className="font-medium">{headToHead[homeTeam.id]?.wins.home || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Away wins:</span>
                <span className="font-medium">{headToHead[homeTeam.id]?.wins.away || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Away team recent form */}
          <div>
            <h4 className="text-sm font-medium mb-2">{awayTeam.name} Recent Form</h4>
            <div className="flex items-center space-x-1">
              {getLastFiveForm(awayTeam.id).map((result, i) => (
                <div 
                  key={`away-${i}`} 
                  className="w-8 h-8 flex items-center justify-center text-sm rounded-full"
                >
                  {getFormEmoji(result)}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span>Home wins:</span>
                <span className="font-medium">{headToHead[awayTeam.id]?.wins.home || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Away wins:</span>
                <span className="font-medium">{headToHead[awayTeam.id]?.wins.away || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricalMatchStats;