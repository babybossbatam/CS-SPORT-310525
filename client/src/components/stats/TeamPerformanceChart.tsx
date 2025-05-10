import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, TrendingUp, Activity, Target, BarChart3, PieChart } from 'lucide-react';
import { getTeamColor } from '@/lib/colorUtils';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
}

interface PerformanceData {
  matches: MatchPerformance[];
  statistics: TeamStatistics;
  league: League;
}

interface MatchPerformance {
  gameweek: number;
  date: string;
  opponent: string;
  result: 'W' | 'L' | 'D';
  scoreFor: number;
  scoreAgainst: number;
  xG: number;
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
}

interface TeamStatistics {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  possession: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
}

type ChartType = 'form' | 'goals' | 'defense' | 'advanced' | 'comparison';
type TimeRange = 'last5' | 'last10' | 'season';

interface TeamPerformanceChartProps {
  teamId: number;
  compareTeamId?: number;
  defaultChartType?: ChartType;
  defaultTimeRange?: TimeRange;
}

// Sample data generator function for demo purposes
const generateSampleData = (teamId: number, timeRange: TimeRange): PerformanceData => {
  const matches = [];
  const matchCount = timeRange === 'last5' ? 5 : timeRange === 'last10' ? 10 : 20;
  
  // Generate random match data
  for (let i = 1; i <= matchCount; i++) {
    const result = Math.random() > 0.6 ? 'W' : Math.random() > 0.5 ? 'D' : 'L';
    const scoreFor = result === 'W' ? Math.floor(Math.random() * 3) + 1 : result === 'D' ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2);
    const scoreAgainst = result === 'W' ? Math.floor(Math.random() * 1) : result === 'D' ? scoreFor : scoreFor + Math.floor(Math.random() * 2) + 1;
    
    matches.push({
      gameweek: i,
      date: new Date(2024, 0, i + 1).toISOString(),
      opponent: `Opponent ${i}`,
      result,
      scoreFor,
      scoreAgainst,
      xG: parseFloat((Math.random() * 3).toFixed(1)),
      possession: Math.floor(Math.random() * 30) + 40,
      shots: Math.floor(Math.random() * 15) + 5,
      shotsOnTarget: Math.floor(Math.random() * 8) + 2,
      corners: Math.floor(Math.random() * 8) + 1,
      fouls: Math.floor(Math.random() * 10) + 5
    });
  }
  
  // Calculate team statistics from matches
  const wins = matches.filter(m => m.result === 'W').length;
  const draws = matches.filter(m => m.result === 'D').length;
  const losses = matches.filter(m => m.result === 'L').length;
  const goalsFor = matches.reduce((sum, m) => sum + m.scoreFor, 0);
  const goalsAgainst = matches.reduce((sum, m) => sum + m.scoreAgainst, 0);
  const cleanSheets = matches.filter(m => m.scoreAgainst === 0).length;
  
  const statistics: TeamStatistics = {
    played: matches.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    cleanSheets,
    yellowCards: Math.floor(Math.random() * 30) + 10,
    redCards: Math.floor(Math.random() * 3),
    possession: parseFloat((matches.reduce((sum, m) => sum + m.possession, 0) / matches.length).toFixed(1)),
    passAccuracy: Math.floor(Math.random() * 20) + 70,
    tackles: Math.floor(Math.random() * 200) + 100,
    interceptions: Math.floor(Math.random() * 150) + 50
  };
  
  return {
    matches,
    statistics,
    league: {
      id: 1,
      name: 'Sample League',
      country: 'Sample Country',
      logo: 'https://via.placeholder.com/20'
    }
  };
};

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({
  teamId,
  compareTeamId,
  defaultChartType = 'form',
  defaultTimeRange = 'last5'
}) => {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [team, setTeam] = useState<Team | null>(null);
  const [compareTeam, setCompareTeam] = useState<Team | null>(null);
  
  // Fetch team information
  const { data: teamInfo } = useQuery<Team>({
    queryKey: [`/api/teams/${teamId}`],
    // We'll fallback to mock data for demo
    select: (data) => data || { id: teamId, name: `Team ${teamId}`, logo: 'https://via.placeholder.com/40' }
  });
  
  // Fetch compare team information if provided
  const { data: compareTeamInfo } = useQuery<Team>({
    queryKey: [`/api/teams/${compareTeamId}`],
    enabled: !!compareTeamId,
    // We'll fallback to mock data for demo
    select: (data) => data || (compareTeamId ? { id: compareTeamId, name: `Team ${compareTeamId}`, logo: 'https://via.placeholder.com/40' } : null)
  });
  
  // Fetch team performance data
  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery<PerformanceData>({
    queryKey: [`/api/teams/${teamId}/performance`, timeRange],
    // We'll use sample data for demo
    queryFn: () => Promise.resolve(generateSampleData(teamId, timeRange))
  });
  
  // Fetch compare team performance data if provided
  const { data: comparePerformanceData, isLoading: isLoadingComparePerformance } = useQuery<PerformanceData>({
    queryKey: [`/api/teams/${compareTeamId}/performance`, timeRange],
    enabled: !!compareTeamId,
    // We'll use sample data for demo
    queryFn: () => compareTeamId ? Promise.resolve(generateSampleData(compareTeamId, timeRange)) : Promise.resolve(null)
  });
  
  useEffect(() => {
    if (teamInfo) {
      setTeam(teamInfo);
    }
    if (compareTeamInfo) {
      setCompareTeam(compareTeamInfo);
    }
  }, [teamInfo, compareTeamInfo]);
  
  // Calculate team colors
  const teamColor = team ? getTeamColor(team.name) : '#4f46e5';
  const compareTeamColor = compareTeam ? getTeamColor(compareTeam.name) : '#ef4444';
  
  // Format data for form chart (results over time)
  const getFormChartData = () => {
    if (!performanceData) return [];
    
    return performanceData.matches.map((match, index) => {
      const points = match.result === 'W' ? 3 : match.result === 'D' ? 1 : 0;
      
      // Calculate running points total
      let runningTotal = 0;
      for (let i = 0; i <= index; i++) {
        runningTotal += performanceData.matches[i].result === 'W' ? 3 : performanceData.matches[i].result === 'D' ? 1 : 0;
      }
      
      return {
        gameweek: match.gameweek,
        result: match.result,
        points,
        runningTotal,
        opponent: match.opponent,
        scoreFor: match.scoreFor,
        scoreAgainst: match.scoreAgainst,
      };
    });
  };
  
  // Format data for goals chart
  const getGoalsChartData = () => {
    if (!performanceData) return [];
    
    return performanceData.matches.map(match => ({
      gameweek: match.gameweek,
      goalsFor: match.scoreFor,
      goalsAgainst: match.scoreAgainst,
      goalDifference: match.scoreFor - match.scoreAgainst,
      xG: match.xG,
      opponent: match.opponent,
    }));
  };
  
  // Format data for defensive chart
  const getDefenseChartData = () => {
    if (!performanceData) return [];
    
    return performanceData.matches.map(match => ({
      gameweek: match.gameweek,
      goalsAgainst: match.scoreAgainst,
      shotsAgainst: match.shots, // This would be opponent shots in real data
      tackles: Math.floor(Math.random() * 20) + 10, // Sample data
      interceptions: Math.floor(Math.random() * 15) + 5, // Sample data
      cleanSheet: match.scoreAgainst === 0 ? 1 : 0,
      opponent: match.opponent,
    }));
  };
  
  // Format data for advanced stats chart
  const getAdvancedChartData = () => {
    if (!performanceData) return [];
    
    return [
      { name: 'Possession', value: performanceData.statistics.possession },
      { name: 'Pass Accuracy', value: performanceData.statistics.passAccuracy },
      { name: 'Goals per Game', value: performanceData.statistics.goalsFor / performanceData.statistics.played },
      { name: 'Clean Sheets %', value: (performanceData.statistics.cleanSheets / performanceData.statistics.played) * 100 },
      { name: 'Tackles per Game', value: performanceData.statistics.tackles / performanceData.statistics.played },
      { name: 'Win Rate', value: (performanceData.statistics.wins / performanceData.statistics.played) * 100 },
    ];
  };
  
  // Format data for comparison chart
  const getComparisonChartData = () => {
    if (!performanceData || !comparePerformanceData) return [];
    
    return [
      {
        stat: 'Possession (%)',
        [team?.name || 'Team A']: performanceData.statistics.possession,
        [compareTeam?.name || 'Team B']: comparePerformanceData.statistics.possession,
      },
      {
        stat: 'Pass Accuracy (%)',
        [team?.name || 'Team A']: performanceData.statistics.passAccuracy,
        [compareTeam?.name || 'Team B']: comparePerformanceData.statistics.passAccuracy,
      },
      {
        stat: 'Goals per Game',
        [team?.name || 'Team A']: parseFloat((performanceData.statistics.goalsFor / performanceData.statistics.played).toFixed(1)),
        [compareTeam?.name || 'Team B']: parseFloat((comparePerformanceData.statistics.goalsFor / comparePerformanceData.statistics.played).toFixed(1)),
      },
      {
        stat: 'Clean Sheets (%)',
        [team?.name || 'Team A']: parseFloat(((performanceData.statistics.cleanSheets / performanceData.statistics.played) * 100).toFixed(1)),
        [compareTeam?.name || 'Team B']: parseFloat(((comparePerformanceData.statistics.cleanSheets / comparePerformanceData.statistics.played) * 100).toFixed(1)),
      },
      {
        stat: 'Tackles per Game',
        [team?.name || 'Team A']: parseFloat((performanceData.statistics.tackles / performanceData.statistics.played).toFixed(1)),
        [compareTeam?.name || 'Team B']: parseFloat((comparePerformanceData.statistics.tackles / comparePerformanceData.statistics.played).toFixed(1)),
      },
      {
        stat: 'Win Rate (%)',
        [team?.name || 'Team A']: parseFloat(((performanceData.statistics.wins / performanceData.statistics.played) * 100).toFixed(1)),
        [compareTeam?.name || 'Team B']: parseFloat(((comparePerformanceData.statistics.wins / comparePerformanceData.statistics.played) * 100).toFixed(1)),
      },
    ];
  };
  
  // Get the appropriate chart based on type
  const renderChart = () => {
    if (!performanceData) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading team performance data...</div>
        </div>
      );
    }
    
    switch (chartType) {
      case 'form':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={getFormChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="gameweek" 
                label={{ value: 'Gameweek', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                label={{ value: 'Points', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow-sm">
                        <p className="text-sm font-medium">Gameweek {label} vs {data.opponent}</p>
                        <p className="text-xs">{data.scoreFor} - {data.scoreAgainst} ({data.result})</p>
                        <p className="text-xs font-medium">Match Points: {data.points}</p>
                        <p className="text-xs font-medium">Total Points: {data.runningTotal}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="runningTotal" 
                name="Points Total" 
                stroke={teamColor} 
                activeDot={{ r: 8 }} 
                strokeWidth={2} 
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'goals':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={getGoalsChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="gameweek" />
              <YAxis />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow-sm">
                        <p className="text-sm font-medium">Gameweek {label} vs {data.opponent}</p>
                        <p className="text-xs">Goals For: {data.goalsFor}</p>
                        <p className="text-xs">Goals Against: {data.goalsAgainst}</p>
                        <p className="text-xs">xG: {data.xG}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="goalsFor" name="Goals For" fill={teamColor} />
              <Bar dataKey="goalsAgainst" name="Goals Against" fill="#ef4444" />
              <Line type="monotone" dataKey="xG" name="Expected Goals (xG)" stroke="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'defense':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={getDefenseChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="gameweek" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tackles"
                name="Tackles"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="interceptions"
                name="Interceptions"
                stroke="#82ca9d"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="goalsAgainst"
                name="Goals Against"
                stroke="#ff7300"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cleanSheet"
                name="Clean Sheet"
                stroke="#4caf50"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'advanced':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getAdvancedChartData()}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name={team?.name || 'Team Performance'}
                dataKey="value"
                stroke={teamColor}
                fill={teamColor}
                fillOpacity={0.6}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
      
      case 'comparison':
        if (!compareTeam || !comparePerformanceData) {
          return (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500">Select a team to compare with</p>
            </div>
          );
        }
        
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={getComparisonChartData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stat" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={team?.name || 'Team A'}
                name={team?.name || 'Team A'}
                fill={teamColor}
                animationDuration={1000}
              />
              <Bar
                dataKey={compareTeam?.name || 'Team B'}
                name={compareTeam?.name || 'Team B'}
                fill={compareTeamColor}
                animationDuration={1000}
                animationBegin={300}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Select a chart type</p>
          </div>
        );
    }
  };
  
  // Render summary statistics
  const renderSummaryStats = () => {
    if (!performanceData) return null;
    
    const { statistics } = performanceData;
    
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <div className="bg-gray-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Played</p>
          <p className="text-xl font-bold">{statistics.played}</p>
        </div>
        <div className="bg-green-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Wins</p>
          <p className="text-xl font-bold text-green-600">{statistics.wins}</p>
        </div>
        <div className="bg-blue-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Draws</p>
          <p className="text-xl font-bold text-blue-600">{statistics.draws}</p>
        </div>
        <div className="bg-red-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Losses</p>
          <p className="text-xl font-bold text-red-600">{statistics.losses}</p>
        </div>
        <div className="bg-indigo-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Goals For</p>
          <p className="text-xl font-bold text-indigo-600">{statistics.goalsFor}</p>
        </div>
        <div className="bg-purple-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Goals Against</p>
          <p className="text-xl font-bold text-purple-600">{statistics.goalsAgainst}</p>
        </div>
        <div className="bg-yellow-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Clean Sheets</p>
          <p className="text-xl font-bold text-yellow-600">{statistics.cleanSheets}</p>
        </div>
        <div className="bg-green-50 p-2 rounded-md text-center">
          <p className="text-xs text-gray-500">Points</p>
          <p className="text-xl font-bold text-green-600">{statistics.wins * 3 + statistics.draws}</p>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          Team Performance
        </CardTitle>
        
        <div className="flex items-center space-x-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last5">Last 5 Matches</SelectItem>
              <SelectItem value="last10">Last 10 Matches</SelectItem>
              <SelectItem value="season">Full Season</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Team header with logo and name */}
        <div className="flex items-center space-x-4 mb-4">
          {team && (
            <div className="flex items-center">
              <img src={team.logo} alt={team.name} className="h-8 w-8 mr-2" />
              <span className="font-semibold">{team.name}</span>
            </div>
          )}
          
          {compareTeam && (
            <>
              <span className="text-gray-400">vs</span>
              <div className="flex items-center">
                <img src={compareTeam.logo} alt={compareTeam.name} className="h-8 w-8 mr-2" />
                <span className="font-semibold">{compareTeam.name}</span>
              </div>
            </>
          )}
        </div>
        
        {/* Summary statistics */}
        {performanceData && renderSummaryStats()}
        
        {/* Chart tabs */}
        <Tabs defaultValue={chartType} className="w-full mt-4">
          <TabsList className="w-full mb-4 grid grid-cols-5">
            <TabsTrigger
              value="form"
              onClick={() => setChartType('form')}
              className="flex items-center"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Form</span>
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              onClick={() => setChartType('goals')}
              className="flex items-center"
            >
              <Trophy className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger
              value="defense"
              onClick={() => setChartType('defense')}
              className="flex items-center"
            >
              <Target className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Defense</span>
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              onClick={() => setChartType('advanced')}
              className="flex items-center"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
            <TabsTrigger
              value="comparison"
              onClick={() => setChartType('comparison')}
              className="flex items-center"
            >
              <PieChart className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="border rounded-md p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={chartType}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderChart()}
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceChart;