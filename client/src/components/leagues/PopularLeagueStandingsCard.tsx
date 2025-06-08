import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PopularLeagueStandingsCard = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>League Standings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Standings feature has been removed</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularLeagueStandingsCard;