
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const PopularLeagueStandingsCard = () => {
  return (
    <Card className="bg-white shadow-md mb-4">
      <CardContent className="p-4">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-[0.9em] text-center">1</TableCell>
              <TableCell className="flex flex-col font-normal">
                <div className="flex items-center">
                  <img
                    src="https://media.api-sports.io/football/teams/40.png"
                    alt="Liverpool"
                    className="mr-2 h-5 w-5 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/20?text=T';
                    }}
                  />
                  <span className="text-[0.9em]">Liverpool</span>
                  <span className="ml-2">👑</span>
                </div>
                <span className="text-[0.75em] text-yellow-500">
                  Won title • CAF Champions League
                </span>
              </TableCell>
              <TableCell className="text-center text-[0.9em]">8</TableCell>
              <TableCell className="text-center text-[0.9em]">17:5</TableCell>
              <TableCell className="text-center text-[0.9em]">12</TableCell>
              <TableCell className="text-center font-bold text-[0.9em]">21</TableCell>
              <TableCell className="text-center text-[0.9em]">7</TableCell>
              <TableCell className="text-center text-[0.9em]">0</TableCell>
              <TableCell className="text-center text-[0.9em]">1</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PopularLeagueStandingsCard;
