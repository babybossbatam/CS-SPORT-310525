import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import LeagueStatsPanel from './LeagueStatsPanel';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Star, ChevronRight } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';

interface Team {
  id: number;
  name: string;
  logo: string;
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

interface LeagueStandingsProps {
  leagueId: number;
  season?: number;
}

const LeagueStandings: React.FC<LeagueStandingsProps> = ({ leagueId, season = 2024 }) => {
  const [, navigate] = useLocation();
  const [view, setView] = useState<'overall' | 'home' | 'away'>('overall');

  const { data, isLoading } = useQuery<StandingsResponse>({
    queryKey: [`/api/leagues/${leagueId}/standings`, { season }],
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.league?.standings?.[0]) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-gray-500">
            <p>No standings data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const standings = data.league.standings[0];

  return (
    <Card className="w-full h-full bg-white shadow-md">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-3">
            <img 
              src={data.league.logo} 
              alt={data.league.name}
              className="h-6 w-6 object-contain"
            />
            <CardTitle className="text-lg font-bold">{data.league.name}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/league/${leagueId}/standings`)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Full Table
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <Tabs defaultValue="overall" className="w-full" onValueChange={(v) => setView(v as any)}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="overall" className="flex-1">Overall</TabsTrigger>
            <TabsTrigger value="home" className="flex-1">Home</TabsTrigger>
            <TabsTrigger value="away" className="flex-1">Away</TabsTrigger>
          </TabsList>

          <div className="w-full">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b text-gray-500 text-xs">
                  <TableHead className="w-8 px-1 py-2 text-center font-medium">#</TableHead>
                  <TableHead className="px-2 py-2 text-left font-medium">Team</TableHead>
                  <TableHead className="w-8 px-1 py-2 text-center font-medium">P</TableHead>
                  <TableHead className="w-12 px-1 py-2 text-center font-medium">GD</TableHead>
                  <TableHead className="w-10 px-1 py-2 text-center font-medium">PTS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.slice(0, 24).map((standing) => {
                  const stats = view === 'overall' ? standing.all : 
                              view === 'home' ? standing.home : 
                              view === 'away' ? standing.away : null;

                  return (
                    <TableRow 
                      key={standing.team.id}
                      className="cursor-pointer hover:bg-gray-50 border-b last:border-0"
                      onClick={() => navigate(`/team/${standing.team.id}`)}
                    >
                      <TableCell className="px-1 py-2 text-center text-sm">
                        <span className={`
                          ${standing.rank <= 4 ? 'text-green-600' : ''}
                          ${standing.rank >= 18 ? 'text-red-600' : ''}
                        `}>
                          {standing.rank}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <img 
                            src={standing.team.logo} 
                            alt={standing.team.name}
                            className="h-4 w-4 object-contain"
                          />
                          <span className="text-sm truncate">{standing.team.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-1 py-2 text-center text-sm">{stats.played}</TableCell>
                      <TableCell className="px-1 py-2 text-center text-sm">{standing.goalsDiff}</TableCell>
                      <TableCell className="px-1 py-2 text-center text-sm font-bold">{standing.points}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LeagueStandings;