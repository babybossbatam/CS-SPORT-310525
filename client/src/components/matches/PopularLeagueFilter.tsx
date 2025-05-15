
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const POPULAR_LEAGUES = [
  { id: 2, name: 'Champions League', country: 'Europe' },
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 3, name: 'Europa League', country: 'Europe' }
];

interface PopularLeagueFilterProps {
  selectedLeague: string;
  onSelectLeague: (leagueId: string) => void;
}

export default function PopularLeagueFilter({ selectedLeague, onSelectLeague }: PopularLeagueFilterProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedLeague === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectLeague('all')}
          >
            All Leagues
          </Button>
          {POPULAR_LEAGUES.map((league) => (
            <Button
              key={league.id}
              variant={selectedLeague === league.id.toString() ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectLeague(league.id.toString())}
            >
              {league.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
