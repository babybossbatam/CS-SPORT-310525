import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Award, Shield } from 'lucide-react';

interface TeamPerformanceStatsProps {
  teamId: number;
  leagueId?: number;
  season?: number;
}

interface TeamStats {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  form: string; // e.g. "WWDLW"
}

const TeamPerformanceStats: React.FC<TeamPerformanceStatsProps> = ({ 
  teamId,
  leagueId = 39, // Default to Premier League
  season = 2024, // Default to current season
}) => {
  // Fetch team statistics
  const { data, isLoading, error } = useQuery<TeamStats>({
    queryKey: [`/api/teams/${teamId}/statistics`, { leagueId, season }],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-gray-500">
            <p>Unable to load team statistics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = [
    { name: 'Wins', value: data.wins, fill: '#4ade80' },
    { name: 'Draws', value: data.draws, fill: '#facc15' },
    { name: 'Losses', value: data.losses, fill: '#f87171' },
  ];

  // Prepare form display
  const formArray = data.form.split('').map((result) => {
    switch (result) {
      case 'W':
        return { result: 'W', color: 'bg-green-500', icon: <ArrowUpRight className="h-3 w-3" /> };
      case 'D':
        return { result: 'D', color: 'bg-yellow-500', icon: <Minus className="h-3 w-3" /> };
      case 'L':
        return { result: 'L', color: 'bg-red-500', icon: <ArrowDownRight className="h-3 w-3" /> };
      default:
        return { result: '?', color: 'bg-gray-300', icon: null };
    }
  });

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Team Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-green-600 text-xs uppercase font-semibold">Wins</div>
            <div className="text-2xl font-bold mt-1">{data.wins}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-yellow-600 text-xs uppercase font-semibold">Draws</div>
            <div className="text-2xl font-bold mt-1">{data.draws}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-red-600 text-xs uppercase font-semibold">Losses</div>
            <div className="text-2xl font-bold mt-1">{data.losses}</div>
          </div>
        </div>

        {/* Form Guide */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Recent Form</h3>
          <div className="flex space-x-2">
            {formArray.map((item, index) => (
              <div 
                key={index} 
                className={`${item.color} h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm`}
              >
                {item.result}
              </div>
            ))}
          </div>
        </div>

        {/* Goals Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between">
              <div className="text-blue-600 text-xs uppercase font-semibold">Goals Scored</div>
              <Award className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold mt-1">{data.goalsFor}</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="flex justify-between">
              <div className="text-indigo-600 text-xs uppercase font-semibold">Clean Sheets</div>
              <Shield className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold mt-1">{data.cleanSheets}</div>
          </div>
        </div>

        {/* Win/Draw/Loss Chart */}
        <div className="h-40 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceStats;