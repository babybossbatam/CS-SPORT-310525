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
    <Card className="w-full h-full">
      <LeagueStatsPanel leagueId={leagueId} season={season} className="border-b rounded-t-lg rounded-b-none" />
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={data.league.logo} 
              alt={data.league.name}
              className="h-8 w-8 object-contain"
            />
            <CardTitle>{data.league.name}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/league/${leagueId}/standings`)}>
            View Full
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overall" className="w-full" onValueChange={(v) => setView(v as any)}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="overall" className="flex-1">Overall</TabsTrigger>
            <TabsTrigger value="home" className="flex-1">Home</TabsTrigger>
            <TabsTrigger value="away" className="flex-1">Away</TabsTrigger>
          </TabsList>

          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">Pos</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">F/A</TableHead>
                  <TableHead className="text-center">+/-</TableHead>
                  <TableHead className="text-center">PTS</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">D</TableHead>
                  <TableHead className="text-center">L</TableHead>
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
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/team/${standing.team.id}`)}
                    >
                      <TableCell className="text-center font-medium">
                        <div className="flex items-center justify-center gap-1">
                          {standing.rank}
                          {standing.rank <= 3 && <Trophy className="h-4 w-4 text-amber-500" />}
                          {standing.description?.toLowerCase().includes('champions') && 
                            <Star className="h-4 w-4 text-blue-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img 
                            src={standing.team.logo} 
                            alt={standing.team.name}
                            className="h-5 w-5 object-contain"
                          />
                          <span className="font-medium">{standing.team.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{stats.played}</TableCell>
                      <TableCell className="text-center">{stats.goals.for}/{stats.goals.against}</TableCell>
                      <TableCell className="text-center">{standing.goalsDiff}</TableCell>
                      <TableCell className="text-center font-bold">{standing.points}</TableCell>
                      <TableCell className="text-center">{stats.win}</TableCell>
                      <TableCell className="text-center">{stats.draw}</TableCell>
                      <TableCell className="text-center">{stats.lose}</TableCell>
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