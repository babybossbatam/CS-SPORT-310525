import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';

// Types
interface HeadToHeadStats {
  totalMatches: number;
  homeTeamWins: number;
  draws: number;
  awayTeamWins: number;
  homeTeamGoals: number;
  awayTeamGoals: number;
  lastFiveResults: ('H' | 'D' | 'A')[];
}

interface HistoricalMatchStatsProps {
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  headToHead?: HeadToHeadStats;
}

// Default data if none provided
const defaultHeadToHead: HeadToHeadStats = {
  totalMatches: 15,
  homeTeamWins: 6,
  draws: 4,
  awayTeamWins: 5,
  homeTeamGoals: 20,
  awayTeamGoals: 18,
  lastFiveResults: ['H', 'A', 'D', 'H', 'A']
};

// Component
const HistoricalMatchStats: React.FC<HistoricalMatchStatsProps> = ({
  homeTeam,
  awayTeam,
  headToHead = defaultHeadToHead
}) => {
  // Prepare data for pie chart
  const pieData = [
    { name: `${homeTeam.name} Wins`, value: headToHead.homeTeamWins, color: '#3b82f6' },
    { name: 'Draws', value: headToHead.draws, color: '#6b7280' },
    { name: `${awayTeam.name} Wins`, value: headToHead.awayTeamWins, color: '#ef4444' }
  ];
  
  // Colors and styles for result indicators
  const resultColors = {
    'H': 'bg-blue-500',
    'D': 'bg-gray-500',
    'A': 'bg-red-500'
  };
  
  const resultLabels = {
    'H': homeTeam.name,
    'D': 'Draw',
    'A': awayTeam.name
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Head to Head History</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img 
              src={homeTeam.logo} 
              alt={homeTeam.name} 
              className="w-8 h-8"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
              }}
            />
            <span className="ml-2 font-semibold">{homeTeam.name}</span>
          </div>
          
          <div className="text-lg font-bold">vs</div>
          
          <div className="flex items-center">
            <span className="mr-2 font-semibold">{awayTeam.name}</span>
            <img 
              src={awayTeam.logo} 
              alt={awayTeam.name} 
              className="w-8 h-8"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Team';
              }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Statistics */}
          <div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Matches</p>
                <p className="text-2xl font-bold">{headToHead.totalMatches}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{homeTeam.name}</p>
                  <p className="text-xl font-bold text-blue-600">{headToHead.homeTeamWins}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Draws</p>
                  <p className="text-xl font-bold text-gray-600">{headToHead.draws}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{awayTeam.name}</p>
                  <p className="text-xl font-bold text-red-600">{headToHead.awayTeamWins}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Goals Scored</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">{headToHead.homeTeamGoals}</span>
                  <span className="text-sm text-gray-500">vs</span>
                  <span className="text-lg font-bold text-red-600">{headToHead.awayTeamGoals}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Last 5 Meetings</p>
                <div className="flex space-x-2 mt-1">
                  {headToHead.lastFiveResults.map((result, idx) => (
                    <div 
                      key={idx} 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${resultColors[result]}`}
                      title={resultLabels[result]}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-60 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <h3 className="text-sm font-medium mb-2">Recent Matches</h3>
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 text-gray-500 font-medium">
              <div>Date</div>
              <div className="text-center">Competition</div>
              <div className="text-right">Result</div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
              <div>2024-12-10</div>
              <div className="text-center">Premier League</div>
              <div className="text-right font-medium">{homeTeam.name} 2-1 {awayTeam.name}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
              <div>2024-05-15</div>
              <div className="text-center">FA Cup</div>
              <div className="text-right font-medium">{awayTeam.name} 3-0 {homeTeam.name}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
              <div>2023-11-28</div>
              <div className="text-center">Premier League</div>
              <div className="text-right font-medium">{homeTeam.name} 1-1 {awayTeam.name}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricalMatchStats;