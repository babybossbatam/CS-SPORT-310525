
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const PopularLeagueStandingsCard = () => {
  const { data } = useQuery({
    queryKey: ['league-standings', 39], // Premier League ID
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/standings?league=39&season=2024');
      return response.json();
    },
  });
  
  const standings = data?.league?.standings?.[0]?.slice(0, 10) || [];

  return (
    <Card className="bg-white shadow-md mb-4">
      <CardHeader>
        <CardTitle>Premier League</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-center">#</TableHead>
              <TableHead className="pl-4">Team</TableHead>
              <TableHead className="text-center">P</TableHead>
              <TableHead className="text-center">F:A</TableHead>
              <TableHead className="text-center">+/-</TableHead>
              <TableHead className="text-center">PTS</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">D</TableHead>
              <TableHead className="text-center">L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings?.slice(0, 7).map((standing: any) => {
              const stats = standing.all;
              return (
                <TableRow key={standing.team.id} className="border-b border-gray-100">
                  <TableCell className="font-medium text-[0.9em] text-center">{standing.rank}</TableCell>
                  <TableCell className="flex flex-col font-normal">
                    <div className="flex items-center">
                      <img
                        src={standing.team.logo}
                        alt={standing.team.name}
                        className="mr-2 h-5 w-5 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
                        }}
                      />
                      <span className="text-[0.9em]">{standing.team.name}</span>
                      {standing.rank === 1 && <span className="ml-2">👑</span>}
                    </div>
                    {standing.description && (
                      <span className="text-[0.75em] text-yellow-500">
                        {standing.description}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-[0.9em]">{stats.played}</TableCell>
                  <TableCell className="text-center text-[0.9em]">{stats.goals.for}:{stats.goals.against}</TableCell>
                  <TableCell className="text-center text-[0.9em]">{standing.goalsDiff}</TableCell>
                  <TableCell className="text-center font-bold text-[0.9em]">{standing.points}</TableCell>
                  <TableCell className="text-center text-[0.9em]">{stats.win}</TableCell>
                  <TableCell className="text-center text-[0.9em]">{stats.draw}</TableCell>
                  <TableCell className="text-center text-[0.9em]">{stats.lose}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PopularLeagueStandingsCard;
