import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import MyCircularFlag from "@/components/common/MyCircularFlag";
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";
import LazyImage from "@/components/common/LazyImage";
import { isNationalTeam } from "@/lib/teamLogoSources";

interface Team {
  id: number;
  name: string;
  logo: string;
  nextMatch?: {
    name: string;
    logo: string;
  };
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
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
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

const LeagueStandings: React.FC<LeagueStandingsProps> = ({
  leagueId,
  season = 2024,
}) => {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"overall" | "home" | "away">("overall");

  const { data, isLoading, error } = useQuery({
    queryKey: ["league-standings", leagueId, season],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/leagues/${leagueId}/standings`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
      } catch (err) {
        console.error("Error fetching standings:", err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!leagueId,
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

  if (error) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 text-red-500">
            <p>Error loading standings data.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.league?.standings || data.league.standings.length === 0) {
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

  const allStandings = data.league.standings;

  return (
    <Card className="w-full h-full">
      <CardContent className="pt-6">
        <Tabs
          defaultValue="overall"
          className="w-full"
          onValueChange={(v) => setView(v as any)}
        >
          <TabsList className="w-full mb-4">
            <TabsTrigger value="overall" className="flex-1">
              Overall
            </TabsTrigger>
            <TabsTrigger value="home" className="flex-1">
              Home
            </TabsTrigger>
            <TabsTrigger value="away" className="flex-1">
              Away
            </TabsTrigger>
          </TabsList>

          <div className="w-full max-w-full space-y-6">
            {allStandings.map((standings, groupIndex) => {
              if (!standings || standings.length === 0) {
                return (
                  <div
                    key={groupIndex}
                    className="text-center p-4 text-gray-500"
                  >
                    <p>No standings data available for this group.</p>
                  </div>
                );
              }

              return (
                <div key={groupIndex}>
                  {allStandings.length > 1 && (
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      {standings[0]?.group ||
                        `Group ${String.fromCharCode(65 + groupIndex)}`}
                    </h3>
                  )}

                  <div className="relative overflow-hidden">
                    <Table className="w-full -ml-6">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px] text-center sticky left-0 bg-white dark:bg-gray-800 z-10">
                            Pos
                          </TableHead>
                          <TableHead className="pl-8 sticky left-[60px] bg-white dark:bg-gray-800 z-10 min-w-[180px]">
                            Team
                          </TableHead>
                          <TableHead className="text-center min-w-[50px]">
                            P
                          </TableHead>
                          <TableHead className="text-center min-w-[70px]">
                            F/A
                          </TableHead>
                          <TableHead className="text-center min-w-[50px]">
                            +/-
                          </TableHead>
                          <TableHead className="text-center min-w-[60px]">
                            PTS
                          </TableHead>
                          <TableHead className="text-center min-w-[50px]">
                            W
                          </TableHead>
                          <TableHead className="text-center min-w-[50px]">
                            D
                          </TableHead>
                          <TableHead className="text-center min-w-[50px]">
                            L
                          </TableHead>
                          <TableHead className="text-center min-w-[100px]">
                            Form
                          </TableHead>
                          <TableHead className="text-center min-w-[60px]">
                            Next
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <div className="overflow-x-auto">
                          {standings.map((standing) => {
                            const stats =
                              view === "overall"
                                ? standing.all
                                : view === "home"
                                  ? standing.home
                                  : view === "away"
                                    ? standing.away
                                    : null;

                            return (
                              <TableRow
                                key={`${groupIndex}-${standing.team.id}`}
                                className="hover:bg-gray-50/50 transition-colors relative cursor-pointer"
                                onClick={() =>
                                  navigate(`/team/${standing.team.id}`)
                                }
                              >
                                <TableCell className="relative pl-3 font-medium sticky left-0 bg-white dark:bg-gray-800 z-10">
                                  <span
                                    className="absolute left-0 top-0 bottom-0 w-1.5"
                                    style={{
                                      backgroundColor:
                                        standing.rank <= 3
                                          ? "#4CAF50"
                                          : standing.rank <= 7
                                            ? "#9C27B0"
                                            : "#9E9E9E",
                                    }}
                                  />
                                  <span
                                    style={{
                                      color:
                                        standing.rank <= 3
                                          ? "#4CAF50"
                                          : standing.rank <= 7
                                            ? "#9C27B0"
                                            : "#9E9E9E",
                                    }}
                                  >
                                    {standing.rank}
                                  </span>
                                </TableCell>
                                <TableCell className="min-w-[180px] pl-2 sticky left-[60px] bg-white dark:bg-gray-800 z-10">
                                  <div className="flex items-center gap-2">
                                    {isNationalTeam(standing.team.name) ? (
                                      <MyCircularFlag
                                        teamName={standing.team.name}
                                        fallbackUrl={standing.team.logo}
                                        size="24px"
                                        className="flex-shrink-0"
                                      />
                                    ) : (
                                      <LazyImage
                                        src={standing.team.logo}
                                        alt={standing.team.name}
                                        className="w-6 h-6 object-contain rounded flex-shrink-0"
                                        style={{ width: '24px', height: '24px' }}
                                        priority="medium"
                                      />
                                    )}
                                    <div className="flex flex-col">
                                      <span className="font-medium text-sm">
                                        {standing.team.name}
                                      </span>
                                      {standing.rank <= 7 &&
                                        standing.description && (
                                          <span
                                            className="text-xs"
                                            style={{
                                              color:
                                                standing.rank <= 3
                                                  ? "#4CAF50"
                                                  : "#9C27B0",
                                            }}
                                          >
                                            {standing.description}
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {stats.played}
                                </TableCell>
                                <TableCell className="text-center">
                                  {stats.goals.for}/{stats.goals.against}
                                </TableCell>
                                <TableCell className="text-center">
                                  {standing.goalsDiff}
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  {standing.points}
                                </TableCell>
                                <TableCell className="text-center">
                                  {stats.win}
                                </TableCell>
                                <TableCell className="text-center">
                                  {stats.draw}
                                </TableCell>
                                <TableCell className="text-center">
                                  {stats.lose}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex gap-1 justify-center">
                                    {standing.form
                                      ?.split("")
                                      .map((result, i) => (
                                        <span
                                          key={i}
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${
                                            result === "W"
                                              ? "bg-green-500"
                                              : result === "D"
                                                ? "bg-gray-500"
                                                : "bg-red-500"
                                          }`}
                                        >
                                          {result}
                                        </span>
                                      ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {standing.team.nextMatch && (
                                    <div className="flex justify-center">
                                      {isNationalTeam(
                                        standing.team.nextMatch.name,
                                      ) ? (
                                        <MyCircularFlag
                                          teamName={
                                            standing.team.nextMatch.name
                                          }
                                          fallbackUrl={
                                            standing.team.nextMatch.logo
                                          }
                                          size="20px"
                                          className="flex-shrink-0"
                                        />
                                      ) : (
                                        <LazyImage
                                          src={standing.team.nextMatch.logo}
                                          alt={standing.team.nextMatch.name}
                                          className="w-5 h-5 object-contain rounded flex-shrink-0"
                                          style={{ width: '20px', height: '20px' }}
                                          priority="low"
                                        />
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </div>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export { LeagueStandings };
export default LeagueStandings;
