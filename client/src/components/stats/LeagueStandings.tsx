import React, { useState } from 'react';
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
  nextMatch?: {
    name: string;
    logo: string;
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

interface LeagueStandingsProps {
  leagueId: number;
  season?: number;
}

const LeagueStandings: React.FC<LeagueStandingsProps> = ({ leagueId, season = 2024 }) => {
  const [, navigate] = useLocation();
  const [view, setView] = useState<'overall' | 'home' | 'away'>('overall');

  const data = null;
  const isLoading = false;

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

  if (!data) {
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

  const standings = [];

  return (
    <Card className="w-full h-full">
      <LeagueStatsPanel leagueId={leagueId} season={season} className="border-b rounded-t-lg rounded-b-none" />
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://via.placeholder.com/50" 
              alt="Placeholder League"
              className="h-8 w-8 object-contain"
            />
            <CardTitle>Placeholder League</CardTitle>
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

          <div className="w-full max-w-full">
            <Table className="w-full -ml-6">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">Pos</TableHead>
                  <TableHead className="pl-8">Team</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">F/A</TableHead>
                  <TableHead className="text-center">+/-</TableHead>
                  <TableHead className="text-center">PTS</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">D</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">Form</TableHead>
                  <TableHead className="text-center">Next</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((standing, index) => {
                  const stats = {played: 0, goals: {for: 0, against: 0}, win: 0, draw: 0, lose: 0};

                  return (
                    <TableRow 
                      key={index}
                      className="hover:bg-gray-50/50 transition-colors relative cursor-pointer"
                      onClick={() => navigate(`/team/1`)}
                    >
                      <TableCell 
                        className="relative pl-3 font-medium"
                      >
                        <span
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{
                            backgroundColor: '#9E9E9E'
                          }}
                        />
                        <span
                          style={{
                            color: '#9E9E9E'
                          }}
                        >
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[180px] pl-2">
                        <div className="flex items-center gap-2">
                          <img 
                            src="https://via.placeholder.com/30" 
                            alt="Placeholder Team"
                            className="h-5 w-5 object-contain"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">Placeholder Team</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{stats.played}</TableCell>
                      <TableCell className="text-center">{stats.goals.for}/{stats.goals.against}</TableCell>
                      <TableCell className="text-center">0</TableCell>
                      <TableCell className="text-center font-bold">0</TableCell>
                      <TableCell className="text-center">{stats.win}</TableCell>
                      <TableCell className="text-center">{stats.draw}</TableCell>
                      <TableCell className="text-center">{stats.lose}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <img 
                            src="https://via.placeholder.com/30" 
                            alt="Placeholder Team"
                            className="w-6 h-6 inline-block"
                          />
                      </TableCell>
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

export { LeagueStandings };
export default LeagueStandings;