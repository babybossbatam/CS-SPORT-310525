import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

// Type for match result
interface MatchResult {
  date: string;
  competition: string;
  opponent: string;
  result: 'W' | 'D' | 'L';
  score: string;
  venue: 'H' | 'A';
}

// Type for performance metrics
interface PerformanceMetrics {
  goalsScored: number[];
  goalsConceded: number[];
  possession: number[];
  shotsOnTarget: number[];
  fouls: number[];
  matches: string[];
}

interface TeamPerformanceTimelineProps {
  teamId: number;
  teamName: string;
  teamLogo: string;
  recentMatches?: MatchResult[];
  performanceMetrics?: PerformanceMetrics;
}

const defaultRecentMatches: MatchResult[] = [
  { date: '2025-05-01', competition: 'Premier League', opponent: 'Manchester City', result: 'W', score: '2-1', venue: 'H' },
  { date: '2025-04-24', competition: 'Premier League', opponent: 'Liverpool', result: 'D', score: '2-2', venue: 'A' },
  { date: '2025-04-17', competition: 'Premier League', opponent: 'Chelsea', result: 'L', score: '0-3', venue: 'A' },
  { date: '2025-04-10', competition: 'Premier League', opponent: 'Arsenal', result: 'W', score: '1-0', venue: 'H' },
  { date: '2025-04-03', competition: 'Premier League', opponent: 'Tottenham', result: 'W', score: '3-1', venue: 'H' },
];

const defaultPerformanceMetrics: PerformanceMetrics = {
  goalsScored: [2, 2, 0, 1, 3],
  goalsConceded: [1, 2, 3, 0, 1],
  possession: [52, 45, 38, 55, 60],
  shotsOnTarget: [6, 4, 2, 7, 8],
  fouls: [10, 8, 12, 7, 5],
  matches: ['vs MCI', 'vs LIV', 'vs CHE', 'vs ARS', 'vs TOT']
};

const TeamPerformanceTimeline: React.FC<TeamPerformanceTimelineProps> = ({
  teamId,
  teamName,
  teamLogo,
  recentMatches = defaultRecentMatches,
  performanceMetrics = defaultPerformanceMetrics
}) => {
  const [activeTab, setActiveTab] = useState('form');
  
  // Combine metrics data for charts
  const chartData = performanceMetrics.matches.map((match, idx) => ({
    match,
    goalsScored: performanceMetrics.goalsScored[idx],
    goalsConceded: performanceMetrics.goalsConceded[idx],
    possession: performanceMetrics.possession[idx],
    shotsOnTarget: performanceMetrics.shotsOnTarget[idx],
    fouls: performanceMetrics.fouls[idx]
  }));

  return (
    <Card className="w-full shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <img 
            src={teamLogo} 
            alt={teamName} 
            className="w-6 h-6 mr-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=Team';
            }}
          />
          <CardTitle className="text-lg font-bold">{teamName} Performance</CardTitle>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="form" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4 border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="form">Recent Form</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent>
          {/* Recent Form Tab */}
          <TabsContent value="form" className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">Last {recentMatches.length} Matches</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    W: {recentMatches.filter(m => m.result === 'W').length}
                  </Badge>
                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                    D: {recentMatches.filter(m => m.result === 'D').length}
                  </Badge>
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                    L: {recentMatches.filter(m => m.result === 'L').length}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                {recentMatches.map((match, index) => (
                  <div 
                    key={`${match.date}-${match.opponent}`}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Badge 
                        className={`mr-2 ${
                          match.result === 'W' ? 'bg-green-600' : 
                          match.result === 'D' ? 'bg-gray-400' : 'bg-red-600'
                        }`}
                      >
                        {match.result}
                      </Badge>
                      <div>
                        <div className="text-sm font-medium">{match.opponent}</div>
                        <div className="text-xs text-gray-500">{match.competition} • {match.venue === 'H' ? 'Home' : 'Away'}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold">{match.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Goals Tab */}
          <TabsContent value="goals" className="pt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="match" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="goalsScored" name="Goals Scored" fill="#3b82f6" />
                <Bar dataKey="goalsConceded" name="Goals Conceded" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          {/* Stats Tab */}
          <TabsContent value="stats" className="pt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="match" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="possession" name="Possession %" stroke="#6366f1" />
                <Line type="monotone" dataKey="shotsOnTarget" name="Shots on Target" stroke="#f97316" />
                <Line type="monotone" dataKey="fouls" name="Fouls" stroke="#a855f7" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default TeamPerformanceTimeline;