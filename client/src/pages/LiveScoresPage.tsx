import { LiveScoreboard } from "@/components/matches/LiveScoreboard";
import { Calendar, Timer } from "lucide-react";
import { format } from "date-fns";

export default function LiveScoresPage() {
  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
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
      
      <main>
        <LiveScoreboard 
          showFeaturedMatch={true}
          showFilters={true}
          maxMatches={20}
        />
      </main>
      
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Data provided by Football API</p>
      </footer>
    </div>
  );
}