import { LeagueMatchScoreboard } from "@/components/matches/LeagueMatchScoreboard";
import { Calendar, Timer } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { FixtureResponse } from "@/types/fixtures";

export default function LiveScoresPage() {
  const liveFixturesQuery = useQuery<FixtureResponse[]>({
    queryKey: ['/api/fixtures/live'],
    staleTime: 30000,
    refetchInterval: 30000
  });

  // Define popular leagues IDs
  const POPULAR_LEAGUES = [2, 3, 39, 140, 135, 78];  // Champions League, Europa League, Premier League, La Liga, Serie A, Bundesliga

  // Filter matches to show only popular leagues
  const filteredMatches = liveFixturesQuery.data?.filter(match => 
    match.league && POPULAR_LEAGUES.includes(match.league.id)
  ) || [];

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Scores</h1>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          <span className="mx-2">•</span>
          <Timer className="h-4 w-4 mr-1" />
          <span>Live updates every minute</span>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-9">
          {filteredMatches.length > 0 && (
            <LeagueMatchScoreboard 
              match={filteredMatches[0]}
              matches={filteredMatches}
              maxMatches={20}
            />
          )}
        </div>
      </main>
    </div>
  );
}