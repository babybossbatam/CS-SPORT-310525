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
          {liveFixturesQuery.data && liveFixturesQuery.data.length > 0 && (
            <LeagueMatchScoreboard 
              match={liveFixturesQuery.data[0]}
              matches={liveFixturesQuery.data}
              maxMatches={20}
            />
          )}
        </div>
      </main>
    </div>
  );
}