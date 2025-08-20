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
    return '#E0E0E0';
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
              <Skeleton key={i} className="h-12 w-full" />
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
    <div className="w-full bg-white">
      {/* View Tabs */}
      <div className="border-b">
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
          <TabsList className="w-full bg-transparent border-0 rounded-none h-12">
            <TabsTrigger 
              value="overall" 
              className="flex-1 bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
            >
              Overall
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
      <div className="space-y-6">
        {allStandings.map((standings, groupIndex) => {
          if (!standings || standings.length === 0) return null;

          return (
            <div key={groupIndex} className="bg-white">
              {/* Group Header */}
              {allStandings.length > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h3 className="text-base font-medium text-gray-800">
                    {standings[0]?.group || `Group ${String.fromCharCode(65 + groupIndex)}`}
                  </h3>
                </div>
              )}

              {/* Standings Table */}
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b bg-gray-50/50">
                      <TableHead className="text-center py-2 px-2 text-xs font-medium text-gray-500 w-8">
                        Pos
                      </TableHead>
                      <TableHead className="text-left py-2 px-3 text-xs font-medium text-gray-500 min-w-[140px]">
                        Team
                      </TableHead>
                      <TableHead className="text-center py-2 px-2 text-xs font-medium text-gray-500 w-8">
                        P
                      </TableHead>
                      <TableHead className="text-center py-2 px-2 text-xs font-medium text-gray-500 w-12">
                        F/A
                      </TableHead>
                      <TableHead className="text-center py-2 px-2 text-xs font-medium text-gray-500 w-10">
                        +/-
                      </TableHead>
                      <TableHead className="text-center py-2 px-2 text-xs font-medium text-gray-900 w-12 font-bold">
                        PTS
                      </TableHead>
                      <TableHead className="text-center py-2 px-2 text-xs font-medium text-gray-500 w-8">
                        W
                      </TableHead>
                      <TableHead className="text-center py-2 px-2 text-xs font-medium text-gray-500 w-8">
                        D
                      </TableHead>
                      <TableHead className="text-center py-2 px-2 text-xs font-medium text-gray-500 w-8">
                        L
                      </TableHead>
                      <TableHead className="text-center py-2 px-2 text-xs font-medium text-gray-500 w-16">
                        Next
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((standing) => {
                      const stats = view === 'overall' ? standing.all : 
                                  view === 'home' ? standing.home : 
                                  view === 'away' ? standing.away : standing.all;

                      return (
                        <TableRow 
                          key={`${groupIndex}-${standing.team.id}`}
                          className="hover:bg-gray-50/50 transition-colors group cursor-pointer border-b border-gray-100"
                        >
                          {/* Position with qualification indicator */}
                          <TableCell className="py-3 px-2 text-center relative">
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-1"
                              style={{ 
                                backgroundColor: getQualificationColor(standing.rank, standing.description)
                              }}
                            />
                            <span 
                              className="font-medium text-sm"
                              style={{
                                color: getQualificationColor(standing.rank, standing.description) !== '#E0E0E0' 
                                  ? getQualificationColor(standing.rank, standing.description) 
                                  : '#374151'
                              }}
                            >
                              {standing.rank}
                            </span>
                          </TableCell>

                          {/* Team */}
                          <TableCell className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {isNationalTeam(standing.team.name) ? (
                                <MyCircularFlag
                                  teamName={standing.team.name}
                                  fallbackUrl={standing.team.logo}
                                  size="20px"
                                  className="flex-shrink-0"
                                />
                              ) : (
                                <LazyImage
                                  src={standing.team.logo}
                                  alt={standing.team.name}
                                  className="w-5 h-5 object-contain rounded flex-shrink-0"
                                  useTeamLogo={true}
                                  teamId={standing.team.id}
                                  teamName={standing.team.name}
                                  style={{ width: '20px', height: '20px' }}
                                />
                              )}
                              <div className="min-w-0">
                                <div className="font-normal text-gray-900 text-sm truncate">
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
                          </TableCell>

                          {/* Stats */}
                          <TableCell className="py-3 px-2 text-center text-sm text-gray-900">{stats.played}</TableCell>
                          <TableCell className="py-3 px-2 text-center text-sm text-gray-900">
                            {stats.goals.for}:{stats.goals.against}
                          </TableCell>
                          <TableCell className="py-3 px-2 text-center text-sm">
                            <span className={`${standing.goalsDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {standing.goalsDiff >= 0 ? '+' : ''}{standing.goalsDiff}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-2 text-center">
                            <span className="font-bold text-sm text-gray-900">
                              {standing.points}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-2 text-center text-sm text-gray-900">{stats.win}</TableCell>
                          <TableCell className="py-3 px-2 text-center text-sm text-gray-900">{stats.draw}</TableCell>
                          <TableCell className="py-3 px-2 text-center text-sm text-gray-900">{stats.lose}</TableCell>

                          {/* Next Match */}
                          <TableCell className="py-3 px-2 text-center">
                            {standing.team.nextMatch && (
                              <div className="flex justify-center">
                                {isNationalTeam(standing.team.nextMatch.name) ? (
                                  <MyCircularFlag
                                    teamName={standing.team.nextMatch.name}
                                    fallbackUrl={standing.team.nextMatch.logo}
                                    size="20px"
                                    className="flex-shrink-0"
                                  />
                                ) : (
                                  <LazyImage
                                    src={standing.team.nextMatch.logo}
                                    alt={standing.team.nextMatch.name}
                                    className="w-5 h-5 object-contain rounded flex-shrink-0"
                                    useTeamLogo={true}
                                    teamId={standing.team.nextMatch.id || standing.team.nextMatch.name}
                                    teamName={standing.team.nextMatch.name}
                                    style={{ width: '20px', height: '20px' }}
                                  />
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyStandingsDetail;