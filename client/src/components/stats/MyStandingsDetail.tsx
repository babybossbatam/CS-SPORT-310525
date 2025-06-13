
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MyCircularFlag from '@/components/common/MyCircularFlag';
import { isNationalTeam } from '@/lib/teamLogoSources';

interface Team {
  id: number;
  name: string;
  logo: string;
  nextMatch?: {
    name: string;
    logo: string;
    date: string;
    venue?: string;
  }
}

interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    }
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    }
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    }
  };
}

interface StandingsResponse {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    standings: Standing[][];
  };
}

interface MyStandingsDetailProps {
  leagueId: number;
  season?: number;
}

const MyStandingsDetail: React.FC<MyStandingsDetailProps> = ({ leagueId, season = 2024 }) => {
  const [view, setView] = useState<'overall' | 'home' | 'away'>('overall');

  const { data, isLoading, error } = useQuery({
    queryKey: ['league-standings-detail', leagueId, season],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/leagues/${leagueId}/standings`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
      } catch (err) {
        console.error('Error fetching standings:', err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    enabled: !!leagueId,
  });

  const getQualificationColor = (rank: number, description?: string) => {
    if (description?.toLowerCase().includes('world cup') || description?.toLowerCase().includes('promotion')) {
      return '#4CAF50'; // Green for World Cup qualification
    }
    if (description?.toLowerCase().includes('playoff')) {
      return '#FF9800'; // Orange for playoffs
    }
    if (rank <= 2) return '#4CAF50'; // Green for top 2
    if (rank <= 6) return '#2196F3'; // Blue for European spots
    return 'transparent';
  };

  const getPositionIcon = (rank: number, description?: string) => {
    if (description?.toLowerCase().includes('world cup') || description?.toLowerCase().includes('promotion')) {
      return '↗️';
    }
    if (description?.toLowerCase().includes('playoff')) {
      return '⚪';
    }
    return '';
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.league?.standings || data.league.standings.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-gray-500">
            <p>No standings data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allStandings = data.league.standings;

  return (
    <div className="w-full max-w-6xl mx-auto bg-white">
      {/* League Header */}
      <div className="flex items-center gap-4 p-6 border-b bg-gray-50">
        <img 
          src={data.league.logo} 
          alt={data.league.name}
          className="w-12 h-12 object-contain"
        />
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.league.name}</h1>
          <p className="text-sm text-gray-600">{data.league.country} • Season {data.league.season}</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b">
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
          <TabsList className="w-full bg-transparent border-0 rounded-none h-12">
            <TabsTrigger 
              value="overall" 
              className="flex-1 bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="home" 
              className="flex-1 bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
            >
              Home
            </TabsTrigger>
            <TabsTrigger 
              value="away" 
              className="flex-1 bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
            >
              Away
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Groups Container */}
      <div className="space-y-8">
        {allStandings.map((standings, groupIndex) => {
          if (!standings || standings.length === 0) return null;
          
          return (
            <div key={groupIndex} className="bg-white">
              {/* Group Header */}
              {allStandings.length > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {standings[0]?.group || `Group ${String.fromCharCode(65 + groupIndex)}`}
                  </h2>
                </div>
              )}
              
              {/* Standings Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        Pos
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                        Team
                      </th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        P
                      </th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        F/A
                      </th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        +/-
                      </th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-900 uppercase tracking-wider w-16 font-bold">
                        PTS
                      </th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        W
                      </th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        D
                      </th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        L
                      </th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Form
                      </th>
                      <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Next
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {standings.map((standing) => {
                      const stats = view === 'overall' ? standing.all : 
                                  view === 'home' ? standing.home : 
                                  view === 'away' ? standing.away : standing.all;

                      return (
                        <tr 
                          key={`${groupIndex}-${standing.team.id}`}
                          className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                        >
                          {/* Position */}
                          <td className="py-4 px-4 relative">
                            <div className="flex items-center gap-2">
                              {/* Qualification indicator */}
                              <div 
                                className="w-1 h-8 rounded-r"
                                style={{ 
                                  backgroundColor: getQualificationColor(standing.rank, standing.description)
                                }}
                              />
                              <span 
                                className="font-semibold text-sm"
                                style={{
                                  color: getQualificationColor(standing.rank, standing.description) !== 'transparent' 
                                    ? getQualificationColor(standing.rank, standing.description) 
                                    : '#374151'
                                }}
                              >
                                {standing.rank}
                              </span>
                              <span className="text-xs">
                                {getPositionIcon(standing.rank, standing.description)}
                              </span>
                            </div>
                          </td>

                          {/* Team */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {isNationalTeam(standing.team.name) ? (
                                <MyCircularFlag
                                  teamName={standing.team.name}
                                  fallbackUrl={standing.team.logo}
                                  size="32px"
                                  className="flex-shrink-0"
                                  showNextMatchOverlay={!!standing.team.nextMatch}
                                  nextMatchInfo={standing.team.nextMatch ? {
                                    opponent: standing.team.nextMatch.name,
                                    date: standing.team.nextMatch.date,
                                    venue: standing.team.nextMatch.venue
                                  } : undefined}
                                />
                              ) : (
                                <img
                                  src={standing.team.logo}
                                  alt={standing.team.name}
                                  className="w-8 h-8 object-contain rounded flex-shrink-0"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes("/assets/fallback-logo.svg")) {
                                      target.src = "/assets/fallback-logo.svg";
                                    }
                                  }}
                                />
                              )}
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 text-sm truncate">
                                  {standing.team.name}
                                </div>
                                {standing.description && (
                                  <div 
                                    className="text-xs mt-0.5 truncate"
                                    style={{
                                      color: getQualificationColor(standing.rank, standing.description)
                                    }}
                                  >
                                    {standing.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Stats */}
                          <td className="py-4 px-2 text-center text-sm text-gray-900">{stats.played}</td>
                          <td className="py-4 px-2 text-center text-sm text-gray-900">
                            {stats.goals.for}:{stats.goals.against}
                          </td>
                          <td className="py-4 px-2 text-center text-sm">
                            <span className={`${standing.goalsDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {standing.goalsDiff >= 0 ? '+' : ''}{standing.goalsDiff}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <span className="font-bold text-sm text-gray-900">
                              {standing.points}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-center text-sm text-gray-900">{stats.win}</td>
                          <td className="py-4 px-2 text-center text-sm text-gray-900">{stats.draw}</td>
                          <td className="py-4 px-2 text-center text-sm text-gray-900">{stats.lose}</td>

                          {/* Form */}
                          <td className="py-4 px-2">
                            <div className="flex gap-0.5 justify-center">
                              {standing.form?.split('').slice(0, 5).map((result, i) => (
                                <div
                                  key={i}
                                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-white ${
                                    result === 'W' ? 'bg-green-500' :
                                    result === 'D' ? 'bg-gray-400' :
                                    'bg-red-500'
                                  }`}
                                >
                                  {result}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Next Match */}
                          <td className="py-4 px-2 text-center">
                            {standing.team.nextMatch && (
                              <div className="flex justify-center">
                                {isNationalTeam(standing.team.nextMatch.name) ? (
                                  <MyCircularFlag
                                    teamName={standing.team.nextMatch.name}
                                    fallbackUrl={standing.team.nextMatch.logo}
                                    size="24px"
                                    className="flex-shrink-0"
                                  />
                                ) : (
                                  <img
                                    src={standing.team.nextMatch.logo}
                                    alt={standing.team.nextMatch.name}
                                    className="w-6 h-6 object-contain rounded flex-shrink-0"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (!target.src.includes("/assets/fallback-logo.svg")) {
                                        target.src = "/assets/fallback-logo.svg";
                                      }
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-6 bg-gray-50 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">World Cup Qualification</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-600">Playoff</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">European Competition</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStandingsDetail;
