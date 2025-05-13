import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import StatsPanel from './StatsPanel';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, TrendingDown, Star, ChevronRight, Info } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const getStatusIcon = (rank: number, status: string, description: string) => {
  if (status === 'up') {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  } else if (status === 'down') {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  } else if (rank <= 3) {
    return <Trophy className="h-4 w-4 text-amber-500" />;
  } else if (description?.toLowerCase().includes('champions league')) {
    return <Star className="h-4 w-4 text-blue-500" />;
  } else if (description?.toLowerCase().includes('europa')) {
    return <Star className="h-4 w-4 text-orange-500" />;
  } else if (description?.toLowerCase().includes('relegation')) {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  
  return null;
};

interface LeagueStandingsProps {
  leagueId: number;
  season?: number;
}

const LeagueStandings: React.FC<LeagueStandingsProps> = ({ 
  leagueId, 
  season = 2024  // Default to current season
}) => {
  const [, navigate] = useLocation();
  const [view, setView] = useState<'all' | 'home' | 'away'>('all');
  
  const { data, isLoading, error } = useQuery<StandingsResponse>({
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

  if (error || !data || !data.league.standings || data.league.standings.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-gray-500">
            <p>Unable to load standings data for this league.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const standings = data.league.standings[0]; // Get first group (most leagues only have one)

  return (
    <Card className="w-full h-full">
      {/* Stats Section */}
      <div className="p-4 border-b border-neutral-200">
        <StatsPanel leagueId={leagueId} season={season} />
      </div>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={data.league.logo}
              alt={data.league.name}
              className="h-8 w-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=L';
              }}
            />
            <CardTitle>{data.league.name} Standings</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/league/${leagueId}/standings`)}>
            View Full
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setView(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="away">Away</TabsTrigger>
          </TabsList>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">GD</TableHead>
                <TableHead className="text-center">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.slice(0, 10).map((standing) => {
                const viewData = view === 'all' ? standing.all : view === 'home' ? standing.home : standing.away;
                
                return (
                  <TableRow 
                    key={standing.team.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/team/${standing.team.id}`)}
                  >
                    <TableCell className="relative">
                      <div className="flex justify-center items-center">
                        <div 
                          className={`absolute left-0 top-0 h-full w-1 ${
                            standing.rank <= 4 ? 'bg-blue-500' : 
                            standing.rank <= 6 ? 'bg-green-500' : 
                            standing.rank >= standings.length - 3 ? 'bg-red-500' : 
                            'bg-transparent'
                          }`}
                        />
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-center">{standing.rank}</span>
                          {standing.description && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help">
                                    {getStatusIcon(standing.rank, standing.status, standing.description)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{standing.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img 
                          src={standing.team.logo} 
                          alt={standing.team.name}
                          className="h-5 w-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
                          }}
                        />
                        <span className="font-medium truncate max-w-[120px]">{standing.team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{viewData.played}</TableCell>
                    <TableCell className="text-center">{viewData.win}</TableCell>
                    <TableCell className="text-center">{viewData.draw}</TableCell>
                    <TableCell className="text-center">{viewData.lose}</TableCell>
                    <TableCell className="text-center">{standing.goalsDiff}</TableCell>
                    <TableCell className="text-center font-bold">{standing.points}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LeagueStandings;