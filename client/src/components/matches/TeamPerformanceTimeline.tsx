import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamInfo {
  id: number;
  name: string;
  logo: string;
}

interface PerformanceData {
  date: string;
  opponent: string;
  result: 'W' | 'D' | 'L';
  score: string;
  isHome: boolean;
}

interface TeamPerformanceTimelineProps {
  team: TeamInfo;
  performances?: PerformanceData[];
}

const TeamPerformanceTimeline: React.FC<TeamPerformanceTimelineProps> = ({
  team,
  performances = [
    // Sample data - in a real app this would come from API
    { date: '2025-04-25', opponent: 'Chelsea', result: 'W', score: '2-1', isHome: true },
    { date: '2025-04-18', opponent: 'Crystal Palace', result: 'D', score: '0-0', isHome: false },
    { date: '2025-04-12', opponent: 'Manchester City', result: 'L', score: '0-3', isHome: true },
    { date: '2025-04-05', opponent: 'Aston Villa', result: 'W', score: '2-0', isHome: false },
    { date: '2025-03-29', opponent: 'Liverpool', result: 'D', score: '1-1', isHome: true }
  ]
}) => {
  // Get a color for the result
  const getResultColor = (result: string) => {
    switch(result) {
      case 'W': return 'bg-green-500';
      case 'D': return 'bg-yellow-500';
      case 'L': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          {team.name} Recent Performance
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">
                  Recent match results for {team.name}, showing their performance over the last 5 games.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pt-1 pb-3">
          {/* Team logo */}
          <div className="flex items-center mb-4">
            <img 
              src={team.logo} 
              alt={team.name} 
              className="w-10 h-10 mr-3"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Team';
              }}
            />
            <div>
              <div className="font-medium">{team.name}</div>
              <div className="text-xs text-gray-500">Last 5 matches</div>
            </div>
          </div>
          
          {/* Performance Timeline */}
          <div className="space-y-4">
            {performances.map((perf, index) => (
              <div key={index} className="relative flex">
                {/* Timeline connector */}
                {index < performances.length - 1 && (
                  <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200"></div>
                )}
                
                {/* Result indicator */}
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white font-bold text-xs z-10 ${getResultColor(perf.result)}`}>
                  {perf.result}
                </div>
                
                {/* Match details */}
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">
                        vs {perf.opponent} {perf.isHome ? '(Home)' : '(Away)'}
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(perf.date)}</div>
                    </div>
                    <div className="text-sm font-semibold">{perf.score}</div>
                  </div>
                  
                  {/* Divider */}
                  {index < performances.length - 1 && (
                    <div className="pt-3"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Performance Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl font-bold text-green-600">
                  {performances.filter(p => p.result === 'W').length}
                </div>
                <div className="text-xs text-gray-500">Wins</div>
              </div>
              <div>
                <div className="text-xl font-bold text-yellow-600">
                  {performances.filter(p => p.result === 'D').length}
                </div>
                <div className="text-xs text-gray-500">Draws</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">
                  {performances.filter(p => p.result === 'L').length}
                </div>
                <div className="text-xs text-gray-500">Losses</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceTimeline;