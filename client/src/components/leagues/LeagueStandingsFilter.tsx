import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const POPULAR_LEAGUES = [
  { id: 2, name: 'Champions League', country: 'Europe' },
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 3, name: 'Europa League', country: 'Europe' }
];

const LeagueStandingsFilter = () => {
  const [season] = useState(2024);

  const leagueQueries = POPULAR_LEAGUES.map(league => ({
    ...league,
    query: useQuery({
      queryKey: [`/api/leagues/${league.id}/standings`, { season }],
      staleTime: 60 * 60 * 1000,
    })
  }));

  if (leagueQueries.some(({ query }) => query.isLoading)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leagueQueries.map(({ id, name, country, query }) => {
        const standings = query.data?.league?.standings?.[0];

        return (
          <Card key={id} className="w-full">
            <CardHeader className="flex flex-row items-center space-x-2 pb-2">
              <img
                src={query.data?.league?.logo}
                alt={name}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=L';
                }}
              />
              <div>
                <CardTitle className="text-lg">{name}</CardTitle>
                <p className="text-sm text-gray-500">{country}</p>
              </div>
            </CardHeader>
            <CardContent>
              {!standings ? (
                <div className="text-center p-4 text-gray-500">
                  <p>No standings data available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">P</TableHead>
                      <TableHead className="text-center">PTS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.slice(0, 5).map((standing) => (
                      <TableRow key={standing.team.id}>
                        <TableCell className="font-medium">{standing.rank}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <img
                              src={standing.team.logo}
                              alt={standing.team.name}
                              className="w-4 h-4 mr-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/16?text=T';
                              }}
                            />
                            <span className="truncate">{standing.team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{standing.all.played}</TableCell>
                        <TableCell className="text-center font-bold">{standing.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LeagueStandingsFilter;