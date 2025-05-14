import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp } from 'lucide-react';
import { CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Popular leagues for top scorers excluding cups
const POPULAR_LEAGUES = [
  { id: 135, name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 140, name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 137, name: 'Coppa Italia', logo: 'https://media.api-sports.io/football/leagues/137.png' },
  { id: 2, name: 'UCL', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 3, name: 'UEL', logo: 'https://media.api-sports.io/football/leagues/3.png' },
  { id: 39, name: 'EPL', logo: 'https://media.api-sports.io/football/leagues/39.png' },
];

interface Player {
  id: number;
  name: string;
  photo: string;
}

interface PlayerStatistics {
  player: Player;
  statistics: {
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number;
      position: string;
    };
    goals: {
      total: number;
    };
  }[];
}

const HomeTopScorersList = () => {
  const [, navigate] = useLocation();
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].id);

  const { data: topScorers, isLoading } = useQuery({
    queryKey: [`/api/leagues/${selectedLeague}/topscorers`],
    staleTime: 30 * 60 * 1000,
    select: (data: PlayerStatistics[]) => {
      return data.sort((a, b) => {
        const goalsA = a.statistics[0]?.goals?.total || 0;
        const goalsB = b.statistics[0]?.goals?.total || 0;
        return goalsB - goalsA;
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-32 bg-gray-200 animate-pulse" />
              <div className="h-3 w-full bg-gray-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={selectedLeague.toString()} onValueChange={(value) => setSelectedLeague(Number(value))}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const currentIndex = POPULAR_LEAGUES.findIndex(l => l.id === selectedLeague);
              const prevLeague = currentIndex > 0 ? POPULAR_LEAGUES[currentIndex - 1] : POPULAR_LEAGUES[POPULAR_LEAGUES.length - 1];
              setSelectedLeague(prevLeague.id);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            ←
          </button>
          <TabsList className="flex-1 grid grid-cols-4 sm:grid-cols-7 h-auto gap-3 bg-gray-100 p-2">
            {POPULAR_LEAGUES.map((league) => (
              <TabsTrigger
                key={league.id}
                value={league.id.toString()}
                className="text-xs py-1.5 px-2 flex items-center gap-1"
              >
                <img src={league.logo} alt={league.name} className="w-4 h-4 object-contain" />
                {league.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <button 
            onClick={() => {
              const currentIndex = POPULAR_LEAGUES.findIndex(l => l.id === selectedLeague);
              const nextLeague = currentIndex < POPULAR_LEAGUES.length - 1 ? POPULAR_LEAGUES[currentIndex + 1] : POPULAR_LEAGUES[0];
              setSelectedLeague(nextLeague.id);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            →
          </button>
        </div>

        {POPULAR_LEAGUES.map((league) => (
          <TabsContent key={league.id} value={league.id.toString()}>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-2 py-3">#</th>
                      <th className="px-2 py-3 text-left">Player</th>
                      <th className="px-2 py-3">Team</th>
                      <th className="px-2 py-3 text-center">Goals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topScorers?.slice(0, 5).map((scorer, index) => {
                      const playerStats = scorer.statistics[0];
                      const goals = playerStats?.goals?.total || 0;

                      return (
                        <tr key={scorer.player.id} className="border-b hover:bg-gray-50">
                          <td className="px-2 py-2">{index + 1}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={scorer.player.photo} alt={scorer.player.name} />
                                <AvatarFallback>{scorer.player.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{scorer.player.name}</div>
                                <div className="text-xs text-gray-500">{playerStats.games.position}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2">{playerStats.team.name}</td>
                          <td className="px-2 py-2 text-center font-semibold">{goals}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-center pt-2">
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center mx-auto"
                  onClick={() => navigate(`/league/${selectedLeague}/stats`)}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  See full rankings
                </button>
              </div>
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default HomeTopScorersList;